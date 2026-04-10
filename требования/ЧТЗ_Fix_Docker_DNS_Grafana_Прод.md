# ЧТЗ: Исправление DNS Docker и Grafana на проде

**Дата:** 2026-04-10
**Приоритет:** КРИТИЧЕСКИЙ
**Домен:** zabor-i-naves.ru (37.143.13.196)

---

## 1. Описание проблемы

### Проблема A: DNS Docker при сборке
`docker compose build --no-cache` падает с ошибкой `Temporary failure resolving deb.debian.org`. Сборка образа `fences-app` невозможна. Контейнеры `fences-app` и `fences-nginx` в статусе `Created` (не запущены).

**Корневая причина:**
- Прод-сервер — OpenVZ VPS (ядро 5.2.0)
- Модуль `iptable_nat` недоступен — NAT невозможен
- `/etc/docker/daemon.json`: `"iptables": false` → Docker не управляет iptables
- Docker's embedded DNS (127.0.0.11) не работает без NAT
- Контейнеры при сборке не могут резолвить внешние домены

### Проблема B: Grafana дашборды не отображают данные
Все дашборды Grafana пустые. Prometheus показывает все таргеты DOWN с ошибкой `127.0.0.11:53: connection refused`.

**Каскадные причины:**
1. DNS сломан → build падает → app/nginx не запущены
2. Сетевой раскол: мониторинг на `fences-of-the-curtain_fences-net` (172.21.x.x), основные сервисы на `fences-net` (172.20.x.x)
3. Prometheus не может резолвить даже экспортеры на той же сети

---

## 2. Решение

**Единственное жизнеспособное решение для OpenVZ без NAT:** перевести все сервисы на `network_mode: host`.

Все контейнеры используют сетевой стек хоста:
- DNS → через `/etc/resolv.conf` хоста (systemd-resolved → 46.254.23.138, 8.8.8.8)
- Сборка → через `network: host` в build config
- Связь между сервисами → через `localhost:PORT`

---

## 3. Критерии приёмки

### AC-1: Docker build работает
- `docker compose build --no-cache` завершается без ошибок DNS
- Образ `fences-app` успешно собирается

### AC-2: Все контейнеры запущены и healthy
- `fences-app` — Up, healthy
- `fences-nginx` — Up
- `fences-db` — Up, healthy
- `fences-redis` — Up, healthy
- `fences-prometheus` — Up, healthy
- `fences-grafana` — Up, healthy
- Все экспортеры — Up, healthy

### AC-3: Prometheus все таргеты UP
- `http://localhost:9090/api/v1/targets` — все таргеты `health: "up"`
- node_exporter, nextjs-app, postgres, redis, nginx — все доступны

### AC-4: Grafana дашборды отображают данные
- System Overview: CPU, Memory, Disk, Network
- PostgreSQL metrics: connections, transactions
- Redis metrics: connected clients, memory
- User analytics

### AC-5: Сайт доступен
- `https://zabor-i-naves.ru` → 200 OK
- `http://zabor-i-naves.ru` → редирект на HTTPS
- API health: `/api/health` → 200 OK

---

## 4. Список файлов для изменения

| Файл | Изменение |
|------|-----------|
| `docker-compose.yml` | `network_mode: host`, убрать `ports`, обновить env-переменные на `localhost` |
| `docker-compose.monitoring.yml` | `network_mode: host`, убрать `ports` и `networks`, обновить env |
| `docker/nginx.conf` | upstream → `localhost:3000` |
| `prometheus.yml` | targets → `localhost:PORT` |
| `grafana/provisioning/datasources/prometheus.yml` | url → `http://localhost:9090` |
| `docker/Dockerfile` | Без изменений (build network настраивается в compose) |
| `.env.production` | Обновить DATABASE_URL, REDIS_HOST на localhost |

---

## 5. Декомпозиция задач

### TASK-INFRA-001: Обновить docker-compose.yml на host networking
- Перевести app, db, redis, nginx на `network_mode: host`
- Добавить `network: host` в build config для app
- Обновить все env: `db` → `localhost`, `redis` → `localhost`
- Убрать секции `ports` и `networks`

### TASK-INFRA-002: Обновить docker-compose.monitoring.yml на host networking
- Перевести все сервисы на `network_mode: host`
- Обновить env экспортеров: `db:5432` → `localhost:5432`, `redis:6379` → `localhost:6379`
- Убрать секции `ports` и `networks`

### TASK-INFRA-003: Обновить конфигурационные файлы
- `docker/nginx.conf`: upstream `fences-app:3000` → `127.0.0.1:3000`
- `prometheus.yml`: все таргеты → `localhost:PORT`
- `grafana/provisioning/datasources/prometheus.yml`: url → `http://localhost:9090`

### TASK-INFRA-004: Очистить старые сети и деплой
- Удалить старые bridge сети
- Полная пересборка и запуск

---

## 6. Порт-мэппинг (host networking)

| Сервис | Порт |
|--------|------|
| nginx | 80, 443 |
| app | 3000 |
| grafana | 3002 |
| postgres | 5432 |
| redis | 6379 |
| prometheus | 9090 |
| node_exporter | 9100 |
| nginx_exporter | 9113 |
| redis_exporter | 9121 |
| postgres_exporter | 9187 |

---

## 7. Риски и митигация

| Риск | Митигация |
|------|-----------|
| Порт 5432 занят на хосте | Проверить перед деплоем, использовать 5433 если нужно |
| Потеря данных при пересоздании | Volume'ы не удаляются, данные сохраняются |
| Дowntime при переключении | Запланировать окно, выполнить быстро |
| Меньшая изоляция контейнеров | Для OpenVZ это единственный вариант |

---

## 8. Окружение

- **VPS:** OpenVZ, ядро 5.2.0
- **IP:** 37.143.13.196
- **Docker:** 29.3.0
- **Docker Compose:** v5.1.0
- **NAT:** Недоступен (модуль iptable_nat не загружается)
