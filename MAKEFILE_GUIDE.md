# Makefile - Команды для упрощения разработки

## Новые команды мониторинга

```bash
# Мониторинг
make monitoring-up         # Запустить стек мониторинга (Prometheus + Grafana + Exporters)
make monitoring-down       # Остановить стек мониторинга
make monitoring-logs       # Посмотреть логи мониторинга
make monitoring-status      # Проверить статус сервисов мониторинга
make monitoring-grafana    # Сбросить пароль админа Grafana
make monitoring-reload      # Перезагрузить конфигурацию Prometheus
make monitoring-backup      # Создать бекап данных Prometheus

# Комбинированные команды
make all-up              # Запустить все сервисы (приложение + мониторинг)
make all-down            # Остановить все сервисы
make full-up             # Alias для all-up
make full-down           # Alias для all-down
```

## Примеры использования

### Быстрый старт с мониторингом
```bash
# 1. Настроить мониторинг (первые раз)
cp .env.monitoring.example .env.monitoring
nano .env.monitoring  # Измените GRAFANA_ADMIN_PASSWORD

# 2. Запустить все сервисы
make all-up

# Доступ:
#   Приложение: http://localhost:3000
#   Grafana:    http://localhost:3001 (admin/admin)
```

### Только мониторинг
```bash
# Если приложение уже запущено
make monitoring-up

# Доступ к Grafana:
#   URL: http://localhost:3001
#   Логин: admin
#   Пароль: admin (из .env.monitoring)
```

### Полезные команды

```bash
# Проверка статуса всех сервисов
make monitoring-status

# Просмотр логов
make logs-app       # Приложение
make logs-db        # База данных
make logs-redis    # Redis
make logs-nginx    # Nginx

# Статистика контейнеров
make stats
```

## Все команды

| Команда | Описание |
|---------|----------|
| make install | Установить зависимости npm |
| make dev | Запустить development сервер (npm run dev) |
| make build | Собрать для production (npm run build) |
| make start | Запустить production сервер (npm start) |
| make test | Запустить тесты (npm test) |
| make lint | Запустить линтер (npm run lint) |
| make clean | Очистить артефакты сборки |
| make docker-build | Собрать Docker образы |
| make docker-up | Запустить Docker контейнеры |
| make docker-down | Остановить Docker контейнеры |
| make docker-restart | Перезапустить контейнеры |
| make docker-clean | Очистить Docker ресурсы |
| make db-migrate | Выполнить миграции БД |
| make db-seed | Заполнить БД данными |
| make db-reset | Сбросить и заполнить БД |
| make db-connect | Подключиться к PostgreSQL |
| make redis-connect | Подключиться к Redis |
| make backup-db | Создать бекап БД |
| make restore-db | Восстановить БД из бекапа |
| make logs-* | Просмотр логов (app, db, redis, nginx) |
| make health-check | Проверить здоровье приложения |
| make monitoring-up | Запустить мониторинг |
| make monitoring-down | Остановить мониторинг |
| make monitoring-logs | Логи мониторинга |
| make monitoring-status | Статус мониторинга |
| make monitoring-grafana | Сбросить пароль Grafana |
| make monitoring-reload | Перезагрузить Prometheus |
| make monitoring-backup | Бекап Prometheus |
| make all-up | Запустить все сервисы |
| make all-down | Остановить все сервисы |
| make full-up | Alias для all-up |
| make full-down | Alias для all-down |
| make rebuild | Пересобрать без кэша |
| make prod-up | Запуск в production |
| make prod-down | Остановка production |

## Подробная документация

Смотрите `DEVOPS_OPTIMIZATIONS_STAGE2.md` для более детальной информации о мониторинге.
