import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
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

export async function sendEmailToAllRecipients(subject: string, html: string): Promise<void> {
  try {
    const recipients = await prisma.notificationRecipient.findMany({
      where: { active: true },
    });

    if (recipients.length === 0) {
      console.log('No active notification recipients found');
      return;
    }

    const emailPromises = recipients.map((recipient: { email: string }) =>
      sendEmail({
        to: recipient.email,
        subject,
        html,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const failed = results.filter((r: { status: string }) => r.status === 'rejected');
    if (failed.length > 0) {
      console.error(`${failed.length} email(s) failed to send`);
    }
  } catch (error) {
    console.error('Error sending emails to recipients:', error);
  }
}

export function generateOrderNotificationHtml(order: {
  id: string;
  clientName: string;
  phone: string;
  email?: string | null;
  serviceType: string;
  calculatedCost: number;
  createdAt: Date | string;
}): string {
  const createdAt =
    typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; margin-bottom: 20px;">Новая заявка #${escapeHtml(order.id)}</h2>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Клиент:</strong> ${escapeHtml(order.clientName)}</p>
        <p><strong>Телефон:</strong> ${escapeHtml(order.phone)}</p>
        ${order.email ? `<p><strong>Email:</strong> ${escapeHtml(order.email)}</p>` : ''}
        <p><strong>Тип услуги:</strong> ${order.serviceType === 'fence' ? 'Забор' : order.serviceType === 'canopy' ? 'Навес' : 'Индивидуальный расчет'}</p>
        <p><strong>Стоимость:</strong> ${Number(order.calculatedCost).toLocaleString('ru-RU')} ₽</p>
        <p><strong>Дата:</strong> ${createdAt.toLocaleDateString('ru-RU')}</p>
      </div>

      <p style="color: #666; font-size: 14px;">
        Перейдите в админ-панель для обработки заявки.
      </p>
    </div>
  `;
}

export async function sendOrderNotification(order: {
  id: string;
  clientName: string;
  phone: string;
  email?: string | null;
  serviceType: string;
  calculatedCost: number;
  createdAt: Date | string;
}): Promise<void> {
  const html = generateOrderNotificationHtml(order);

  await sendEmailToAllRecipients(`Новая заявка #${order.id}`, html);
}

export async function sendClientConfirmation(order: {
  id: string;
  clientName: string;
  email?: string | null;
  serviceType: string;
  calculatedCost: number;
}): Promise<boolean> {
  if (!order.email) return false;

  const contactInfo = await prisma.contactInfo.findFirst();
  const phone = contactInfo?.phone || '+74993901595';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; margin-bottom: 20px;">Ваша заявка принята</h2>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p>Благодарим вас за заявку! Мы свяжемся с вами в ближайшее время.</p>
        <p><strong>Номер заявки:</strong> #${escapeHtml(order.id)}</p>
        <p><strong>Тип услуги:</strong> ${order.serviceType === 'fence' ? 'Забор' : order.serviceType === 'canopy' ? 'Навес' : 'Индивидуальный расчет'}</p>
        <p><strong>Стоимость:</strong> ${Number(order.calculatedCost).toLocaleString('ru-RU')} ₽</p>
      </div>

      <p style="color: #666; font-size: 14px;">
        Если у вас есть вопросы, свяжитесь с нами по телефону ${escapeHtml(phone)}
      </p>
    </div>
  `;

  return sendEmail({
    to: order.email,
    subject: `Заявка #${order.id} принята`,
    html,
  });
}
