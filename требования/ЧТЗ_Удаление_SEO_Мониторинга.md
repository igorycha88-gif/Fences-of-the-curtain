# ЧТЗ: Полное удаление SEO-мониторинга из приложения

## Версия: 1.0
## Дата: 2026-09-07
## Автор: AI-Аналитик (по запросу заказчика)
## Приоритет: High
## Статус: Согласовано (запрос заказчика «полностью уберем» — исчерпывающ)

---

## Маршрутизация

**Архитектор:** ТРЕБУЕТСЯ (изменение схемы БД, >5 файлов, удаление API-контекста) → ADR-001 (`docs/adr/ADR-001-udalenie-seo-monitoringa.md`)
**Исполнитель:** Разработчик (+ DevOps на финальной пересборке)
**Обоснование:** Код/схема/фронтенд — разработка; деплой с дропом таблиц — DevOps (Правило 6: полная пересборка).

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Полностью вывести из эксплуатации подсистему мониторинга поисковых позиций (SERP-парсер, tor-прокси, админка, крон, Telegram-отчёты).

### 1.2 Пользовательская ценность
Упрощение приложения: минус ~2500 строк кода, 2 тяжёлые зависимости (cloakbrowser, playwright-core), контейнер tor, 2 таблицы БД.

### 1.3 Метрики успеха
- Все проверки качества зелёные; в коде не осталось упоминаний seo-monitoring.
- Контентный SEO сайта не затронут (метаданные, sitemap, JSON-LD работают).

## 2. Функциональные требования

### US-1: Удаление подсистемы
- **Given** приложение содержит подсистему SEO-мониторинга
- **When** изменения применены
- **Then** отсутствуют: страница `/admin/seo-monitoring` (404), все её API endpoints (404), крон `/api/cron/seo-positions` (404), пункт меню в админке, таблицы `seo_keywords`/`seo_positions`, сервис tor, env `SEO_TOR_*`/`SEO_PARSER_*`, зависимости cloakbrowser/playwright-core

### US-2: Сохранность остального функционала
- **Given** удаление выполнено
- **When** запускаются тесты/сборка
- **Then** `npm test && npm run lint && npx tsc --noEmit` зелёные; контентный SEO (`src/lib/seo/`, `src/components/seo/`, поля seoTitle/seoDescription/seoKeywords) не изменён; Prometheus/Grafana-мониторинг работает

## 4. Техническая архитектура

Полный перечень — в ADR-001. Кратко:

### 4.1 Изменения в БД
Удалить модели `SeoKeyword`, `SeoPosition` из `prisma/schema.prisma` (строки 1042–1079) → `npx prisma generate` → `npx prisma db push` (в DevOps, после бэкапа `pg_dump`).

### 4.2 API
Удалить: `src/app/api/admin/seo-monitoring/` (7 routes), `src/app/api/cron/seo-positions/` (1 route).

### 4.3 Структура файлов
Удалить: `src/services/seo/`, `src/services/admin/seoMonitoringService.ts`, `src/app/(admin)/admin/seo-monitoring/`, тесты `__tests__/services/seo/`, `__tests__/services/admin/seoMonitoringService.test.ts`.

### 4.4 Частичные правки
- `src/app/(admin)/admin/layout.tsx:201-212` — пункт меню
- `src/components/admin/Layout/MobileSidebar.tsx:188-200` — пункт меню
- `next.config.js:140` — убрать `'cloakbrowser', 'playwright-core'`
- `package.json` — убрать deps cloakbrowser, playwright-core → `npm ci --legacy-peer-deps`
- `docker-compose.dev.yml` — env `SEO_TOR_*` (20–23), `depends_on: tor` (34–35), сервис `tor` (82–93)
- `.env.example:99-114` — блок «SEO POSITION PARSER»
- `.env:44-56` — мёртвый блок «SEO Monitoring» (ValueSERP/Yandex/Google credentials)
- `ARCHITECTURE.md` — убрать раздел про SEO-мониторинг (если есть)

### НЕ ТРОГАТЬ (ложные цели)
`src/lib/seo/`, `src/components/seo/`, sitemap/robots, Метрика/GA, `sendTelegramMessage`, `getMoscowDateTime`, `CRON_SECRET`, Prometheus/Grafana (`docker-compose.monitoring*.yml`), исторические ЧТЗ в `требования/`.

## 6. Декомпозиция на задачи

### Frontend
- **TASK-FRT-001**: Удалить пункт «SEO-мониторинг» из меню админки (`layout.tsx`, `MobileSidebar.tsx`)
- **TASK-FRT-002**: Удалить страницу `src/app/(admin)/admin/seo-monitoring/`

### Backend
- **TASK-BCK-001**: Удалить API routes `api/admin/seo-monitoring/**` и `api/cron/seo-positions`
- **TASK-BCK-002**: Удалить сервисы `src/services/seo/`, `src/services/admin/seoMonitoringService.ts` + их тесты
- **TASK-BCK-003**: Удалить модели `SeoKeyword`/`SeoPosition` из schema.prisma, `npx prisma generate`

### Infrastructure
- **TASK-INF-001**: `next.config.js` (serverComponentsExternalPackages) + `package.json` (deps) → `npm ci --legacy-peer-deps`
- **TASK-INF-002**: `docker-compose.dev.yml` — удалить tor-сервис, env SEO_TOR_*, depends_on
- **TASK-INF-003**: `.env` / `.env.example` — удалить мёртвые SEO-переменные

### Testing
- **TASK-TST-001**: Quality gate `npm test && npm run lint && npx tsc --noEmit` + grep-контроль остатков

### Documentation
- **TASK-DOC-001**: Обновить ARCHITECTURE.md / README.md, если упоминают SEO-мониторинг

## 7. Тестирование

- Регрессия: весь существующий Jest-сюит проходит (минус удалённые SEO-тесты).
- Новые автотесты не требуются: функционал удаляется, нового кода нет (Правило 8 применимо к新增 функционалу).
- Ручная проверка: `/admin/seo-monitoring` → 404; меню без пункта; `/api/health` → 200.

## 8. Риски и зависимости

См. ADR-001. Ключевой внешний шаг: **убрать запись crontab на VPS 37.143.13.196**, вызывающую `POST /api/cron/seo-positions` (иначе 404 в логах). Также рекомендована ротация удалённого Google service account ключа.

## 9. Согласование

- [x] Заказчик (прямая команда «полностью уберем seo мониторинг»)
- [x] Архитектор (ADR-001)
