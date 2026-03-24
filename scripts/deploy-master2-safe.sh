#!/bin/bash

# =============================================================================
# 🚀 БЕЗОПАСНЫЙ ДЕПЛОЙ MASTER2 НА ПРОД VPS
# =============================================================================
# Скрипт выполняет:
# 1. Создание резервных копий
# 2. Применение миграций БД
# 3. Обновление кода
# 4. Перезапуск приложения
# 5. Проверку работоспособности
# =============================================================================

set -e  # Выход при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# КОНФИГУРАЦИЯ
# =============================================================================

VPS_HOST="37.143.13.196"
VPS_USER="root"
VPS_DIR="/root/Fences-of-the-curtain"
APP_NAME="fences-app"
DB_NAME="fences"
DB_USER="postgres"
DB_PASS="HVt6G6LE6mduMrAny91F"
REDIS_PASS="g3xVlty76Op1vIbTuwy+8M+0ZUXx4XgtQX2+YrTtbLY"
BACKUP_DIR="${VPS_DIR}/backups/$(date +%Y%m%d_%H%M%S)"

# =============================================================================
# ФУНКЦИИ ЛОГИРОВАНИЯ
# =============================================================================

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

# =============================================================================
# ПРОВЕРКИ ПЕРЕД ДЕПЛОЕМ
# =============================================================================

pre_deploy_checks() {
    log_step "Проверки перед деплоем..."

    # Проверка соединения с VPS
    log_info "Проверка соединения с VPS..."
    if ! sshpass -p "${DB_PASS}" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "echo 'OK'" > /dev/null 2>&1; then
        log_error "Не удалось подключиться к VPS"
        exit 1
    fi
    log_info "✓ Соединение с VPS установлено"

    # Проверка текущей ветки
    log_info "Проверка текущей ветки..."
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "master2" ]; then
        log_error "Вы не на ветке master2 (текущая: $current_branch)"
        exit 1
    fi
    log_info "✓ Текущая ветка: master2"

    # Проверка незакоммиченных изменений
    log_info "Проверка незакоммиченных изменений..."
    if [ -n "$(git status --porcelain)" ]; then
        log_warn "Есть незакоммиченные изменения:"
        git status --short
        read -p "Продолжить с незакоммиченными изменениями? (y/N): " response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "Деплой отменен"
            exit 0
        fi
    else
        log_info "✓ Нет незакоммиченных изменений"
    fi

    log_info "✓ Все проверки пройдены"
}

# =============================================================================
# СОЗДАНИЕ РЕЗЕРВНЫХ КОПИЙ
# =============================================================================

create_backups() {
    log_step "Создание резервных копий..."

    # Создание директории для бэкапов
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${BACKUP_DIR}"

    # Бэкап БД
    log_info "Создание бэкапа БД..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        PGPASSWORD='${DB_PASS}' pg_dump -h localhost -U ${DB_USER} ${DB_NAME} > ${BACKUP_DIR}/db_backup.sql && \
        gzip ${BACKUP_DIR}/db_backup.sql
    "
    log_info "✓ Бэкап БД создан: ${BACKUP_DIR}/db_backup.sql.gz"

    # Бэкап приложения
    log_info "Создание бэкапа состояния приложения..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        git log --oneline -5 > ${BACKUP_DIR}/git_state.txt && \
        git rev-parse HEAD >> ${BACKUP_DIR}/git_state.txt && \
        pm2 list >> ${BACKUP_DIR}/app_state.txt
    "
    log_info "✓ Бэкап приложения создан"

    # Бэкап uploads
    log_info "Создание бэкапа загрузок..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        if [ -d 'public/uploads' ]; then \
            tar czf ${BACKUP_DIR}/uploads.tar.gz public/uploads/; \
            echo 'Бэкап uploads создан'; \
        else \
            echo 'Директория uploads не найдена'; \
        fi
    "
    log_info "✓ Бэкап uploads создан"

    log_info "✓ Все резервные копии созданы в: ${BACKUP_DIR}"
}

# =============================================================================
# ПРИМЕНЕНИЕ МИГРАЦИЙ
# =============================================================================

apply_migrations() {
    log_step "Применение миграций БД..."

    # Проверка наличия таблицы Panel3D
    log_info "Проверка таблицы Panel3D..."
    local panel3d_exists=$(sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        PGPASSWORD='${DB_PASS}' psql -h localhost -U ${DB_USER} -d ${DB_NAME} -tAc \"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Panel3D')\"
    " 2>/dev/null || echo "false")

    if [ "$panel3d_exists" = "t" ]; then
        log_info "✓ Таблица Panel3D уже существует"
    else
        log_warn "Таблица Panel3D не найдена, создаем..."

        # Применение миграции Panel3D
        sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
            cd ${VPS_DIR} && \
            PGPASSWORD='${DB_PASS}' psql -h localhost -U ${DB_USER} -d ${DB_NAME} -f prisma/migrations/20260324233000_add_panel3d_model/migration.sql
        "
        log_info "✓ Миграция Panel3D применена"
    fi

    # Применение остальных миграций через Prisma
    log_info "Применение миграций Prisma..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        npx prisma migrate deploy
    "
    log_info "✓ Миграции Prisma применены"

    # Генерация Prisma Client
    log_info "Генерация Prisma Client..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        npx prisma generate
    "
    log_info "✓ Prisma Client сгенерирован"
}

# =============================================================================
# ОБНОВЛЕНИЕ КОДА
# =============================================================================

update_code() {
    log_step "Обновление кода приложения..."

    # Пуш master2 на remote
    log_info "Пуш ветки master2 на remote..."
    git push origin master2
    log_info "✓ Ветка master2 запушена"

    # Переключение на master2 на VPS
    log_info "Переключение на master2 на VPS..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        git fetch origin && \
        git checkout master2 && \
        git pull origin master2
    "
    log_info "✓ Код обновлен до master2"

    # Установка зависимостей
    log_info "Установка зависимостей..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        npm ci
    "
    log_info "✓ Зависимости установлены"

    # Очистка кэша
    log_info "Очистка кэша Next.js..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        rm -rf .next
    "
    log_info "✓ Кэш очищен"

    # Сборка приложения
    log_info "Сборка приложения..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        npm run build
    "
    log_info "✓ Приложение собрано"
}

# =============================================================================
# ПЕРЕЗАПУСК ПРИЛОЖЕНИЯ
# =============================================================================

restart_application() {
    log_step "Перезапуск приложения..."

    # Перезапуск PM2
    log_info "Перезапуск PM2..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        pm2 restart ${APP_NAME}
    "
    log_info "✓ Приложение перезапущено"

    # Ожидание запуска
    log_info "Ожидание запуска приложения..."
    sleep 15
}

# =============================================================================
# ПРОВЕРКА РАБОТОСПОСОБНОСТИ
# =============================================================================

verify_deployment() {
    log_step "Проверка работоспособности..."

    # Проверка PM2 статуса
    log_info "Проверка статуса PM2..."
    local pm2_status=$(sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "pm2 list | grep ${APP_NAME} | awk '{print \$10}'" 2>/dev/null || echo "")
    if [ "$pm2_status" = "online" ]; then
        log_info "✓ PM2 статус: online"
    else
        log_error "PM2 статус: $pm2_status (ожидалось: online)"
        return 1
    fi

    # Проверка логов на ошибки
    log_info "Проверка логов на ошибки..."
    local error_count=$(sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "pm2 logs ${APP_NAME} --lines 100 --nostream | grep -i error | wc -l" 2>/dev/null || echo "0")
    if [ "$error_count" -eq 0 ]; then
        log_info "✓ Ошибок в логах не найдено"
    else
        log_warn "Найдено $error_count ошибок в логах"
    fi

    # Проверка API
    log_info "Проверка API endpoints..."
    if curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://${VPS_HOST}:3001/ | grep -q "200"; then
        log_info "✓ Главная страница (HTTP 200)"
    else
        log_error "Главная страница недоступна"
        return 1
    fi

    if curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://${VPS_HOST}:3001/api/health 2>/dev/null | grep -q "200"; then
        log_info "✓ Health check (HTTP 200)"
    else
        log_warn "Health check недоступен (может быть не реализован)"
    fi

    # Проверка Panel3D API
    log_info "Проверка Panel3D API..."
    local panel3d_check=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://${VPS_HOST}:3001/api/admin/panel3d 2>/dev/null || echo "000")
    if [ "$panel3d_check" = "401" ] || [ "$panel3d_check" = "403" ]; then
        log_info "✓ Panel3D API доступен (требуется авторизация)"
    elif [ "$panel3d_check" = "200" ]; then
        log_info "✓ Panel3D API работает"
    else
        log_warn "Panel3D API вернул код: $panel3d_check"
    fi

    log_info "✓ Проверка работоспособности завершена"
}

# =============================================================================
# ОТКАТ (ROLLBACK)
# =============================================================================

rollback() {
    log_step "🚨 НАЧИНАЕМ ОТКАТ..."

    log_warn "Переключение обратно на master..."
    sshpass -p "${DB_PASS}" ssh ${VPS_USER}@${VPS_HOST} "
        cd ${VPS_DIR} && \
        git checkout master && \
        git pull origin master && \
        npm ci && \
        npx prisma generate && \
        npm run build && \
        pm2 restart ${APP_NAME}
    "

    log_info "Ожидание завершения отката..."
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
    echo "🚀 БЕЗОПАСНЫЙ ДЕПЛОЙ MASTER2 НА ПРОД VPS"
    echo "=============================================================================="
    echo ""
    log_info "VPS: ${VPS_USER}@${VPS_HOST}"
    log_info "Ветка: master2"
    log_info "Начало деплоя: $(date)"
    echo ""

    # Подтверждение деплоя
    read -p "Вы уверены, что хотите продолжить деплой? (y/N): " confirm
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

    # Применение миграций
    if ! apply_migrations; then
        log_error "Не удалось применить миграции"
        rollback
        exit 1
    fi

    # Обновление кода
    if ! update_code; then
        log_error "Не удалось обновить код"
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
        read -p "Выполнить откат? (y/N): " rollback_confirm
        if [[ "$rollback_confirm" =~ ^[Yy]$ ]]; then
            rollback
        else
            log_warn "Откат отменен. Требуется ручное вмешательство"
            exit 1
        fi
    fi

    echo ""
    echo "=============================================================================="
    log_info "✓ ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН"
    echo "=============================================================================="
    log_info "Завершение деплоя: $(date)"
    log_info "Приложение запущено на ветке: master2"
    log_info "Резервные копии: ${BACKUP_DIR}"
    echo ""
    log_info "Для отката выполните: bash scripts/rollback-to-master.sh"
    echo ""

    exit 0
}

# Запуск
main "$@"