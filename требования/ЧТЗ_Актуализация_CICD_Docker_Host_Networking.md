# ЧТЗ: Актуализация CI/CD после перехода на Docker host networking

**Дата:** 2026-04-10
**Приоритет:** ВЫСОКИЙ

---

## 1. Контекст

В рамках фикса DNS Docker и Grafana была полностью изменена архитектура прода:

### Было (старое):
- App запускался через **PM2** (npm build + next start -p 3001)
- PostgreSQL, Redis, Nginx — хостовые сервисы
- Docker: только мониторинг (bridge сети, Docker DNS)
- CI/CD: push → SSH → git pull → npm ci → npm build → pm2 reload

### Стало (новое):
- App запускается в **Docker контейнере** (`network_mode: host`, порт 3001)
- PostgreSQL, Redis, Nginx — хостовые сервисы (не в Docker)
- Мониторинг: Docker (`network_mode: host`), все таргеты `127.0.0.1:PORT`
- PM2 **удалён** — заменён на Docker
- `build: network: host` в docker-compose (fix DNS для OpenVZ)

### Фактическая архитектура прода:

| Компонент | Способ запуска | Порт |
|-----------|---------------|------|
| PostgreSQL 14 | systemd (хостовый) | 5432 |
| Redis | systemd (хостовый) | 6379 |
| Nginx + SSL | systemd (хостовый) | 80, 443 |
| Nginx stub_status | systemd (порт 8099) | 8099 |
| App (Next.js) | Docker (host network) | 3001 |
| Prometheus | Docker (host network) | 9090 |
| Grafana | Docker (host network) | 3002 |
| Node Exporter | Docker (host network) | 9100 |
| Postgres Exporter | Docker (host network) | 9187 |
| Redis Exporter | Docker (host network) | 9121 |
| Nginx Exporter | Docker (host network) | 9113 |

### Файлы compose на проде:
- `docker-compose.yml` — только app
- `docker-compose.monitoring.yml` — мониторинг
- Запуск: `docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d`

---

## 2. Что нужно актуализировать

### Файлы CI/CD:

| Файл | Проблема |
|------|----------|
| `.github/workflows/deploy-production.yml` | Деплоит через PM2, порт 3000, ветка master |
| `.github/workflows/ci.yml` | OK (только проверки) |
| `Makefile` | Все команды для bridge Docker + PM2 |
| `scripts/deploy-quick.sh` | Деплой через PM2 |
| `scripts/auto-deploy.sh` | Деплой через PM2 |
| `ecosystem.config.js` | Больше не нужен (PM2 удалён) |
| `scripts/vps-deploy.sh` | Аналогично PM2 |
| `scripts/deploy-master2-*.sh` | Множество устаревших скриптов |

---

## 3. Критерии приёмки

### AC-1: GitHub Actions deploy-production.yml актуален
- Триггер: push to master2
- Деплой через SSH → git pull → docker compose build → docker compose up
- Health check на порт 3001
- Rollback через docker compose + git reset

### AC-2: CI.yml не сломан
- Триггер: push/PR to master2
- quality + test + build verification — без изменений

### AC-3: Makefile актуален
- Все команды работают с новой архитектурой
- docker compose вместо docker-compose
- monitoring использует -f флаги
- Убраны PM2-команды
- Добавлены production-deploy команды

### AC-4: Один canonical deploy-скрипт
- `scripts/deploy-production.sh` — единственный актуальный скрипт
- Работает с Docker, не PM2
- Включает: backup, build, deploy, health check, rollback

### AC-5: Устаревшие скрипты удалены или помечены deprecated
- deploy-quick.sh, auto-deploy.sh, deploy-master2-*.sh — удалены
- ecosystem.config.js — удалён

---

## 4. Декомпозиция

### TASK-CI-001: Обновить deploy-production.yml
- Новая логика деплоя через Docker
- Ветка master2, порт 3001

### TASK-CI-002: Обновить Makefile
- Актуализировать все цели под новую архитектуру

### TASK-CI-003: Создать scripts/deploy-production.sh
- Canonical deploy скрипт

### TASK-CI-004: Удалить устаревшие скрипты
- Удалить PM2-скрипты и ecosystem.config.js
