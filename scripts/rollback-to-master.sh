#!/bin/bash

# =============================================================================
# 🔄 ОТКАТ НА MASTER (ROLLBACK)
# =============================================================================
# Скрипт выполняет быстрый откат на ветку master
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

# Конфигурация
VPS_HOST="37.143.13.196"
VPS_USER="root"
VPS_DIR="/root/Fences-of-the-curtain"
APP_NAME="fences-app"
DB_PASS="HVt6G6LE6mduMrAny91F"

# Главная функция
main() {
    echo ""
    echo "=============================================================================="
    echo "🔄 ОТКАТ НА ВЕТКУ MASTER"
    echo "=============================================================================="
    echo ""
    log_info "VPS: ${VPS_USER}@${VPS_HOST}"
    log_info "Начало отката: $(date)"
    echo ""

    # Подтверждение
    read -p "Вы уверены, что хотите откатиться на master? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "Откат отменен"
        exit 0
    fi

    log_step "Переключение на master..."

    # Переключение на master
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        git checkout master && \
        git pull origin master
    "
    log_info "✓ Переключено на master"

    # Установка зависимостей
    log_info "Установка зависимостей..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        npm ci
    "
    log_info "✓ Зависимости установлены"

    # Генерация Prisma Client
    log_info "Генерация Prisma Client..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        npx prisma generate
    "
    log_info "✓ Prisma Client сгенерирован"

    # Сборка
    log_info "Сборка приложения..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        npm run build
    "
    log_info "✓ Приложение собрано"

    # Перезапуск
    log_info "Перезапуск PM2..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        pm2 restart ${APP_NAME}
    "
    log_info "✓ Приложение перезапущено"

    # Ожидание
    log_info "Ожидание запуска..."
    sleep 10

    # Проверка статуса
    log_info "Проверка статуса PM2..."
    local pm2_status=$(sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "pm2 list | grep ${APP_NAME} | awk '{print \$10}'" 2>/dev/null || echo "")
    if [ "$pm2_status" = "online" ]; then
        log_info "✓ PM2 статус: online"
    else
        log_error "PM2 статус: $pm2_status"
        exit 1
    fi

    echo ""
    echo "=============================================================================="
    log_warn "✓ ОТКАТ ЗАВЕРШЕН"
    echo "=============================================================================="
    log_info "Завершение отката: $(date)"
    log_info "Приложение запущено на ветке: master"
    echo ""

    exit 0
}

# Запуск
main "$@"