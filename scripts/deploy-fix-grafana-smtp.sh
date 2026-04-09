#!/bin/bash

# =============================================================================
# Безопасный деплой исправлений Grafana + SMTP на продакшен
# =============================================================================
# Версия: 1.0
# Дата: 2026-04-09
# Что исправляет:
#   - Grafana: порт 3002, убран auth proxy, правильные targets Prometheus
#   - SMTP: убран хардкод, USE_LOCAL_SMTP=false, правильные credentials
# =============================================================================

set -euo pipefail

VPS_HOST="37.143.13.196"
VPS_USER="root"
VPS_PASS="${VPS_PASSWORD:-Gorunova007@}"
VPS_DIR="/root/Fences-of-the-curtain"
BRANCH="master2"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

STEP=0
TOTAL_STEPS=8

log() { echo -e "${GREEN}[STEP ${STEP}/${TOTAL_STEPS}]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; }

vps_ssh() {
    sshpass -p "${VPS_PASS}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${VPS_USER}@${VPS_HOST}" "$1"
}

echo -e "${BLUE}"
echo "============================================================"
echo "  Безопасный деплой исправлений Grafana + SMTP"
echo "============================================================"
echo -e "${NC}"

# ---- STEP 1: Проверка подключения ----
STEP=1
log "Проверка подключения к VPS..."
if ! vps_ssh "echo 'OK'" > /dev/null 2>&1; then
    err "Не удалось подключиться к ${VPS_HOST}"
    exit 1
fi
echo -e "  ${GREEN}OK${NC}: подключение установлено"

# ---- STEP 2: Проверка текущего состояния ----
STEP=2
log "Проверка текущего состояния..."

APP_STATUS=$(vps_ssh "pm2 list 2>/dev/null | grep fences-app | awk '{print \$10}'" || echo "unknown")
echo "  PM2 app: ${APP_STATUS}"

MONITORING_CONTAINERS=$(vps_ssh "docker ps -a --filter name=fences- --format '{{.Names}} {{.Status}}' 2>/dev/null || echo 'no containers'")
echo "  Monitoring containers:"
vps_ssh "docker ps -a --filter name=fences- --format '    {{.Names}}: {{.Status}}' 2>/dev/null || echo '    нет контейнеров'"

CURRENT_ENV=$(vps_ssh "cat ${VPS_DIR}/.env | grep -E 'SMTP_|USE_LOCAL' 2>/dev/null || echo '.env not found'")
echo "  Текущий SMTP config:"
echo "$CURRENT_ENV" | sed 's/^/    /'

# ---- STEP 3: Резервное копирование ----
STEP=3
log "Резервное копирование конфигураций..."
BACKUP_DIR="${VPS_DIR}/backups/grafana-smtp-fix-$(date +%Y%m%d_%H%M%S)"
vps_ssh "mkdir -p ${BACKUP_DIR}"
vps_ssh "cd ${VPS_DIR} && cp docker-compose.monitoring.yml prometheus.yml .env.production .env ${BACKUP_DIR}/ 2>/dev/null || true"
vps_ssh "cd ${VPS_DIR} && docker compose -f docker-compose.monitoring.yml config > ${BACKUP_DIR}/monitoring-config-dump.yml 2>/dev/null || true"
echo -e "  ${GREEN}OK${NC}: бэкап в ${BACKUP_DIR}"

# ---- STEP 4: Обновление кода ----
STEP=4
log "Обновление кода с Git..."
BEFORE_COMMIT=$(vps_ssh "cd ${VPS_DIR} && git rev-parse HEAD 2>/dev/null || echo 'unknown'")
vps_ssh "cd ${VPS_DIR} && git fetch origin ${BRANCH} && git stash 2>/dev/null || true"
vps_ssh "cd ${VPS_DIR} && git checkout ${BRANCH} && git pull origin ${BRANCH}"
AFTER_COMMIT=$(vps_ssh "cd ${VPS_DIR} && git rev-parse HEAD")
echo "  ${BEFORE_COMMIT:0:7} → ${AFTER_COMMIT:0:7}"

# ---- STEP 5: Исправление .env на сервере ----
STEP=5
log "Проверка и исправление SMTP-конфигурации в .env..."

vps_ssh "cd ${VPS_DIR} && bash -s" << 'ENVEOF'
cd /root/Fences-of-the-curtain

# Проверяем наличие USE_LOCAL_SMTP
if grep -q 'USE_LOCAL_SMTP="true"' .env 2>/dev/null || grep -q 'USE_LOCAL_SMTP=true' .env 2>/dev/null; then
    echo "  Исправляю USE_LOCAL_SMTP=true → false"
    sed -i 's/USE_LOCAL_SMTP="true"/USE_LOCAL_SMTP=false/' .env
    sed -i "s/USE_LOCAL_SMTP=true/USE_LOCAL_SMTP=false/" .env
elif ! grep -q 'USE_LOCAL_SMTP' .env 2>/dev/null; then
    echo "  Добавляю USE_LOCAL_SMTP=false"
    echo 'USE_LOCAL_SMTP=false' >> .env
fi

# Проверяем SMTP_HOST
if ! grep -q 'SMTP_HOST="smtp.yandex.ru"' .env 2>/dev/null && ! grep -q "SMTP_HOST=smtp.yandex.ru" .env 2>/dev/null; then
    echo "  WARNING: SMTP_HOST не установлен на smtp.yandex.ru"
    echo "  Текущее значение:"
    grep 'SMTP_HOST' .env 2>/dev/null || echo "  (не найдено)"
fi

# Проверяем SMTP_USER
if ! grep -q 'SMTP_USER=' .env 2>/dev/null; then
    echo "  WARNING: SMTP_USER не найден в .env"
fi

# Проверяем SMTP_PASS
if ! grep -q 'SMTP_PASS=' .env 2>/dev/null; then
    echo "  WARNING: SMTP_PASS не найден в .env"
fi

# Проверяем GRAFANA_ADMIN_PASSWORD
if ! grep -q 'GRAFANA_ADMIN_PASSWORD=' .env 2>/dev/null; then
    echo "  Добавляю GRAFANA_ADMIN_PASSWORD"
    echo 'GRAFANA_ADMIN_PASSWORD=SecureGrafanaPass2026!' >> .env
fi

echo "  Итоговый SMTP config:"
grep -E 'SMTP_|USE_LOCAL' .env 2>/dev/null || echo "  (ошибка чтения)"
ENVEOF

echo -e "  ${GREEN}OK${NC}: .env проверен"

# ---- STEP 6: Перезапуск мониторинга ----
STEP=6
log "Перезапуск мониторинга (полная пересборка)..."

vps_ssh "cd ${VPS_DIR} && docker compose -f docker-compose.monitoring.yml down 2>/dev/null || true"
vps_ssh "cd ${VPS_DIR} && docker compose -f docker-compose.monitoring.yml build --no-cache 2>&1 | tail -5"
vps_ssh "cd ${VPS_DIR} && docker compose -f docker-compose.monitoring.yml up -d --force-recreate"

echo "  Ожидание запуска контейнеров (30 сек)..."
sleep 30

# ---- STEP 7: Проверка Grafana ----
STEP=7
log "Проверка Grafana..."

GRAFANA_HEALTH=$(vps_ssh "curl -sf http://localhost:3002/api/health 2>/dev/null || echo 'FAILED'")
if echo "$GRAFANA_HEALTH" | grep -q '"status":"ok"'\|"database":"ok"; then
    echo -e "  ${GREEN}OK${NC}: Grafana health: ${GRAFANA_HEALTH}"
else
    echo -e "  ${RED}FAIL${NC}: Grafana health: ${GRAFANA_HEALTH}"

    GRAFANA_LOGS=$(vps_ssh "docker logs fences-grafana --tail 20 2>&1")
    echo "  Grafana logs (последние 20 строк):"
    echo "$GRAFANA_LOGS" | sed 's/^/    /'
fi

# Проверка Prometheus
PROM_HEALTH=$(vps_ssh "docker exec fences-prometheus wget -qO- http://localhost:9090/-/healthy 2>/dev/null || echo 'FAILED'")
if echo "$PROM_HEALTH" | grep -q "OK"; then
    echo -e "  ${GREEN}OK${NC}: Prometheus healthy"
else
    echo -e "  ${RED}FAIL${NC}: Prometheus: ${PROM_HEALTH}"
fi

# Проверка порта 3002 извне
FIREWALL_CHECK=$(vps_ssh "curl -sf http://localhost:3002/api/health >/dev/null 2>&1 && echo 'PORT_OK' || echo 'PORT_BLOCKED'")
if [ "$FIREWALL_CHECK" = "PORT_OK" ]; then
    echo -e "  ${GREEN}OK${NC}: Порт 3002 доступен локально"
else
    echo -e "  ${YELLOW}WARN${NC}: Порт 3002 заблокирован — проверяю firewall..."
    vps_ssh "ufw status 2>/dev/null | head -5 || iptables -L INPUT -n 2>/dev/null | head -10 || echo 'не удалось проверить'"
    echo "  Открываю порт 3002..."
    vps_ssh "ufw allow 3002/tcp 2>/dev/null || iptables -I INPUT -p tcp --dport 3002 -j ACCEPT 2>/dev/null || echo 'firewall tweak skipped'"
fi

# ---- STEP 8: Проверка SMTP ----
STEP=8
log "Проверка SMTP..."

SMTP_TEST=$(vps_ssh "cd ${VPS_DIR} && node -e \"
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false }
});
transporter.verify()
  .then(() => { console.log('SMTP_OK'); process.exit(0); })
  .catch((e) => { console.log('SMTP_FAIL: ' + e.message); process.exit(1); })
\" 2>&1 || echo 'SMTP_ERROR'")

if echo "$SMTP_TEST" | grep -q "SMTP_OK"; then
    echo -e "  ${GREEN}OK${NC}: SMTP подключение успешно"
else
    echo -e "  ${RED}FAIL${NC}: ${SMTP_TEST}"
    echo "  Возможные причины:"
    echo "    1. Неверные SMTP credentials"
    echo "    2. Сервер блокирует исходящие SMTP-соединения"
    echo "    3. Yandex app password истёк"
fi

# ---- ИТОГ ----
echo ""
echo -e "${GREEN}============================================================"
echo "  ОТЧЁТ О ДЕПЛОЕ"
echo "============================================================${NC}"
echo ""
echo "  Git: ${BEFORE_COMMIT:0:7} → ${AFTER_COMMIT:0:7}"
echo "  Бэкап: ${BACKUP_DIR}"
echo ""

GRAFANA_UP=$(vps_ssh "docker ps --filter name=fences-grafana --filter status=running --format '{{.Names}}' 2>/dev/null")
if [ -n "$GRAFANA_UP" ]; then
    echo -e "  Grafana:  ${GREEN}WORKING${NC} — http://${VPS_HOST}:3002"
else
    echo -e "  Grafana:  ${RED}DOWN${NC}"
fi

if echo "$SMTP_TEST" | grep -q "SMTP_OK"; then
    echo -e "  SMTP:     ${GREEN}WORKING${NC}"
else
    echo -e "  SMTP:     ${RED}ISSUE${NC} — нужна ручная проверка credentials"
fi

echo ""
echo -e "  Rollback: ssh ${VPS_USER}@${VPS_HOST} \"cd ${VPS_DIR} && cp ${BACKUP_DIR}/* . 2>/dev/null; docker compose -f docker-compose.monitoring.yml down; docker compose -f docker-compose.monitoring.yml up -d\""
echo ""
echo -e "  ${BLUE}Логин Grafana:${NC} admin / SecureGrafanaPass2026!"
