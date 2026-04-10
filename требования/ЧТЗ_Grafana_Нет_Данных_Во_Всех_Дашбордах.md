# ЧТЗ: Исправление отсутствия данных во всех дашбордах Grafana

## Бизнес-проблема
На проде и на тесте в Grafana во всех дашбордах не отображаются данные. Пользователь видит пустые панели или ошибки "No data".

## Анализ root causes

### RC-1: Нет общей Docker-сети между app и monitoring (КРИТИЧЕСКИЙ)
**Файлы:** `docker-compose.yml`, `docker-compose.monitoring.yml`

Основной стек (`docker-compose.yml`) и мониторинг (`docker-compose.monitoring.yml`) запускаются как **отдельные Docker Compose проекты** с изолированными сетями.

Экспортеры (redis_exporter, postgres_exporter, nginx_exporter) не могут достучаться до сервисов основного стека:
- Redis — нет маппинга портов на хост
- PostgreSQL — маппинг на 5433, а не 5432
- Nginx stub_status блокирует запросы не с 127.0.0.1

### RC-2: Redis недоступен для redis_exporter (КРИТИЧЕСКИЙ)
**Файл:** `docker-compose.monitoring.yml:100`
```
REDIS_ADDR=redis://host.docker.internal:6379
```
Redis в `docker-compose.yml` **не пробрасывает порт** на хост. Подключение невозможно.

### RC-3: PostgreSQL exporter использует неправильный порт (КРИТИЧЕСКИЙ)
**Файл:** `docker-compose.monitoring.yml:85`
```
DATA_SOURCE_URI=postgresql://postgres:${POSTGRES_PASSWORD}@host.docker.internal:5432/fences
```
PostgreSQL в `docker-compose.yml` пробрасывает порт **5433:5432**, а не 5432.

### RC-4: Дашборд user-analytics.json использует захардкоженный UID Prometheus (ВЫСОКИЙ)
**Файл:** `grafana/provisioning/dashboards/imported/user-analytics.json`

Все панели ссылаются на Prometheus по UID `"PBFA97CFB590B2093"`, который не совпадает с автоматически созданным datasource UID в Grafana. Остальные дашборды используют `"datasource": "Prometheus"` (по имени) — это работает.

### RC-5: nginx_exporter не может достичь nginx_status (СРЕДНИЙ)
**Файл:** `docker/nginx.conf:122-127`, `docker-compose.monitoring.yml:111`

Nginx разрешает stub_status только с `127.0.0.1`, а nginx_exporter обращается через `host.docker.internal:80` — IP хоста, не 127.0.0.1 контейнера.

### RC-6: Prometheus не может скрейпить Next.js app metrics (СРЕДНИЙ)
**Файл:** `prometheus.yml:26`
```
targets: ['host.docker.internal:3000']
```
App в `docker-compose.yml` пробрасывает `3000:3000`, это может работать, но ненадёжно.

## План исправления

### TASK-GRAFANA-001: Общая Docker-сеть
Создать внешнюю сеть `fences-net` и подключить оба compose файла к ней. Это решит RC-1, RC-2, RC-3, RC-5, RC-6.

### TASK-GRAFANA-002: Исправить подключения экспортеров
После создания общей сети, обновить host'ы:
- `redis_exporter` → `redis://redis:6379` (по имени контейнера в общей сети) с паролем из секрета
- `postgres_exporter` → `postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/fences` (по имени контейнера)
- `nginx_exporter` → `http://nginx:80/nginx_status` (по имени контейнера) + обновить nginx.conf для разрешения доступа из Docker-сети
- `prometheus.yml` scrape target для app → `app:3000` (по имени контейнера)

### TASK-GRAFANA-003: Исправить дашборд user-analytics.json
Заменить все `"uid": "PBFA97CFB590B2093"` на ссылку по имени `"Prometheus"`.

### TASK-GRAFANA-004: Обновить nginx.conf для мониторинга
Разрешить доступ к `/nginx_status` из Docker-сети (172.16.0.0/12 или конкретной сети).

### TASK-GRAFANA-005: Redis password для redis_exporter
Обеспечить передачу пароля Redis в redis_exporter через общую сеть.

## Критерии приёмки
- [ ] AC-1: Все 4 дашборда Grafana отображают данные (System Overview, Redis, PostgreSQL, User Analytics)
- [ ] AC-2: Prometheus успешно скрейпит все 5 таргетов (node, nextjs, postgres, redis, nginx)
- [ ] AC-3: Конфигурация работает и на проде, и на тесте
- [ ] AC-4: Изменения залиты в master2 и прод

## Файлы для изменения
1. `docker-compose.yml` — добавить external network
2. `docker-compose.monitoring.yml` — добавить external network, исправить хосты экспортеров
3. `prometheus.yml` — исправить scrape targets
4. `docker/nginx.conf` — разрешить stub_status из Docker-сети
5. `grafana/provisioning/dashboards/imported/user-analytics.json` — исправить datasource UID
