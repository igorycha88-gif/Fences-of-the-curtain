# Мониторинг: Быстрый старт

## Что создано

- ✅ **docker-compose.monitoring.yml** - Полная конфигурация мониторинга
- ✅ **prometheus.yml** - Конфигурация Prometheus
- ✅ **prometheus/alert_rules.yml** - Правила алертов
- ✅ **grafana/provisioning/datasources/prometheus.yml** - Datasource
- ✅ **grafana/provisioning/dashboards/dashboard.yml** - Автоимпорт дашбордов

## Как запустить

### Вариант 1: Использовать Makefile (рекомендуется)
```bash
# 1. Настроить мониторинг (первые раз)
cp .env.monitoring.example .env.monitoring
nano .env.monitoring  # Настроить GRAFANA_ADMIN_PASSWORD

# 2. Запустить все сервисы (приложение + мониторинг)
make all-up

# 3. Или только мониторинг (если приложение уже запущено)
make monitoring-up
```

### Вариант 2: Использовать docker-compose напрямую
```bash
# 1. Настроить мониторинг
cp .env.monitoring.example .env.monitoring
nano .env.monitoring

# 2. Запустить все сервисы
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# 3. Проверить статус
docker-compose -f docker-compose.monitoring.yml ps
```

### Доступ к Grafana

```
URL: http://localhost:3001
Логин: admin
Пароль: admin (из .env.monitoring, можно изменить)

Рекомендуемые дашборды (ID для импорта):
- Node.js Application: 11159
- PostgreSQL Database: 9628
- Redis Cache: 11835
- Nginx Ingress: 9614
```

### Команды мониторинга

```bash
make monitoring-up         # Запустить стек мониторинга
make monitoring-down       # Остановить мониторинг
make monitoring-logs       # Логи мониторинга
make monitoring-status      # Статус сервисов
make monitoring-grafana    # Сбросить пароль админа Grafana
make monitoring-reload      # Перезагрузить Prometheus
make monitoring-backup      # Бекап Prometheus данных

make all-up              # Запустить все сервисы
make all-down            # Остановить все сервисы
make full-up             # Alias для all-up
make full-down           # Alias для all-down
```

### Проверка работоспособности

```bash
# Проверить все сервисы
make monitoring-status

# Проверить метрики Node.js
curl http://localhost:9100/metrics | head -20

# Проверить метрики PostgreSQL
curl http://localhost:9187/metrics | head -20

# Проверить метрики Redis
curl http://localhost:9121/metrics | head -20

# Проверить метрики Nginx
curl http://localhost:9113/metrics | head -20

# Проверить Prometheus
curl http://localhost:9090/api/v1/status

# Проверить Grafana
curl http://localhost:3000/api/health
```

## Доступ к сервисам

| Сервис | URL | Логин/Пароль |
|---------|-----|---------------|
| **Приложение** | http://localhost:3000 | - |
| **Grafana** | http://localhost:3001 | admin / admin |
| **Prometheus** | http://localhost:9090 | - |
| **Node Exporter** | http://localhost:9100/metrics | - |
| **PostgreSQL Exporter** | http://localhost:9187/metrics | - |
| **Redis Exporter** | http://localhost:9121/metrics | - |
| **Nginx Exporter** | http://localhost:9113/metrics | - |

## Метрики и алерты

### Application (Next.js)
- ✅ Status сервиса (up/down)
- ⚠️ Высокая ошибка (error rate > 10/s)
- ⚠️ Высокое использование памяти (> 90%)
- 🚨 Критическое использование памяти (> 95%)

### Database (PostgreSQL)
- ✅ Статус подключения
- ⚠️ Высокая загрузка соединений (> 80%)
- ⚠️ Высокая скорость запросов (> 100 queries/s)

### Cache (Redis)
- ✅ Статус сервиса
- ⚠️ Высокое использование памяти (> 90%)
- ⚠️ Высокая скорость выселения (> 10 keys/s)

### Proxy (Nginx)
- ✅ Статус сервиса
- ⚠️ Высокое время отклика (p95 > 1s)
- ⚠️ Низкий hit rate (< 70%)
- ⚠️ Высокая ошибка 5xx (> 10/s)

## Рекомендуемые дашборды

После первого входа в Grafana:

1. **Node.js Application Dashboard** (ID: 11159)
   - Откройте: Dashboards → Import
   - Введите ID: 11159
   - Нажмите Load

2. **PostgreSQL Dashboard** (ID: 9628)
   - Откройте: Dashboards → Import
   - Введите ID: 9628
   - Нажмите Load

3. **Redis Dashboard** (ID: 11835)
   - Откройте: Dashboards → Import
   - Введите ID: 11835
   - Нажмите Load

4. **Nginx Dashboard** (ID: 9614)
   - Откройте: Dashboards → Import
   - Введите ID: 9614
   - Нажмите Load

## Алерты

Prometheus автоматически настроен на отправку алертов в Alertmanager. Для настройки уведомлений:

```yaml
# docker-compose.monitoring.yml
# В секции grafana:
# - GF_INSTALL_PLUGINS=grafana-piechart-panel
# - GF_INSTALL_PLUGINS=grafana-alertlist-panel
```

## Следующие шаги

1. **Настроить Alertmanager** для email/Telegram уведомлений
2. **Добавить APM** (Application Performance Monitoring)
3. **Настроить retention** данных в Prometheus
4. **Добавить логирование приложений** в Loki
5. **Настроить автоматический бекап** на основе алертов
