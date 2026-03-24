#!/bin/bash

# =============================================================================
# ✅ ПРОВЕРКА ДЕПЛОЯ (VERIFICATION)
# =============================================================================
# Скрипт проверяет работоспособность приложения после деплоя
# =============================================================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_failure() {
    echo -e "${RED}✗${NC} $1"
}

# Конфигурация
VPS_HOST="37.143.13.196"
VPS_USER="root"
VPS_DIR="/root/Fences-of-the-curtain"
APP_NAME="fences-app"
DB_PASS="HVt6G6LE6mduMrAny91F"

# Счетчики
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local description="$1"
    local command="$2"

    echo -n "  Проверка: $description ... "
    if eval "$command" > /dev/null 2>&1; then
        log_success "ПРОЙДЕНО"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        log_failure "НЕ ПРОЙДЕНО"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Главная функция
main() {
    echo ""
    echo "=============================================================================="
    echo "✅ ПРОВЕРКА ДЕПЛОЯ"
    echo "=============================================================================="
    echo ""
    log_info "VPS: ${VPS_USER}@${VPS_HOST}"
    log_info "Начало проверки: $(date)"
    echo ""

    # 1. Проверка PM2 статуса
    log_step "1. Проверка PM2"
    check "PM2 запущен" "sshpass -p '${DB_PASS}' ssh ${VPS_USER}@${VPS_HOST} 'pm2 list | grep ${APP_NAME}'"
    check "PM2 статус online" "sshpass -p '${DB_PASS}' ssh ${VPS_USER}@${VPS_HOST} \"pm2 list | grep ${APP_NAME} | grep online\""
    check "PM2 без ошибок" "! sshpass -p '${DB_PASS}' ssh ${VPS_USER}@${VPS_HOST} 'pm2 jlist | grep -i errored'"

    # 2. Проверка логов
    log_step "2. Проверка логов"
    local error_count=$(sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "pm2 logs ${APP_NAME} --lines 100 --nostream | grep -i error | wc -l" 2>/dev/null || echo "0")
    echo "  Количество ошибок в логах: $error_count"
    if [ "$error_count" -eq 0 ]; then
        log_success "Нет ошибок в логах"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        log_warn "Найдены ошибки в логах"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    # 3. Проверка API
    log_step "3. Проверка API endpoints"
    check "Главная страница (200)" "curl -s -o /dev/null -w '%{http_code}' http://${VPS_HOST}:3001/ | grep 200"
    check "Админ login (200)" "curl -s -o /dev/null -w '%{http_code}' http://${VPS_HOST}:3001/admin/login | grep 200"
    check "Калькулятор забора (200)" "curl -s -o /dev/null -w '%{http_code}' http://${VPS_HOST}:3001/calculator/fence | grep 200"
    check "Калькулятор навеса (200)" "curl -s -o /dev/null -w '%{http_code}' http://${VPS_HOST}:3001/calculator/canopy | grep 200"

    # 4. Проверка Panel3D API
    log_step "4. Проверка Panel3D функционала"
    local panel3d_check=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://${VPS_HOST}:3001/api/admin/panel3d 2>/dev/null || echo "000")
    echo "  Panel3D API HTTP код: $panel3d_check"
    if [ "$panel3d_check" = "200" ] || [ "$panel3d_check" = "401" ] || [ "$panel3d_check" = "403" ]; then
        log_success "Panel3D API доступен"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        log_failure "Panel3D API недоступен"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    # 5. Проверка БД
    log_step "5. Проверка БД"
    check "Таблица Panel3D существует" "sshpass -p '${DB_PASS}' ssh ${VPS_USER}@${VPS_HOST} \"PGPASSWORD='${DB_PASS}' psql -h localhost -U postgres -d fences -c 'SELECT 1 FROM information_schema.tables WHERE table_name = \\\"Panel3D\\\"' | grep 1\""
    check "Таблица FenceEstimate имеет panel3dId" "sshpass -p '${DB_PASS}' ssh ${VPS_USER}@${VPS_HOST} \"PGPASSWORD='${DB_PASS}' psql -h localhost -U postgres -d fences -c 'SELECT 1 FROM information_schema.columns WHERE table_name = \\\"FenceEstimate\\\" AND column_name = \\'panel3dId\\'' | grep 1\""

    # 6. Проверка Redis
    log_step "6. Проверка Redis"
    check "Redis контейнер запущен" "sshpass -p '${DB_PASS}' ssh ${VPS_USER}@${VPS_HOST} 'docker ps | grep redis'"
    local redis_response=$(sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "docker exec fences-redis redis-cli -a '${REDIS_PASS}' PING" 2>/dev/null || echo "FAILED")
    if [[ "$redis_response" == *"PONG"* ]]; then
        log_success "Redis отвечает PONG"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        log_failure "Redis не отвечает"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    # 7. Проверка дискового пространства
    log_step "7. Проверка системных ресурсов"
    local disk_usage=$(sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "df -h ${VPS_DIR} | tail -1 | awk '{print \$5}' | sed 's/%//'")
    echo "  Использование диска: ${disk_usage}%"
    if [ "$disk_usage" -lt 90 ]; then
        log_success "Дисковое пространство в норме"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        log_warn "Мало дискового пространства"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    # Итоги
    echo ""
    echo "=============================================================================="
    echo "📊 РЕЗУЛЬТАТЫ ПРОВЕРКИ"
    echo "=============================================================================="
    echo "  Всего проверок: $TOTAL_CHECKS"
    echo -e "  ${GREEN}Пройдено:$NC $PASSED_CHECKS"
    echo -e "  ${RED}Не пройдено:$NC $FAILED_CHECKS"
    echo ""

    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "  Успешность: ${success_rate}%"
    echo ""

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "${GREEN}✓ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!${NC}"
        echo ""
        exit 0
    elif [ $success_rate -ge 80 ]; then
        echo -e "${YELLOW}⚠ НЕКОТОРЫЕ ПРОВЕРКИ НЕ ПРОЙДЕНЫ, НО ДЕПЛОЙ В ЦЕЛОМ УСПЕШЕН${NC}"
        echo ""
        exit 0
    else
        echo -e "${RED}✗ МНОГО ПРОВЕРОК НЕ ПРОЙДЕНО. РЕКОМЕНДУЕТСЯ ОТКАТ${NC}"
        echo ""
        exit 1
    fi
}

# Запуск
main "$@"