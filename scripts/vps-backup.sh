#!/bin/bash
set -e

echo "=== СКРИПТ СОЗДАНИЯ БЕКАПОВ (BACKUP) ==="
echo "Дата: $(date)"
echo "Версия: 1.0.0"
echo "======================================"

BACKUP_DIR="/var/www/backups"
CURRENT_DIR="/var/www/fences-of-the-curtain"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/backup.log"
}

# Функция обработки ошибок
error_exit() {
    log "ОШИБКА: $1"
    log "Создание бекапа прервано. Проверьте логи: $BACKUP_DIR/backup.log"
    exit 1
}

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    error_exit "Этот скрипт должен запускаться с правами root"
fi

# Создание директории для бекапа
mkdir -p "$BACKUP_PATH"
log "Создание директории бекапа: $BACKUP_PATH"

# Шаг 1: Бекап базы данных
log "Создание бекапа базы данных..."
cd "$CURRENT_DIR" || error_exit "Директория проекта не найдена"

# Проверка, что контейнер базы данных запущен
if ! docker compose ps | grep -q "db.*Up"; then
    log "Запуск контейнера базы данных..."
    docker compose up -d db
    sleep 5
fi

# Создание дампа базы данных
docker compose exec -T db pg_dump -U postgres -d fences | gzip > "$BACKUP_PATH/database.sql.gz"
log "✓ Бекап базы данных создан"

# Шаг 2: Бекап кода приложения
log "Создание бекапа кода приложения..."
tar -czf "$BACKUP_PATH/app_code.tar.gz" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='*.log' \
    --exclude='coverage' \
    --exclude='.cache' \
    --exclude='*.tar.gz' \
    .
log "✓ Бекап кода приложения создан"

# Шаг 3: Бекап переменных окружения
log "Создание бекапа переменных окружения..."
cp "$CURRENT_DIR/.env" "$BACKUP_PATH/.env.backup"
log "✓ Бекап .env создан"

# Шаг 4: Бекап загруженных файлов
log "Создание бекапа загруженных файлов..."
docker run --rm -v "$CURRENT_DIR:/host" -v uploads_data:/data alpine sh -c "tar -czf /host/$BACKUP_PATH/uploads.tar.gz -C /data ." 2>/dev/null || log "Предупреждение: Не удалось создать бекап загруженных файлов"
log "✓ Бекап загруженных файлов создан"

# Шаг 5: Бекап Docker volumes
log "Создание списка Docker volumes..."
docker volume ls > "$BACKUP_PATH/volumes.txt"
log "✓ Список Docker volumes сохранен"

# Шаг 6: Бекап запущенных контейнеров
log "Сохранение информации о контейнерах..."
docker compose ps > "$BACKUP_PATH/containers.txt"
docker compose config > "$BACKUP_PATH/docker-compose.yml.backup"
log "✓ Информация о контейнерах сохранена"

# Шаг 7: Сохранение информации о миграциях
log "Сохранение информации о миграциях..."
if docker compose exec -T db psql -U postgres -d fences -c "SELECT * FROM _prisma_migrations;" > /dev/null 2>&1; then
    docker compose exec -T db psql -U postgres -d fences -c "SELECT migration_name, started_at, finished_at FROM _prisma_migrations ORDER BY started_at;" > "$BACKUP_PATH/applied_migrations.txt"
    log "✓ Информация о миграциях сохранена"
else
    log "Предупреждение: Не удалось получить информацию о миграциях"
fi

# Шаг 8: Создание контрольной суммы
log "Создание контрольных сумм..."
cd "$BACKUP_PATH"
md5sum *.gz *.txt > checksums.md5
cd "$CURRENT_DIR"
log "✓ Контрольные суммы созданы"

# Шаг 9: Создание файла информации о бекапе
cat > "$BACKUP_PATH/backup_info.txt" << EOF
=== ИНФОРМАЦИЯ О БЕКАПЕ ===
Дата создания: $(date)
Версия бекапа: 1.0.0
Тип бекапа: Полный
Директория проекта: $CURRENT_DIR
Git branch: $(git branch --show-current 2>/dev/null || echo 'N/A')
Git commit: $(git rev-parse HEAD 2>/dev/null || echo 'N/A')
Содержимое:
- database.sql.gz: Бекап базы данных PostgreSQL
- app_code.tar.gz: Бекап исходного кода приложения
- .env.backup: Переменные окружения
- uploads.tar.gz: Загруженные файлы пользователей
- volumes.txt: Список Docker volumes
- containers.txt: Информация о запущенных контейнерах
- docker-compose.yml.backup: Конфигурация Docker Compose
- applied_migrations.txt: Примененные миграции базы данных
- checksums.md5: Контрольные суммы файлов
================================
EOF

# Шаг 10: Очистка старых бекапов (хранить последние 5)
log "Очистка старых бекапов..."
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm -rf
cd "$CURRENT_DIR"
log "✓ Старые бекапы удалены (хранятся последние 5)"

# Завершение
log "======================================"
log "БЕКАП УСПЕШНО СОЗДАН"
log "Путь к бекапу: $BACKUP_PATH"
log "Размер бекапа: $(du -sh "$BACKUP_PATH" | cut -f1)"
log "Время завершения: $(date)"
log "======================================"
log ""
log "Для восстановления используйте:"
log "  bash scripts/vps-rollback.sh $TIMESTAMP"
log ""
log "Проверьте целостность бекапа:"
log "  cd $BACKUP_PATH && md5sum -c checksums.md5"