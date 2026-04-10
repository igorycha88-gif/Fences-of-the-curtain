# ЧТЗ: Безопасный деплой master2 → прод с откатом

## 1. Контекст

Текущий CI/CD деплоит ветку `master2` напрямую на VPS (37.143.13.196) через GitHub Actions SSH. Обнаружены критические проблемы:
- 2 из 6 Grafana-дашбордов отсутствуют на проде
- Prometheus скрейпит порт 3000 вместо 3001
- Нет отдельного workflow для отката
- Redis exporter unhealthy
- Grafana пароль рассинхронизирован

## 2. Цель

Сделать безопасный деплой из master2 на прод с:
1. Автоматическим созданием всех Grafana-дашбордов
2. Возможностью быстрого отката
3. Полной пересборкой всех сервисов

## 3. Критерии приёмки

### AC-1: Prometheus скрейпит приложение на правильном порту
- `prometheus.yml` → `nextjs-app` job target `127.0.0.1:3001` (не 3000)
- Prometheus targets все `up` после деплоя

### AC-2: Все 6 Grafana-дашбордов создаются при деплое
- System Overview
- Service Health
- PostgreSQL Metrics
- Redis Metrics
- User Analytics - Fences
- Business Metrics - Production
- Dashboard.yml корректно провижинит дашборды из папки `imported/`
- После деплоя `GET /api/search?type=dash-db` возвращает все 6

### AC-3: Безопасный деплой с автороллбэком
- Перед деплоем: бэкап БД, git tag для отката
- Сборка всех Docker-сервисов (app + monitoring)
- Health check приложения (6 попыток)
- При фейле — автоматический откат к предыдущему коммиту
- Логи деплоя сохраняются в `/var/log/fences-deploy/`

### AC-4: Отдельный workflow для ручного отката
- `workflow_dispatch` с вводом git ref (commit/tag/branch)
- Бэкап БД перед откатом
- Пересборка + health check
- Логирование

### AC-5: Redis exporter healthy
- Конфигурация совместима с Redis 7 (на проде)
- Контейнер в статусе healthy

### AC-6: Grafana пароль синхронизирован
- Пароль из `.env` совпадает с реальным паролем в Grafana
- После рестарта Grafana API доступно с паролем из env

## 4. Задачи

### TASK-INF-1: Исправить Prometheus scrape порт
**Файл:** `prometheus.yml`
**Изменение:** `nextjs-app` job: `127.0.0.1:3000` → `127.0.0.1:3001/api/metrics`

### TASK-INF-2: Добавить недостающие дашборды
**Файлы:** 
- `grafana/provisioning/dashboards/imported/service-health.json` — есть в локальном репо
- `grafana/provisioning/dashboards/imported/business-metrics-production.json` — есть в локальном репо
**Проблема:** Файлы существуют в master2, но dashboard.yml не сканирует подпапку `imported/`

### TASK-INF-3: Обновить dashboard.yml
**Файл:** `grafana/provisioning/dashboards/dashboard.yml`
**Изменение:** Provider path → `/etc/grafana/provisioning/dashboards/imported` (подпапка)
**Или:** оставить path как есть, но убрать дублирование и исправить структуру

### TASK-INF-4: Переписать deploy-production.yml
**Файл:** `.github/workflows/deploy-production.yml`
**Изменения:**
- Полная пересборка ВСЕХ сервисов (`docker compose build --no-cache` без указания `app`)
- Проверка Grafana dashboards через API после деплоя
- Проверка Prometheus targets
- Проверка Redis exporter статуса
- Улучшенный роллбэк

### TASK-INF-5: Добавить rollback workflow
**Файл:** `.github/workflows/rollback-production.yml`
- `workflow_dispatch` с input `rollback_ref`
- SSH на VPS, бэкап БД, git reset, rebuild, health check

### TASK-INF-6: Починить Redis exporter
**Файл:** `docker-compose.monitoring.yml`
**Изменение:** Добавить `--skip-tls-flag=latency-histogram` или обновить конфигурацию

## 5. Файлы для изменения

1. `prometheus.yml` — исправить порт
2. `grafana/provisioning/dashboards/dashboard.yml` — исправить провиженинг
3. `.github/workflows/deploy-production.yml` — переписать
4. `.github/workflows/rollback-production.yml` — новый файл
5. `docker-compose.monitoring.yml` — Redis exporter fix

## 6. Риски

- При полной пересборке на 4GB RAM сервере может не хватить памяти → `NODE_OPTIONS=--max-old-space-size=512` уже установлен
- OpenVZ DNS проблемы → `network: host` уже используется
- Длинный downtime при полной пересборке → ~3-5 минут
