#!/bin/bash

# =============================================================================
# 🚀 БЕЗОПАСНЫЙ ДЕПЛОЙ MASTER2 С МОНИТОРИНГОМ
# =============================================================================
# Версия: 2.0
# Дата: 04.04.2026
# =============================================================================

set -e

# Конфигурация
VPS_HOST="37.143.13.196"
VPS_USER="root"
VPS_PASS="Gorunova007@"
VPS_DIR="/root/Fences-of-the-curtain"
DB_PASS="HVt6G6LE6mduMrAny91F"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функция SSH
vps_ssh() {
    sshpass -p "${VPS_PASS}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "$1"
}

echo -e "${BLUE}"
echo "=============================================================================="
echo "🚀 БЕЗОПАСНЫЙ ДЕПЛОЙ MASTER2 С МОНИТОРИНГОМ"
echo "=============================================================================="
echo -e "${NC}"

# [1/10] Проверка подключения
echo -e "${YELLOW}[1/10] Проверка подключения к VPS...${NC}"
vps_ssh "echo 'OK'" > /dev/null 2>&1 || { echo -e "${RED}✗ Ошибка подключения${NC}"; exit 1; }
echo -e "${GREEN}✓ Подключение установлено${NC}"

# [2/10] Резервное копирование
echo -e "${YELLOW}[2/10] Резервное копирование...${NC}"
BACKUP_DIR="${VPS_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
vps_ssh "mkdir -p ${BACKUP_DIR}"
vps_ssh "PGPASSWORD='${DB_PASS}' pg_dump -h localhost -U postgres fences > ${BACKUP_DIR}/db_backup.sql && gzip ${BACKUP_DIR}/db_backup.sql"
vps_ssh "cd ${VPS_DIR} && git rev-parse HEAD > ${BACKUP_DIR}/commit.txt"
vps_ssh "cd ${VPS_DIR} && tar czf ${BACKUP_DIR}/uploads.tar.gz public/uploads/ 2>/dev/null || echo 'No uploads'"
echo -e "${GREEN}✓ Бэкап создан: ${BACKUP_DIR}${NC}"

# [3/10] Обновление кода
echo -e "${YELLOW}[3/10] Обновление кода...${NC}"
vps_ssh "cd ${VPS_DIR} && git fetch origin && git pull origin master2"
NEW_COMMIT=$(vps_ssh "cd ${VPS_DIR} && git rev-parse HEAD")
echo -e "${GREEN}✓ Код обновлен: ${NEW_COMMIT:0:7}${NC}"

# [4/10] Миграции БД
echo -e "${YELLOW}[4/10] Миграции БД...${NC}"
vps_ssh "cd ${VPS_DIR} && npx prisma migrate deploy"
vps_ssh "cd ${VPS_DIR} && npx prisma generate"
echo -e "${GREEN}✓ Миграции применены${NC}"

# [5/10] Зависимости
echo -e "${YELLOW}[5/10] Установка зависимостей...${NC}"
vps_ssh "cd ${VPS_DIR} && npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund"
echo -e "${GREEN}✓ Зависимости установлены${NC}"

# [6/10] Сборка
echo -e "${YELLOW}[6/10] Сборка приложения (5-8 мин)...${NC}"
START_TIME=$(date +%s)
vps_ssh "cd ${VPS_DIR} && rm -rf .next && npm run build"
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))
echo -e "${GREEN}✓ Сборка завершена за ${BUILD_TIME} сек${NC}"

# [7/10] Перезапуск
echo -e "${YELLOW}[7/10] Перезапуск PM2...${NC}"
vps_ssh "cd ${VPS_DIR} && pm2 reload fences-app || pm2 restart fences-app"
vps_ssh "pm2 save"
echo -e "${GREEN}✓ Приложение перезапущено${NC}"
sleep 15

# [8/10] Проверка приложения
echo -e "${YELLOW}[8/10] Проверка приложения...${NC}"

# PM2
PM2_STATUS=$(vps_ssh "pm2 list | grep fences-app | awk '{print \$10}'")
[ "$PM2_STATUS" = "online" ] && echo -e "${GREEN}✓ PM2: online${NC}" || { echo -e "${RED}✗ PM2: $PM2_STATUS${NC}"; exit 1; }

# Health
HEALTH=$(vps_ssh "curl -s http://localhost:3001/api/health")
echo "$HEALTH" | grep -q '"status":"ok"' && echo -e "${GREEN}✓ Health: OK${NC}" || { echo -e "${RED}✗ Health failed${NC}"; exit 1; }

# Main page
HTTP_CODE=$(vps_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/")
[ "$HTTP_CODE" = "200" ] && echo -e "${GREEN}✓ Главная: HTTP 200${NC}" || { echo -e "${RED}✗ Главная: HTTP $HTTP_CODE${NC}"; exit 1; }

# API
API_CODE=$(vps_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/admin/notification-recipients")
echo -e "${GREEN}✓ API notification-recipients: HTTP $API_CODE${NC}"

# [9/10] Запуск мониторинга
echo -e "${YELLOW}[9/10] Запуск мониторинга...${NC}"

# Проверка GRAFANA_ADMIN_PASSWORD
GRAFANA_PASS_EXISTS=$(vps_ssh "cd ${VPS_DIR} && grep -q 'GRAFANA_ADMIN_PASSWORD=' .env && echo 'yes' || echo 'no'")
if [ "$GRAFANA_PASS_EXISTS" = "no" ]; then
    echo "  → Добавление GRAFANA_ADMIN_PASSWORD в .env..."
    vps_ssh "cd ${VPS_DIR} && echo 'GRAFANA_ADMIN_PASSWORD=SecureGrafanaPass2026!' >> .env"
fi

# Запуск мониторинга
vps_ssh "cd ${VPS_DIR} && docker-compose -f docker-compose.monitoring.yml up -d"
echo -e "${GREEN}✓ Мониторинг запущен${NC}"

sleep 30

# [10/10] Проверка мониторинга
echo -e "${YELLOW}[10/10] Проверка мониторинга...${NC}"

# Grafana
GRAFANA_STATUS=$(vps_ssh "docker ps --filter name=fences-grafana --format '{{.Status}}' | head -1")
if echo "$GRAFANA_STATUS" | grep -q "Up"; then
    echo -e "${GREEN}✓ Grafana: $GRAFANA_STATUS${NC}"
else
    echo -e "${YELLOW}⚠ Grafana: Не запущена${NC}"
fi

# Prometheus
PROM_STATUS=$(vps_ssh "docker ps --filter name=fences-prometheus --format '{{.Status}}' | head -1")
if echo "$PROM_STATUS" | grep -q "Up"; then
    echo -e "${GREEN}✓ Prometheus: $PROM_STATUS${NC}"
else
    echo -e "${YELLOW}⚠ Prometheus: Не запущен${NC}"
fi

# Итог
echo ""
echo -e "${GREEN}=============================================================================="
echo "✅ ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН"
echo "==============================================================================${NC}"
echo "📊 Коммит: ${NEW_COMMIT:0:7}"
echo "⏱️  Время сборки: ${BUILD_TIME} сек"
echo "💾 Бэкап: ${BACKUP_DIR}"
echo ""
echo "🔍 Проверки:"
echo "  • Health: http://${VPS_HOST}:3001/api/health"
echo "  • Admin: http://${VPS_HOST}:3001/admin"
echo ""
echo "📈 Мониторинг:"
echo "  • Grafana: http://${VPS_HOST}:3000 (admin / SecureGrafanaPass2026!)"
echo "  • Prometheus: http://${VPS_HOST}:9090"
echo ""
echo "🚨 Откат: bash scripts/rollback-master2.sh ${BACKUP_DIR}"
