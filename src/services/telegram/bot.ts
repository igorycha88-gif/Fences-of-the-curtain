export async function sendTelegramMessage(message: string): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn('Telegram credentials not configured');
      return false;
    }

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
  const message = `
🆕 <b>Новая заявка #${order.id.slice(-6)}</b>

👤 <b>Клиент:</b> ${order.clientName}
📞 <b>Телефон:</b> ${order.phone}
${order.email ? `📧 <b>Email:</b> ${order.email}` : ''}

🏠 <b>Тип:</b> ${order.serviceType === 'fence' ? 'Забор' : 'Навес'}
💰 <b>Стоимость:</b> ${order.calculatedCost.toLocaleString('ru-RU')} ₽
📅 <b>Дата:</b> ${new Date(order.createdAt).toLocaleDateString('ru-RU')}

Обработайте заявку в админ-панели.
  `.trim();

  return sendTelegramMessage(message);
}

export function sendContactForm(data: any) {
  const message = `
📨 <b>Форма обратной связи</b>

👤 <b>Имя:</b> ${data.name}
📞 <b>Телефон:</b> ${data.phone}
${data.email ? `📧 <b>Email:</b> ${data.email}` : ''}

💬 <b>Сообщение:</b>
${data.message}
  `.trim();

  return sendTelegramMessage(message);
}
