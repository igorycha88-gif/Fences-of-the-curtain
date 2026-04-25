import { getTelegramDispatcher } from '@/lib/telegram-proxy';

export async function sendTelegramMessage(message: string): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId || botToken === 'your-bot-token' || chatId === 'your-chat-id') {
      console.warn('Telegram credentials not configured');
      return false;
    }

    const dispatcher = getTelegramDispatcher();

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
      ...(dispatcher ? { dispatcher } : {}),
    });

    if (response.ok) {
      console.log('Telegram message sent');
      return true;
    } else {
      console.error('Telegram error:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Telegram send error:', error);
    return false;
  }
}

export function sendOrderNotification(order: any) {
  const escapedName = (order.clientName || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedPhone = (order.phone || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedEmail = (order.email || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const orderId = String(order.id || '').slice(-6);

  const message = `
🆕 <b>Новая заявка #${orderId}</b>

👤 <b>Клиент:</b> ${escapedName}
📞 <b>Телефон:</b> ${escapedPhone}
${escapedEmail ? `📧 <b>Email:</b> ${escapedEmail}` : ''}

🏠 <b>Тип:</b> ${order.serviceType === 'fence' ? 'Забор' : 'Навес'}
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
