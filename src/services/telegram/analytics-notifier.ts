import { redis } from '@/lib/redis';
import { getTelegramDispatcher } from '@/lib/telegram-proxy';
import { getCityByIP } from '@/services/admin/ipLookupService';
import logger from '@/lib/logger';

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

const TELEGRAM_MAX_ATTEMPTS = 3;
const TELEGRAM_REQUEST_TIMEOUT_MS = 8000;
const TELEGRAM_RETRY_BASE_DELAY_MS = 1000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableTelegramFailure(attempt: { networkError: boolean; status?: number }): boolean {
  if (attempt.networkError) return true;
  const status = attempt.status;
  return status === 429 || (typeof status === 'number' && status >= 500);
}

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

  await sendTelegramMessageWithRetry({
    botToken,
    chatId,
    message,
    context: { eventName, sessionId },
  });
}

export async function sendTelegramMessageWithRetry(params: {
  botToken: string;
  chatId: string;
  message: string;
  context: { eventName: string; sessionId: string };
  maxAttempts?: number;
  retryBaseDelayMs?: number;
}): Promise<void> {
  const {
    botToken,
    chatId,
    message,
    context,
    maxAttempts = TELEGRAM_MAX_ATTEMPTS,
    retryBaseDelayMs = TELEGRAM_RETRY_BASE_DELAY_MS,
  } = params;

  const dispatcher = getTelegramDispatcher();
  let lastError: unknown = null;
  let lastStatus: number | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TELEGRAM_REQUEST_TIMEOUT_MS);

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
        ...(dispatcher ? { dispatcher } : {}),
      });

      if (response.ok) {
        if (attempt > 1) {
          logger.warn('Telegram analytics notification sent after retry', {
            module: 'telegram/analytics-notifier',
            operation: 'sendAnalyticsNotification',
            eventName: context.eventName,
            sessionId: context.sessionId,
            attempt,
          });
        }
        return;
      }

      const responseText = await response.text();
      lastStatus = response.status;
      lastError = new Error(`Telegram API responded with status ${response.status}`);

      logger.error('Telegram analytics notification API error', {
        module: 'telegram/analytics-notifier',
        operation: 'sendAnalyticsNotification',
        eventName: context.eventName,
        sessionId: context.sessionId,
        attempt,
        status: response.status,
        response: responseText.slice(0, 500),
      });

      if (!isRetryableTelegramFailure({ networkError: false, status: response.status })) {
        return;
      }
    } catch (error) {
      lastError = error;

      logger.error('Telegram analytics notification attempt failed', {
        module: 'telegram/analytics-notifier',
        operation: 'sendAnalyticsNotification',
        eventName: context.eventName,
        sessionId: context.sessionId,
        attempt,
        maxAttempts,
        error,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < maxAttempts) {
      await sleep(retryBaseDelayMs * (attempt === 1 ? 1 : 3));
    }
  }

  logger.error('Telegram analytics notification failed after all attempts', {
    module: 'telegram/analytics-notifier',
    operation: 'sendAnalyticsNotification',
    eventName: context.eventName,
    sessionId: context.sessionId,
    attempts: maxAttempts,
    lastStatus,
    error: lastError,
  });
}
