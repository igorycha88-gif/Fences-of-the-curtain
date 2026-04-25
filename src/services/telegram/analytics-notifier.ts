import { redis } from '@/lib/redis';
import { getCityByIP } from '@/services/admin/ipLookupService';

const NOTIFIABLE_EVENTS = [
  'contact_form_submit',
  'phone_click',
  'lead_submit',
  'calculator_calculate',
  'calculator_export',
  'portfolio_view',
  'contacts_view',
] as const;

export type NotifiableEvent = (typeof NOTIFIABLE_EVENTS)[number];

const EVENT_LABELS: Record<NotifiableEvent, { emoji: string; label: string }> = {
  contact_form_submit: { emoji: '📨', label: 'Заявка с формы контактов' },
  phone_click: { emoji: '📞', label: 'Клик по номеру телефона' },
  lead_submit: { emoji: '🎯', label: 'Новый лид' },
  calculator_calculate: { emoji: '🧮', label: 'Расчёт калькулятора' },
  calculator_export: { emoji: '📤', label: 'Экспорт расчёта' },
  portfolio_view: { emoji: '🏗️', label: 'Просмотр портфолио' },
  contacts_view: { emoji: '📋', label: 'Просмотр контактов' },
};

const DEDUP_TTL_SECONDS = 10;

export function isNotifiableEvent(eventName: string): eventName is NotifiableEvent {
  return (NOTIFIABLE_EVENTS as readonly string[]).includes(eventName);
}

export async function shouldDedup(eventName: string, sessionId: string): Promise<boolean> {
  const key = `telegram:dedup:${eventName}:${sessionId}`;
  const result = await redis.set(key, '1', 'EX', DEDUP_TTL_SECONDS, 'NX');
  return result === null;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatNotificationMessage(
  eventName: NotifiableEvent,
  page: string,
  timestamp: string,
  location: string | null
): string {
  const { emoji, label } = EVENT_LABELS[eventName];
  const safePage = escapeHtml(page || 'unknown');
  const time = formatTime(timestamp);
  const locationLine = location ? `\n📍 Локация: ${escapeHtml(location)}` : '';

  return `${emoji} <b>${label}</b>

📄 Страница: ${safePage}
🕐 Время: ${time}${locationLine}`;
}

export async function sendAnalyticsNotification(params: {
  eventName: NotifiableEvent;
  page: string;
  sessionId: string;
  timestamp: string;
  ip?: string;
}): Promise<void> {
  const { eventName, page, sessionId, timestamp, ip } = params;

  const deduped = await shouldDedup(eventName, sessionId);
  if (deduped) return;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId || botToken === 'your-bot-token' || chatId === 'your-chat-id') {
    return;
  }

  let location: string | null = null;
  if (ip) {
    try {
      location = await getCityByIP(ip);
    } catch {
      location = null;
    }
  }

  const message = formatNotificationMessage(eventName, page, timestamp, location);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error('Telegram analytics notification API error:', await response.text());
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('Telegram analytics notification error:', error);
  }
}
