#!/bin/bash

# =============================================================================
# 🚀 БЫСТРЫЙ ДЕПЛОЙ MASTER2 (НЕИНТЕРАКТИВНЫЙ)
# =============================================================================

set -e

VPS_HOST="37.143.13.196"
VPS_USER="root"
VPS_PASS="Gorunova007@"
VPS_DIR="/root/Fences-of-the-curtain"
DB_PASS="HVt6G6LE6mduMrAny91F"

echo "=============================================================================="
echo "🚀 ЗАПУСК ДЕПЛОЯ MASTER2"
echo "=============================================================================="
echo ""

# Функция для SSH команд
vps_ssh() {
    sshpass -p "${VPS_PASS}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "$1"
}

echo "[$(date '+%H:%M:%S')] [1/8] Проверка подключения к VPS..."
vps_ssh "echo 'OK'" > /dev/null 2>&1 || { echo "❌ Ошибка подключения"; exit 1; }
echo "✓ Подключение установлено"

echo ""
echo "[$(date '+%H:%M:%S')] [2/8] Создание резервных копий..."
BACKUP_DIR="${VPS_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
vps_ssh "mkdir -p ${BACKUP_DIR}"
vps_ssh "PGPASSWORD='${DB_PASS}' pg_dump -h localhost -U postgres fences > ${BACKUP_DIR}/db_backup.sql && gzip ${BACKUP_DIR}/db_backup.sql"
vps_ssh "cd ${VPS_DIR} && git rev-parse HEAD > ${BACKUP_DIR}/commit.txt"
echo "✓ Резервные копии созданы: ${BACKUP_DIR}"

echo ""
echo "[$(date '+%H:%M:%S')] [3/8] Обновление кода..."
vps_ssh "cd ${VPS_DIR} && git fetch origin && git pull origin master2"
NEW_COMMIT=$(vps_ssh "cd ${VPS_DIR} && git rev-parse HEAD")
echo "✓ Код обновлен до: ${NEW_COMMIT:0:7}"

echo ""
echo "[$(date '+%H:%M:%S')] [4/8] Установка зависимостей..."
vps_ssh "cd ${VPS_DIR} && npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund"
echo "✓ Зависимости установлены"

echo ""
echo "[$(date '+%H:%M:%S')] [5/8] Миграции БД..."
vps_ssh "cd ${VPS_DIR} && npx prisma migrate deploy"
vps_ssh "cd ${VPS_DIR} && npx prisma generate"
echo "✓ Миграции применены"

echo ""
echo "[$(date '+%H:%M:%S')] [6/8] Сборка приложения..."
START_TIME=$(date +%s)
vps_ssh "cd ${VPS_DIR} && rm -rf .next && npm run build"
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))
echo "✓ Сборка завершена за ${BUILD_TIME} сек"

echo ""
echo "[$(date '+%H:%M:%S')] [7/8] Перезапуск PM2..."
vps_ssh "cd ${VPS_DIR} && pm2 reload fences-app || pm2 restart fences-app"
vps_ssh "pm2 save"
echo "✓ Приложение перезапущено"

echo ""
echo "[$(date '+%H:%M:%S')] [8/8] Проверка работоспособности..."
sleep 15

# Проверка PM2
PM2_STATUS=$(vps_ssh "pm2 list | grep fences-app | awk '{print \$10}'")
if [ "$PM2_STATUS" = "online" ]; then
    echo "✓ PM2 статус: online"
else
    echo "❌ PM2 статус: $PM2_STATUS"
    exit 1
fi

# Проверка health
HEALTH=$(vps_ssh "curl -s http://localhost:3001/api/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "✓ Health check: OK"
else
    echo "❌ Health check failed"
    exit 1
fi

# Проверка главной страницы
HTTP_CODE=$(vps_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Главная страница: HTTP 200"
else
    echo "❌ Главная страница: HTTP $HTTP_CODE"
    exit 1
fi

# Проверка новых API
API_CODE=$(vps_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/admin/notification-recipients")
echo "✓ API notification-recipients: HTTP $API_CODE"

echo ""
echo "=============================================================================="
echo "✅ ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН"
echo "=============================================================================="
echo "Время: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Коммит: ${NEW_COMMIT:0:7}"
echo "Бэкап: ${BACKUP_DIR}"
echo ""
echo "Проверки:"
echo "  • Health: http://${VPS_HOST}:3001/api/health"
echo "  • Admin panel: http://${VPS_HOST}:3001/admin"
echo "  • PM2 logs: ssh root@${VPS_HOST} 'pm2 logs fences-app --lines 50'"
echo ""
