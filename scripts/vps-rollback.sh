#!/bin/bash
set -e

echo "=== СКРИПТ БЕЗОПАСНОГО ОТКАТА (ROLLBACK) ==="
echo "Дата: $(date)"
echo "Версия: 1.0.0"
echo "======================================"

ROLLBACK_DIR="/var/www/rollback"
BACKUP_DIR="/var/www/backups"
CURRENT_DIR="/var/www/fences-of-the-curtain"

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$ROLLBACK_DIR/rollback.log"
}

# Функция обработки ошибок
error_exit() {
    log "ОШИБКА: $1"
    log "Откат прерван. Проверьте логи: $ROLLBACK_DIR/rollback.log"
    exit 1
}

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    error_exit "Этот скрипт должен запускаться с правами root"
fi

# Создание директорий
mkdir -p "$ROLLBACK_DIR" "$BACKUP_DIR"

# Проверка аргументов
if [ $# -eq 0 ]; then
    echo "Использование: $0 <backup_date>"
    echo "Пример: $0 20260331_120000"
    echo ""
    echo "Доступные бекапы:"
    ls -la "$BACKUP_DIR" | grep "^d" | awk '{print $9}' | grep -E "^[0-9]" || echo "Нет доступных бекапов"
    exit 1
fi

BACKUP_DATE=$1
BACKUP_PATH="$BACKUP_DIR/$BACKUP_DATE"

if [ ! -d "$BACKUP_PATH" ]; then
    error_exit "Бекап $BACKUP_DATE не найден"
fi

log "Начало процедуры отката к версии: $BACKUP_DATE"

# Шаг 1: Остановка всех контейнеров
log "Остановка всех контейнеров..."
cd "$CURRENT_DIR" || error_exit "Директория проекта не найдена"
docker compose down || log "Предупреждение: Некоторые контейнеры не были остановлены"

# Шаг 2: Восстановление базы данных
log "Восстановление базы данных из бекапа..."
if [ -f "$BACKUP_PATH/database.sql.gz" ]; then
    docker compose up -d db
    log "Ожидание готовности базы данных..."
    sleep 10
    
    # Очистка текущей базы данных
    docker compose exec -T db psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS fences;"
    docker compose exec -T db psql -U postgres -d postgres -c "CREATE DATABASE fences;"
    
    # Восстановление из бекапа
    gunzip -c "$BACKUP_PATH/database.sql.gz" | docker compose exec -T db psql -U postgres -d fences
    log "База данных восстановлена"
else
    log "Предупреждение: Бекап базы данных не найден"
fi

# Шаг 3: Восстановление кода приложения
log "Восстановление кода приложения..."
if [ -f "$BACKUP_PATH/app_code.tar.gz" ]; then
    # Резервное копирование текущего кода
    tar -czf "$ROLLBACK_DIR/current_code_before_rollback_$(date +%Y%m%d_%H%M%S).tar.gz" \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='*.log' \
        .

    # Распаковка бекапа
    tar -xzf "$BACKUP_PATH/app_code.tar.gz"
    log "Код приложения восстановлен"
else
    log "Предупреждение: Бекап кода не найден"
fi

# Шаг 4: Восстановление Docker volumes
log "Восстановление Docker volumes..."
if [ -f "$BACKUP_PATH/uploads.tar.gz" ]; then
    docker compose up -d
    sleep 5
    docker run --rm -v "$CURRENT_DIR:/host" -v uploads_data:/data alpine sh -c "tar -xzf /host/$BACKUP_PATH/uploads.tar.gz -C /data"
    log "Загруженные файлы восстановлены"
fi

# Шаг 5: Восстановление переменных окружения
log "Восстановление переменных окружения..."
if [ -f "$BACKUP_PATH/.env.backup" ]; then
    cp "$BACKUP_PATH/.env.backup" "$CURRENT_DIR/.env"
    log "Переменные окружения восстановлены"
else
    log "Предупреждение: Бекап .env не найден"
fi

# Шаг 6: Пересборка и запуск контейнеров
log "Пересборка и запуск контейнеров..."
docker compose build
docker compose up -d

# Шаг 7: Ожидание запуска сервисов
log "Ожидание запуска сервисов..."
sleep 20

# Шаг 8: Проверка здоровья
log "Проверка здоровья приложения..."
MAX_RETRIES=10
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        log "✓ Приложение успешно запущено"
        break
    fi
    RETRY=$((RETRY + 1))
    log "Попытка $RETRY/$MAX_RETRIES: Ожидание запуска..."
    sleep 5
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    error_exit "Приложение не запустилось после отката"
fi

# Шаг 9: Проверка базы данных
log "Проверка подключения к базе данных..."
if docker compose exec -T db pg_isready -U postgres -d fences > /dev/null 2>&1; then
    log "✓ База данных доступна"
else
    error_exit "База данных недоступна"
fi

# Шаг 10: Запуск миграций (если нужно)
log "Проверка необходимости миграций..."
if [ -f "$BACKUP_PATH/applied_migrations.txt" ]; then
    log "Применялись миграции: $(cat $BACKUP_PATH/applied_migrations.txt)"
fi

# Завершение
log "======================================"
log "ОТКАТ УСПЕШНО ЗАВЕРШЕН"
log "Восстановленная версия: $BACKUP_DATE"
log "Время завершения: $(date)"
log "======================================"
log ""
log "Следующие шаги:"
log "1. Проверьте работоспособность приложения: http://localhost:3000"
log "2. Проверьте админ-панель"
log "3. Проверьте API endpoints"
log "4. Просмотрите логи: docker compose logs -f"
log ""
log "Если возникнут проблемы, логи находятся в: $ROLLBACK_DIR/"