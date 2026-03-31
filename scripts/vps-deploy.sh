#!/bin/bash
set -e

echo "=== СКРИПТ БЕЗОПАСНОГО ДЕПЛОЯ НА VPS ==="
echo "Дата: $(date)"
echo "Версия: 1.0.0"
echo "======================================"

BACKUP_DIR="/var/www/backups"
DEPLOY_DIR="/var/www/fences-of-the-curtain"
REPO_URL="git@github.com:igorycha88-gif/Fences-of-the-curtain.git"
BRANCH="master2"

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_DIR/deploy.log"
}

# Функция обработки ошибок
error_exit() {
    log "ОШИБКА: $1"
    log "Деплой прерван. Для отката используйте скрипт rollback.sh"
    exit 1
}

# Функция проверки здоровья сервисов
check_health() {
    local service=$1
    local url=$2
    local max_retries=$3
    local retry=0

    while [ $retry -lt $max_retries ]; do
        if curl -f "$url" > /dev/null 2>&1; then
            log "✓ $service доступен"
            return 0
        fi
        retry=$((retry + 1))
        log "Попытка $retry/$max_retries: $service недоступен, ожидание..."
        sleep 5
    done

    error_exit "$service недоступен после $max_retries попыток"
}

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    error_exit "Этот скрипт должен запускаться с правами root"
fi

# Создание директорий
mkdir -p "$BACKUP_DIR"
mkdir -p "$DEPLOY_DIR"

cd "$DEPLOY_DIR" || error_exit "Не удалось перейти в директорию деплоя"

# ============================================
# ПРЕДВАРИТЕЛЬНАЯ ПОДГОТОВКА
# ============================================

log "ЭТАП 1: Предварительная подготовка"
log "-----------------------------------"

# Проверка необходимых инструментов
log "Проверка наличия необходимых инструментов..."
command -v git >/dev/null 2>&1 || error_exit "Git не установлен"
command -v docker >/dev/null 2>&1 || error_exit "Docker не установлен"
docker compose version >/dev/null 2>&1 || error_exit "Docker Compose не установлен"
command -v node >/dev/null 2>&1 || error_exit "Node.js не установлен"
log "✓ Все необходимые инструменты установлены"

# Проверка версии Node.js
NODE_VERSION=$(node --version)
log "Версия Node.js: $NODE_VERSION"

# ============================================
# СОЗДАНИЕ БЕКАПА ПЕРЕД ДЕПЛОЕМ
# ============================================

log ""
log "ЭТАП 2: Создание бекапа перед деплоем"
log "-----------------------------------"

if [ -f "scripts/vps-backup.sh" ]; then
    bash scripts/vps-backup.sh
    log "✓ Бекап создан успешно"
else
    log "Предупреждение: Скрипт бекапа не найден, пропускаем..."
fi

# ============================================
# КЛОНирование ИЛИ ОБНОВЛЕНИЕ РЕПОЗИТОРИЯ
# ============================================

log ""
log "ЭТАП 3: Получение исходного кода"
log "-----------------------------------"

if [ -d ".git" ]; then
    log "Обновление существующего репозитория..."
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    log "Клонирование репозитория..."
    rm -rf .git 2>/dev/null || true
    git clone "$REPO_URL" temp_repo
    mv temp_repo/.git .
    rm -rf temp_repo
    git checkout $BRANCH
fi

CURRENT_COMMIT=$(git rev-parse HEAD)
log "✓ Код получен (commit: $CURRENT_COMMIT)"
log "Текущая ветка: $(git branch --show-current)"

# ============================================
# НАСТРОЙКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
# ============================================

log ""
log "ЭТАП 4: Настройка переменных окружения"
log "-----------------------------------"

if [ ! -f ".env" ]; then
    log "Создание файла .env из .env.example..."
    cp .env.example .env
    log "⚠ ВАЖНО: Отредактируйте .env и установите правильные значения!"
    log "Необходимые переменные:"
    echo "  - POSTGRES_PASSWORD"
    echo "  - REDIS_PASSWORD"
    echo "  - NEXTAUTH_SECRET"
    echo "  - CRON_SECRET"
    echo "  - SMTP_* (параметры почты)"
    echo "  - TELEGRAM_* (параметры Telegram бота)"
    echo ""
    read -p "Нажмите Enter после редактирования .env..."
else
    log "✓ Файл .env уже существует"
fi

# Создание Redis password secret
mkdir -p secrets
if [ ! -f "secrets/redis_password" ]; then
    log "Создание Redis password..."
    openssl rand -base64 32 > secrets/redis_password
    log "✓ Redis password создан"
else
    log "✓ Redis password уже существует"
fi

# ============================================
# СБОРКА DOCKER ОБРАЗОВ
# ============================================

log ""
log "ЭТАП 5: Сборка Docker образов"
log "-----------------------------------"

log "Очистка старых Docker образов..."
docker system prune -f

log "Сборка образов..."
docker compose build --no-cache

log "✓ Docker образы собраны"

# ============================================
# ЗАПУСК СЕРВИСОВ
# ============================================

log ""
log "ЭТАП 6: Запуск сервисов"
log "-----------------------------------"

# Остановка старых контейнеров
log "Остановка старых контейнеров..."
docker compose down || true

# Запуск новых контейнеров
log "Запуск новых контейнеров..."
docker compose up -d

log "✓ Контейнеры запущены"

# Ожидание запуска базы данных
log "Ожидание готовности базы данных..."
sleep 15

# ============================================
# ПРИМЕНЕНИЕ МИГРАЦИЙ БАЗЫ ДАННЫХ
# ============================================

log ""
log "ЭТАП 7: Применение миграций базы данных"
log "-----------------------------------"

# Проверка подключения к базе данных
MAX_DB_RETRIES=10
DB_RETRY=0

while [ $DB_RETRY -lt $MAX_DB_RETRIES ]; do
    if docker compose exec -T db pg_isready -U postgres -d fences > /dev/null 2>&1; then
        log "✓ База данных готова"
        break
    fi
    DB_RETRY=$((DB_RETRY + 1))
    log "Попытка $DB_RETRY/$MAX_DB_RETRIES: Ожидание базы данных..."
    sleep 5
done

if [ $DB_RETRY -eq $MAX_DB_RETRIES ]; then
    error_exit "База данных не стала доступной"
fi

# Применение миграций
log "Применение Prisma миграций..."
docker compose exec -T app npx prisma migrate deploy || error_exit "Ошибка применения миграций"
log "✓ Миграции применены"

# ============================================
# ЗАПОЛНЕНИЕ БАЗЫ ДАННЫХ
# ============================================

log ""
log "ЭТАП 8: Заполнение базы данных"
log "-----------------------------------"

log "Заполнение справочных данных..."
docker compose exec -T app npm run db:seed || log "Предупреждение: Ошибка заполнения базы данных"
log "✓ База данных заполнена"

# ============================================
# ПРОВЕРКА ЗДОРОВЬЯ СЕРВИСОВ
# ============================================

log ""
log "ЭТАП 9: Проверка здоровья сервисов"
log "-----------------------------------"

# Проверка состояния контейнеров
log "Проверка состояния контейнеров..."
docker compose ps

# Проверка приложения
log "Проверка доступности приложения..."
sleep 10
check_health "Приложение" "http://localhost:3000/" 20

# Проверка API
log "Проверка API endpoints..."
check_health "API Health" "http://localhost:3000/api/health" 10

# Проверка базы данных
log "Проверка подключения к базе данных..."
docker compose exec -T db pg_isready -U postgres -d fences > /dev/null 2>&1 && log "✓ База данных доступна" || error_exit "База данных недоступна"

# Проверка Redis
log "Проверка подключения к Redis..."
docker compose exec -T redis redis-cli -a "$(cat secrets/redis_password)" ping > /dev/null 2>&1 && log "✓ Redis доступен" || error_exit "Redis недоступен"

# ============================================
# НАСТРОЙКА NGINX И SSL
# ============================================

log ""
log "ЭТАП 10: Настройка Nginx и SSL"
log "-----------------------------------"

if [ ! -d "ssl" ]; then
    log "Директория SSL не найдена. Используйте Let's Encrypt для получения сертификатов:"
    echo "  certbot certonly --webroot -w /var/www/html -d ваш-домен.com"
    echo ""
    echo "Затем скопируйте сертификаты в директорию ssl/ и обновите docker-compose.yml"
else
    log "✓ SSL сертификаты уже настроены"
fi

# Перезапуск Nginx для применения настроек
log "Перезапуск Nginx..."
docker compose restart nginx || log "Предупреждение: Не удалось перезапустить Nginx"

# ============================================
# ИТОГОВАЯ ПРОВЕРКА
# ============================================

log ""
log "ЭТАП 11: Итоговая проверка"
log "-----------------------------------"

log "ЗапускSmoke тестов..."
bash scripts/smoke-test.sh 2>/dev/null || log "Предупреждение: Smoke тесты не выполнены"

log "Проверка логов на наличие ошибок..."
ERROR_COUNT=$(docker compose logs --tail=100 app | grep -i "error\|exception\|fatal" | wc -l || echo "0")
if [ "$ERROR_COUNT" -gt 0 ]; then
    log "⚠ Предупреждение: Найдено $ERROR_COUNT записей об ошибках в логах"
else
    log "✓ Критических ошибок не найдено"
fi

# ============================================
# ЗАВЕРШЕНИЕ
# ============================================

log ""
log "======================================"
log "ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН"
log "======================================"
log ""
log "Информация о деплое:"
echo "  - Ветка: $BRANCH"
echo "  - Commit: $CURRENT_COMMIT"
echo "  - Время завершения: $(date)"
echo "  - Бекап создан: $BACKUP_DIR/$(ls -t $BACKUP_DIR | head -1)"
echo ""
log "Доступные сервисы:"
echo "  - Приложение: http://localhost:3000"
echo "  - Nginx: http://localhost:80 и https://localhost:443"
echo "  - Admin панель: http://localhost:3000/admin"
echo ""
log "Полезные команды:"
echo "  - Просмотр логов: docker compose logs -f"
echo "  - Статус контейнеров: docker compose ps"
echo "  - Перезапуск: docker compose restart"
echo "  - Остановка: docker compose down"
echo ""
log "Для отката в случае проблем:"
echo "  bash scripts/vps-rollback.sh <backup_date>"
echo ""
log "Проверьте:"
echo "  1. Работоспособность калькулятора"
echo "  2. Доступность админ-панели"
echo "  3. Работоспособность API"
echo "  4. Работоспособность Telegram бота"
echo "  5. Работоспособность почтовых уведомлений"
echo "======================================"