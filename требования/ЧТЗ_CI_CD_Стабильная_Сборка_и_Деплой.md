# ЧТЗ: Стабильный CI/CD для локальной и продовой сборки

> Дата: 2026-04-10  
> Приоритет: КРИТИЧЕСКИЙ  
> Статус: Утверждено

---

## 1. Постановка задачи

Постоянные проблемы со сборкой локальной (Docker) и продакшн (PM2) версий приложения. Необходимо провести полный аудит, устранить корневые причины и создать единый надёжный CI/CD pipeline с безопасным деплоем.

---

## 2. Обнаруженные проблемы (АУДИТ)

### 🔴 КРИТИЧЕСКИЕ (блокируют работу)

| # | Проблема | Влияние | Файл |
|---|----------|---------|------|
| P1 | **`output: 'standalone'` + `next start`** — PM2 запускает `npx next start -p 3001`, но Next.js 14.2.35 пишет: `"next start" does not work with "output: standalone" configuration` → процесс падает, PM2 перезапускает → 445 рестартов | Прод нестабилен, приложение постоянно падает и поднимается | `ecosystem.config.js:6`, `next.config.js:36` |
| P2 | **Порт 3001 vs 3000** — ecosystem.config.js args=`-p 3001`, но env_production PORT=3000. Nginx проксирует на 3001. Два процесса слушают оба порта | Конфликт портов, EADDRINUSE | `ecosystem.config.js:7,21` |
| P3 | **Прод на `master2`, CI/CD триггерится на `master`** — на сервере активная ветка `master2`, а все workflow слушают `master`. Деплой не срабатывает | Деплой сломан | `.github/workflows/deploy-production.yml:5` |
| P4 | **17+ workflow файлов** — дублирование, противоречия, разные порты (3000/3001), разные методы деплоя (SSH key vs password) | Хаос, невозможно понять что реально работает | `.github/workflows/*` |
| P5 | **Docker-compose networks** — `docker-compose.yml` использует `fences-net` (external), `docker-compose.dev.yml` использует `fences-network` (bridge). На проде нет сети `fences-net` → nginx/app контейнеры Created, не стартуют | Docker-деплой на проде сломан | `docker-compose.yml:127` |

### 🟡 СРЕДНИЕ (создают риски)

| # | Проблема | Влияние |
|---|----------|---------|
| P6 | **`npm install` вместо `npm ci`** — на проде нет lock-фиксации, версии «плавают» между деплоями | Неконсистентные билды |
| P7 | **Отсутствие `prisma.config.ts` в Dockerfile** (dev) — не копируется, может ломать генерацию | Сборка падает |
| P8 | **node_modules cache через tar.gz** — неэффективно, занимает место, может быть неконсистентным | Медленный деплой |
| P9 | **Нет lock-файла `package-lock.json` в git** — `package-lock.json*` (со звёздочкой) в COPY Dockerfile | Неконсистентные installs |
| P10 | **Бэкапы БД в корне проекта** — 10+ SQL дампов лежат в /root/Fences-of-the-curtain/, не в .gitignore | Мусор на проде |
| P11 | **Миграции через `prisma db push --accept-data-loss`** в deploy-manual.yml — ПОТЕРЯ ДАННЫХ | Потеря данных на проде |

### 🟢 НИЗКИЕ (технический долг)

| # | Проблема |
|---|----------|
| P12 | Нет health check endpoint `/api/health` (только проверка корня) |
| P13 | Docker образ не использует `output: standalone` правильно (копирует все node_modules вместо standalone) |
| P14 | Нет Sentry/мониторинга ошибок приложения |

---

## 3. Решение: Единый CI/CD Pipeline

### 3.1 Архитектура нового CI/CD

```
┌─────────────────────────────────────────────────────────────────────┐
│                     GITHUB REPOSITORY                                │
│                   (branch: master)                                   │
└────────────────────────┬────────────────────────────────────────────┘
                         │ push / PR
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   CI Pipeline (ci.yml)                               │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Install │→ │ Lint+TSC │→ │  Tests   │→ │ Security Audit       │ │
│  └─────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │
└────────────────────────┬────────────────────────────────────────────┘
                         │ success + merge to master
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│              CD Pipeline (deploy-production.yml)                     │
│  ┌──────────────────────┐  ┌─────────────────────────────────────┐ │
│  │ 1. Build Verification│  │ 2. Deploy to VPS (SSH)              │ │
│  │    npm ci + build    │→ │  a) DB Backup                       │ │
│  │                      │  │  b) git pull                        │ │
│  │                      │  │  c) npm ci                          │ │
│  │                      │  │  d) prisma generate + migrate deploy │ │
│  │                      │  │  e) npm run build                   │ │
│  │                      │  │  f) PM2 reload (zero-downtime)      │ │
│  │                      │  │  g) Health check (5 retries)        │ │
│  │                      │  │  h) Rollback on failure             │ │
│  └──────────────────────┘  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Исправления по проблемам

| Проблема | Решение | Детали |
|----------|---------|--------|
| P1 | **Убрать `output: 'standalone'`** или использовать standalone правильно | Вариант A: убрать standalone → `next start` работает. Вариант B: оставить standalone, запускать через `node .next/standalone/server.js`. Выбран **Вариант A** — проще, стабильнее для PM2 |
| P2 | **Единый порт 3000** | ecosystem.config.js: `-p 3000`, nginx: proxy_pass `localhost:3000` |
| P3 | **CI/CD на `master` + production branch** | Прод переключается на `master`, CI/CD триггерится на push to `master` |
| P4 | **Удалить 14 лишних workflow** | Оставить только `ci.yml` и `deploy-production.yml` |
| P5 | **Единая сеть Docker** | Создать `fences-net` external на проде ИЛИ убрать external, использовать default |
| P6 | **`npm ci`** везде | Заменить `npm install` на `npm ci` в CI/CD |
| P8 | **GitHub Actions cache** вместо tar | Использовать `actions/cache` для node_modules |
| P11 | **Только `prisma migrate deploy`** | Убрать `--accept-data-loss` |

### 3.3 Безопасный деплой (Safe Deployment)

**Стратегия: Blue-Green через PM2 + Health Check + Auto-Rollback**

```
1. Pre-flight (GitHub Actions runner):
   ├── npm ci
   ├── npx tsc --noEmit  
   ├── npm run lint
   ├── npm test
   └── npm run build (проверка сборки)

2. Deploy (VPS via SSH):
   ├── a) DB Backup: pg_dump → backup_YYYYMMDD_HHMMSS.sql
   ├── b) Git tag: prod-pre-deploy-YYYYMMDDHHMMSS
   ├── c) git fetch + git reset --hard origin/master
   ├── d) npm ci --production=false
   ├── e) npx prisma generate
   ├── f) npx prisma migrate deploy (SAFE, no data loss)
   ├── g) npm run build
   ├── h) PM2 reload (zero-downtime graceful restart)
   ├── i) Wait 15s
   ├── j) Health check: curl /api/health (5 attempts × 5s)
   │   ├── SUCCESS → cleanup backup tag, done
   │   └── FAIL → AUTO ROLLBACK:
   │       ├── git reset --hard PREVIOUS_COMMIT
   │       ├── npm ci + prisma generate + build
   │       ├── PM2 reload
   │       └── Health check after rollback
   └── k) Cleanup: old backups > 7 days, old logs > 30 days
```

---

## 4. Критерии приёмки

### AC-1: Единый CI pipeline
- [ ] Один файл `ci.yml` — lint, typecheck, tests, security audit
- [ ] Запускается на PR и push to master
- [ ] Время < 5 минут

### AC-2: Единый CD pipeline  
- [ ] Один файл `deploy-production.yml` — build verification + deploy
- [ ] Запускается только на push to master (после CI)
- [ ] Поддержка manual dispatch

### AC-3: Нет лишних workflow
- [ ] Удалены все workflow кроме `ci.yml` и `deploy-production.yml`
- [ ] Нет `.backup` файлов в `.github/workflows/`

### AC-4: Прод на master
- [ ] Продакшн сервер переключён на ветку `master`
- [ ] CI/CD триггерится корректно

### AC-5: Стабильный PM2 (0 рестартов)
- [ ] PM2 работает через `next start` БЕЗ standalone конфликта
- [ ] Единый порт 3000
- [ ] Nginx проксирует на 3000
- [ ] 0 рестартов после деплоя (проверка через 30 мин)

### AC-6: Безопасный деплой
- [ ] Автоматический бэкап БД перед каждым деплоем
- [ ] Автоматический rollback при неудачном health check
- [ ] Уведомление о результате (в логе)

### AC-7: Docker (локальная разработка)
- [ ] `docker-compose.dev.yml` поднимается без ошибок
- [ ] Единая сеть, нет external зависимостей
- [ ] Health checks проходят

### AC-8: Health check endpoint
- [ ] `/api/health` возвращает `{ status: "ok", timestamp, db, redis }`
- [ ] Используется в CI/CD health check

---

## 5. Файлы для изменения

### Создать:
- `src/app/api/health/route.ts` — health check endpoint
- `.github/workflows/ci.yml` (переписать)
- `.github/workflows/deploy-production.yml` (переписать)

### Изменить:
- `ecosystem.config.js` — порт 3000, убрать standalone
- `next.config.js` — убрать `output: 'standalone'`
- `docker-compose.yml` — убрать external network, исправить healthcheck
- `docker-compose.dev.yml` — унифицировать сеть
- `docker/Dockerfile` — оптимизировать, убрать standalone зависимость
- `nginx config (прод)` — порт 3001 → 3000

### Удалить:
- `.github/workflows/build-docker.yml`
- `.github/workflows/bump-version.yml`
- `.github/workflows/check-login-file.yml`
- `.github/workflows/check-pm2-config.yml`
- `.github/workflows/check-response.yml`
- `.github/workflows/ci-enhanced.yml`
- `.github/workflows/clean-rebuild.yml`
- `.github/workflows/clear-cache.yml`
- `.github/workflows/deploy-manual.yml`
- `.github/workflows/deploy-production-optimized.yml`
- `.github/workflows/deploy-production.yml.backup`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/direct-check.yml`
- `.github/workflows/force-restart.yml`
- `.github/workflows/port-check.yml`

---

## 6. Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Потеря данных при переключении ветки | Низкая | Критическое | Полный pg_dump перед любыми действиями |
| Nginx перестанет работать после смены порта | Низкая | Высокое | Тест на проде: curl localhost:3000 до переключения nginx |
| PM2 потеряет конфигурацию | Средняя | Среднее | pm2 save + dump.pm2 бэкап |
| Docker сборка упадёт | Средняя | Низкое | Локальное тестирование перед push |

---

## 7. Декомпозиция задач

| ID | Задача | Приоритет |
|----|--------|-----------|
| TASK-CICD-001 | Создать health check endpoint `/api/health` | BCK |
| TASK-CICD-002 | Исправить `next.config.js` — убрать standalone | BCK |
| TASK-CICD-003 | Исправить `ecosystem.config.js` — порт 3000 | INF |
| TASK-CICD-004 | Переписать `ci.yml` — единый CI pipeline | INF |
| TASK-CICD-005 | Переписать `deploy-production.yml` — безопасный деплой | INF |
| TASK-CICD-006 | Исправить Docker конфигурации (compose + Dockerfile) | INF |
| TASK-CICD-007 | Удалить 14 лишних workflow файлов | INF |
| TASK-CICD-008 | Переключить прод на master + обновить nginx | INF |
