# Централизованный мониторинг — подключение zabor-i-naves.ru

Реализация ЧТЗ `требования/ЧТЗ_Централизованный_мониторинг.md`.
Контракт: `GET /metrics/{tracking,content,node,postgres}` + `X-Monitoring-Key` (64 hex), только HTTPS 443, без новых портов.

## Что сделано в коде

| Компонент | Файл |
|---|---|
| Гейджи `business_*` (окна 24ч/1ч, кэш 60с) | `src/lib/tracking-metrics.ts` |
| Эндпоинт `GET /api/metrics/tracking` | `src/app/api/metrics/tracking/route.ts` |
| Закрытие `/api/metrics` ключом (403) | `src/app/api/metrics/route.ts`, `src/lib/monitoring-auth.ts` |
| Запись tracking-структур в Redis | `src/app/api/analytics/events/route.ts` |
| Индекс `Order.createdAt` | `prisma/schema.prisma` |

Ключ читается из env `MONITORING_KEY`. Запросы с loopback (127.0.0.1/::1/без X-Real-IP)
разрешены без ключа — собственный Prometheus сайта скрейпит `127.0.0.1:3001` напрямую.

## Шаги подключения на VPS (37.143.13.196)

### 1. Ключ мониторинга
```bash
KEY=$(openssl rand -hex 32)
# Передать $KEY команде мониторинга защищённым каналом (не в git/чат).
```
В `.env` приложения добавить: `MONITORING_KEY=<ключ>` (файл chmod 600).

### 2. nginx
```bash
cp deploy/monitoring/nginx/monitoring-key.conf.example /etc/nginx/conf.d/monitoring-key.conf
# вписать ключ в map вместо <MONITORING_KEY>; chmod 600 root:root
# включить locations в server-блок zabor-i-naves.ru (443):
#   include /etc/nginx/conf.d/zabor-i-naves-metrics.locations.conf;
cp deploy/monitoring/nginx/site-metrics-locations.conf.example /etc/nginx/conf.d/zabor-i-naves-metrics.locations.conf
nginx -t && systemctl reload nginx
touch /var/log/nginx/metrics_access.log && chown nginx:nginx /var/log/nginx/metrics_access.log
```
Upstream `127.0.0.1:3001` заменить на именованный upstream сайта, если используется.

### 3. node_exporter (kind=node, 127.0.0.1:9100)
Уже запущен контейнером `fences-node-exporter` (`docker-compose.monitoring.yml`,
`--web.listen-address=127.0.0.1:9100`). Отклонение от ЧТЗ (systemd вместо контейнера)
сознательно: функционально эквивалентно, порт наружу не торчит. Проверка:
`curl -s http://127.0.0.1:9100/metrics | head` → метрики `node_*`.

### 4. postgres_exporter (kind=postgres, 127.0.0.1:9187)
```bash
# readonly-пользователь с pg_monitor (НЕ суперпользователь):
psql -U postgres -f deploy/monitoring/postgres/monitoring-user.sql
# в .env: MONITORING_PG_DSN=postgresql://site_monitor:<пароль>@127.0.0.1:5432/fences?sslmode=disable
docker compose -f docker-compose.monitoring.yml up -d postgres_exporter
```

### 5. Тег Яндекс.Метрики 108488683
- В репо: `docker/Dockerfile` — `ARG NEXT_PUBLIC_YANDEX_METRIKA_ID` теперь по умолчанию `108488683`, тег рендерится при сборке образа.
- Проверить секрет GitHub `NEXT_PUBLIC_YANDEX_METRIKA_ID=108488683` (или очистить — сработает дефолт).
- После деплоя: `curl -s https://zabor-i-naves.ru | grep -c mc.yandex` → ≥ 1.

### 6. Применение схемы БД
Индекс `Order.createdAt`: `npx prisma db push` (или штатная миграция) на VPS.

## Приёмка (ЧТЗ §9)
```bash
KEY=<ключ>
curl -H "X-Monitoring-Key: $KEY" https://zabor-i-naves.ru/metrics/tracking  # 200 + business_page_views_24h
curl https://zabor-i-naves.ru/metrics/tracking                              # 403
curl https://zabor-i-naves.ru/api/metrics                                   # 403
curl -H "X-Monitoring-Key: $KEY" https://zabor-i-naves.ru/metrics/node      # node_*
curl -H "X-Monitoring-Key: $KEY" https://zabor-i-naves.ru/metrics/postgres  # pg_*
curl -H "X-Monitoring-Key: $KEY" https://zabor-i-naves.ru/metrics/content   # http_requests_total и т.п.
ss -tlnp | grep -E '9100|9187'                                              # только 127.0.0.1
curl -f https://zabor-i-naves.ru/api/health                                 # ok
```
