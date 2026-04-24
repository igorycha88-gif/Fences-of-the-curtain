import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { redis } from '@/lib/redis';
import { sendTelegramMessage } from '@/services/telegram/bot';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

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

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || !authHeader || !safeCompare(authHeader, `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' });
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

    const sent = await sendTelegramMessage(message);

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send Telegram message' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, date: today, messageSent: true });
  } catch (error) {
    console.error('Daily summary cron error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
