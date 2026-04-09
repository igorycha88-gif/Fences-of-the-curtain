#!/usr/bin/env node

const nodemailer = require('nodemailer');

async function testEmail() {
  // Test port 465 with SSL
  console.log('=== Тестирование порта 465 (SSL) ===');
  const transporter465 = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
      user: 'zabori-naves@yandex.ru',
      pass: 'iecighkzmsgktvtq'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔗 Подключение к smtp.yandex.ru:465 (SSL)...');
    await transporter465.verify();
    console.log('✅ Подключение к порту 465 успешно!');

    const info = await transporter465.sendMail({
      from: '"Заборы и Навесы" <zabori-naves@yandex.ru>',
      to: 'test@example.com',
      subject: 'Тест SSL (порт 465)',
      html: '<h2>Тест email</h2><p>Отправлено через порт 465 с SSL</p>'
    });
    console.log('✅ Письмо отправлено!');
    console.log('   Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Ошибка порта 465:', error.message);
  }

  console.log('\n=== Тестирование порта 587 (STARTTLS) ===');
  const transporter587 = nodemailer.createTransport({
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

  try {
    console.log('🔗 Подключение к smtp.yandex.ru:587 (STARTTLS)...');
    await transporter587.verify();
    console.log('✅ Подключение к порту 587 успешно!');

    const info = await transporter587.sendMail({
      from: '"Заборы и Навесы" <zabori-naves@yandex.ru>',
      to: 'test@example.com',
      subject: 'Тест STARTTLS (порт 587)',
      html: '<h2>Тест email</h2><p>Отправлено через порт 587 с STARTTLS</p>'
    });
    console.log('✅ Письмо отправлено!');
    console.log('   Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Ошибка порта 587:', error.message);
  }
}

testEmail().catch(console.error);