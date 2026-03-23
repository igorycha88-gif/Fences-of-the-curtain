#!/bin/bash

# Скрипт для настройки VPS для деплоя с GitHub Actions

set -e

echo "=== Настройка VPS для GitHub Actions деплоя ==="

# 1. Создание директории для SSH ключей
echo "1. Настройка SSH..."
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# 2. Добавление публичного ключа (требуется вставка)
echo ""
echo "Вставьте публичный SSH ключ (содержимое .pub файла):"
read -r PUBLIC_KEY

if [ -z "$PUBLIC_KEY" ]; then
    echo "❌ Ошибка: публичный ключ не предоставлен"
    exit 1
fi

# Добавление ключа в authorized_keys
if [ ! -f /root/.ssh/authorized_keys ]; then
    touch /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
fi

echo "$PUBLIC_KEY" >> /root/.ssh/authorized_keys
echo "✅ Публичный ключ добавлен в /root/.ssh/authorized_keys"

# 3. Создание директории для бэкапов
echo ""
echo "2. Настройка директории для бэкапов..."
sudo mkdir -p /backup/fences
sudo chown postgres:postgres /backup/fences
sudo chmod 700 /backup/fences
echo "✅ Директория для бэкапов создана: /backup/fences"

# 4. Проверка подключения к PostgreSQL
echo ""
echo "3. Проверка подключения к PostgreSQL..."
if sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ PostgreSQL доступен"
else
    echo "❌ Ошибка: PostgreSQL недоступен"
    exit 1
fi

# 5. Проверка наличия миграций
echo ""
echo "4. Проверка миграций Prisma..."
APP_DIR="/root/Fences-of-the-curtain"
if [ -d "$APP_DIR/prisma/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 "$APP_DIR/prisma/migrations" 2>/dev/null | wc -l)
    echo "✅ Найдено миграций: $MIGRATION_COUNT"
else
    echo "⚠️  Директория миграций не найдена"
fi

# 6. Вывод статуса текущего деплоя
echo ""
echo "5. Статус текущего деплоя:"
if pm2 list | grep -q "fences-app"; then
    echo "✅ PM2 процесс 'fences-app' запущен"
    pm2 status
else
    echo "⚠️  PM2 процесс 'fences-app' не найден"
fi

echo ""
echo "=== Настройка VPS завершена! ==="
echo ""
echo "Теперь можно запускать деплой через GitHub Actions."
echo "Для ручного деплоя выполните:"
echo "  cd $APP_DIR"
echo "  git pull origin master"
echo "  npm install --legacy-peer-deps"
echo "  npx prisma generate"
echo "  npm run build"
echo "  npx prisma migrate deploy"
echo "  pm2 reload ecosystem.config.js --env production"
