#!/bin/bash

# Безопасный деплой master2 на production VPS
# С автоматическим откатом в случае ошибки

set -e

# Конфигурация
VPS_HOST="37.143.13.196"
VPS_USER="root"
VPS_PASS="Gorunova007@"
PROJECT_DIR="/root/Fences-of-the-curtain"
BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="fences_backup_${TIMESTAMP}"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Функция выполнения команд на VPS
vps_cmd() {
    sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

# Функция отката
rollback() {
    log_error "Начинаю откат изменений..."
    
    # Восстанавливаем код из предыдущего коммита
    vps_cmd "cd $PROJECT_DIR && git reset --hard $CURRENT_COMMIT" || true
    
    # Восстанавливаем .env
    if vps_cmd "[ -f $BACKUP_DIR/.env.backup ]"; then
        vps_cmd "cp $BACKUP_DIR/.env.backup $PROJECT_DIR/.env"
        log_info ".env восстановлен"
    fi
    
    # Пересобираем старую версию
    log_info "Пересборка старой версии..."
    vps_cmd "cd $PROJECT_DIR && npm run build" || {
        log_error "Ошибка сборки при откате!"
        exit 1
    }
    
    # Перезапускаем PM2
    vps_cmd "cd $PROJECT_DIR && pm2 restart fences-app" || true
    
    log_warning "Откат завершен. Приложение вернулось к предыдущей версии."
    exit 1
}

# Проверка зависимостей
log_info "Проверка зависимостей..."
if ! command -v sshpass &> /dev/null; then
    log_error "sshpass не установлен. Установите: brew install sshpass"
    exit 1
fi

# Начало деплоя
log_info "=========================================="
log_info "Начало безопасного деплоя master2 -> Production"
log_info "=========================================="

# 1. Получаем текущий коммит на проде
log_info "Получение текущего состояния production..."
CURRENT_COMMIT=$(vps_cmd "cd $PROJECT_DIR && git rev-parse HEAD")
log_info "Текущий коммит на production: $CURRENT_COMMIT"

# 2. Создаем директорию для бэкапов
log_info "Создание директории для бэкапов..."
vps_cmd "mkdir -p $BACKUP_DIR"

# 3. Бэкап базы данных
log_info "Создание бэкапа базы данных..."
vps_cmd "sudo -u postgres pg_dump fences > $BACKUP_DIR/db_${BACKUP_NAME}.sql" || {
    log_error "Ошибка создания бэкапа БД!"
    exit 1
}
log_success "Бэкап БД создан: $BACKUP_DIR/db_${BACKUP_NAME}.sql"

# 4. Бэкап .env
log_info "Создание бэкапа .env..."
vps_cmd "cp $PROJECT_DIR/.env $BACKUP_DIR/.env.backup"
log_success "Бэкап .env создан"

# 5. Проверяем статус миграций
log_info "Проверка статуса миграций..."
MIGRATION_STATUS=$(vps_cmd "sudo -u postgres psql -d fences -t -c \"SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name = '20260331230000_add_picket_fields_to_fence_estimate';\"")
if [ "$MIGRATION_STATUS" -gt 0 ]; then
    log_success "Миграция 20260331230000 уже применена"
else
    log_warning "Миграция не применена, будет применена автоматически"
fi

# 6. Обновляем код
log_info "Обновление кода из ветки master2..."
vps_cmd "cd $PROJECT_DIR && git fetch origin master2" || {
    log_error "Ошибка git fetch!"
    exit 1
}

vps_cmd "cd $PROJECT_DIR && git checkout master2" || {
    log_error "Ошибка git checkout!"
    exit 1
}

vps_cmd "cd $PROJECT_DIR && git pull origin master2" || {
    log_error "Ошибка git pull!"
    rollback
}

NEW_COMMIT=$(vps_cmd "cd $PROJECT_DIR && git rev-parse HEAD")
log_success "Код обновлен: $CURRENT_COMMIT -> $NEW_COMMIT"

# 7. Исправляем .env (устанавливаем правильный пароль PostgreSQL)
log_info "Проверка и исправление .env..."
vps_cmd "cd $PROJECT_DIR && grep -q 'POSTGRES_PASSWORD' .env && sed -i 's/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=\"postgres\"/' .env || echo 'POSTGRES_PASSWORD=\"postgres\"' >> .env"
vps_cmd "cd $PROJECT_DIR && sed -i 's|DATABASE_URL=.*|DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/fences\"|' .env"
log_success ".env обновлен"

# 8. Установка зависимостей
log_info "Установка зависимостей..."
vps_cmd "cd $PROJECT_DIR && npm install --legacy-peer-deps" || {
    log_error "Ошибка npm install!"
    rollback
}
log_success "Зависимости установлены"

# 9. Генерация Prisma Client
log_info "Генерация Prisma Client..."
vps_cmd "cd $PROJECT_DIR && npx prisma generate" || {
    log_error "Ошибка prisma generate!"
    rollback
}
log_success "Prisma Client сгенерирован"

# 10. Применение миграций (если есть новые)
log_info "Проверка и применение миграций..."
vps_cmd "cd $PROJECT_DIR && npx prisma migrate deploy" || {
    log_error "Ошибка применения миграций!"
    rollback
}
log_success "Миграции применены"

# 11. Сборка приложения
log_info "Сборка приложения (это может занять несколько минут)..."
vps_cmd "cd $PROJECT_DIR && npm run build" || {
    log_error "Ошибка сборки приложения!"
    rollback
}
log_success "Приложение успешно собрано"

# 12. Перезапуск PM2
log_info "Перезапуск приложения через PM2..."
vps_cmd "cd $PROJECT_DIR && pm2 restart fences-app" || {
    log_error "Ошибка перезапуска PM2!"
    rollback
}
log_success "Приложение перезапущено"

# 13. Ожидание запуска и проверка
log_info "Ожидание запуска приложения (10 секунд)..."
sleep 10

log_info "Проверка статуса приложения..."
PM2_STATUS=$(vps_cmd "pm2 jlist" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ "$PM2_STATUS" = "online" ]; then
    log_success "Приложение успешно запущено (status: $PM2_STATUS)"
else
    log_error "Приложение не запущено корректно (status: $PM2_STATUS)"
    log_warning "Проверьте логи: pm2 logs fences-app"
    rollback
fi

# 14. Проверка логов на ошибки
log_info "Проверка логов на ошибки..."
ERRORS=$(vps_cmd "pm2 logs fences-app --lines 50 --nostream" | grep -i "error" | wc -l)
if [ "$ERRORS" -gt 0 ]; then
    log_warning "Обнаружены ошибки в логах. Проверьте: pm2 logs fences-app"
else
    log_success "Ошибок в логах не обнаружено"
fi

# 15. Создание скрипта отката
log_info "Создание скрипта отката..."
vps_cmd "cat > $BACKUP_DIR/rollback_$TIMESTAMP.sh << 'ROLLBACK_EOF'
#!/bin/bash
# Скрипт отката к версии $CURRENT_COMMIT от $TIMESTAMP

cd $PROJECT_DIR

echo 'Остановка приложения...'
pm2 stop fences-app

echo 'Восстановление кода...'
git reset --hard $CURRENT_COMMIT

echo 'Восстановление .env...'
cp $BACKUP_DIR/.env.backup .env

echo 'Установка зависимостей...'
npm ci

echo 'Генерация Prisma Client...'
npx prisma generate

echo 'Сборка приложения...'
npm run build

echo 'Восстановление базы данных...'
sudo -u postgres psql -d fences < $BACKUP_DIR/db_${BACKUP_NAME}.sql

echo 'Запуск приложения...'
pm2 restart fences-app

echo 'Откат завершен!'
ROLLBACK_EOF
chmod +x $BACKUP_DIR/rollback_$TIMESTAMP.sh"
log_success "Скрипт отката создан: $BACKUP_DIR/rollback_$TIMESTAMP.sh"

# Завершение
log_success "=========================================="
log_success "Деплой успешно завершен!"
log_success "=========================================="
echo ""
log_info "Версия на production: $NEW_COMMIT"
log_info "Предыдущая версия: $CURRENT_COMMIT"
log_info "Бэкап БД: $BACKUP_DIR/db_${BACKUP_NAME}.sql"
log_info "Скрипт отката: $BACKUP_DIR/rollback_$TIMESTAMP.sh"
echo ""
log_warning "Для отката выполните на VPS:"
log_warning "  bash $BACKUP_DIR/rollback_$TIMESTAMP.sh"
echo ""
log_info "Полезные команды:"
log_info "  Логи: pm2 logs fences-app"
log_info "  Статус: pm2 status"
log_info "  Мониторинг: pm2 monit"
