# 📋 Документация по развертыванию (Deployment Guide)

## 🎯 Критические моменты для предотвращения проблем

### ⚠️ ТОП-10 проблем, которые нужно знать:

1. **ПОРТЫ** - Приложение всегда должно работать на порту **3001**
   - `package.json`: `"start": "next start -p 3001"`
   - `ecosystem.config.js`: `PORT: 3001`
   - `nginx.conf`: `proxy_pass http://localhost:3001`

2. **Next.js конфигурация** - НИКОГДА не использовать `output: 'standalone'`
   - Это ломает статические файлы
   - Убедитесь, что `next.config.js` НЕ содержит `output: 'standalone'`

3. **Пароли администраторов** - ВСЕГДА должны быть захешированы (bcrypt, 60 символов)
   - Не храните plaintext пароли в БД
   - После миграции БД запустите скрипт хеширования

4. **CSP (Content Security Policy)** - должен разрешать inline стили
   - `style-src 'self' 'unsafe-inline'` - обязательно для Next.js
   - Включить поддержку Google Fonts и Google Analytics

5. **ECOSYSTEM CONFIG** - правильная команда запуска
   ```javascript
   script: 'npx',
   args: 'next start -p 3001',
   ```

6. **NGINX конфигурация** - правильный прокси
   - Проверить порт: `proxy_pass http://localhost:3001`
   - Проверить редиректы: HTTP → HTTPS
   - Проверить SSL сертификаты

7. **Окружение (Environment Variables)** - критичные переменные
   - `NEXTAUTH_SECRET` - минимум 32 символа
   - `DATABASE_URL` - правильная строка подключения
   - `REDIS_URL` - правильная строка подключения
   - `NODE_ENV=production`

8. **PM2 конфигурация** - сохраняйте изменения
   - После каждого изменения: `pm2 save`
   - Проверяйте статус: `pm2 status`

9. **Миграции БД** - используйте безопасные команды
   - ❌ `prisma db push --accept-data-loss` - ОПАСНО!
   - ✅ `prisma migrate deploy` - безопасно

10. **GitHub Secrets** - не хардкодите пароли и IP
    - Используйте `${{ secrets.SSH_HOST }}`
    - Используйте `${{ secrets.SSH_PASSWORD }}`

---

## 🚀 Первичная настройка сервера

### 1. Требования к серверу

**Минимальная конфигурация:**
- CPU: 2 cores
- RAM: 2GB
- Диск: 20GB SSD
- ОС: Ubuntu 20.04+ или Debian 11+

**Требуемое ПО:**
- Node.js 20.x
- PostgreSQL 14+
- Redis 7+
- Nginx 1.18+
- PM2 (npm install -g pm2)
- Certbot (для SSL)

### 2. Установка зависимостей

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установка PostgreSQL
apt install -y postgresql postgresql-contrib

# Установка Redis
apt install -y redis-server

# Установка Nginx
apt install -y nginx

# Установка Certbot
apt install -y certbot python3-certbot-nginx

# Установка PM2
npm install -g pm2
```

### 3. Настройка PostgreSQL

```bash
# Создание базы данных
sudo -u postgres psql
CREATE DATABASE fences;
CREATE USER fences WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE fences TO fences;
\q
```

### 4. Настройка Redis

```bash
# Настройка пароля
redis-cli
CONFIG SET requirepass "strong_redis_password"
EXIT
```

### 5. Настройка SSL сертификатов

```bash
# Получение сертификата (для домена)
certbot --nginx -d zabor-i-naves.ru

# Или самоподписанный сертификат для IP
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/key.pem \
  -out /etc/nginx/ssl/cert.pem
```

### 6. Создание .env файла

```bash
cd /root/Fences-of-the-curtain
cp .env.example .env
nano .env
```

**Обязательные переменные:**
```bash
NODE_ENV=production
PORT=3001
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://zabor-i-naves.ru
DATABASE_URL=postgresql://fences:password@localhost:5432/fences
REDIS_URL=redis://:password@localhost:6379
```

### 7. Настройка PM2 автозапуска

```bash
# Создание конфига
pm2 startup systemd -u root --hp /root

# Сохранение конфига
pm2 save
```

### 8. Настройка бэкапов БД

```bash
# Добавление в crontab
crontab -e
# Добавить строку:
0 2 * * * /root/Fences-of-the-curtain/scripts/backup-db.sh
```

---

## 🔄 Процесс деплоя

### Вариант 1: GitHub Actions (рекомендуется)

1. **Настройка GitHub Secrets:**
   - `SSH_HOST`: IP сервера
   - `SSH_PASSWORD`: пароль root
   - `SSH_PORT`: порт SSH (обычно 22)

2. **Триггер деплоя:**
   - Перейдите в Actions → Deploy to VPS
   - Нажмите "Run workflow"

3. **Автоматический процесс:**
   - Pull изменений
   - Установка зависимостей
   - Генерация Prisma Client
   - Сборка приложения
   - Применение миграций
   - Перезагрузка PM2
   - Health check (10 попыток)

### Вариант 2: Ручной деплой

```bash
# 1. Подключение к серверу
ssh root@your-server-ip

# 2. Переход в директорию
cd /root/Fences-of-the-curtain

# 3. Создание бэкапа перед деплоем
sudo -u postgres pg_dump -U postgres fences > backup_before_deploy.sql

# 4. Обновление кода
git fetch origin
git pull origin master

# 5. Установка зависимостей
npm install --legacy-peer-deps

# 6. Генерация Prisma Client
npx prisma generate

# 7. Сборка приложения
npm run build

# 8. Применение миграций
npx prisma migrate deploy

# 9. Перезагрузка приложения
pm2 reload ecosystem.config.js --env production

# 10. Проверка статуса
pm2 status
pm2 logs fences-app --lines 50
```

---

## 🔧 Конфигурационные файлы

### next.config.js (КРИТИЧНО)

```javascript
// ❌ НЕ ИСПОЛЬЗОВАТЬ
output: 'standalone',

// ✅ ПРАВИЛЬНО
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'zabor-i-naves.ru'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Security headers
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          
          // CSP - КРИТИЧНО для работы стилей
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://mc.yandex.ru https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' https://mc.yandex.ru; frame-src 'self' https://www.google.com https://www.gstatic.com; object-src 'none';"
          }
        ],
      },
    ];
  },
};
```

### ecosystem.config.js (КРИТИЧНО)

```javascript
module.exports = {
  apps: [
    {
      name: 'fences-app',
      script: 'npx',
      args: 'next start -p 3001',  // КРИТИЧНО: порт 3001
      cwd: '/root/Fences-of-the-curtain',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,  // КРИТИЧНО: порт 3001
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/fences-app/error.log',
      out_file: '/var/log/fences-app/out.log',
      merge_logs: true,
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      restart_delay: 1000,
    },
  ],
};
```

### nginx.conf (КРИТИЧНО)

```nginx
upstream app {
    server 127.0.0.1:3001;  // КРИТИЧНО: порт 3001
}

server {
    listen 443 ssl http2;
    server_name zabor-i-naves.ru;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/zabor-i-naves.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zabor-i-naves.ru/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Статические файлы
    location /_next/static/ {
        alias /root/Fences-of-the-curtain/.next/static/;
        expires 365d;
    }
    
    location / {
        proxy_pass http://app;  // КРИТИЧНО: upstream на 3001
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name zabor-i-naves.ru;
    return 301 https://$host$request_uri;
}
```

---

## 🔍 Мониторинг и диагностика

### Проверка статуса приложения

```bash
# PM2 статус
pm2 status
pm2 logs fences-app --lines 100

# Проверка портов
netstat -tlnp | grep -E ':(3000|3001)'

# Проверка ответа приложения
curl -I http://localhost:3001/
curl -I http://localhost:3001/_next/static/media/test-file.woff2
```

### Проверка базы данных

```bash
# Подключение к БД
sudo -u postgres psql -d fences

# Проверка пользователей
SELECT id, email, role, length(password) as password_length 
FROM "User" WHERE role IN ('ADMIN', 'MANAGER');

# Выход
\q
```

### Проверка Redis

```bash
# Проверка соединения
redis-cli ping
# Должно вернуть: PONG
```

### Проверка Nginx

```bash
# Проверка конфига
nginx -t

# Проверка статуса
systemctl status nginx

# Перезагрузка
systemctl reload nginx
```

---

## 🛠️ Решение проблем (Troubleshooting)

### Проблема: Приложение не запускается (PM2 waiting/restarting)

**Причины:**
1. Порт занят
2. Ошибка в конфиге
3. Модули не установлены

**Решение:**
```bash
# 1. Проверка логов
pm2 logs fences-app --lines 100

# 2. Проверка занятых портов
netstat -tlnp | grep -E ':(3000|3001)'

# 3. Убить процесс на порту
kill -9 <PID>

# 4. Проверка .env файла
cat .env | grep -E '^(NODE_ENV|DATABASE_URL|REDIS_URL|NEXTAUTH_SECRET)'

# 5. Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Проблема: 404 на статических файлах

**Причина:** `output: 'standalone'` в next.config.js

**Решение:**
```bash
# 1. Убрать output: 'standalone' из next.config.js
nano next.config.js

# 2. Пересобрать приложение
rm -rf .next
npm run build

# 3. Перезапустить приложение
pm2 reload fences-app
```

### Проблема: CSP ошибки в консоли браузера

**Причина:** Неверный Content Security Policy

**Решение:**
```bash
# Проверить CSP header
curl -I http://localhost:3001/ | grep -i 'content-security-policy'

# Должно включать:
# style-src 'self' 'unsafe-inline'
```

### Проблема: Не могу авторизоваться (401 Unauthorized)

**Причины:**
1. Пароли не захешированы
2. Неверный NEXTAUTH_SECRET

**Решение:**
```bash
# 1. Проверить пароли в БД
sudo -u postgres psql -d fences -c "SELECT id, email, length(password) as pwd_len FROM \"User\" WHERE role IN ('ADMIN', 'MANAGER');"

# Длина должна быть 60 символов (bcrypt)

# 2. Если короче - запустить миграцию
npx tsx scripts/reset-passwords.ts

# 3. Проверить NEXTAUTH_SECRET
grep NEXTAUTH_SECRET .env
# Должен быть минимум 32 символа
```

### Проблема: Сайт недоступен по HTTPS

**Решение:**
```bash
# 1. Проверить наличие SSL сертификатов
ls -la /etc/letsencrypt/live/zabor-i-naves.ru/

# 2. Проверить конфиг Nginx
cat /etc/nginx/sites-available/fences | grep ssl_certificate

# 3. Если сертификаты отсутствуют
certbot --nginx -d zabor-i-naves.ru
```

---

## 📊 Ключевые метрики для мониторинга

### Критичные метрики
- PM2 статус: должен быть "online"
- Перезапуски PM2: должны быть 0 или минимальны
- Ошибки в логах: отсутствовать
- HTTP статус: 200 OK
- Время отклика: < 2 секунды

### Логи для регулярной проверки
```bash
# Приложение
tail -f /var/log/fences-app/error.log
tail -f /var/log/fences-app/out.log

# Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# PostgreSQL
tail -f /var/log/postgresql/postgresql-*

# PM2
pm2 logs --lines 100 --nostream
```

---

## 🔄 Обновление паролей администраторов

### После миграции БД

Если вы импортировали БД или изменили схему, пароли могут быть plaintext:

```bash
# Запуск скрипта хеширования
cd /root/Fences-of-the-curtain
npx tsx scripts/reset-passwords.ts

# Проверить результат
sudo -u postgres psql -d fences -c "SELECT email, length(password) FROM \"User\" WHERE role IN ('ADMIN', 'MANAGER');"
# Должна быть 60 символов
```

---

## 📦 Полный чек-лист перед деплоем

### Перед деплоем
- [ ] Все изменения закоммичены и запушены
- [ ] GitHub Secrets настроены (SSH_HOST, SSH_PASSWORD)
- [ ] `.env.example` обновлён новыми переменными
- [ ] `.env` файл существует на сервере
- [ ] Бэкап БД создан
- [ ] Nginx конфиг проверен (`nginx -t`)

### После деплоя
- [ ] PM2 статус: online
- [ ] Перезапусков: 0
- [ ] HTTP/HTTPS доступен
- [ ] Статические файлы доступны (проверить .woff2)
- [ ] Авторизация работает
- [ ] CSP нет ошибок в консоли браузера
- [ ] Порты 3001 и 443 открыты
- [ ] БД подключается
- [ ] Redis подключается

### Регулярные задачи
- [ ] Бэкапы БД создаются ежедневно
- [ ] SSL сертификаты обновляются (certbot renew)
- [ ] Логи проверяются еженедельно
- [ ] Мониторинг настроен
- [ ] Уведомления о проблемах работают

---

## 📞 Контакты для экстренных ситуаций

### Если приложение не работает
1. Проверить PM2: `pm2 status`
2. Проверить логи: `pm2 logs fences-app --lines 100`
3. Проверить порты: `netstat -tlnp`

### Если база данных не работает
1. Проверить статус: `systemctl status postgresql`
2. Проверить логи: `tail -f /var/log/postgresql/postgresql-*.log`
3. Попробовать подключиться: `sudo -u postgres psql -d fences`

### Если Nginx не работает
1. Проверить статус: `systemctl status nginx`
2. Проверить конфиг: `nginx -t`
3. Проверить логи: `tail -f /var/log/nginx/error.log`

---

## 📚 Полезные команды

### PM2
```bash
pm2 list                    # Список процессов
pm2 status                  # Статус
pm2 logs <name> --lines 100 # Логи
pm2 restart <name>          # Рестарт
pm2 reload <name>           # Перезагрузка (без отключения)
pm2 save                    # Сохранить конфиг
pm2 startup                  # Настроить автозапуск
```

### Prisma
```bash
npx prisma generate           # Генерация клиента
npx prisma migrate deploy     # Применение миграций
npx prisma db push           # Опасно! Не использовать в проде
npx prisma studio            # GUI для БД
```

### Git
```bash
git status                   # Статус изменений
git log --oneline -10      # Последние коммиты
git reset --hard <hash>     # Откат к версии
git tag                     # Список тегов
```

### Systemd
```bash
systemctl status <service>    # Статус сервиса
systemctl restart <service>   # Рестарт
systemctl reload <service>    # Перезагрузка конфига
systemctl enable <service>    # Автозапуск
journalctl -u <service>     # Логи сервиса
```

---

## 🎓 Дополнительные ресурсы

### Документация
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- PM2: https://pm2.keymetrics.io/docs/usage
- Nginx: https://nginx.org/en/docs/

### Мониторинг
- PM2 Monitor: `pm2 monit`
- Nginx status: `systemctl status nginx`
- PostgreSQL: `sudo -u postgres psql -c "SELECT version();"`

---

## ⚡ Быстрый старт (Quick Start)

```bash
# 1. Подключиться к серверу
ssh root@your-server-ip

# 2. Диагностика
cd /root/Fences-of-the-curtain
bash scripts/diagnose.sh

# 3. Деплой
git pull origin master
npm install --legacy-peer-deps
npx prisma generate
npm run build
npx prisma migrate deploy
pm2 reload ecosystem.config.js --env production

# 4. Проверка
pm2 status
curl -I http://localhost:3001/
```

---

**Помните:** Проверяйте всё по шагам и не спешите. Ошибка в одном файле может сломать всё приложение!
