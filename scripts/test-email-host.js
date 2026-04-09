#!/usr/bin/env node

const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 587,
    secure: false,
    auth: {
      user: 'zabori-naves@yandex.ru',
      pass: 'iecighkzmsgktvtq'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log('🔗 Подключение к SMTP серверу smtp.yandex.ru:587...');

  try {
    await transporter.verify();
    console.log('✅ Успешное подключение к SMTP серверу!');
  } catch (error) {
    console.error('❌ Ошибка подключения к SMTP серверу:', error.message);
    return;
  }

  console.log('📧 Отправка тестового письма...');

  const testEmails = ['test@example.com', 'igorycha.s@yandex.ru'];

  for (const email of testEmails) {
    try {
      const info = await transporter.sendMail({
        from: '"Заборы и Навесы" <zabori-naves@yandex.ru>',
        to: email,
        subject: 'Тестовое письмо (отправлено с хост-машины)',
        html: `
          <h2>Тест email</h2>
          <p>Это тестовое письмо, отправленное напрямую с хост-машины.</p>
          <p><strong>Кому:</strong> ${email}</p>
          <p><strong>Время:</strong> ${new Date().toLocaleString('ru-RU')}</p>
          <p><hr></p>
          <p><em>Если вы получили это письмо, значит SMTP работает!</em></p>
        `
      });

      console.log(`✅ Письмо отправлено на ${email}`);
      console.log(`   Message ID: ${info.messageId}`);
    } catch (error) {
      console.error(`❌ Ошибка отправки на ${email}:`, error.message);
    }
  }

  console.log('\n📋 Проверьте почту через несколько секунд.');
}

testEmail().catch(console.error);