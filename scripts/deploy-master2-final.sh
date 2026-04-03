#!/bin/bash

# =============================================================================
# 🚀 БЕЗОПАСНЫЙ ДЕПЛОЙ MASTER2 НА ПРОД VPS (ФИНАЛЬНАЯ ВЕРСИЯ)
# =============================================================================
# Автор: DevOps Team
# Дата: 03.04.2026
# Версия: 2.0
# =============================================================================

set -e  # Выход при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# =============================================================================
# КОНФИГУРАЦИЯ
# =============================================================================

VPS_HOST="37.143.13.196"
VPS_USER="root"
VPS_PASS="Gorunova007@"
VPS_DIR="/root/Fences-of-the-curtain"
APP_NAME="fences-app"
DB_NAME="fences"
DB_USER="postgres"
DB_PASS="HVt6G6LE6mduMrAny91F"
REDIS_PASS="g3xVlty76Op1vIbTuwy+8M+0ZUXx4XgtQX2+YrTtbLY"
GRAFANA_PASS="SecureGrafanaPass2026!"
BACKUP_DIR="${VPS_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
DEPLOY_LOG="/var/log/fences-deploy/deploy-$(date +%Y%m%d_%H%M%S).log"

# Коммиты
CURRENT_COMMIT="454bec7"
TARGET_COMMIT="fff1a96"

# =============================================================================
# ФУНКЦИИ ЛОГИРОВАНИЯ
# =============================================================================

log_info() {
    local msg="[$(date '+%H:%M:%S')] [INFO] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$DEPLOY_LOG" 2>/dev/null || true
}

log_warn() {
    local msg="[$(date '+%H:%M:%S')] [WARN] $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "$msg" >> "$DEPLOY_LOG" 2>/dev/null || true
}

log_error() {
    local msg="[$(date '+%H:%M:%S')] [ERROR] $1"
    echo -e "${RED}${msg}${NC}"
    echo "$msg" >> "$DEPLOY_LOG" 2>/dev/null || true
}

log_step() {
    local msg="[$(date '+%H:%M:%S')] [STEP] $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "$msg" >> "$DEPLOY_LOG" 2>/dev/null || true
}

log_success() {
    local msg="[$(date '+%H:%M:%S')] [SUCCESS] $1"
    echo -e "${GREEN}✓ ${msg}${NC}"
    echo "✓ $msg" >> "$DEPLOY_LOG" 2>/dev/null || true
}

# =============================================================================
# ФУНКЦИЯ ВЫПОЛНЕНИЯ КОМАНД НА VPS
# =============================================================================

vps_ssh() {
    sshpass -p "${VPS_PASS}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "$1"
}

# =============================================================================
# ПРОВЕРКИ ПЕРЕД ДЕПЛОЕМ
# =============================================================================

pre_deploy_checks() {
    log_step "Проверки перед деплоем..."

    # Проверка sshpass
    if ! command -v sshpass &> /dev/null; then
        log_error "sshpass не установлен. Установите: brew install sshpass (macOS) или apt install sshpass (Linux)"
        exit 1
    fi

    # Проверка соединения с VPS
    log_info "Проверка соединения с VPS..."
    if ! vps_ssh "echo 'OK'" > /dev/null 2>&1; then
        log_error "Не удалось подключиться к VPS"
        exit 1
    fi
    log_success "Соединение с VPS установлено"

    # Проверка текущей ветки
    log_info "Проверка текущей ветки..."
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "master2" ]; then
        log_error "Вы не на ветке master2 (текущая: $current_branch)"
        exit 1
    fi
    log_success "Текущая ветка: master2"

    # Проверка незакоммиченных изменений
    log_info "Проверка незакоммиченных изменений..."
    if [ -n "$(git status --porcelain)" ]; then
        log_warn "Есть незакоммиченные изменения:"
        git status --short
        read -p "$(echo -e ${YELLOW}Продолжить с незакоммиченными изменениями? \(y/N\): ${NC})" response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "Деплой отменен"
            exit 0
        fi
    else
        log_success "Нет незакоммиченных изменений"
    fi

    # Проверка что код запушен
    log_info "Проверка что код запушен в origin..."
    git fetch origin
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse origin/master2)
    if [ "$local_commit" != "$remote_commit" ]; then
        log_warn "Локальный коммит ($local_commit) отличается от remote ($remote_commit)"
        read -p "$(echo -e ${YELLOW}Запушить изменения? \(y/N\): ${NC})" push_response
        if [[ "$push_response" =~ ^[Yy]$ ]]; then
            git push origin master2
            log_success "Изменения запушены"
        else
            log_error "Сначала запушьте изменения в origin/master2"
            exit 1
        fi
    else
        log_success "Код актуален в origin/master2"
    fi

    # Проверка Prisma Client
    log_info "Проверка Prisma Client..."
    if [ ! -d "node_modules/.prisma/client" ]; then
        log_warn "Prisma Client не сгенерирован. Генерация..."
        npx prisma generate
    fi
    log_success "Prisma Client готов"

    log_success "Все проверки пройдены"
}

# =============================================================================
# СОЗДАНИЕ РЕЗЕРВНЫХ КОПИЙ
# =============================================================================

create_backups() {
    log_step "Создание резервных копий..."

    # Создание директории для бэкапов и логов
    vps_ssh "mkdir -p ${BACKUP_DIR} /var/log/fences-deploy"

    # Бэкап БД
    log_info "Создание бэкапа БД PostgreSQL..."
    vps_ssh "PGPASSWORD='${DB_PASS}' pg_dump -h localhost -U ${DB_USER} ${DB_NAME} > ${BACKUP_DIR}/db_backup.sql && gzip ${BACKUP_DIR}/db_backup.sql"
    log_success "Бэкап БД создан: ${BACKUP_DIR}/db_backup.sql.gz"

    # Бэкап uploads
    log_info "Создание бэкапа загрузок..."
    vps_ssh "cd ${VPS_DIR} && if [ -d 'public/uploads' ]; then tar czf ${BACKUP_DIR}/uploads.tar.gz public/uploads/ && echo 'OK' || echo 'SKIP'; else echo 'SKIP'; fi"
    log_success "Бэкап uploads создан"

    # Бэкап состояния приложения
    log_info "Сохранение состояния приложения..."
    vps_ssh "cd ${VPS_DIR} && \
        git rev-parse HEAD > ${BACKUP_DIR}/commit.txt && \
        git log --oneline -5 > ${BACKUP_DIR}/git_log.txt && \
        pm2 list > ${BACKUP_DIR}/pm2_status.txt && \
        pm2 logs fences-app --lines 100 --nostream > ${BACKUP_DIR}/pm2_logs.txt 2>&1 || true"
    log_success "Состояние сохранено"

    log_success "Все резервные копии созданы в: ${BACKUP_DIR}"
}

# =============================================================================
# ОБНОВЛЕНИЕ КОДА
# =============================================================================

update_code() {
    log_step "Обновление кода приложения..."

    # Pull последнего кода
    log_info "Получение последних изменений из origin/master2..."
    vps_ssh "cd ${VPS_DIR} && git fetch origin && git pull origin master2"

    # Проверка обновления
    log_info "Проверка обновления..."
    local new_commit=$(vps_ssh "cd ${VPS_DIR} && git rev-parse HEAD")
    log_success "Код обновлен до коммита: $new_commit"

    # Установка зависимостей
    log_info "Установка зависимостей (legacy-peer-deps)..."
    vps_ssh "cd ${VPS_DIR} && npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund"
    log_success "Зависимости установлены"

    log_success "Код успешно обновлен"
}

# =============================================================================
# ПРИМЕНЕНИЕ МИГРАЦИЙ
# =============================================================================

apply_migrations() {
    log_step "Применение миграций БД..."

    # Проверка статуса миграций
    log_info "Проверка статуса миграций..."
    vps_ssh "cd ${VPS_DIR} && npx prisma migrate status"

    # Применение миграций
    log_info "Применение миграций (безопасный режим)..."
    if ! vps_ssh "cd ${VPS_DIR} && npx prisma migrate deploy"; then
        log_error "Ошибка применения миграций!"
        return 1
    fi
    log_success "Миграции успешно применены"

    # Генерация Prisma Client
    log_info "Генерация Prisma Client..."
    vps_ssh "cd ${VPS_DIR} && npx prisma generate"
    log_success "Prisma Client сгенерирован"

    log_success "Миграции БД успешно применены"
}

# =============================================================================
# СБОРКА ПРИЛОЖЕНИЯ
# =============================================================================

build_application() {
    log_step "Сборка приложения..."

    # Очистка кэша
    log_info "Очистка кэша Next.js..."
    vps_ssh "cd ${VPS_DIR} && rm -rf .next"

    # Сборка
    log_info "Сборка приложения (это может занять 3-5 минут)..."
    local BUILD_START=$(date +%s)
    if ! vps_ssh "cd ${VPS_DIR} && npm run build"; then
        log_error "Ошибка сборки!"
        return 1
    fi
    local BUILD_END=$(date +%s)
    local BUILD_TIME=$((BUILD_END - BUILD_START))
    log_success "Приложение собрано за ${BUILD_TIME} секунд"

    log_success "Сборка успешно завершена"
}

# =============================================================================
# ПЕРЕЗАПУСК ПРИЛОЖЕНИЯ
# =============================================================================

restart_application() {
    log_step "Zero-downtime перезапуск приложения..."

    # Graceful reload через PM2
    log_info "Graceful reload через PM2..."
    if vps_ssh "pm2 list | grep -q ${APP_NAME}"; then
        vps_ssh "cd ${VPS_DIR} && pm2 reload ${APP_NAME}"
        log_success "Приложение перезагружено (reload)"
    else
        log_warn "Процесс не найден в PM2, запуск нового..."
        vps_ssh "cd ${VPS_DIR} && pm2 start ecosystem.config.js --env production"
        log_success "Приложение запущено"
    fi

    # Сохранение конфигурации PM2
    vps_ssh "pm2 save"

    # Ожидание стабилизации
    log_info "Ожидание стабилизации (15 секунд)..."
    sleep 15

    log_success "Приложение успешно перезапущено"
}

# =============================================================================
# ПРОВЕРКА РАБОТОСПОСОБНОСТИ
# =============================================================================

verify_deployment() {
    log_step "Проверка работоспособности..."

    # Проверка PM2 статуса
    log_info "Проверка статуса PM2..."
    local pm2_status=$(vps_ssh "pm2 list | grep ${APP_NAME} | awk '{print \$10}'")
    if [ "$pm2_status" = "online" ]; then
        log_success "PM2 статус: online"
    else
        log_error "PM2 статус: $pm2_status (ожидалось: online)"
        return 1
    fi

    # Проверка health endpoint
    log_info "Проверка health endpoint..."
    local health_response=$(vps_ssh "curl -s http://localhost:3001/api/health")
    if echo "$health_response" | grep -q '"status":"ok"'; then
        log_success "Health check пройден: $health_response"
    else
        log_error "Health check не пройден"
        return 1
    fi

    # Проверка главной страницы
    log_info "Проверка главной страницы..."
    local http_code=$(vps_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/")
    if [ "$http_code" = "200" ]; then
        log_success "Главная страница доступна (HTTP $http_code)"
    else
        log_error "Главная страница недоступна (HTTP $http_code)"
        return 1
    fi

    # Проверка логов на ошибки
    log_info "Проверка логов на критические ошибки..."
    local error_count=$(vps_ssh "pm2 logs ${APP_NAME} --lines 100 --nostream | grep -i 'error' | grep -v 'ENOENT' | wc -l")
    if [ "$error_count" -eq 0 ]; then
        log_success "Критических ошибок в логах не найдено"
    else
        log_warn "Найдено $error_count ошибок в логах (проверьте вручную)"
    fi

    # Проверка новых API endpoints
    log_info "Проверка новых API endpoints..."
    local api_code=$(vps_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/admin/notification-recipients")
    if [ "$api_code" = "401" ] || [ "$api_code" = "403" ]; then
        log_success "API notification-recipients доступен (требуется авторизация, HTTP $api_code)"
    elif [ "$api_code" = "200" ]; then
        log_success "API notification-recipients работает (HTTP $api_code)"
    else
        log_warn "API notification-recipients вернул HTTP $api_code"
    fi

    log_success "Все проверки работоспособности пройдены"
}

# =============================================================================
# ЗАПУСК МОНИТОРИНГА
# =============================================================================

setup_monitoring() {
    log_step "Настройка мониторинга (Grafana + Prometheus)..."

    # Проверка наличия docker-compose
    log_info "Проверка Docker..."
    if ! vps_ssh "command -v docker &> /dev/null"; then
        log_warn "Docker не установлен, пропускаем мониторинг"
        return 0
    fi

    # Проверка .env на наличие GRAFANA_ADMIN_PASSWORD
    log_info "Проверка конфигурации мониторинга..."
    if ! vps_ssh "cd ${VPS_DIR} && grep -q 'GRAFANA_ADMIN_PASSWORD' .env"; then
        log_info "Добавление GRAFANA_ADMIN_PASSWORD в .env..."
        vps_ssh "cd ${VPS_DIR} && echo 'GRAFANA_ADMIN_PASSWORD=${GRAFANA_PASS}' >> .env"
    fi

    # Проверка наличия файла docker-compose.monitoring.yml
    if ! vps_ssh "test -f ${VPS_DIR}/docker-compose.monitoring.yml"; then
        log_warn "Файл docker-compose.monitoring.yml не найден, пропускаем"
        return 0
    fi

    # Запуск мониторинга
    log_info "Запуск мониторинга через Docker Compose..."
    vps_ssh "cd ${VPS_DIR} && docker-compose -f docker-compose.monitoring.yml up -d"

    # Ожидание запуска
    log_info "Ожидание запуска контейнеров мониторинга (30 секунд)..."
    sleep 30

    # Проверка статуса контейнеров
    log_info "Проверка статуса контейнеров..."
    local containers=$(vps_ssh "docker ps --format '{{.Names}}\t{{.Status}}' | grep -E 'grafana|prometheus|exporter' || echo ''")
    if [ -n "$containers" ]; then
        log_success "Контейнеры мониторинга запущены:"
        echo "$containers" | while read line; do
            log_info "  - $line"
        done
    else
        log_warn "Контейнеры мониторинга не найдены"
        return 0
    fi

    # Проверка доступности Grafana
    log_info "Проверка доступности Grafana..."
    if vps_ssh "curl -sf http://localhost:3000/api/health > /dev/null 2>&1"; then
        log_success "Grafana доступна на порту 3000"
    else
        log_warn "Grafana не отвечает на порту 3000 (возможно, другой порт)"
    fi

    # Проверка доступности Prometheus
    log_info "Проверка доступности Prometheus..."
    if vps_ssh "curl -sf http://localhost:9090/-/healthy > /dev/null 2>&1"; then
        log_success "Prometheus доступен на порту 9090"
    else
        log_warn "Prometheus не отвечает"
    fi

    log_success "Мониторинг настроен"
    log_info "Grafana доступна: http://${VPS_HOST}:3000 (admin / ${GRAFANA_PASS})"
    log_info "Prometheus: http://${VPS_HOST}:9090"
}

# =============================================================================
# ОТКАТ (ROLLBACK)
# =============================================================================

rollback() {
    log_step "🚨 НАЧИНАЕМ ОТКАТ..."

    log_warn "Возврат к предыдущему коммиту..."
    vps_ssh "cd ${VPS_DIR} && git reset --hard ${CURRENT_COMMIT}"

    log_warn "Восстановление зависимостей..."
    vps_ssh "cd ${VPS_DIR} && npm ci --legacy-peer-deps && npx prisma generate"

    log_warn "Восстановление БД из бэкапа (если требуется)..."
    if [ -f "${BACKUP_DIR}/db_backup.sql.gz" ]; then
        read -p "$(echo -e ${RED}Восстановить БД из бэкапа? \(y/N\): ${NC})" restore_db
        if [[ "$restore_db" =~ ^[Yy]$ ]]; then
            vps_ssh "gunzip -c ${BACKUP_DIR}/db_backup.sql.gz | PGPASSWORD='${DB_PASS}' psql -h localhost -U ${DB_USER} -d ${DB_NAME}"
            log_warn "БД восстановлена"
        fi
    fi

    log_warn "Пересборка приложения..."
    vps_ssh "cd ${VPS_DIR} && npm run build"

    log_warn "Перезапуск приложения..."
    vps_ssh "pm2 restart ${APP_NAME}"

    sleep 10

    log_warn "✓ ОТКАТ ЗАВЕРШЕН"
    log_info "Пожалуйста, проверьте работоспособность приложения"
}

# =============================================================================
# ГЛАВНАЯ ФУНКЦИЯ
# =============================================================================

main() {
    echo ""
    echo "=============================================================================="
    echo -e "${CYAN}🚀 БЕЗОПАСНЫЙ ДЕПЛОЙ MASTER2 НА ПРОД VPS${NC}"
    echo "=============================================================================="
    echo ""
    log_info "VPS: ${VPS_USER}@${VPS_HOST}"
    log_info "Ветка: master2"
    log_info "Текущий коммит: ${CURRENT_COMMIT}"
    log_info "Целевой коммит: ${TARGET_COMMIT}"
    log_info "Начало деплоя: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # Подтверждение деплоя
    read -p "$(echo -e ${YELLOW}Вы уверены, что хотите продолжить деплой? \(y/N\): ${NC})" confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "Деплой отменен"
        exit 0
    fi

    # Предварительные проверки
    if ! pre_deploy_checks; then
        log_error "Проверки перед деплоем не пройдены"
        exit 1
    fi

    # Создание бэкапов
    if ! create_backups; then
        log_error "Не удалось создать резервные копии"
        exit 1
    fi

    # Обновление кода
    if ! update_code; then
        log_error "Не удалось обновить код"
        rollback
        exit 1
    fi

    # Применение миграций
    if ! apply_migrations; then
        log_error "Не удалось применить миграции"
        rollback
        exit 1
    fi

    # Сборка приложения
    if ! build_application; then
        log_error "Не удалось собрать приложение"
        rollback
        exit 1
    fi

    # Перезапуск приложения
    if ! restart_application; then
        log_error "Не удалось перезапустить приложение"
        rollback
        exit 1
    fi

    # Проверка работоспособности
    if ! verify_deployment; then
        log_error "Проверка работоспособности не пройдена"
        read -p "$(echo -e ${RED}Выполнить откат? \(y/N\): ${NC})" rollback_confirm
        if [[ "$rollback_confirm" =~ ^[Yy]$ ]]; then
            rollback
        else
            log_warn "Откат отменен. Требуется ручное вмешательство"
            exit 1
        fi
    fi

    # Настройка мониторинга
    setup_monitoring

    echo ""
    echo "=============================================================================="
    log_success "ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН"
    echo "=============================================================================="
    log_info "Завершение деплоя: $(date '+%Y-%m-%d %H:%M:%S')"
    log_info "Приложение запущено на ветке: master2"
    log_info "Резервные копии: ${BACKUP_DIR}"
    log_info "Лог деплоя: ${DEPLOY_LOG}"
    echo ""
    log_info "Для отката выполните: bash scripts/rollback-to-master.sh"
    log_info "Проверьте работу email уведомлений в админ-панели"
    echo ""

    exit 0
}

# Запуск
main "$@"
