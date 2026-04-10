#!/bin/bash

# =============================================================================
# 🔄 ЭКСТРЕННЫЙ ОТКАТ MASTER2
# =============================================================================

set -e

VPS_HOST="${VPS_HOST:-37.143.13.196}"
VPS_USER="${VPS_USER:-root}"
VPS_PASS="${VPS_PASS:?Set VPS_PASS env variable}"
VPS_DIR="/root/Fences-of-the-curtain"
DB_PASS="${DB_PASS:?Set DB_PASS env variable}"
PREV_COMMIT="454bec7"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

vps_ssh() {
    sshpass -p "${VPS_PASS}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "$1"
}

BACKUP_DIR="${1:-}"

echo -e "${YELLOW}=============================================================================="
echo "🔄 ЭКСТРЕННЫЙ ОТКАТ"
echo "==============================================================================${NC}"

if [ -z "$BACKUP_DIR" ]; then
    echo "⚠️  Бэкап не указан, используется последний..."
    BACKUP_DIR=$(vps_ssh "ls -td ${VPS_DIR}/backups/*/ | head -1 | tr -d '/'")
fi

echo "Бэкап: ${BACKUP_DIR}"
echo "Целевой коммит: ${PREV_COMMIT}"
read -p "Продолжить откат? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено"
    exit 1
fi

# [1/5] Остановка приложения
echo -e "${YELLOW}[1/5] Остановка приложения...${NC}"
vps_ssh "pm2 stop fences-app || true"
echo -e "${GREEN}✓ Приложение остановлено${NC}"

# [2/5] Восстановление кода
echo -e "${YELLOW}[2/5] Восстановление кода...${NC}"
vps_ssh "cd ${VPS_DIR} && git reset --hard ${PREV_COMMIT}"
echo -e "${GREEN}✓ Код восстановлен${NC}"

# [3/5] Восстановление БД (если нужно)
read -p "Восстановить БД из бэкапа? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}[3/5] Восстановление БД...${NC}"
    vps_ssh "gunzip -c ${BACKUP_DIR}/db_backup.sql.gz | PGPASSWORD='${DB_PASS}' psql -h localhost -U postgres fences"
    echo -e "${GREEN}✓ БД восстановлена${NC}"
else
    echo -e "${YELLOW}[3/5] Пропуск восстановления БД${NC}"
fi

# [4/5] Переустановка и сборка
echo -e "${YELLOW}[4/5] Переустановка и сборка...${NC}"
vps_ssh "cd ${VPS_DIR} && npm ci --legacy-peer-deps"
vps_ssh "cd ${VPS_DIR} && npx prisma generate"
vps_ssh "cd ${VPS_DIR} && rm -rf .next && npm run build"
echo -e "${GREEN}✓ Сборка завершена${NC}"

# [5/5] Запуск
echo -e "${YELLOW}[5/5] Запуск приложения...${NC}"
vps_ssh "pm2 start fences-app"
vps_ssh "pm2 save"
sleep 10

# Проверка
PM2_STATUS=$(vps_ssh "pm2 list | grep fences-app | awk '{print \$10}'")
if [ "$PM2_STATUS" = "online" ]; then
    echo -e "${GREEN}✓ Приложение запущено${NC}"
else
    echo -e "${RED}✗ Ошибка запуска${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ ОТКАТ УСПЕШНО ЗАВЕРШЕН${NC}"
echo "Коммит: ${PREV_COMMIT}"
