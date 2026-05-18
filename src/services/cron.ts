import { redis } from '@/lib/redis';
import { sendTelegramMessage } from '@/services/telegram/bot';
import { getMoscowDate } from '@/lib/timezone';
import { positionCollector } from '@/services/seo/positionCollector';
import { seoChangeNotifier } from '@/services/seo/seoChangeNotifier';

const KEY_EVENTS = [
  { key: 'calculator_calculate', emoji: '🧮', label: 'Расчёты калькулятора' },
  { key: 'calculator_export', emoji: '📤', label: 'Экспорты' },
  { key: 'contact_form_submit', emoji: '📨', label: 'Заявки с форм' },
  { key: 'phone_click', emoji: '📞', label: 'Клики по телефону' },
  { key: 'lead_submit', emoji: '🎯', label: 'Лиды' },
  { key: 'portfolio_view', emoji: '🏗️', label: 'Просмотры портфолио' },
  { key: 'contacts_view', emoji: '📋', label: 'Просмотры контактов' },
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}с`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}м ${sec}с`;
}

async function sendDailySummary(): Promise<boolean> {
  try {
    const today = getMoscowDate();
    const dailyKey = `analytics:daily:${today}`;
    const dailyData = await redis.hgetall(dailyKey);

    const uniqueUsers = await redis.get('analytics:metrics:unique_users_today') || '0';
    const avgDurationRaw = await redis.get('analytics:metrics:avg_session_duration');
    const funnelRateRaw = await redis.get('analytics:metrics:rates:funnel_completion');

    const pageViews = parseInt(dailyData['page_view'] || '0', 10);
    const avgDuration = avgDurationRaw ? parseFloat(avgDurationRaw) : 0;
    const funnelRate = funnelRateRaw ? parseFloat(funnelRateRaw) : 0;

    const keyEventsLines = KEY_EVENTS.map(({ key, emoji, label }) => {
      const count = parseInt(dailyData[key] || '0', 10);
      return `${emoji} ${label}: ${count}`;
    }).join('\n');

    const message = `📊 <b>Итог дня — ${today}</b>

👥 Уникальные посетители: ${uniqueUsers}
👁 Всего просмотров: ${pageViews.toLocaleString('ru-RU')}

📈 <b>Ключевые события:</b>
${keyEventsLines}

⏱ Средняя сессия: ${avgDuration > 0 ? formatDuration(avgDuration) : '—'}
📈 Конверсия (формы/просмотры): ${funnelRate > 0 ? (funnelRate * 100).toFixed(1) + '%' : '—'}`;

    return await sendTelegramMessage(message);
  } catch (error) {
    console.error('[Cron] Daily summary error:', error);
    return false;
  }
}

const LAST_SENT_KEY = 'cron:daily_summary:last_sent_date';
const LAST_SEO_KEY_PREFIX = 'cron:seo_positions:last_sent_date:';
const SEO_RUNNING_KEY = 'cron:seo_positions:running';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

async function runSeoCollection(timeSlot: string): Promise<void> {
  const runningFlag = await redis.get(SEO_RUNNING_KEY);
  if (runningFlag) {
    console.log(`[Cron] SEO collection already running, skipping ${timeSlot}`);
    return;
  }

  const lastSeoKey = `${LAST_SEO_KEY_PREFIX}${timeSlot}`;
  const today = getMoscowDate();
  const lastSeoDate = await redis.get(lastSeoKey);
  if (lastSeoDate === today) {
    console.log(`[Cron] SEO positions already collected for ${timeSlot} today`);
    return;
  }

  console.log(`[Cron] Starting SEO position collection (${timeSlot})...`);
  await redis.set(SEO_RUNNING_KEY, today, 'EX', 12 * 60 * 60);
  await redis.set(lastSeoKey, today, 'EX', 86400);

  try {
    const result = await positionCollector.startBatchSession();
    console.log(
      `[Cron] SEO positions collected: checked=${result.checked}, errors=${result.errors}, batches=${result.completedBatches}/${result.totalBatches}`
    );

    if (result.completedBatches === result.totalBatches) {
      await seoChangeNotifier.sendReport(result);
      console.log('[Cron] SEO change report sent to Telegram');
    }
  } catch (err) {
    console.error('[Cron] SEO position collection error:', err);
    await redis.del(lastSeoKey);
  } finally {
    await redis.del(SEO_RUNNING_KEY);
  }
}

export async function checkAndSend(): Promise<void> {
  const now = new Date();
  const moscowParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const hour = parseInt(moscowParts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(moscowParts.find(p => p.type === 'minute')?.value || '0', 10);
  const today = getMoscowDate();

  if (hour === 20 && minute === 0) {
    const lastSentDate = await redis.get(LAST_SENT_KEY);
    if (lastSentDate !== today) {
      console.log('[Cron] Sending daily summary at 20:00 Moscow time...');
      await redis.set(LAST_SENT_KEY, today, 'EX', 86400);

      try {
        const sent = await sendDailySummary();
        if (sent) {
          console.log('[Cron] Daily summary sent successfully');
        } else {
          console.error('[Cron] Daily summary failed to send');
          await redis.del(LAST_SENT_KEY);
        }
      } catch (err) {
        console.error('[Cron] Daily summary error:', err);
        await redis.del(LAST_SENT_KEY);
      }
    }
  }

  if ((hour === 0 && minute === 0) || (hour === 9 && minute === 0)) {
    const timeSlot = `${hour}:00`;
    await runSeoCollection(timeSlot);
  }
}

export function startScheduler(): void {
  if (schedulerInterval) return;

  console.log('[Cron] Starting scheduler: SEO 00:00/09:00, Daily summary 20:00 (Europe/Moscow)');
  schedulerInterval = setInterval(checkAndSend, 60_000);
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Cron] Scheduler stopped');
  }
}

export { sendDailySummary };
