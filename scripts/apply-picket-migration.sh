#!/bin/bash

# =============================================================================
# 🔧 ПРИМЕНЕНИЕ МИГРАЦИИ PICKET ПОЛЕЙ НА ПРОДЕ
# =============================================================================
# Скрипт применяет недостающую миграцию для picket-полей в FenceEstimate
#
# ВНИМАНИЕ: После включения ufw (см. ЧТЗ_Grafana_Reverse_Proxy.md, FR-004)
# порт 3001 закрыт извне. Этот скрипт использует прямой запрос на
# http://${VPS_HOST}:3001/, который теперь работает ТОЛЬКО через SSH-туннель:
#
#   ssh -L 3001:127.0.0.1:3001 root@37.143.13.196
#   VPS_HOST=127.0.0.1 bash scripts/apply-picket-migration.sh
#
# Альтернатива: запускать скрипт прямо на VPS (через SSH-сессию),
# оставив VPS_HOST=127.0.0.1.
# =============================================================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Конфигурация
VPS_HOST="37.143.13.196"
VPS_USER="root"
VPS_DIR="/var/www/fences-of-the-curtain"
APP_NAME="fences-app"
MIGRATION_NAME="20260331230000_add_picket_fields_to_fence_estimate"

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Функция отката
rollback_migration() {
    log_step "🚨 ОТКАТ МИГРАЦИИ..."
    
    ssh root@${VPS_HOST} "
        cd ${VPS_DIR} && \
        sudo -u postgres psql -d fences -c \"
            ALTER TABLE \\\"FenceEstimate\\\" DROP COLUMN IF EXISTS \\\"picketNomenclatureId\\\";
            ALTER TABLE \\\"FenceEstimate\\\" DROP COLUMN IF EXISTS \\\"picketNomenclatureName\\\";
            ALTER TABLE \\\"FenceEstimate\\\" DROP COLUMN IF EXISTS \\\"picketTotal\\\";
            ALTER TABLE \\\"FenceEstimate\\\" DROP COLUMN IF EXISTS \\\"picketStep\\\";
            ALTER TABLE \\\"FenceEstimate\\\" DROP COLUMN IF EXISTS \\\"picketMountingType\\\";
            ALTER TABLE \\\"FenceEstimate\\\" DROP COLUMN IF EXISTS \\\"picketProfileType\\\";
            ALTER TABLE \\\"FenceEstimate\\\" DROP COLUMN IF EXISTS \\\"picketCoatingName\\\";
            DELETE FROM _prisma_migrations WHERE migration_name = '${MIGRATION_NAME}';
        \"
    "
    
    log_warn "Откат миграции завершен"
}

# Главная функция
main() {
    echo ""
    echo "=============================================================================="
    echo "🔧 ПРИМЕНЕНИЕ МИГРАЦИИ PICKET ПОЛЕЙ"
    echo "=============================================================================="
    echo ""
    
    # Шаг 1: Проверка соединения
    log_step "Проверка соединения с VPS..."
    if ! ssh root@${VPS_HOST} "echo 'OK'" > /dev/null 2>&1; then
        log_error "Не удалось подключиться к VPS"
        exit 1
    fi
    log_info "✓ Соединение установлено"
    
    # Шаг 2: Создание бэкапа БД
    log_step "Создание бэкапа БД..."
    BACKUP_FILE="/var/www/backups/db_before_picket_migration_$(date +%Y%m%d_%H%M%S).sql.gz"
    ssh root@${VPS_HOST} "
        mkdir -p /var/www/backups && \
        sudo -u postgres pg_dump fences | gzip > ${BACKUP_FILE}
    "
    log_info "✓ Бэкап создан: ${BACKUP_FILE}"
    
    # Шаг 3: Проверка, не применена ли уже миграция
    log_step "Проверка статуса миграции..."
    MIGRATION_EXISTS=$(ssh root@${VPS_HOST} "
        sudo -u postgres psql -d fences -tAc \"SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name = '${MIGRATION_NAME}'\"
    ")
    
    if [ "$MIGRATION_EXISTS" -gt 0 ]; then
        log_warn "Миграция уже была применена ранее"
        
        # Проверим, существуют ли колонки
        COLUMNS_EXIST=$(ssh root@${VPS_HOST} "
            sudo -u postgres psql -d fences -tAc \"SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'FenceEstimate' AND column_name = 'picketNomenclatureId'\"
        ")
        
        if [ "$COLUMNS_EXIST" -eq 1 ]; then
            log_info "✓ Колонки существуют, миграция корректна"
        else
            log_error "Миграция помечена как примененная, но колонки отсутствуют!"
            log_warn "Пробуем применить миграцию вручную..."
        fi
    else
        # Шаг 4: Пуш изменений в репозиторий
        log_step "Отправка изменений в репозиторий..."
        git add prisma/migrations/${MIGRATION_NAME}/
        git commit -m "fix: add missing migration for picket fields in FenceEstimate" || log_warn "Нет изменений для коммита"
        git push origin master2
        log_info "✓ Изменения отправлены"
        
        # Шаг 5: Обновление кода на VPS
        log_step "Обновление кода на VPS..."
        ssh root@${VPS_HOST} "
            cd ${VPS_DIR} && \
            git fetch origin && \
            git pull origin master2
        "
        log_info "✓ Код обновлен"
        
        # Шаг 6: Применение миграции
        log_step "Применение миграции..."
        ssh root@${VPS_HOST} "
            cd ${VPS_DIR} && \
            sudo -u postgres psql -d fences -f prisma/migrations/${MIGRATION_NAME}/migration.sql
        "
        
        if [ $? -eq 0 ]; then
            log_info "✓ Миграция применена успешно"
            
            # Регистрация миграции в Prisma
            ssh root@${VPS_HOST} "
                sudo -u postgres psql -d fences -c \"
                    INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
                    VALUES (gen_random_uuid(), 'manual_migration', NOW(), '${MIGRATION_NAME}', NULL, NULL, NOW(), 1);
                \"
            "
            log_info "✓ Миграция зарегистрирована в Prisma"
        else
            log_error "Ошибка при применении миграции"
            rollback_migration
            exit 1
        fi
    fi
    
    # Шаг 7: Генерация Prisma Client
    log_step "Генерация Prisma Client..."
    ssh root@${VPS_HOST} "
        cd ${VPS_DIR} && \
        npx prisma generate
    "
    log_info "✓ Prisma Client сгенерирован"
    
    # Шаг 8: Перезапуск приложения
    log_step "Перезапуск приложения..."
    ssh root@${VPS_HOST} "pm2 restart ${APP_NAME}"
    log_info "✓ Приложение перезапущено"
    
    # Шаг 9: Ожидание и проверка
    log_step "Ожидание запуска (15 сек)..."
    sleep 15
    
    # Шаг 10: Проверка статуса
    log_step "Проверка статуса приложения..."
    PM2_STATUS=$(ssh root@${VPS_HOST} "pm2 list | grep ${APP_NAME} | awk '{print \$10}'")
    
    if [ "$PM2_STATUS" = "online" ]; then
        log_info "✓ Статус PM2: online"
    else
        log_error "Статус PM2: $PM2_STATUS"
        log_warn "Проверьте логи: ssh root@${VPS_HOST} 'pm2 logs ${APP_NAME} --lines 50'"
    fi
    
    # Шаг 11: Проверка логов на ошибки
    log_step "Проверка логов на ошибки..."
    ERROR_COUNT=$(ssh root@${VPS_HOST} "pm2 logs ${APP_NAME} --lines 50 --nostream | grep -i 'picketNomenclatureId' | wc -l" || echo "0")
    
    if [ "$ERROR_COUNT" -eq 0 ]; then
        log_info "✓ Ошибок picketNomenclatureId не найдено!"
    else
        log_warn "Найдено ошибок: $ERROR_COUNT"
        log_warn "Проверьте логи вручную"
    fi
    
    # Шаг 12: Проверка API
    log_step "Проверка API..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://${VPS_HOST}:3001/ 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_info "✓ Главная страница доступна (HTTP 200)"
    else
        log_warn "Главная страница вернула код: $HTTP_CODE"
    fi
    
    echo ""
    echo "=============================================================================="
    log_info "✓ МИГРАЦИЯ ЗАВЕРШЕНА"
    echo "=============================================================================="
    echo ""
    log_info "Бэкап БД: ${BACKUP_FILE}"
    log_info "Для отката выполните: bash scripts/rollback-picket-migration.sh"
    echo ""
    
    # Финальная проверка
    log_step "Финальная проверка таблицы FenceEstimate..."
    ssh root@${VPS_HOST} "
        sudo -u postgres psql -d fences -c \"
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'FenceEstimate' 
            AND column_name LIKE 'picket%'
            ORDER BY column_name;
        \"
    "
}

# Запуск
main "$@"
