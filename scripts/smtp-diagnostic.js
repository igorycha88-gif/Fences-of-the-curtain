#!/usr/bin/env node

const nodemailer = require('nodemailer');
const dns = require('dns');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const resolve4 = promisify(dns.resolve4);

console.log('=== 🔍 Диагностика SMTP и VPN ===\n');

async function runDiagnostics() {
  try {
    // 1. Проверка DNS
    console.log('1️⃣ Проверка DNS для smtp.yandex.ru...');
    const addresses = await resolve4('smtp.yandex.ru');
    console.log('✅ DNS резолвинг работает:');
    addresses.forEach(addr => console.log(`   - ${addr}`));
  } catch (error) {
    console.error('❌ Ошибка DNS:', error.message);
  }

  try {
    // 2. Проверка маршрутизации
    console.log('\n2️⃣ Проверка маршрутизации...');
    const { stdout } = await execAsync('route -n get smtp.yandex.ru');
    console.log('Маршрут к smtp.yandex.ru:');
    console.log(stdout);
  } catch (error) {
    console.error('❌ Не удалось получить маршрут:', error.message);
  }

  // 3. Проверка портов напрямую
  console.log('\n3️⃣ Проверка портов...');
  const net = require('net');
  const ports = [25, 465, 587, 2525];

  for (const port of ports) {
    try {
      const result = await Promise.race([
        new Promise((resolve) => {
          const socket = new net.Socket();
          socket.setTimeout(3000);

          socket.connect(port, 'smtp.yandex.ru', () => {
            socket.destroy();
            resolve({ port, success: true });
          });

          socket.on('error', () => {
            resolve({ port, success: false });
          });

          socket.on('timeout', () => {
            socket.destroy();
            resolve({ port, success: false });
          });
        }),
        new Promise(resolve => setTimeout(() => resolve({ port, success: false }), 3000))
      ]);

      if (result.success) {
        console.log(`✅ Порт ${result.port} доступен`);
      } else {
        console.log(`❌ Порт ${result.port} заблокирован`);
      }
    } catch (error) {
      console.log(`❌ Порт ${port} ошибка: ${error.message}`);
    }
  }

  // 4. Попытка отправки через разные порты
  console.log('\n4️⃣ Попытка отправки email...\n');

  const emailTests = [
    {
      name: 'Порт 465 (SSL)',
      config: {
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
      }
    },
    {
      name: 'Порт 587 (STARTTLS)',
      config: {
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
      }
    }
  ];

  for (const test of emailTests) {
    console.log(`📧 Тест: ${test.name}`);
    const transporter = nodemailer.createTransport(test.config);

    try {
      await transporter.verify();
      console.log('✅ Подключение успешно!');

      const info = await transporter.sendMail({
        from: '"Заборы и Навесы" <zabori-naves@yandex.ru>',
        to: 'test@example.com',
        subject: `Тест: ${test.name}`,
        html: `<h2>Тестовое письмо</h2><p>Отправлено через ${test.name}</p>`
      });

      console.log('✅ Email отправлен!');
      console.log(`   Message ID: ${info.messageId}\n`);
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
      if (error.code === 'ETIMEDOUT') {
        console.error('   💡 Причина: VPN блокирует порт или сетевое ограничение');
      }
      console.log('');
    }
  }

  console.log('=== 📋 Рекомендации ===');
  console.log('1. Временно отключите VPN и повторите тест');
  console.log('2. Настройте split tunneling в VPN для smtp.yandex.ru');
  console.log('3. Используйте другой SMTP провайдер (SendGrid, Mailgun)');
  console.log('4. Для локальной разработки используйте MailHog: http://localhost:8025');
}

runDiagnostics().catch(console.error);