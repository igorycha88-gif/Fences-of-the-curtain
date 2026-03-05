import nodemailer from 'nodemailer';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: `"Заборы и Навесы" <${process.env.SMTP_USER}>`,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text || data.html.replace(/<[^>]*>/g, ''),
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

export function sendOrderNotification(order: any) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; margin-bottom: 20px;">Новая заявка #${order.id}</h2>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Клиент:</strong> ${order.clientName}</p>
        <p><strong>Телефон:</strong> ${order.phone}</p>
        ${order.email ? `<p><strong>Email:</strong> ${order.email}</p>` : ''}
        <p><strong>Тип услуги:</strong> ${order.serviceType === 'fence' ? 'Забор' : 'Навес'}</p>
        <p><strong>Стоимость:</strong> ${order.calculatedCost.toLocaleString('ru-RU')} ₽</p>
        <p><strong>Дата:</strong> ${new Date(order.createdAt).toLocaleDateString('ru-RU')}</p>
      </div>

      <p style="color: #666; font-size: 14px;">
        Перейдите в админ-панель для обработки заявки.
      </p>
    </div>
  `;

  return sendEmail({
    to: 'info@fences.ru',
    subject: `Новая заявка #${order.id}`,
    html,
  });
}

export function sendClientConfirmation(order: any) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; margin-bottom: 20px;">Ваша заявка принята</h2>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p>Благодарим вас за заявку! Мы свяжемся с вами в ближайшее время.</p>
        <p><strong>Номер заявки:</strong> #${order.id}</p>
        <p><strong>Тип услуги:</strong> ${order.serviceType === 'fence' ? 'Забор' : 'Навес'}</p>
        <p><strong>Стоимость:</strong> ${order.calculatedCost.toLocaleString('ru-RU')} ₽</p>
      </div>

      <p style="color: #666; font-size: 14px;">
        Если у вас есть вопросы, свяжитесь с нами по телефону +7 (900) 123-45-67
      </p>
    </div>
  `;

  return sendEmail({
    to: order.email || order.clientName,
    subject: `Заявка #${order.id} принята`,
    html,
  });
}
