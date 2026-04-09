# ЧТЗ: Исправление Grafana и SMTP на продакшене

**Дата:** 2026-04-09
**Приоритет:** P0 — Critical
**Автор:** Аналитик (AI Team)

---

## 1. Описание проблемы

На продакшн-сервере (37.143.13.196) не работает:
1. **Grafana** — http://37.143.13.196:3002 недоступен
2. **SMTP-уведомления** — письма не отправляются при создании заявок

## 2. Корневые причины

### 2.1 Grafana
| # | Причина | Файл | Влияние |
|---|---------|------|---------|
| G-1 | Нет проброса порта 3002 для Grafana | `docker-compose.monitoring.yml` | Grafana недоступна извне |
| G-2 | Auth Proxy включён без nginx-прокси | `docker-compose.monitoring.yml` | 401 при прямом доступе |
| G-3 | `depends_on: app, db, redis, nginx` — сервисы не в Docker | `docker-compose.monitoring.yml` | Контейнеры не стартуют |
| G-4 | Prometheus скрейпит Docker-имена вместо host-адресов | `prometheus.yml` | Нет метрик |

### 2.2 SMTP
| # | Причина | Файл | Влияние |
|---|---------|------|---------|
| S-1 | `USE_LOCAL_SMTP="true"` в .env-шаблоне | `.env` | Письма идут в mailhog (несуществующий) |
| S-2 | Хардкод `SMTP_HOST=smtp.yandex.ru` в docker-compose (PM2 не использует docker-compose) | `docker-compose.yml` | Конфигурация бессмысленна для PM2 |
| S-3 | `.env.production` содержит Gmail-credentials, а не Yandex | `.env.production` | Рассинхрон с реальными настройками |

## 3. Решение

### 3.1 Grafana — TASK-MON-001

**Файлы для изменения:**
- `docker-compose.monitoring.yml` — полная переработка

**Изменения:**
1. Добавить `ports: ["3002:3000"]` для Grafana
2. Убрать `GF_AUTH_PROXY_ENABLED` и связанные настройки (прямой доступ)
3. Установить `GF_SERVER_SERVE_FROM_SUB_PATH=false`
4. Убрать `depends_on: app, db, redis, nginx` — использовать `extra_hosts` для доступа к host-сервисам
5. Добавить `extra_hosts: ["host.docker.internal:host-gateway"]` для всех monitoring-сервисов
6. Prometheus: изменить targets на `host.docker.internal:<port>` вместо Docker-имён

### 3.2 Prometheus — TASK-MON-002

**Файлы для изменения:**
- `prometheus.yml`

**Изменения:**
1. `app:3000` → `host.docker.internal:3000` (PM2)
2. `postgres_exporter:9187` → `localhost:9187` (тот же контейнер)
3. `redis_exporter:9121` → `localhost:9121` (тот же контейнер)
4. `node_exporter:9100` → `localhost:9100` (тот же контейнер)
5. `nginx_exporter:9113` → `localhost:9113` (тот же контейнер)
6. Убрать scrape `nginx:80` для `/nginx_status` (nginx на хосте, не в Docker)

### 3.3 SMTP — TASK-SMTP-001

**Файлы для изменения:**
- `.env.production` — актуализация SMTP-настроек
- `docker-compose.yml` — убрать хардкод SMTP, использовать ${SMTP_HOST} из .env
- `scripts/deploy-master2-safe.sh` — добавить проверку SMTP-конфигурации

**Изменения:**
1. `.env.production`: `USE_LOCAL_SMTP=false`, актуальные Yandex-credentials
2. `docker-compose.yml`: `SMTP_HOST=${SMTP_HOST}` вместо хардкода, убрать `extra_hosts` для smtp
3. Деплой-скрипт: валидация SMTP-настроек перед деплоем

### 3.4 Безопасный деплой — TASK-DEPLOY-001

**Новый скрипт:** `scripts/deploy-fix-grafana-smtp.sh`

**Алгоритм безопасного деплоя:**
1. SSH → проверка текущего состояния контейнеров
2. Бэкап текущих конфигураций
3. Обновление файлов на сервере (git pull)
4. Проверка/обновление .env на сервере
5. Перезапуск только мониторинга (без app)
6. Проверка доступности Grafana (port 3002)
7. Проверка SMTP (отправка тестового письма)
8. Rollback при неудаче

## 4. Критерии приёмки

### AC-1: Grafana доступна
- [ ] `http://37.143.13.196:3002` возвращает страницу входа Grafana
- [ ] Логин admin / SecureGrafanaPass2026! работает
- [ ] Dashboard «User Analytics» загружается

### AC-2: SMTP работает
- [ ] При создании заявки отправляется email-уведомление
- [ ] В логах нет ошибок SMTP (Email error)
- [ ] Тестовое письмо доставляется

### AC-3: Безопасность
- [ ] Деплой не затрагивает основное приложение (PM2)
- [ ] Rollback-план подготовлен
- [ ] Секреты не утекают в логи

## 5. Файлы для изменения

| Файл | Действие |
|------|----------|
| `docker-compose.monitoring.yml` | Правка |
| `prometheus.yml` | Правка |
| `docker-compose.yml` | Правка (убрать хардкод SMTP) |
| `.env.production` | Правка (актуализация SMTP) |
| `scripts/deploy-fix-grafana-smtp.sh` | Создание |

## 6. Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Мониторинг влияет на основное приложение | Низкая | Среднее | Отдельный compose, не трогаем PM2 |
| SMTP-credentials устарели | Средняя | Высокое | Проверить credentials, подготовить альтернативу |
| Firewall блокирует порт 3002 | Средняя | Высокое | Проверить iptables/ufw на сервере |
