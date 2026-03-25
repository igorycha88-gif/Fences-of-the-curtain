#!/bin/bash
##############################################################################
# УЛУЧЧЕННЫЙ СКРИПТ ДЛЯ БЕЗОПАСНОГО ДЕПЛОЯ MASTER2 НА VPS
#
# Автор: DevOps Team
# Дата: 2026-03-25
# Версия: 2.0.0
#
# Особенности:
# - Детальное логирование всех этапов
# - Автоматическое создание бэкапов
# - Проверки здоровья приложения
# - Возможность отката при ошибках
# - Мониторинг памяти и производительности
#
##############################################################################

set -e  # Остановить скрипт при любой ошибке

##############################################################################
# КОНФИГУРАЦИЯ
##############################################################################

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Настройки проекта
APP_DIR="/root/Fences-of-the-curtain"
BACKUP_DIR="$APP_DIR/backups"
DB_NAME="fences"
DB_USER="postgres"
DB_HOST="localhost"
DB_PASSWORD="HVt6G6LE6mduMrAny91F"
BRANCH="master2"

# Настройки таймаутов
BUILD_TIMEOUT=600  # 10 минут на сборку
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_DELAY=10

##############################################################################
# ФУНКЦИИ ЛОГИРОВАНИЯ
##############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_step() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
}

##############################################################################
# ПРОВЕРКИ ПЕРЕД НАЧАЛОМ
##############################################################################

check_prerequisites() {
    log_step "1. ПРОВЕРКА ПРЕДВАРИТЕЛЬНЫХ ТРЕБОВАНИЙ"

    # Проверка git
    if ! command -v git &> /dev/null; then
        log_error "git не установлен"
        exit 1
    fi
    log_success "✓ git установлен: $(git --version)"

    # Проверка npm
    if ! command -v npm &> /dev/null; then
        log_error "npm не установлен"
        exit 1
    fi
    log_success "✓ npm установлен: $(npm --version)"

    # Проверка pm2
    if ! command -v pm2 &> /dev/null; then
        log_error "pm2 не установлен"
        exit 1
    fi
    log_success "✓ pm2 установлен: $(pm2 --version)"

    # Проверка psql
    if ! command -v psql &> /dev/null; then
        log_error "psql не установлен"
        exit 1
    fi
    log_success "✓ psql установлен"

    log_success "Все предварительные требования выполнены"
}

##############################################################################
# СОЗДАНИЕ БЭКАПА
##############################################################################

create_backup() {
    log_step "2. СОЗДАНИЕ БЭКАПА"

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}"

    log_info "Создание директории бэкапа..."
    mkdir -p ${BACKUP_PATH}
    mkdir -p ${BACKUP_DIR}

    # Бэкап текущей версии кода
    log_info "Создание бэкапа текущего состояния..."
    cp -r ${APP_DIR}/.next ${BACKUP_PATH}/ 2>/dev/null || log_warning "⚠ .next директория не существует"
    cp ${APP_DIR}/package.json ${BACKUP_PATH}/ 2>/dev/null || log_warning "⚠ package.json не существует"

    # Бэкап базы данных
    log_info "Создание бэкапа базы данных..."
    PGPASSWORD=${DB_PASSWORD} pg_dump -h ${DB_HOST} -U ${DB_USER} ${DB_NAME} > ${BACKUP_PATH}/db_backup.sql

    if [ $? -eq 0 ]; then
        log_success "✓ База данных бэкаплена"
        log_info "Размер бэкапа: $(du -h ${BACKUP_PATH}/db_backup.sql | cut -f1)"
    else
        log_error "❌ Ошибка при создании бэкапа БД"
        exit 1
    fi

    # Сохранение информации о текущем состоянии
    log_info "Сохранение информации о текущем состоянии..."
    cd ${APP_DIR}
    echo "Current branch: $(git branch --show-current)" > ${BACKUP_PATH}/state.txt
    echo "Current commit: $(git log -1 --oneline)" >> ${BACKUP_PATH}/state.txt
    echo "Timestamp: $(date)" >> ${BACKUP_PATH}/state.txt

    log_success "Бэкап создан: ${BACKUP_PATH}"
    echo ${BACKUP_PATH}
}

##############################################################################
# ПРОВЕРКА СОСТОЯНИЯ ПЕРЕД ДЕПЛОЕМ
##############################################################################

check_predeploy_status() {
    log_step "3. ПРОВЕРКА СОСТОЯНИЯ ПЕРЕД ДЕПЛОЕМ"

    # Проверка текущей ветки
    cd ${APP_DIR}
    CURRENT_BRANCH=$(git branch --show-current)
    log_info "Текущая ветка: ${CURRENT_BRANCH}"

    # Проверка последнего коммита
    CURRENT_COMMIT=$(git log -1 --oneline)
    log_info "Текущий коммит: ${CURRENT_COMMIT}"

    # Проверка состояния PM2
    log_info "Состояние PM2:"
    pm2 status

    PM2_JSON=$(pm2 jlist)
    PM2_STATUS=$(echo $PM2_JSON | jq -r '.[] | select(.name=="fences-app") | .pm2_env.status' 2>/dev/null || echo "unknown")

    if [ "$PM2_STATUS" == "online" ]; then
        log_success "✓ PM2 процесс работает"

        # Сбор информации о памяти и CPU
        PM2_MEMORY=$(echo $PM2_JSON | jq -r '.[] | select(.name=="fences-app") | .monit.memory // 0')
        PM2_CPU=$(echo $PM2_JSON | jq -r '.[] | select(.name=="fences-app") | .monit.cpu // 0')
        PM2_RESTARTS=$(echo $PM2_JSON | jq -r '.[] | select(.name=="fences-app") | .pm2_env.restart_time // 0')

        log_info "Использование памяти: $((PM2_MEMORY / 1024 / 1024))MB"
        log_info "CPU: ${PM2_CPU}%"
        log_info "Рестартов: ${PM2_RESTARTS}"

        if [ "$PM2_RESTARTS" -gt 50 ]; then
            log_warning "⚠ Много рестартов (${PM2_RESTARTS}) - возможны проблемы"
        fi
    else
        log_warning "⚠ PM2 процесс не в состоянии 'online': ${PM2_STATUS}"
    fi

    # Проверка соединения с БД
    log_info "Проверка соединения с БД..."
    DB_STATUS=$(PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -c 'SELECT 1' -t 2>/dev/null || echo "error")

    if [ "$DB_STATUS" == "1" ]; then
        log_success "✓ Соединение с БД работает"

        # Проверка количества миграций
        MIGRATION_COUNT=$(PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -c 'SELECT COUNT(*) FROM "_prisma_migrations" WHERE rolled_back_at IS NULL' -t 2>/dev/null || echo "error")
        log_info "Применено миграций: ${MIGRATION_COUNT}"
    else
        log_error "❌ Проблема с соединением с БД"
        exit 1
    fi

    # Проверка свободного дискового пространства
    log_info "Проверка дискового пространства..."
    DISK_USAGE=$(df -h ${APP_DIR} | tail -1 | awk '{print $5}' | sed 's/%//')
    log_info "Использование диска: ${DISK_USAGE}%"

    if [ "$DISK_USAGE" -gt 80 ]; then
        log_warning "⚠ Мало свободного места на диске: ${DISK_USAGE}%"
    fi
}

##############################################################################
# ОБНОВЛЕНИЕ КОДА
##############################################################################

update_code() {
    log_step "4. ОБНОВЛЕНИЕ КОДА"

    cd ${APP_DIR}

    # Сохранение локальных изменений (если есть)
    log_info "Проверка локальных изменений..."
    LOCAL_CHANGES=$(git status --porcelain | wc -l)

    if [ "$LOCAL_CHANGES" -gt 0 ]; then
        log_warning "⚠ Обнаружены локальные изменения (${LOCAL_CHANGES} файлов)"
        log_info "Сохранение локальных изменений в stash..."
        git stash push -m "deploy-stash-$(date +%s)"
        log_success "✓ Локальные изменения сохранены в stash"
    else
        log_success "✓ Локальных изменений нет"
    fi

    # Получение изменений из репозитория
    log_info "Получение изменений из репозитория..."
    git fetch origin

    # Проверка наличия новых изменений
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse origin/${BRANCH})

    log_info "Локальный коммит: ${LOCAL_COMMIT:0:8}"
    log_info "Удаленный коммит: ${REMOTE_COMMIT:0:8}"

    if [ "$LOCAL_COMMIT" == "$REMOTE_COMMIT" ]; then
        log_warning "⚠ Новых изменений нет (уже на актуальной версии)"
        return 0
    fi

    log_info "Есть новые изменения. Обновление..."

    # Переключение на нужную ветку и обновление
    git checkout ${BRANCH}
    git pull origin ${BRANCH}

    # Проверка успешности
    if [ $? -eq 0 ]; then
        NEW_COMMIT=$(git log -1 --oneline)
        log_success "✓ Код обновлен: ${NEW_COMMIT}"

        # Показать изменения
        log_info "Изменения между версиями:"
        git log --oneline ${LOCAL_COMMIT}..HEAD | head -10
    else
        log_error "❌ Ошибка при обновлении кода"
        exit 1
    fi
}

##############################################################################
# ОБНОВЛЕНИЕ ЗАВИСИМОСТЕЙ
##############################################################################

update_dependencies() {
    log_step "5. ОБНОВЛЕНИЕ ЗАВИСИМОСТЕЙ"

    cd ${APP_DIR}

    log_info "Очистка кэша npm..."
    npm cache clean --force

    log_info "Установка зависимостей..."
    npm ci

    if [ $? -eq 0 ]; then
        log_success "✓ Зависимости установлены"

        # Показать количество установленных пакетов
        PKG_COUNT=$(ls -1 node_modules 2>/dev/null | wc -l)
        log_info "Установлено пакетов: ${PKG_COUNT}"
    else
        log_error "❌ Ошибка при установке зависимостей"
        exit 1
    fi
}

##############################################################################
# ГЕНЕРАЦИЯ PRISMA КЛИЕНТА
##############################################################################

generate_prisma() {
    log_step "6. ГЕНЕРАЦИЯ PRISMA КЛИЕНТА"

    cd ${APP_DIR}

    log_info "Генерация Prisma клиента..."
    npm run db:generate

    if [ $? -eq 0 ]; then
        log_success "✓ Prisma клиент сгенерирован"
    else
        log_error "❌ Ошибка при генерации Prisma клиента"
        exit 1
    fi
}

##############################################################################
# СИНХРОНИЗАЦИЯ СХЕМЫ БД
##############################################################################

sync_database() {
    log_step "7. СИНХРОНИЗАЦИЯ СХЕМЫ БД"

    cd ${APP_DIR}

    log_info "Проверка состояния миграций..."
    MIGRATION_STATUS=$(PGPASSWORD=${DB_PASSWORD} npx prisma migrate status 2>&1 || true)
    echo "$MIGRATION_STATUS"

    # Проверка на отложенные миграции
    if echo "$MIGRATION_STATUS" | grep -q "Draft"; then
        log_warning "⚠ Есть черновые миграции"
    fi

    # Используем db push вместо migrate из-за истории миграций
    log_info "Синхронизация схемы базы данных..."
    PGPASSWORD=${DB_PASSWORD} npx prisma db push --accept-data-loss

    if [ $? -eq 0 ]; then
        log_success "✓ Схема базы данных синхронизирована"
    else
        log_error "❌ Ошибка при синхронизации БД"
        exit 1
    fi
}

##############################################################################
# СБОРКА ПРИЛОЖЕНИЯ
##############################################################################

build_application() {
    log_step "8. СБОРКА ПРИЛОЖЕНИЯ"

    cd ${APP_DIR}

    log_info "Остановка PM2 для освобождения ресурсов..."
    pm2 stop fences-app || true

    log_info "Сборка Next.js приложения..."
    log_info "Это может занять несколько минут..."
    log_info "Таймаут: ${BUILD_TIMEOUT} секунд"

    # Сборка с таймаутом
    timeout ${BUILD_TIMEOUT} npm run build

    if [ $? -eq 0 ]; then
        log_success "✓ Приложение собрано успешно"

        # Показать размер сборки
        BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
        log_info "Размер сборки: ${BUILD_SIZE}"
    else
        log_error "❌ Ошибка сборки приложения"
        log_error "Проверьте логи выше для деталей"
        rollback $1
        exit 1
    fi
}

##############################################################################
# ПЕРЕЗАПУСК PM2
##############################################################################

restart_pm2() {
    log_step "9. ПЕРЕЗАПУСК PM2"

    log_info "Перезапуск PM2 процесса..."
    pm2 restart fences-app

    if [ $? -ne 0 ]; then
        log_error "❌ Ошибка при перезапуске PM2"
        rollback $1
        exit 1
    fi

    # Ожидание запуска
    log_info "Ожидание запуска приложения..."
    sleep 5

    # Проверка статуса
    PM2_JSON=$(pm2 jlist)
    PM2_STATUS=$(echo $PM2_JSON | jq -r '.[] | select(.name=="fences-app") | .pm2_env.status' 2>/dev/null || echo "unknown")

    if [ "$PM2_STATUS" == "online" ]; then
        log_success "✓ PM2 процесс успешно запущен"

        # Показать информацию о процессе
        PM2_PID=$(echo $PM2_JSON | jq -r '.[] | select(.name=="fences-app") | .pid')
        PM2_UPTIME=$(echo $PM2_JSON | jq -r '.[] | select(.name=="fences-app") | .pm2_env.pm_uptime // 0')
        log_info "PID: ${PM2_PID}"
        log_info "Uptime: ${PM2_UPTIME}s"
    else
        log_error "❌ PM2 процесс не запустился"
        log_error "Статус: ${PM2_STATUS}"
        rollback $1
        exit 1
    fi
}

##############################################################################
# ПРОВЕРКА ЗДОРОВЬЯ ПРИЛОЖЕНИЯ
##############################################################################

health_check() {
    log_step "10. ПРОВЕРКА ЗДОРОВЬЯ ПРИЛОЖЕНИЯ"

    log_info "Ожидание полной инициализации приложения..."
    sleep 10

    SUCCESS=0

    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        log_info "Попытка $i из $HEALTH_CHECK_RETRIES..."

        # Проверка HTTP ответа
        HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001 || echo '000')

        if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "302" ] || [ "$HTTP_CODE" == "304" ]; then
            log_success "✓ Приложение отвечает (HTTP $HTTP_CODE)"
            SUCCESS=1
            break
        fi

        log_warning "⚠ Приложение не отвечает (HTTP $HTTP_CODE)"

        # Проверка логов PM2 на ошибки
        PM2_ERRORS=$(pm2 logs fences-app --lines 10 --err --nostream 2>/dev/null | grep -i error || echo "")
        if [ -n "$PM2_ERRORS" ]; then
            log_warning "⚠ Обнаружены ошибки в логах:"
            echo "$PM2_ERRORS"
        fi

        sleep $HEALTH_CHECK_DELAY
    done

    if [ "$SUCCESS" -eq 0 ]; then
        log_error "❌ Приложение не ответило после $HEALTH_CHECK_RETRIES попыток"
        log_error "Проверьте логи: pm2 logs fences-app"
        rollback $1
        exit 1
    fi
}

##############################################################################
# ФИНАЛЬНАЯ ПРОВЕРКА
##############################################################################

final_check() {
    log_step "11. ФИНАЛЬНАЯ ПРОВЕРКА"

    # Проверка логов PM2
    log_info "Последние 20 строк логов PM2:"
    pm2 logs fences-app --lines 20 --nostream

    # Проверка использования памяти
    PM2_JSON=$(pm2 jlist)
    PM2_MEMORY=$(echo $PM2_JSON | jq -r '.[] | select(.name=="fences-app") | .monit.memory // 0')
    PM2_CPU=$(echo $PM2_JSON | jq -r '.[] | select(.name=="fences-app") | .monit.cpu // 0')
    log_info "Использование памяти: $((PM2_MEMORY / 1024 / 1024))MB"
    log_info "CPU: ${PM2_CPU}%"

    # Проверка соединения с БД
    log_info "Проверка соединения с БД..."
    DB_CHECK=$(PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -c 'SELECT COUNT(*) FROM "_prisma_migrations" WHERE rolled_back_at IS NULL' -t 2>/dev/null || echo "error")
    log_info "Применено миграций: ${DB_CHECK}"

    # Проверка ключевых API endpoints
    log_info "Проверка ключевых API endpoints..."

    # Проверка API калькулятора
    CALC_API=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/calculator/fence || echo '000')
    log_info "API калькулятора: HTTP $CALC_API"

    # Проверка API работ
    WORKS_API=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/admin/works || echo '000')
    log_info "API работ: HTTP $WORKS_API"

    # Проверка API Panel3D
    PANEL3D_API=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/admin/panel3d || echo '000')
    log_info "API Panel3D: HTTP $PANEL3D_API"

    log_success "✓ Финальная проверка завершена"
}

##############################################################################
# ОТКАТ (ROLLBACK)
##############################################################################

rollback() {
    BACKUP_DIR=$1

    if [ -z "$BACKUP_DIR" ] || [ ! -d "$BACKUP_DIR" ]; then
        log_error "Директория бэкапа не найдена: ${BACKUP_DIR}"
        return 1
    fi

    log_step "🔄 ОТКАТ ИЗМЕНЕНИЙ"

    log_warning "Начинаем откат к бэкапу: ${BACKUP_DIR}"

    # Остановка PM2
    log_info "Остановка PM2..."
    pm2 stop fences-app || true

    # Восстановление базы данных
    if [ -f "${BACKUP_DIR}/db_backup.sql" ]; then
        log_info "Восстановление базы данных из бэкапа..."
        PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} < ${BACKUP_DIR}/db_backup.sql

        if [ $? -eq 0 ]; then
            log_success "✓ База данных восстановлена"
        else
            log_error "❌ Ошибка при восстановлении БД"
        fi
    else
        log_warning "⚠ Бэкап БД не найден"
    fi

    # Восстановление предыдущего состояния кода
    log_info "Восстановление предыдущего состояния кода..."
    cd ${APP_DIR}

    # Попытка отката через git
    if git log --oneline | head -2 | tail -1 | grep -q "deploy"; then
        git reset --hard HEAD~1
        log_success "✓ Код отката на 1 коммит назад"
    fi

    # Восстановление .next директории
    if [ -d "${BACKUP_DIR}/.next" ]; then
        log_info "Восстановление .next директории..."
        rm -rf ${APP_DIR}/.next
        cp -r ${BACKUP_DIR}/.next ${APP_DIR}/
        log_success "✓ .next директория восстановлена"
    fi

    # Восстановление package.json
    if [ -f "${BACKUP_DIR}/package.json" ]; then
        log_info "Восстановление package.json..."
        cp ${BACKUP_DIR}/package.json ${APP_DIR}/

        # Переустановка зависимостей
        log_info "Переустановка зависимостей..."
        npm ci
    fi

    # Перезапуск PM2
    log_info "Перезапуск PM2..."
    pm2 restart fences-app

    if [ $? -eq 0 ]; then
        log_success "✓ PM2 перезапущен"
    else
        log_error "❌ Ошибка при перезапуске PM2"
    fi

    log_success "✓ Откат выполнен"
    log_warning "Пожалуйста, проверьте работоспособность приложения"
}

##############################################################################
# ГЛАВНАЯ ФУНКЦИЯ
##############################################################################

main() {
    START_TIME=$(date +%s)

    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║   УЛУЧЧЕННЫЙ СКРИПТ ДЛЯ БЕЗОПАСНОГО ДЕПЛОЯ MASTER2 НА VPS     ║"
    echo "║                                                               ║"
    echo "║   Директория: ${APP_DIR}                    ║"
    echo "║   Ветка: ${BRANCH}                                               ║"
    echo "║   БД: ${DB_NAME}                                                ║"
    echo "║   Дата: $(date '+%Y-%m-%d %H:%M:%S')                        ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    # Запуск этапов деплоя
    check_prerequisites

    BACKUP_PATH=$(create_backup)

    check_predeploy_status

    update_code

    # Если новых изменений не было - выходим
    if [ $? -eq 0 ] && [ "$?" != "0" ]; then
        log_info "Новых изменений нет, деплой не требуется"
        exit 0
    fi

    update_dependencies

    generate_prisma

    sync_database

    build_application ${BACKUP_PATH}

    restart_pm2 ${BACKUP_PATH}

    health_check ${BACKUP_PATH}

    final_check

    ##############################################################################
    # УСПЕШНОЕ ЗАВЕРШЕНИЕ
    ##############################################################################

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    MINUTES=$((DURATION / 60))
    SECONDS=$((DURATION % 60))

    log_step "✅ ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН"

    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}   Приложение успешно обновлено и запущено              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Время выполнения: ${MINUTES}м ${SECONDS}с                          ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                         ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Бэкап сохранен:                                         ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${BACKUP_PATH}    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                         ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Полезные команды:                                    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   - pm2 status                    - статус PM2        ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   - pm2 logs fences-app           - логи приложения    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   - pm2 monit                     - мониторинг        ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   - pm2 describe fences-app        - детали процесса    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   - pm2 restart fences-app         - перезапуск        ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                         ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Мониторинг приложения:                                  ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   http://37.143.13.196:3001                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                         ${GREEN}║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

##############################################################################
# ЗАПУСК
##############################################################################

# Обработка ошибок
trap 'log_error "Скрипт прерван с ошибкой"; exit 1' ERR

# Запуск основной функции
main "$@"
