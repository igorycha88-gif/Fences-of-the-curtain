#!/usr/bin/env node

const { createServer } = require('net');

// Создаём простой TCP прокси для теста
const server = createServer((socket) => {
  console.log('🔗 Новое подключение к прокси');

  // Подключаемся к SMTP серверу
  const targetSocket = createServer((client) => {
    console.log('✅ Подключено к smtp.yandex.ru');
  }).connect({
    host: 'smtp.yandex.ru',
    port: 587
  }, () => {
    console.log('📡 Перенаправление данных...');
    socket.pipe(targetSocket).pipe(socket);
  });

  targetSocket.on('error', (err) => {
    console.error('❌ Ошибка подключения к SMTP:', err.message);
    socket.end();
  });

  socket.on('error', (err) => {
    console.error('❌ Ошибка клиентского сокета:', err.message);
    targetSocket.end();
  });
});

const PORT = 8026;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TCP прокси запущен на порту ${PORT}`);
  console.log(`📧 Перенаправление на smtp.yandex.ru:587`);
  console.log(`\n💡 Используйте этот порт в SMTP настройках: ${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Ошибка сервера:', err);
});