import { redis } from '@/lib/redis';
import { getMoscowDate } from '@/lib/timezone';

const KEY_EVENTS = [
  { key: 'calculator_calculate', emoji: '🧮', label: 'Расчёты калькулятора' },
  { key: 'calculator_export', emoji: '📤', label: 'Экспорты' },
  { key: 'contact_form_submit', emoji: '📨', label: 'Заявки с форм' },
  { key: 'phone_click', emoji: '📞', label: 'Клики по телефону' },
  { key: 'lead_submit', emoji: '🎯', label: 'Лиды' },
  { key: 'portfolio_view', emoji: '🏗️', label: 'Просмотры портфолио' },
  { key: 'contacts_view', emoji: '📋', label: 'Просмотры контактов' },
];

async function sendBotMessage(chatId: number | string, text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || botToken === 'your-bot-token') return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error('Telegram bot command API error:', await response.text());
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('Telegram bot command error:', error);
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}с`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}м ${sec}с`;
}

async function getTodayDailyData(): Promise<Record<string, string>> {
  const today = getMoscowDate();
  const dailyKey = `analytics:daily:${today}`;
  return redis.hgetall(dailyKey);
}

export async function handleStats(chatId: number): Promise<void> {
  try {
    const dailyData = await getTodayDailyData();

    const uniqueUsers = await redis.get('analytics:metrics:unique_users_today');
    const avgDurationRaw = await redis.get('analytics:metrics:avg_session_duration');
    const funnelRateRaw = await redis.get('analytics:metrics:rates:funnel_completion');

    const pageViews = parseInt(dailyData['page_view'] || '0', 10);
    const avgDuration = avgDurationRaw ? parseFloat(avgDurationRaw) : 0;
    const funnelRate = funnelRateRaw ? parseFloat(funnelRateRaw) : 0;

    const keyEventsLines = KEY_EVENTS.map(({ key, emoji, label }) => {
      const count = parseInt(dailyData[key] || '0', 10);
      return `${emoji} ${label}: ${count}`;
    }).join('\n');

    const message = `📊 <b>Статистика за сегодня</b>

👥 Уникальные посетители: ${uniqueUsers || '0'}
👁 Просмотров: ${pageViews.toLocaleString('ru-RU')}
${keyEventsLines}

⏱ Средняя сессия: ${avgDuration > 0 ? formatDuration(avgDuration) : '—'}
📈 Конверсия (формы/просмотры): ${funnelRate > 0 ? (funnelRate * 100).toFixed(1) + '%' : '—'}`;

    await sendBotMessage(chatId, message);
  } catch (error) {
    console.error('Failed to load stats:', error);
    await sendBotMessage(chatId, '⚠️ Не удалось загрузить статистику. Попробуйте позже.');
  }
}

export async function handleEvents(chatId: number): Promise<void> {
  try {
    const dailyData = await getTodayDailyData();

    const lines = KEY_EVENTS.map(({ key, emoji, label }) => {
      const count = parseInt(dailyData[key] || '0', 10);
      return `${emoji} ${label}: ${count}`;
    }).join('\n');

    const message = `📋 <b>Ключевые события за сегодня</b>

${lines}`;

    await sendBotMessage(chatId, message);
  } catch (error) {
    console.error('Failed to load events:', error);
    await sendBotMessage(chatId, '⚠️ Не удалось загрузить события. Попробуйте позже.');
  }
}

export async function handleHelp(chatId: number): Promise<void> {
  const message = `🤖 <b>Бот аналитики Заборы и Навесы</b>

Доступные команды:

/stats — Статистика за сегодня (посетители, события, конверсия)
/events — Ключевые события за сегодня
/help — Список команд

Бот также отправляет уведомления о ключевых событиях на сайте.`;

  await sendBotMessage(chatId, message);
}

export async function handleCommand(text: string, chatId: number): Promise<void> {
  const command = text.trim().split(' ')[0].toLowerCase();

  switch (command) {
    case '/start':
    case '/help':
      await handleHelp(chatId);
      break;
    case '/stats':
      await handleStats(chatId);
      break;
    case '/events':
      await handleEvents(chatId);
      break;
    default:
      await sendBotMessage(chatId, 'Неизвестная команда. Используйте /help для списка команд.');
  }
}
