# ЧТЗ: Grafana за Reverse Proxy (https://zabor-i-naves.ru/grafana)

## Версия: 1.0
## Дата: 2026-08-12
## Автор: AI-аналитик
## Приоритет: High
## Статус: Approved

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Перенести Grafana с прямого публичного доступа `http://37.143.13.196:3002` на путь `https://zabor-i-naves.ru/grafana` через основной nginx (порт 443, TLS). Закрыть прямой доступ к monitoring-портам (3002, 9090, 9100, 9113, 9121, 9187) привязкой сервисов к `127.0.0.1` на уровне приложения (БЕЗ системного фаервола, см. FR-004') для устранения утечки метрик и снижения поверхности атаки.

### 1.2 Пользовательская ценность
- **Безопасность**: Grafana доступна только через защищённый HTTPS с двойной авторизацией (nginx basic auth + Grafana login). Закрыты экспортированные метрики хоста/БД/Redis/nginx.
- **Единая точка входа**: весь трафик мониторинга идёт через основной домен `zabor-i-naves.ru` по TLS 1.2/1.3.
- **Соответствие best practices**: nginx reverse proxy перед Grafana — стандартная паттерн (Grafana docs, раздел "Configure Grafana behind a reverse proxy").
- **Снижение рисков**: устраняется прямой brute-force порт 3002, пропадает информация о версии Grafana в открытом доступе.

### 1.3 Метрики успеха
- `https://zabor-i-naves.ru/grafana` отдаёт login page Grafana (HTTP 200) с заголовком `Content-Type: text/html`.
- `https://zabor-i-naves.ru/grafana/api/health` → `{"database":"ok","version":"12.4.2"}` (HTTP 200).
- Прямой запрос `http://37.143.13.196:3002/` извне → connection refused (Grafana слушает 127.0.0.1).
- `curl -I https://zabor-i-naves.ru/grafana/` без Authorization → HTTP 401 (требуется basic auth).
- При корректном basic auth → проксирование на Grafana login (HTTP 200).
- Все экспортёры (9100/9113/9121/9187) и Prometheus (9090) недоступны извне (слушают 127.0.0.1).
- Сайт `https://zabor-i-naves.ru/` продолжает работать без регрессий (HTTP 200).
- **НИКАКОГО ufw/iptables** — безопасность через listen-address в compose.
- Все unit-тесты проекта проходят; `npm run lint && npx tsc --noEmit` зелёные.

---

## 2. Анализ текущего состояния (AS-IS)

### 2.1 Фактическое сканирование портов (выполнено 2026-08-12)

| Порт | Сервис | Открыт извне | Назначение |
|------|--------|--------------|------------|
| 22 | SSH (OpenSSH 8.9p1) | ✅ | Администрирование VPS |
| 80 | nginx | ✅ | Редирект HTTP→HTTPS |
| 443 | nginx (TLS) | ✅ | Основной сайт |
| **3001** | Next.js (Blue) | ✅ | Приложение напрямую, в обход nginx upstream |
| **3002** | Grafana | ✅ | **Лишний публичный доступ** |
| **3003** | Green (Blue-Green) | ❌ | Сейчас неактивен |
| 5432 | PostgreSQL | ❌ | localhost-only ✅ |
| 6379 | Redis | ❌ | localhost-only ✅ |
| **8099** | nginx stub_status | ✅ | **Открыт в интернет** |
| **9090** | Prometheus | ✅ | **Открыт в интернет** |
| **9100** | node_exporter | ✅ | **Открыт в интернет** |
| **9113** | nginx_exporter | ✅ | **Открыт в интернет** |
| **9121** | redis_exporter | ✅ | **Открыт в интернет** |
| **9187** | postgres_exporter | ✅ | **Открыт в интернет** |

### 2.2 Выявленные проблемы

| Проблема | Файл/Место | Критичность |
|----------|-----------|-------------|
| Grafana напрямую доступна извне на порту 3002 без nginx basic auth | VPS firewall | High |
| `GF_SERVER_ROOT_URL=http://37.143.13.196:3002` (HTTP, IP, не домен) | `docker-compose.monitoring.yml:37` | High |
| `GF_SERVER_SERVE_FROM_SUB_PATH=false` (не настроен sub-path) | `docker-compose.monitoring.yml:38` | High |
| Метрики `node_exporter` (9100) отдаются без auth — утечка инфо о хосте | VPS firewall | Medium |
| Метрики `postgres_exporter`/`redis_exporter` отдаются без auth | VPS firewall | Medium |
| Prometheus UI (9090) открыт для запросов/эксплорера | VPS firewall | Medium |
| Готовый блок `/grafana/` с basic auth есть в `nginx.optimized.conf:208-236`, но не активирован | `docker/nginx.optimized.conf` | Info |

### 2.3 Ключевое архитектурное наблюдение

**Nginx на проде установлен на хосте** (systemctl), НЕ в Docker-контейнере.
- Скрипт `scripts/deploy-vps.sh:65-103` управляет upstream'ом через файл `/etc/nginx/conf.d/fences-upstream.conf`.
- Команды: `nginx -s reload`, `systemctl reload nginx`.
- SSL-сертификаты: `/etc/nginx/ssl/` (см. `scripts/setup-ssl.sh`).
- Файлы `docker/nginx*.conf` в репо — это **эталонные шаблоны/документация**, применяемые через скрипты.

---

## 3. Целевое состояние (TO-BE)

```
┌──────────────────────────────────────────────────────────────────────┐
│                  ПОЛЬЗОВАТЕЛЬ (браузер, HTTPS)                        │
│   https://zabor-i-naves.ru/grafana                                    │
└───────────────────────────────────┬──────────────────────────────────┘
                                     │ TLS 1.2/1.3 (порт 443)
                                     ▼
                ┌────────────────────────────────────┐
                │ nginx на хосте (systemctl)         │
                │ server { listen 443 ssl http2; }   │
                │   location /grafana/ {             │
                │     auth_basic (.htpasswd, admin)  │ ← слой 1: nginx basic auth
                │     proxy_pass http://127.0.0.1:3002│
                │   }                                │
                └─────────────────┬──────────────────┘
                                  │ 127.0.0.1:3002 (локально)
                                  ▼
                ┌────────────────────────────────────┐
                │ Grafana container                  │
                │ GF_SERVER_ROOT_URL=https://.../grafana
                │ GF_SERVER_SERVE_FROM_SUB_PATH=true │ ← слой 2: Grafana login
                │ GF_SERVER_HTTP_ADDR=0.0.0.0        │
                │ (порт 3002 заблокирован фаерволом) │
                └────────────────────────────────────┘

  Внешний доступ извне (БЕЗ фаервола — через listen-address):
    ✅ 22    (SSH — администрирование, не трогаем)
    ✅ 80    (HTTP — редирект + Let's Encrypt ACME)
    ✅ 443   (HTTPS — основной сайт + /grafana/)
    ✅ 3001  (Next.js Blue) — НЕ трогаем в этой задаче
    ✅ 3003  (Green Blue-Green) — НЕ трогаем в этой задаче

  ЗАКРЫТЬ привязкой к 127.0.0.1 (БЕЗ ufw/iptables):
    ❌ 3002  (Grafana)        — GF_SERVER_HTTP_ADDR=127.0.0.1 → доступ только через nginx /grafana/
    ❌ 9090  (Prometheus)     — --web.listen-address=127.0.0.1:9090 → доступ через SSH-туннель
    ❌ 9100  (node_exporter)  — --web.listen-address=127.0.0.1:9100
    ❌ 9113  (nginx_exporter) — --web.listen-address=127.0.0.1:9113
    ❌ 9121  (redis_exporter) — --web.listen-address=127.0.0.1:9121
    ❌ 9187  (postgres_exporter) — --web.listen-address=127.0.0.1:9187
    ⚠️ 8099  (nginx stub_status) — уже защищён `allow 127.0.0.1; deny all` в /etc/nginx/conf.d/stub_status.conf
```

**Принцип (отказ от ufw):** после негативного опыта на проекте по химчистке (ufw положил сервер),
команда решила не использовать системный фаервол. Все ограничения доступа реализуются на уровне
приложения (listen-address / GF_SERVER_HTTP_ADDR), что идемпотентно, откатываемо и не рискует
разорвать SSH-сессию.

**Почему не трогаем 3001/3003 в этой задаче:**
- Все healthcheck-проверки идут через `127.0.0.1` (loopback), не через внешний IP.
- `docker-compose.yml:44`, `deploy-vps.sh:51`, `deploy-production.yml:174` — все localhost.
- Закрытие 3001/3003 вынесено в отдельную задачу (требует решения про `apply-picket-migration.sh`).

```


**Подтверждение что 3001/3003 можно закрыть** (все обращения — локальные):
- `docker-compose.yml:44`: `healthcheck: curl http://127.0.0.1:3001/api/health` ✅ localhost
- `scripts/deploy-vps.sh:51`: `curl http://127.0.0.1:${port}/api/health` (Blue-Green) ✅ localhost
- `deploy-production.yml:174`: `test_ep GET http://127.0.0.1:3001/api/health` ✅ localhost (на VPS)
- `scripts/diagnose.sh:89`, `scripts/recover.sh:60`, `scripts/rollback.sh:50`: все `http://localhost:3001/` ✅

**Единственное исключение:** `scripts/apply-picket-migration.sh:179` стучит на `http://${VPS_HOST}:3001/` извне. После закрытия 3001 — запускать через SSH-туннель: `ssh -L 3001:127.0.0.1:3001 root@37.143.13.196` (либо правка скрипта). См. риск R-006.

---

## 4. Функциональные требования

### FR-001: Настроить Grafana на работу за reverse proxy по sub-path `/grafana`
- В `docker-compose.monitoring.yml` для сервиса `grafana`:
  - `GF_SERVER_ROOT_URL=https://zabor-i-naves.ru/grafana` (вместо `http://37.143.13.196:3002`)
  - `GF_SERVER_SERVE_FROM_SUB_PATH=true` (вместо `false`)
  - `GF_SERVER_HTTP_PORT=3002` оставить без изменений (Grafana продолжает слушать на 3002 локально).

### FR-002: Зафиксировать эталонный nginx-конфиг `/grafana/` в репо
- В `docker/nginx.conf` (строки после `location /api/` блоков) добавить в **оба** `server` блока (HTTP 80 и HTTPS 443) `location /grafana/` со следующими параметрами:
  - `auth_basic "Grafana - Admin Only";`
  - `auth_basic_user_file /etc/nginx/.htpasswd;`
  - `proxy_pass http://127.0.0.1:3002/grafana/;` (важно: с сохранением пути)
  - `proxy_set_header Host $host;`
  - `proxy_set_header X-Real-IP $remote_addr;`
  - `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
  - `proxy_set_header X-Forwarded-Proto $scheme;`
  - `proxy_set_header X-Forwarded-Host $host;`
  - `proxy_set_header X-Forwarded-Port $server_port;`
  - `proxy_http_version 1.1;`
  - `proxy_set_header Upgrade $http_upgrade;` (WebSocket для Grafana Live)
  - `proxy_set_header Connection "upgrade";`
  - `proxy_cache off;`
  - `proxy_read_timeout 60s;`
  - `client_max_body_size 20M;` (загрузка CSV/JSON дашбордов)
- В `docker/nginx.optimized.conf` блок `/grafana/` уже существует (строки 208-236, 412-441) — проверить актуальность, при необходимости синхронизировать upstream `grafana` → `server 127.0.0.1:3002;` (сейчас указан `fences-grafana:3000`, что неверно для host-network схемы прода).

### FR-003: Скрипт `scripts/setup-grafana-proxy.sh` для применения настроек на VPS
Скрипт должен идемпотентно:
1. Копировать файл `docker/.htpasswd` в `/etc/nginx/.htpasswd` (если отличается).
2. Генерировать файл `/etc/nginx/conf.d/grafana.conf` с `location /grafana/` для HTTPS-сервера (использовать `include`-файл, не патчить основной site-конфиг).
3. Проверять валидность конфигурации: `nginx -t`. Если failed — откат и exit 1.
4. Рестартовать Grafana с новыми env: `docker compose -f docker-compose.monitoring.yml up -d --force-recreate grafana`.
5. Дождаться healthcheck Grafana: цикл `curl -sf http://127.0.0.1:3002/api/health` (таймаут 60 сек).
6. Применить reload nginx: `nginx -s reload`.
7. Smoke-тесты (см. раздел 6).
8. Логировать каждый шаг через `log()` (аналогично `deploy-vps.sh`).

### FR-004: Закрыть лишние порты привязкой сервисов к 127.0.0.1 (БЕЗ фаервола)
> **Стратегия изменена 2026-08-12**: вместо ufw/iptables (рискованно для прода) используем привязку
> monitoring-сервисов к loopback-интерфейсу на уровне приложения. Это безопаснее: не трогает
> системный firewall, действует на уровне listen-address, идемпотентно, откат = вернуть `0.0.0.0`.

В `docker-compose.monitoring.yml` изменить для каждого сервиса адрес привязки:
- **Grafana**: добавить env `GF_SERVER_HTTP_ADDR=127.0.0.1` (по умолчанию слушает `0.0.0.0:3002`).
- **Prometheus**: `--web.listen-address=127.0.0.1:9090` (вместо `0.0.0.0:9090`).
- **node_exporter**: `--web.listen-address=127.0.0.1:9100`.
- **postgres_exporter**: `--web.listen-address=127.0.0.1:9187`.
- **redis_exporter**: `--web.listen-address=127.0.0.1:9121`.
- **nginx_exporter**: `--web.listen-address=127.0.0.1:9113`.

**Почему это работает без фаервола:**
- Все сервисы в `network_mode: host` — они разделяют сеть с VPS.
- Привязка к `127.0.0.1` = демон принимает соединения только с loopback-интерфейса.
- Внешний интерфейс (37.143.13.196) физически не может установить соединение.
- Prometheus скрапит через `127.0.0.1:PORT` (см. `prometheus.yml`) — продолжает работать.
- Grafana доступна через nginx (тоже на хосте) → `proxy_pass http://127.0.0.1:3002/grafana/`.

**Что НЕ меняется:**
- `nginx stub_status` (порт 8099) — уже защищён `allow 127.0.0.1; deny all` в `/etc/nginx/conf.d/stub_status.conf`.
- Порт 3001 (Next.js Blue) и 3003 (Green) — оставляем как есть (вне scope этой задачи).
- SSH (22), HTTP (80), HTTPS (443) — не трогаются, открыты как были.

**Доступ к Prometheus UI после изменений:**
- Прямой URL `http://37.143.13.196:9090` перестанет работать (привязан к 127.0.0.1).
- Доступ через SSH-туннель: `ssh -L 9090:127.0.0.1:9090 root@37.143.13.196`, затем `http://localhost:9090`.
- При необходимости позже — добавить `location /prometheus/` в nginx (аналогично `/grafana/`).

### FR-005: Логирование (ПРАВИЛО 8)
- В скрипте `setup-grafana-proxy.sh` использовать структурированный `log()` с timestamp и уровнем (аналог `deploy-vps.sh:35`).
- Логи писать в `/var/log/grafana-proxy/setup-$(date +%Y%m%d-%H%M%S).log`.
- Каждый `nginx -t`, `docker compose`, `curl` проверяет exit code и логирует результат.
- В случае ошибки на любом шаге — выводить диагностику и откатывать изменения.

### FR-006: Автотесты (ПРАВИЛО 8)
Поскольку изменения инфраструктурные (nginx + docker-compose + bash-скрипт), автотесты:
- Валидация YAML `docker-compose.monitoring.yml`: скрипт `scripts/test-monitoring-config.sh` через `docker compose -f docker-compose.monitoring.yml config --quiet` (или python yaml.safe_load).
- Валидация nginx-синтаксиса: для обоих конфигов (`nginx.conf`, `nginx.optimized.conf`) использовать `nginx -t -c <file>` в Docker-контейнере `nginx:stable-alpine` локально (CI/DevOps шаг). Это можна делать через `scripts/validate-nginx.sh`.
- Unit-тесты bash-скрипта через [bats-core](если уже используется в проекте) ИЛИ минимальный shellcheck линтинг через `shellcheck scripts/setup-grafana-proxy.sh` (в CI). Покрытие ≥ 60% строк скрипта проверками.
- При отсутствии bats-core в проекте — добавить минимум 3 тестовых прогона в `scripts/test-grafana-proxy.sh`: проверка наличия env-переменных в compose, проверка `location /grafana/` в nginx.conf, проверка наличия `.htpasswd` файла.

---

## 5. Нефункциональные требования

### NFR-001: Безопасность
- Никаких секретов (паролей basic auth, токенов) в коммитах. Файл `docker/.htpasswd` уже содержит только bcrypt/apr1 хэш — это допустимо (не plaintext). Пароль передаётся пользователю вне репо.
- `.htpasswd` должен иметь права `0644` (читается nginx worker).
- Grafana admin password остаётся в `${GRAFANA_ADMIN_PASSWORD}` env (не хардкод).

### NFR-002: Совместимость
- Не нарушать работу основного сайта `https://zabor-i-naves.ru/`.
- Не нарушать Blue-Green деплой (`deploy-vps.sh` продолжает работать — upstream `app` не трогается, добавляется только новый location/include-файл).
- Не нарушать dev-окружение (`docker-compose.dev.yml` не затрагивается).

### NFR-003: Идемпотентность
- Повторный запуск `setup-grafana-proxy.sh` не должен ломать работающую инсталляцию.
- Скрипт корректно обрабатывает ситуацию "уже настроено" (no-op с логированием).

### NFR-004: Откатываемость
- Скрипт создаёт бэкап `/etc/nginx/conf.d/grafana.conf.bak` перед изменением.
- В случае ошибки — автоматически восстанавливает `.bak`.
- Флаг `--rollback` в скрипте удаляет `/etc/nginx/conf.d/grafana.conf`, восстанавливает env Grafana, перезапускает сервисы.
- Откат: вернуть `0.0.0.0` в `docker-compose.monitoring.yml` + `docker compose -f docker-compose.monitoring.yml up -d --force-recreate`.

---

## 6. Критерии приёмки

### AC-001: Grafana доступна по новому URL
```
GIVEN nginx настроен с location /grafana/
AND Grafana запущена с SERVE_FROM_SUB_PATH=true
WHEN пользователь открывает https://zabor-i-naves.ru/grafana/
THEN возвращается HTTP 200
AND Content-Type: text/html
AND в HTML присутствует Grafana login form
AND все assets (CSS/JS) загружаются с путём /grafana/public/... (HTTP 200)
```

### AC-002: Требуется basic auth
```
GIVEN nginx basic auth активирован
WHEN curl -I https://zabor-i-naves.ru/grafana/ без заголовка Authorization
THEN возвращается HTTP 401
AND заголовок WWW-Authenticate: Basic realm="Grafana - Admin Only"
```

### AC-003: Прямой доступ к порту 3002 (Grafana) закрыт
```
GIVEN GF_SERVER_HTTP_ADDR=127.0.0.1
WHEN nc -z -w 3 37.143.13.196 3002 извне
THEN соединение закрыто/таймаут (демон не слушает внешний интерфейс)
AND curl http://37.143.13.196:3002/ извне → connection refused
AND curl http://127.0.0.1:3002/api/health на VPS → 200 (локально работает)
```

### AC-004: Метрики экспортёров недоступны извне (привязка к 127.0.0.1)
```
GIVEN все exporters имеют --web.listen-address=127.0.0.1:PORT
WHEN nc -z -w 3 37.143.13.196 9100 извне
THEN соединение закрыто
AND аналогично для 9113, 9121, 9187
AND на самом VPS curl http://127.0.0.1:9100/metrics → 200 (Prometheus скрапит)
```

### AC-004b: Prometheus (9090) недоступен извне
```
GIVEN --web.listen-address=127.0.0.1:9090
WHEN nc -z -w 3 37.143.13.196 9090 извне
THEN соединение закрыто
AND доступ через ssh -L 9090:127.0.0.1:9090 root@37.143.13.196 → работает

### AC-005: Сайт и Blue-Green не нарушены
```
GIVEN изменения применены
WHEN curl -I https://zabor-i-naves.ru/ (главная)
THEN HTTP 200/301 (как раньше)
AND curl https://zabor-i-naves.ru/api/health → {"status":"ok"}
AND deploy-vps.sh продолжает работать (healthcheck на 127.0.0.1:3001/3003 — фаервол не мешает)
```

### AC-006: Health check Grafana через sub-path
```
WHEN curl -u admin:<basic_auth_pass> https://zabor-i-naves.ru/grafana/api/health
THEN {"database":"ok","version":"12.4.2"}
```

### AC-007: Telegram-бот продолжает работать
```
GIVEN monitoring-сервисы привязаны к 127.0.0.1 (через listen-address/GF_SERVER_HTTP_ADDR)
WHEN Telegram API отправляет POST на https://zabor-i-naves.ru/api/telegram/webhook?secret=...
THEN nginx проксирует запрос на app (через 443) → HTTP 200
AND бот отвечает пользователю (исходящий fetch на api.telegram.org — default allow outgoing)
AND setup-telegram-webhook.sh можно повторно запустить (регистрирует webhook через исходящий HTTPS)
AND никакой входящий порт кроме 443 боту не требуется
```

**Архитектурное обоснование** (почему бот не зависит от закрываемых портов):
- Входящий трафик: Telegram → `https://zabor-i-naves.ru/api/telegram/webhook` (порт 443, открыт).
- Обработчик: `src/app/api/telegram/webhook/route.ts:13`.
- Исходящий трафик: app → `https://api.telegram.org/bot.../sendMessage` (`src/services/telegram/bot.ts:15`, через `src/lib/telegram-proxy.ts`). Не ограничивается (привязка listen-address влияет только на входящие).
- Xray-клиент (`scripts/setup-xray-proxy.sh`) — исходящий прокси, входящих портов не требует.

### AC-008: Автотесты проходят
```
GIVEN реализованы автотесты по FR-006
WHEN npm test && npm run lint && npx tsc --noEmit
THEN все команды зелёные
AND scripts/validate-nginx.sh → exit 0
AND shellcheck scripts/setup-grafana-proxy.sh → без ошибок
```

---

## 7. Декомпозиция задач

| ID | Описание | Этап | Исполнитель |
|----|----------|------|-------------|
| **TASK-GRP-BCK-001** | Обновить `docker-compose.monitoring.yml`: env Grafana (ROOT_URL, SERVE_FROM_SUB_PATH) | Разработка | Разработчик |
| **TASK-GRP-BCK-002** | Актуализировать `docker/nginx.conf`: добавить `location /grafana/` в оба server-блока (HTTP+HTTPS) | Разработка | Разработчик |
| **TASK-GRP-BCK-003** | Актуализировать `docker/nginx.optimized.conf`: исправить upstream `grafana` на `127.0.0.1:3002` (host-network), проверить `/grafana/` блок | Разработка | Разработчик |
| **TASK-GRP-INF-001** | Создать `scripts/setup-grafana-proxy.sh` (применение на VPS: htpasswd, nginx conf, recreate monitoring с listen-address=127.0.0.1) | Разработка | Разработчик |
| **TASK-GRP-INF-002** | Создать `scripts/validate-nginx.sh` для CI (проверка синтаксиса nginx-конфигов через `nginx:stable-alpine`) | Разработка | Разработчик |
| **TASK-GRP-INF-003** | Проверить и задокументировать `scripts/apply-picket-migration.sh` — добавить в header комментарий про SSH-туннель при закрытом 3001 | Разработка | Разработчик |
| **TASK-GRP-TEST-001** | Написать автотесты: проверка compose YAML, проверка наличия `/grafana/` в nginx.conf, наличие `.htpasswd` | Разработка | Разработчик |
| **TASK-GRP-TEST-002** | Добавить `shellcheck scripts/setup-grafana-proxy.sh` в CI (если ещё нет) | Разработка | Разработчик |
| **TASK-GRP-QA-001** | Глубокая проверка кода по ПРАВИЛУ 4 + ручной smoke на VPS | Тестирование | Тестировщик |
| **TASK-GRP-DEPLOY-001** | Применить скрипт `setup-grafana-proxy.sh` на VPS через SSH. ПОЛНАЯ пересборка monitoring-стека. | Деплой | DevOps |

---

## 8. Маршрут конвейера

```
📋 АНАЛИТИК (готово — это ЧТЗ)
   │
   ▼
💻 РАЗРАБОТЧИК
   ├─ TASK-GRP-BCK-001/002/003 (конфиги в репо)
   ├─ TASK-GRP-INF-001/002 (скрипты)
   ├─ TASK-GRP-TEST-001/002 (автотесты)
   ├─ npm test && npm run lint && npx tsc --noEmit ✅
   └─ авто-переход → Тестировщик
      │
      ▼
🧪 ТЕСТИРОВЩИК
   ├─ TASK-GRP-QA-001: ревью каждого изменённого файла
   ├─ validate-nginx.sh → exit 0
   ├─ при багах → цикл баг-фикса
   └─ GO → авто-переход → DevOps
      │
      ▼
🚀 DEVOPS
   ├─ TASK-GRP-DEPLOY-001
   ├─ SSH на VPS (37.143.13.196)
   ├─ git pull origin master2 в /root/Fences-of-the-curtain
   ├─ ПОЛНАЯ пересборка monitoring-стека:
   │     docker compose -f docker-compose.monitoring.yml up -d --force-recreate
   ├─ bash scripts/setup-grafana-proxy.sh
   ├─ Smoke-тесты: /grafana/ (401/200), порт 3002 закрыт, сайт OK
   └─ итоговый отчёт
```

---

## 9. Файлы для изменения

| Файл | Тип изменения | Ответственный TASK |
|------|--------------|---------------------|
| `docker-compose.monitoring.yml` | Изменить env сервиса `grafana` (строки 37-44) | TASK-GRP-BCK-001 |
| `docker/nginx.conf` | Добавить `location /grafana/` в server 80 и server 443 | TASK-GRP-BCK-002 |
| `docker/nginx.optimized.conf` | Исправить upstream `grafana` → `127.0.0.1:3002`, синхронизировать блок | TASK-GRP-BCK-003 |
| `scripts/setup-grafana-proxy.sh` | **НОВЫЙ** — применение настроек на VPS | TASK-GRP-INF-001 |
| `scripts/validate-nginx.sh` | **НОВЫЙ** — CI-проверка синтаксиса | TASK-GRP-INF-002 |
| `scripts/test-grafana-proxy.sh` | **НОВЫЙ** — автотесты | TASK-GRP-TEST-001 |
| `.github/workflows/ci.yml` | Добавить шаг `shellcheck` + `validate-nginx.sh` (если применимо) | TASK-GRP-TEST-002 |

Файлы **НЕ** изменяются:
- `docker-compose.yml` (основной прод — app/db/redis)
- `docker-compose.dev.yml` (dev-окружение)
- `scripts/deploy-vps.sh` (Blue-Green, не трогаем)
- `prisma/schema.prisma` (БД не меняется)
- Любые файлы в `src/` (код приложения не меняется)

---

## 10. Риски и меры снижения

| Риск | Вероятность | Влияние | Меры снижения |
|------|-------------|---------|---------------|
| Ошибка в nginx-конфиге → падение всего сайта | Medium | Critical | `nginx -t` перед reload; бэкап conf.d/grafana.conf.bak; автооткат |
| После recreate monitoring Prometheus теряет метрики | Low | Medium | Healthcheck Prometheus в скрипте; scrape через 127.0.0.1 не меняется |
| Grafana не отдаёт assets по sub-path (404 на /public/) | Medium | High | Проверка `GF_SERVER_SERVE_FROM_SUB_PATH=true` + `ROOT_URL` оканчивается на `/grafana` (без trailing slash); smoke-тест AC-001 |
| Привязка к 127.0.0.1 ломает Prometheus scrape | Low | High | `prometheus.yml` уже использует `127.0.0.1:PORT` для всех targets — не зависит от внешнего интерфейса |
| Grafana admin пароль `admin123` (если env не задан) | Medium | Medium | На проде `GRAFANA_ADMIN_PASSWORD` задаётся через `.env`; в репо только дефолт |
| `.htpasswd` пароль забыт | Medium | Medium | Записать в менеджер паролей; документировать в README |
| ufw/iptables НЕ используется (по решению команды) | — | — | Альтернатива — listen-address (см. FR-004'). Отрицательный опыт на другом проекте — ufw положил сервер, поэтому фаервол исключён из стратегии. |
| Blue-Green деплой ломается (3001/3003 привязаны к 0.0.0.0) | — | — | Не трогаются в этой задаче. Если позже потребуется закрыть — отдельная задача. |
| `scripts/apply-picket-migration.sh` ломается (использует `${VPS_HOST}:3001` извне) | Medium | Low | Это разовая миграция. Запуск через SSH-туннель: `ssh -L 3001:127.0.0.1:3001 root@37.143.13.196`, затем локально `./apply-picket-migration.sh` (где `VPS_HOST=127.0.0.1`). Прим.: порт 3001 в этой задаче НЕ закрывается, поэтому скрипт пока работает как есть. |
| `.htpasswd` пароль забыт | Medium | Medium | Записать в менеджер паролей; документировать в README |

---

## 11. Open Questions (закрыты пользователем 2026-08-12)

| Вопрос | Решение пользователя |
|--------|---------------------|
| Способ авторизации на /grafana/ | **nginx basic auth + Grafana login** (двойная защита). Использовать существующий `docker/.htpasswd` (пользователь `admin`). |
| Прямой доступ к monitoring-портам | **Привязать к 127.0.0.1** через listen-address / GF_SERVER_HTTP_ADDR (БЕЗ ufw/iptables — риск для прода). |
| Применение на проде | **Скрипт `scripts/setup-grafana-proxy.sh` + ЧТЗ** (ручной запуск на VPS через DevOps этап). |

---

## 12. Примечания

- Версия Grafana на проде: **12.4.2** (подтверждено через `/api/health`).
- Версия приложения на проде: **1.15.0** (подтверждено через `/api/health`).
- Файл `docker/.htpasswd` уже содержит валидный apr1-хэш пользователя `admin` (создан ранее, в репо).
- `.htpasswd.example` — пример bcrypt-хэша (`$2y$05$...`), для документации.
- Порядок применения: **сначала** изменения в репо + тесты → **затем** deploy на VPS.
