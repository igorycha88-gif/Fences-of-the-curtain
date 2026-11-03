import { getTelegramDispatcher } from '@/lib/telegram-proxy';
import logger from '@/lib/logger';

const TELEGRAM_MAX_ATTEMPTS = 3;
const TELEGRAM_REQUEST_TIMEOUT_MS = 8000;
const TELEGRAM_RETRY_BASE_DELAY_MS = 1000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableFailure(networkError: boolean, status?: number): boolean {
  if (networkError) return true;
  const statusCode = status;
  return statusCode === 429 || (typeof statusCode === 'number' && statusCode >= 500);
}

export async function sendTelegramMessage(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId || botToken === 'your-bot-token' || chatId === 'your-chat-id') {
    logger.warn('Telegram credentials not configured', {
      module: 'telegram/bot',
      operation: 'sendTelegramMessage',
    });
    return false;
  }

  const dispatcher = getTelegramDispatcher();
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= TELEGRAM_MAX_ATTEMPTS; attempt++) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TELEGRAM_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
        signal: controller.signal,
        ...(dispatcher ? { dispatcher } : {}),
      });

      if (response.ok) {
        logger.info('Telegram message sent', {
          module: 'telegram/bot',
          operation: 'sendTelegramMessage',
          attempt,
          durationMs: Date.now() - startedAt,
        });
        return true;
      }

      const responseText = await response.text();
      logger.error('Telegram API error', {
        module: 'telegram/bot',
        operation: 'sendTelegramMessage',
        attempt,
        status: response.status,
        durationMs: Date.now() - startedAt,
        response: responseText.slice(0, 500),
      });

      if (!isRetryableFailure(false, response.status)) {
        return false;
      }
    } catch (error) {
      lastError = error;
      logger.error('Telegram send attempt failed', {
        module: 'telegram/bot',
        operation: 'sendTelegramMessage',
        attempt,
        durationMs: Date.now() - startedAt,
        error,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < TELEGRAM_MAX_ATTEMPTS) {
      await sleep(TELEGRAM_RETRY_BASE_DELAY_MS * (attempt === 1 ? 1 : 3));
    }
  }

  logger.error('Telegram send failed after all attempts', {
    module: 'telegram/bot',
    operation: 'sendTelegramMessage',
    attempts: TELEGRAM_MAX_ATTEMPTS,
    error: lastError,
  });
  return false;
}

export function getOrderTypeLabel(order: { serviceType?: string | null; parameters?: Record<string, unknown> | null }): string {
  const serviceType = order?.serviceType ?? null;

  if (serviceType === 'fence') return 'Забор';
  if (serviceType === 'canopy') return 'Навес';
  if (serviceType === 'gates') return 'Ворота';
  if (serviceType === 'garage') return 'Гараж';

  if (serviceType === 'INDIVIDUAL_CALCULATION') {
    const params = order?.parameters ?? {};
    if (params.serviceType === 'gates') return 'Индивидуальный расчёт (ворота)';
    if (params.serviceType === 'garage') return 'Индивидуальный расчёт (гараж)';
    if (params.canopyType !== undefined || params.purpose !== undefined) return 'Индивидуальный расчёт (навес)';
    if (params.fenceTypeId !== undefined || params.fenceTypeName !== undefined) {
      const fenceName = typeof params.fenceTypeName === 'string' && params.fenceTypeName ? params.fenceTypeName : null;
      return fenceName ? `Индивидуальный расчёт (забор), ${fenceName}` : 'Индивидуальный расчёт (забор)';
    }
    return 'Индивидуальный расчёт';
  }

  return serviceType || 'Не указан';
}

export function sendOrderNotification(order: any) {
  const escapedName = (order.clientName || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedPhone = (order.phone || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedEmail = (order.email || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const orderId = String(order.id || '').slice(-6);
  const escapedTypeLabel = getOrderTypeLabel(order).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const message = `
🆕 <b>Новая заявка #${orderId}</b>

👤 <b>Клиент:</b> ${escapedName}
📞 <b>Телефон:</b> ${escapedPhone}
${escapedEmail ? `📧 <b>Email:</b> ${escapedEmail}` : ''}

🏠 <b>Тип:</b> ${escapedTypeLabel}
💰 <b>Стоимость:</b> ${Number(order.calculatedCost || 0).toLocaleString('ru-RU')} ₽
📅 <b>Дата:</b> ${new Date(order.createdAt).toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' })}

Обработайте заявку в админ-панели.
  `.trim();

  return sendTelegramMessage(message);
}

export function sendContactForm(data: any) {
  const escapedName = (data.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedPhone = (data.phone || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedEmail = (data.email || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedMessage = (data.message || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const timeStr = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

  const message = `
📨 <b>Форма обратной связи</b>

👤 <b>Имя:</b> ${escapedName}
📞 <b>Телефон:</b> ${escapedPhone}
${escapedEmail ? `📧 <b>Email:</b> ${escapedEmail}` : ''}

💬 <b>Сообщение:</b>
${escapedMessage}

🕐 <b>Время:</b> ${timeStr}
  `.trim();

  return sendTelegramMessage(message);
}
