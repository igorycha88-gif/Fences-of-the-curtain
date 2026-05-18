# ЧТЗ: SEO-мониторинг позиций сайта в поисковой выдаче

**Дата:** 2026-05-18
**Статус:** Утверждён
**Маршрут:** Маршрут 2 (Сложная задача — Архитектор → Аналитик → Разработчик → Тестировщик → DevOps)
**Исполнитель:** Разработчик (fullstack)

---

## 1. Описание задачи

Реализовать модуль ежедневного мониторинга позиций сайта `zabor-i-naves.ru` в поисковой выдаче Яндекс и Google по ключевым запросам, определённым в SEO-конфигурации проекта (`src/lib/seo/constants.ts`).

Модуль должен быть интегрирован в админ-панель и предоставлять:
- Управление списком ключевых слов (CRUD + импорт из конфига)
- Ежедневный автоматический сбор позиций через ValueSERP API
- Отображение текущих позиций и динамики изменений
- Визуализацию истории позиций (графики за 7/30/90 дней)

## 2. Внешние сервисы

| Сервис | Назначение | Бесплатный лимит | Env-переменная |
|--------|------------|-------------------|----------------|
| **ValueSERP** | Парсинг позиций в Google и Яндекс | 2000 запросов/мес | `VALUESERP_API_KEY` |

**API ValueSERP:**
- Endpoint: `https://api.valueserp.com/search`
- Параметры: `q` (запрос), `location` (Москва), `google_domain` (google.ru / yandex.ru), `num` (10), `hl` (ru)
- Ответ: `organic_results[]` → `position`, `title`, `link`
- Поиск позиции: найти `zabor-i-naves.ru` в `organic_results`, если нет → позиция = 0 (не в TOP-10)

## 3. Модель данных (Prisma)

### 3.1. Новые модели

```prisma
model SeoKeyword {
  id          String        @id @default(cuid())
  keyword     String
  searchEngine String      @default("google")
  pagePath    String?
  group       String?
  active      Boolean       @default(true)
  sortOrder   Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  positions   SeoPosition[]

  @@unique([keyword, searchEngine])
  @@index([active])
  @@index([searchEngine])
  @@index([group])
  @@index([keyword])
  @@map("seo_keywords")
}

model SeoPosition {
  id         String     @id @default(cuid())
  keywordId  String
  position   Int
  url        String?
  title      String?
  snippet    String?
  found      Boolean    @default(true)
  checkedAt  DateTime   @default(now())
  createdAt  DateTime   @default(now())
  keyword    SeoKeyword @relation(fields: [keywordId], references: [id], onDelete: Cascade)

  @@index([keywordId])
  @@index([checkedAt])
  @@index([keywordId, checkedAt])
  @@index([found])
  @@map("seo_positions")
}
```

### 3.2. Данные для начального заполнения (seed)

Импортировать все ключевые слова из `src/lib/seo/constants.ts` → `PAGE_METADATA.*.keywords` и `SEO_CONFIG.DEFAULT_KEYWORDS`.

Группировка по страницам:
- `home` → keywords from PAGE_METADATA.home.keywords
- `services` → keywords from PAGE_METADATA.services.keywords
- `calculator` → keywords from PAGE_METADATA.calculator.keywords
- и т.д.

Дубликаты (одинаковое слово для Google и Яндекс) → создать 2 записи: одну с `searchEngine: "google"`, одну с `searchEngine: "yandex"`.

## 4. API endpoints

### 4.1. Admin API (требуют авторизацию `requireAdmin`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/admin/seo-monitoring/keywords` | Список ключевых слов (с пагинацией, фильтрами: group, searchEngine, active, search) |
| POST | `/api/admin/seo-monitoring/keywords` | Добавить ключевое слово |
| PUT | `/api/admin/seo-monitoring/keywords/[id]` | Обновить слово (active, group, sortOrder) |
| DELETE | `/api/admin/seo-monitoring/keywords/[id]` | Удалить слово |
| POST | `/api/admin/seo-monitoring/keywords/seed` | Импорт из seo/constants.ts (idempotent — не дублировать) |
| GET | `/api/admin/seo-monitoring/positions` | Позиции с фильтрами (keywordId, dateFrom, dateTo, searchEngine, group). Агрегация: текущая позиция, изменение за день/неделю, лучший результат |
| GET | `/api/admin/seo-monitoring/summary` | Сводка: сколько слов в TOP-3, TOP-5, TOP-10, не найдено. Средняя позиция. |

### 4.2. Cron API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/cron/seo-positions` | Сбор позиций для всех активных ключевых слов. Auth: `CRON_SECRET` |

## 5. Сервисный слой

### 5.1. `src/services/admin/seoMonitoringService.ts`

```
class SeoMonitoringService:
  - getKeywords(params) → { items, total, page, pageSize, totalPages }
  - createKeyword(data) → SeoKeyword
  - updateKeyword(id, data) → SeoKeyword
  - deleteKeyword(id) → void
  - seedFromConfig() → { created, skipped } — импорт из constants.ts
  - getPositions(params) → SeoPosition[] с агрегацией
  - getSummary() → { top3, top5, top10, notFound, avgPosition, totalKeywords }
```

### 5.2. `src/services/seo/positionCollector.ts`

```
class PositionCollector:
  - collectAll() → { checked, errors } — собрать позиции для всех активных ключевых слов
  - collectForKeyword(keyword, searchEngine) → { position, url, title, snippet, found }
  - callValueSerpApi(params) → ValueSerpResponse — вызов ValueSERP API
  - findSitePosition(results, domain) → number — найти позицию сайта в результатах
```

**Логика сбора:**
1. Получить все активные SeoKeyword из БД
2. Для каждого слова — вызвать ValueSERP API с параметрами:
   - `q: keyword.keyword`
   - `location: "Moscow,Russia"`
   - `gl: "ru"`
   - `hl: "ru"`
   - `google_domain: keyword.searchEngine === "yandex" ? "yandex.ru" : "google.ru"`
   - `num: 10`
   - `api_key: VALUESERP_API_KEY`
3. Найти `zabor-i-naves.ru` в `organic_results`
4. Сохранить результат в `SeoPosition`
5. Rate limit: задержка 2 сек между запросами (чтобы не превысить лимит)

## 6. Frontend — страница SEO-мониторинга

### 6.1. Расположение
`src/app/(admin)/admin/seo-monitoring/page.tsx`

### 6.2. Навигация
Добавить ссылку «SEO-мониторинг» в sidebar (после «Отзывы») и в MobileSidebar (аналогично).

### 6.3. Структура страницы

**Секция 1: Сводка (summary cards)**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ В TOP-3     │ В TOP-5     │ В TOP-10    │ Не найдено  │
│ 12          │ 25          │ 40          │ 15          │
│ ↑ +2        │ → 0         │ ↓ -3        │ ↑ +1        │
└─────────────┴─────────────┴─────────────┴─────────────┘
```
Изменение относительно предыдущего дня.

**Секция 2: Фильтры**
- Переключатель поисковика: Google / Яндекс / Все
- Фильтр по группе (странице)
- Период: 7 / 30 / 90 дней

**Секция 3: Таблица ключевых слов с позициями**
| Ключевое слово | Поисковик | Группа | Позиция | Изменение | Дата проверки |
|----------------|-----------|--------|---------|-----------|---------------|
| забор из профнастила | Google | home | 5 | ↑ +2 (было 7) | 18.05.2026 |

Изменение: ↑ зелёный, ↓ красный, → серый. Позиция 0 = «Не найдено» (красный).

**Секция 4: Управление ключевыми словами**
- Кнопка «Импорт из SEO-конфига» — вызов `/api/admin/seo-monitoring/keywords/seed`
- Кнопка «Добавить слово» — форма с полями: keyword, searchEngine, group
- Кнопка удаления слова
- Переключатель active/inactive

**Секция 5: Кнопка ручного сбора**
- «Собрать позиции сейчас» — вызов cron endpoint (для тестирования)

## 7. Cron-job

### Расписание
Ежедневно в 03:00 MSK — вызов `POST /api/cron/seo-positions`

### Внешний триггер
Настроить внешний cron (GitHub Actions / Vercel Cron / серверный crontab):
```
0 0 * * * curl -X POST https://zabor-i-naves.ru/api/cron/seo-positions -H "Authorization: Bearer $CRON_SECRET"
```

### Интеграция в существующий scheduler
Добавить проверку в `src/services/cron.ts` → аналогично `sendDailySummary`, добавить `checkAndCollectSeoPositions()` с проверкой времени 03:00 MSK.

## 8. Переменные окружения (.env)

```
VALUESERP_API_KEY=          # API ключ ValueSERP (пользователь должен получить)
```

## 9. Файлы для создания/изменения

### Новые файлы:
| Файл | Назначение |
|------|------------|
| `src/services/admin/seoMonitoringService.ts` | Сервис CRUD ключевых слов + агрегация |
| `src/services/seo/positionCollector.ts` | Сервис сбора позиций через ValueSERP |
| `src/app/api/admin/seo-monitoring/keywords/route.ts` | GET + POST ключевых слов |
| `src/app/api/admin/seo-monitoring/keywords/[id]/route.ts` | PUT + DELETE ключевого слова |
| `src/app/api/admin/seo-monitoring/keywords/seed/route.ts` | POST импорт из конфига |
| `src/app/api/admin/seo-monitoring/positions/route.ts` | GET позиций с фильтрами |
| `src/app/api/admin/seo-monitoring/summary/route.ts` | GET сводки |
| `src/app/api/cron/seo-positions/route.ts` | POST cron-job сбора позиций |
| `src/app/(admin)/admin/seo-monitoring/page.tsx` | Страница мониторинга |
| `__tests__/services/seo/positionCollector.test.ts` | Тесты сборщика позиций |
| `__tests__/services/admin/seoMonitoringService.test.ts` | Тесты сервиса |
| `__tests__/api/admin/seo-monitoring.test.ts` | Тесты API endpoints |

### Изменяемые файлы:
| Файл | Изменение |
|------|-----------|
| `prisma/schema.prisma` | Добавить модели SeoKeyword, SeoPosition |
| `src/app/(admin)/admin/layout.tsx` | Добавить ссылку «SEO-мониторинг» в sidebar |
| `src/components/admin/Layout/MobileSidebar.tsx` | Добавить ссылку «SEO-мониторинг» |
| `src/services/cron.ts` | Добавить `checkAndCollectSeoPositions()` в scheduler |

## 10. Критерии приёмки

1. ✅ В админ-панели доступен раздел «SEO-мониторинг» по адресу `/admin/seo-monitoring`
2. ✅ Можно добавить/удалить/отключить ключевое слово
3. ✅ Кнопка «Импорт из SEO-конфига» импортирует все ключевые слова из `constants.ts` (idempotent)
4. ✅ Cron endpoint `/api/cron/seo-positions` собирает позиции через ValueSERP API
5. ✅ Таблица показывает текущие позиции с динамикой изменений (↑ ↓ →)
6. ✅ Сводные карточки показывают количество слов в TOP-3 / TOP-5 / TOP-10 / не найдено
7. ✅ Фильтры по поисковику (Google/Яндекс), группе, периоду работают корректно
8. ✅ Все проверки проходят: `npm test && npm run lint && npx tsc --noEmit`
9. ✅ Sidebar (desktop + mobile) содержит ссылку «SEO-мониторинг»

## 11. Декомпозиция задач

| ID | Задача | Тип |
|----|--------|-----|
| TASK-SEO-001 | Добавить модели SeoKeyword, SeoPosition в Prisma schema | BCK |
| TASK-SEO-002 | Создать seoMonitoringService (CRUD + агрегация) | BCK |
| TASK-SEO-003 | Создать positionCollector (ValueSERP API) | BCK |
| TASK-SEO-004 | Создать API endpoints (keywords CRUD + positions + summary) | BCK |
| TASK-SEO-005 | Создать cron endpoint для сбора позиций | BCK |
| TASK-SEO-006 | Обновить cron.ts — добавить SEO-сбор в scheduler | BCK |
| TASK-SEO-007 | Создать страницу SEO-мониторинга в админ-панели | FRT |
| TASK-SEO-008 | Добавить ссылки в sidebar и MobileSidebar | FRT |
| TASK-SEO-009 | Написать unit-тесты | TST |
| TASK-SEO-010 | Запустить prisma db push + проверить работу | INF |
