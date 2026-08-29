# ЧТЗ: Сайт zabor-i-naves.ru — Полные бизнес-метрики

## Версия: 1.0
## Дата: 2026-08-29
## Автор: AI-аналитик
## Приоритет: High
## Статус: Approved (конвейер, auto)

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Дать руководителю и менеджерам единую страницу «Бизнес-метрики» в админ-панели
с полным срезом по воронке продаж: KPI с трендами, воронка статусов, динамика
заявок, причины отмен, эффективность менеджеров, среднее время по статусам,
распределение по типам услуг, экспорт в Excel.

### 1.2 Метрики успеха
- Время загрузки дашборда: < 1 сек (один агрегированный API-запрос)
- Все блоки ЧТЗ реализованы и покрыты автотестами ≥ 60%

---

## 2. Исходное состояние

- `src/services/admin/statisticsService.ts` — только базовые счётчики (используется дашбордом, НЕ трогаем)
- `GET /api/admin/statistics` — базовый endpoint (НЕ трогаем)
- Страницы `/admin/business-metrics` — нет
- RBAC: право `statistics` уже есть у ADMIN и MANAGER
- `Order.statusHistory` (Json): `[{ status, changedAt, changedBy, changedByName, data }]`
- Labels уже есть: `STATUS_LABELS`, `CANCELLATION_REASON_LABELS` в `src/lib/validators/order.ts`
- Чарт-библиотек в проекте нет → визуализация чистым Tailwind + SVG (без новых зависимостей)

## 3. Маршрутизация

- Маршрут 1 (стандартная задача): Аналитик → Разработчик → Тестировщик → DevOps
- Архитектор НЕ привлекается: нет новых сущностей БД, 2 API endpoint'а, существующие паттерны (services/admin + api/admin + components/admin)

---

## 4. Функциональные требования

### ФТ-1. Сервис бизнес-метрик (новый файл, существующий не менять)
`src/services/admin/businessMetricsService.ts`:
- `getBusinessMetrics(period, filters)` — агрегированный ответ:
  - `kpi`: totalOrders, inProgress, completed, cancelled (шт + %), conversion, avgCheck, revenue — каждое с трендом vs предыдущий период (value, trend, trendDirection)
  - `funnel`: NEW → ESTIMATE_APPROVAL → MEASUREMENT → PRODUCTION → INSTALLATION → COMPLETED (count, % от total, конверсия шага; по достижшим статус за период — по statusHistory и текущему status)
  - `timeline`: по дням — new / completed / cancelled
  - `cancellationReasons`: группировка CANCELLED-заявок по `cancellationReason` (count, %, label)
  - `serviceTypes`: группировка по `serviceType` (count, %, label, revenue)
  - `managers`: по `assignedUser` — total / inProgress / completed / cancelled / conversion / avgCheck / revenue
  - `avgTimeByStatus`: средние сутки в каждом статусе по `statusHistory.changedAt`
- Фильтры: `period` (day/week/month/quarter/year), `dateFrom`/`dateTo` (ISO, опционально), `serviceType` (опционально), `managerId` (опционально)
- Логирование: начало/конец операции, ошибки с контекстом (`src/lib/logger.ts`)

### ФТ-2. API агрегированных метрик
`GET /api/admin/business-metrics?period=month[&dateFrom&dateTo&serviceType&managerId]`
- Авторизация: `requireAdmin(request, 'statistics')`
- Валидация query-параметров (zod-подобная проверка; невалидные → 400)
- Логирование request/response (method, path, userId, status, duration)
- Ошибки → 500 + `logger.error`

### ФТ-3. API экспорта
`GET /api/admin/business-metrics/export?period=...` (те же фильтры)
- Возвращает XLSX (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- Листы: «Сводка KPI», «Воронка», «Динамика», «Причины отмен», «Типы услуг», «Менеджеры», «Время по статусам»
- Паттерн — как в `src/app/api/admin/estimates/[id]/export/route.ts` (XLSX)
- Логирование + audit-запись не требуется (чтение), но logger обязателен

### ФТ-4. Страница «Бизнес-метрики»
`/admin/business-metrics` (`src/app/(admin)/admin/business-metrics/page.tsx`):
- Панель фильтров: период (Сегодня/Неделя/Месяц/Квартал/Год), тип услуги (Все + список), менеджер (Все + список); фильтры в URL
- 7 KPI-карточек: Всего, В работе, Завершено, Отменено, Конверсия, Ср. чек, Выручка — с трендом и цветовой индикацией (↑ зелёный / ↓ красный / «—» серый; для «Отменено» инверсия цвета)
- Воронка статусов — горизонтальные бары с % и конверсией шага
- Динамика заявок — SVG line-chart (3 линии: новые/завершённые/отменённые)
- Причины отмен — donut (conic-gradient) + легенда с count/%
- Типы услуг — таблица/bar (count, %, revenue)
- Менеджеры — таблица с сортировкой по выручке
- Время по статусам — горизонтальные бары (средние сутки)
- Кнопка «Экспорт в Excel» (window.open на export endpoint)
- Состояния: загрузка, ошибка, «нет данных»
- Responsive: 4/2/1 колонки

### ФТ-5. Навигация
- Пункт «Бизнес-метрики» в сайдбар (`src/app/(admin)/admin/layout.tsx`) — после «Расчеты»
- Пункт в `src/components/admin/Layout/MobileSidebar.tsx` — после «Расчеты»

---

## 5. Нефункциональные требования

- Один агрегированный запрос к API (не N запросов на блок)
- Индексы БД уже есть (status, createdAt, cancellationReason)
- Без новых npm-зависимостей
- Логирование во все новые файлы через `src/lib/logger.ts`

---

## 6. Декомпозиция

| ID | Задача | Файлы |
|----|--------|-------|
| TASK-BCK-001 | Сервис businessMetricsService + логирование | `src/services/admin/businessMetricsService.ts` |
| TASK-BCK-002 | API метрик | `src/app/api/admin/business-metrics/route.ts` |
| TASK-BCK-003 | API экспорта XLSX | `src/app/api/admin/business-metrics/export/route.ts` |
| TASK-FRT-001 | Компоненты дашборда | `src/components/admin/BusinessMetrics/*.tsx` |
| TASK-FRT-002 | Страница | `src/app/(admin)/admin/business-metrics/page.tsx` |
| TASK-FRT-003 | Навигация | `layout.tsx`, `MobileSidebar.tsx` |
| TASK-TST-001 | Тесты сервиса | `__tests__/services/admin/businessMetricsService.test.ts` |
| TASK-TST-002 | Тесты API | `__tests__/api/admin/business-metrics.test.ts` |

Порядок: BCK → FRT → TST.

## 7. Критерии приёмки

1. `GET /api/admin/business-metrics` возвращает kpi/funnel/timeline/cancellationReasons/serviceTypes/managers/avgTimeByStatus с трендами
2. Экспорт возвращает валидный XLSX с 7 листами
3. Страница `/admin/business-metrics` отображает все блоки, фильтры работают, состояние «нет данных» не падает
4. Пункты меню «Бизнес-метрики» в desktop и mobile сайдбарах
5. `npm test && npm run lint && npx tsc --noEmit` — зелёные
6. Логирование во всех новых backend-файлах
7. Автотесты: happy path + error cases + edge cases (пустая БД, нет history, нет менеджера) + тесты логирования

## 8. Риски

| Риск | Митигация |
|------|-----------|
| Большие volumeы Order при группировке | select только нужных полей, фильтр по периоду в SQL |
| Пустая statusHistory у старых заявок | fallback: текущий status + createdAt |
| xlsx в devDeps | Уже используется существующим export-роутом — паттерн рабочий |
