# DevOps Optimizations - Stage 2

## Выполненные оптимизации

### 1. Оптимизация Dockerfile

**Изменения:**
- Добавлен отдельный stage для Prisma генерации с кэшированием
- Оптимизирован порядок копирования файлов для лучшего кэширования слоев
- Добавлен `npm cache clean --force` для уменьшения размера образа
- Добавлен `HEALTHCHECK` в Dockerfile для встроенного мониторинга
- Использован `--chown` для копирования файлов от имени пользователя
- Добавлены системные зависимости только для runtime в runner stage

**Результат:**
- Уменьшен размер Docker образа
- Ускорена сборка благодаря кэшированию слоев
- Добавлены health checks для контейнеров

### 2. Создание Makefile

**Команды:**
```bash
make help          # Показать доступные команды
make install       # Установить зависимости
make dev           # Запустить development сервер
make build         # Собрать для production
make start         # Запустить production сервер
make test          # Запустить тесты
make lint          # Запустить линтер
make clean         # Очистить артефакты сборки
make docker-build  # Собрать Docker образы
make docker-up     # Запустить Docker контейнеры
make docker-down   # Остановить Docker контейнеры
make db-migrate    # Выполнить миграции базы данных
make db-seed       # Заполнить базу данными
make db-reset      # Сбросить и заполнить базу данных
make db-connect    # Подключиться к PostgreSQL
make redis-connect # Подключиться к Redis
make backup-db     # Создать бекап базы данных
make restore-db    # Восстановить базу из бекапа
make logs-app      # Показать логи приложения
make logs-db       # Показать логи базы данных
make logs-redis   # Показать логи Redis
make logs-nginx   # Показать логи Nginx
make stats         # Показать статистику Docker контейнеров
make health-check  # Проверить состояние приложения
```

**Примеры:**
```bash
# Быстрый старт локальной разработки
make docker-up

# Полный цикл деплоя
make docker-down docker-build docker-up

# Работа с базой данных
make db-migrate db-seed

# Мониторинг
make health-check
make logs-app
```

### 3. Nginx кэширование

**Добавлено:**
- Proxy cache с размером 100MB
- Кэширование статических файлов на 1 год
- Кэширование API ответов (200 - 10 минут, 301/302 - 5 минут)
- Cache bypass для POST запросов и авторизованных пользователей
- Rate limiting (10 запросов/секунду)
- Health check endpoints
- Nginx status endpoint для мониторинга

**Параметры кэша:**
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=100m inactive=60m
proxy_cache_valid 200 10m;
proxy_cache_valid 301 302 5m;
```

**Мониторинг кэша:**
```bash
curl http://localhost:3000/cache_status
```

### 4. Централизованное логирование

**Создан модуль:** `src/lib/logger.ts`

**Функциональность:**
- Уровни логирования: ERROR, WARN, INFO, DEBUG, TRACE
- Контекст логирования с метаданными (userId, requestId, module)
- Автоматическое определение окружения (development/production/browser)
- Поддержка динамического уровня через переменную окружения LOG_LEVEL
- Функция `withContext()` для добавления контекста

**Использование:**
```typescript
import logger from '@/lib/logger';

// Базовое использование
logger.info('User logged in', { userId: '123', module: 'auth' });
logger.error('Database connection failed', { error, module: 'db' });

// С контекстом
const contextLogger = logger.withContext({ requestId: 'abc-123' });
contextLogger.info('Processing request');
```

**Health check endpoint:**
```typescript
// src/app/api/health/route.ts
import logger from '@/lib/logger';

export async function GET() {
  logger.info('Health check called', { module: 'health' });
  return NextResponse.json({ status: 'ok', uptime: process.uptime() });
}
```

## Измененные файлы

### Docker
- `docker/Dockerfile` - Оптимизирован multi-stage build
- `docker/Dockerfile.dev` - Оптимизирован development build
- `docker/Dockerfile.all-in-one` - Оптимизирован all-in-one build
- `docker/nginx.conf` - Добавлено кэширование и rate limiting

### Configuration
- `docker-compose.yml` - Добавлены health checks, логи, nginx cache volume
- `docker-compose.dev.yml` - Добавлены health checks

### Project Structure
- `Makefile` - Создан для упрощения команд
- `src/lib/logger.ts` - Создан централизованный модуль логирования
- `src/app/api/health/route.ts` - Создан health check endpoint

## Переменные окружения

### Логирование
```bash
# .env
LOG_LEVEL=info  # debug|info|warn|error
```

### Docker
```bash
# app_logs volume монтируется в /var/log/app
# nginx_cache volume монтируется в /var/cache/nginx
```

## Мониторинг

### Health Checks
- Docker health checks для всех контейнеров
- API endpoint `/health` для мониторинга приложения
- Nginx status endpoint `/nginx_status` для мониторинга прокси

### Логи
- Volume `app_logs` для персистентного хранения логов
- Nginx логи для мониторинга прокси
- Команды Makefile для быстрого доступа к логам:
  - `make logs-app`
  - `make logs-db`
  - `make logs-redis`
  - `make logs-nginx`

## Результаты оптимизации

### Performance
- ✅ Уменьшен размер Docker образов
- ✅ Ускорена сборка благодаря кэшированию
- ✅ Ускорена работа приложения благодаря nginx кэшированию
- ✅ Добавлен rate limiting для защиты от DDoS

### Developer Experience
- ✅ Упрощены команды через Makefile
- ✅ Улучшено отладка через централизованное логирование
- ✅ Добавлен быстрый доступ к логам и статистике

### Operations
- ✅ Добавлены health checks для автоматического мониторинга
- ✅ Улучшено наблюдаемость через логирование и метрики
- ✅ Улучшен деплой через Makefile команды

## Следующие шаги

1. ~~**Интеграция с системой мониторинга** (Prometheus + Grafana)~~ ✅ ВЫПОЛНЕНО
   - Создан `docker-compose.monitoring.yml` с полной конфигурацией
   - Создан `prometheus.yml` с scrape конфигурацией
   - Созданы правила алертов `prometheus/alert_rules.yml`
   - Созданы правила записи `prometheus/recording_rules.yml`
   - Создан provisioning для Grafana datasource
   - Создан provisioning для Grafana dashboards
   - Добавлены команды в Makefile для управления мониторингом
   - Создан `MONITORING_QUICKSTART.md` для быстрого старта
   - Создан `.env.monitoring.example` для настройки

2. **Добавление APM** (Application Performance Monitoring)
3. **Оптимизация изображений** (Next.js Image Optimization)
4. **Добавление CDN** для статических ресурсов
5. **Реализация автоматизированного бекапа** базы данных
6. **Добавление интеграционных тестов** для CI/CD

## Мониторинг: Детальная информация

### Состав системы мониторинга

```
Prometheus (TSDB) → Сбор метрик со всех экспортеров
     ↓
     ├─ Node Exporter (CPU, Memory, Filesystem)
     ├─ PostgreSQL Exporter (Connections, Queries, Transactions)
     ├─ Redis Exporter (Memory, Commands, Evictions)
     └─ Nginx Exporter (Requests, Response time, Cache)

Grafana (Визуализация) → Отображение метрик и алертов
     ├─ Datasource: Prometheus
     ├─ Dashboards: Node.js, PostgreSQL, Redis, Nginx
     └─ Alerting: Email, Telegram (будет)

Alertmanager (Уведомления) → Отправка алертов
     ├─ Email
     └─ Telegram (будет)
```

### Команды Makefile для мониторинга

```bash
make monitoring-up         # Запустить стек мониторинга
make monitoring-down       # Остановить стек мониторинга
make monitoring-logs       # Посмотреть логи мониторинга
make monitoring-status      # Проверить статус сервисов
make monitoring-grafana    # Сбросить пароль админа Grafana
make monitoring-reload      # Перезагрузить конфигурацию Prometheus
make monitoring-backup      # Сделать бекап данных Prometheus

make all-up              # Запустить все сервисы (приложение + мониторинг)
make all-down            # Остановить все сервисы
make full-up             # Alias для all-up
make full-down           # Alias для all-down
```

### Доступ к сервисам

| Сервис | URL | Логин/Пароль |
|---------|-----|---------------|
| Приложение | http://localhost:3000 | - |
| Grafana | http://localhost:3001 | admin / admin (из .env.monitoring) |
| Prometheus | http://localhost:9090 | - |
| Node Exporter | http://localhost:9100/metrics | - |
| PostgreSQL Exporter | http://localhost:9187/metrics | - |
| Redis Exporter | http://localhost:9121/metrics | - |
| Nginx Exporter | http://localhost:9113/metrics | - |

### Настройка Grafana

```bash
# 1. Скопировать пример конфигурации
cp .env.monitoring.example .env.monitoring

# 2. Настроить пароль админа
nano .env.monitoring
# Измените GRAFANA_ADMIN_PASSWORD

# 3. Запустить мониторинг
make monitoring-up

# 4. Перейти в Grafana: http://localhost:3001
# 5. Войти под admin / ваш_пароль

# 6. Импортировать дашборды (ID указаны ниже):
#    - Node.js: 11159
#    - PostgreSQL: 9628
#    - Redis: 11835
#    - Nginx: 9614
```

### Алерты Prometheus

Критичные алерты:
- ❌ Приложение недоступно (> 1 мин)
- 🚨 Критическое использование памяти (> 95%)
- 🚨 PostgreSQL недоступен (> 1 мин)
- 🚨 Redis недоступен (> 1 мин)
- 🚨 Nginx недоступен (> 1 мин)

Предупреждения:
- ⚠️ Высокий уровень ошибок (> 10/s)
- ⚠️ Высокое использование памяти (> 90%)
- ⚠️ Высокая загрузка PostgreSQL (> 80% соединений)
- ⚠️ Высокая скорость запросов (> 100 queries/s)
- ⚠️ Высокое время отклика Nginx (p95 > 1s)
- ⚠️ Низкий hit rate кэша (< 70%)
- ⚠️ Высокая выселение Redis (> 10 keys/s)
