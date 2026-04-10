# ЧТЗ: Оптимизация потребления памяти приложения (~4GB → ~1.5GB)

**Дата:** 2026-04-10  
**Приоритет:** CRITICAL  
**Автор:** Аналитик (AI)

---

## 1. Описание проблемы

Production-окружение (Docker: app + PostgreSQL + Redis + Nginx) суммарно потребляет ~4GB оперативной памяти. Ожидаемое потребление для данного стека: 1.0–1.5GB.

**Оценка распределения памяти по контейнерам:**

| Контейнер | Текущее | Ожидаемое | Причина перерасхода |
|-----------|---------|-----------|---------------------|
| app (Node.js) | ~1.5-2.5GB | ~300-500MB | Нет лимита heap, утечки подключений, тяжёлые импорты, неограниченный in-memory кэш |
| redis | ~0.5-1GB | ~30-50MB | Неограниченный рост ключей analytics (600K+ ключей/мес) |
| db (PostgreSQL) | ~0.5-1GB | ~200-300MB | Дефолтные настройки shared_buffers |
| nginx | ~20-50MB | ~20-30MB | OK |
| **ИТОГО** | **~2.5-4.5GB** | **~0.6-0.9GB** | |

---

## 2. Выявленные причины (по приоритету)

### CRITICAL (исправить обязательно)

**BUG-001: Health route создаёт новые подключения к БД и Redis**  
Файл: `src/app/api/health/route.ts:8,29`  
- `new PrismaClient()` на уровне модуля — отдельный от синглтона пул подключений  
- `new Redis(redisUrl)` внутри `checkRedis()` — новое TCP-соединение на каждый healthcheck (каждые 30с)  
- При ошибке `ping()` — `client.disconnect()` не вызывается → утечка TCP-соединения  

**BUG-002: Analytics events — неограниченный рост ключей Redis + сломанный код**  
Файл: `src/app/api/analytics/events/route.ts:23,69,83,97`  
- Каждый ивент создаёт уникальный ключ `analytics:events:{timestamp}:{sessionId}` с TTL 30 дней  
- При 1000 посетителей × 20 ивентов = 600,000 ключей/мес → Redis растёт до 1GB+  
- `EVENT_NAMES` и `funnelSteps` — не определены → ReferenceError при обработке лидов/воронки  
- `redis.hset` вызывается с JSON как имя поля — некорректное использование API  

**BUG-003: Metrics route — синтаксическая ошибка**  
Файл: `src/app/api/metrics/route.ts:28`  
- Лишняя `}` — маршрут не компилируется  

**BUG-004: redis.keys() блокирует Redis**  
Файлы: `src/lib/prometheus.ts:128`, `src/lib/cache.ts:94`  
- `KEYS` — O(N) команда, сканирует ВСЕ ключи в Redis  
- Вызывается при каждом сборе метрик и при инвалидации кэша  

### HIGH (существенная экономия памяти)

**BUG-005: Неограниченный рост in-memory кэша**  
Файл: `src/lib/cache.ts:9`  
- `Map<string, MemoryCacheEntry>` — нет maxSize, нет периодической очистки  
- Просроченные записи обнаруживаются только при чтении, но не удаляются из Map  

**BUG-006: Статические импорты тяжёлых библиотек**  
Файлы: 6 файлов (jspdf, docx, sharp, xlsx)  
- Все загружаются в память при старте, даже если запрос не использует их  
- Совместно: ~15-40MB на каждый cold start  

**BUG-007: Docker production копирует полный node_modules (657MB)**  
Файл: `docker/Dockerfile:53`  
- Полный `node_modules` в runner-стадии вместо standalone Next.js build  
- Должен использоваться `output: 'standalone'` в next.config.js  

**BUG-008: Нет лимита Node.js heap**  
- Не установлен `--max-old-space-size` — V8 может занять до ~1.5GB по умолчанию  

---

## 3. Критерии приёмки

| ID | Критерий | Метод проверки |
|----|----------|----------------|
| AC-1 | Health route использует синглтоны prisma и redis | Код-ревью: нет `new PrismaClient()`, нет `new Redis()` |
| AC-2 | Analytics events не создаёт неограниченное число ключей Redis | Код-ревью: используются hincrby с агрегацией, нет уникальных ключей на ивент |
| AC-3 | Analytics events не падает с ReferenceError | Код-ревью: EVENT_NAMES и funnelSteps определены или условие убрано |
| AC-4 | Metrics route компилируется без ошибок | `npx tsc --noEmit` проходит |
| AC-5 | redis.keys() заменён на SCAN | Grep: нет `redis.keys(` |
| AC-6 | CacheService.memoryCache ограничен по размеру и очищается | Код-ревью: maxSize + периодическая очистка |
| AC-7 | Тяжёлые библиотеки импортируются динамически | Код-ревью: `import('jspdf')`, `import('docx')`, `import('sharp')`, `import('xlsx')` |
| AC-8 | Dockerfile использует standalone build | Код-ревью + `docker images` — размер образа уменьшен |
| AC-9 | Установлен лимит Node.js heap (512MB) | Код-ревью Dockerfile: `NODE_OPTIONS=--max-old-space-size=512` |
| AC-10 | npm test && lint && tsc проходят | CI |

---

## 4. Декомпозиция задач

### TASK-MEM-001: Исправить health route (BCK)
- Заменить `new PrismaClient()` на импорт из `@/lib/prisma`
- Заменить `new Redis()` на импорт из `@/lib/redis`
- Использовать `redis.ping()` напрямую

### TASK-MEM-002: Исправить analytics events route (BCK)
- Убрать создание уникальных ключей на каждый ивент
- Агрегировать данные через hincrby/hset (без уникальных ключей)
- Определить `EVENT_NAMES` и `funnelSteps` или убрать мёртвый код
- Исправить некорректное использование `redis.hset`
- Пайплайнить Redis-команды через `redis.pipeline()`

### TASK-MEM-003: Исправить metrics route + prometheus.ts (BCK)
- Убрать лишнюю `}` в metrics/route.ts
- Заменить `redis.keys()` на SCAN в prometheus.ts и cache.ts
- Исправить самореферентные переменные и async-ошибки

### TASK-MEM-004: Ограничить CacheService.memoryCache (BCK)
- Добавить `maxSize: 1000` — при превышении удалять старые записи
- Добавить периодическую очистку просроченных записей (каждые 60с)

### TASK-MEM-005: Динамические импорты тяжёлых библиотек (BCK)
- jspdf → `import('jspdf')` в pdf/generator.ts
- docx → `import('docx')` в word/estimateWordGenerator.ts
- sharp → `import('sharp')` в lib/utils/fileUpload.ts
- xlsx → `import('xlsx')` в estimates/export/route.ts и exportService.ts

### TASK-MEM-006: Оптимизировать Dockerfile (INF)
- Добавить `output: 'standalone'` в next.config.js
- Переписать Dockerfile для standalone build
- Добавить `NODE_OPTIONS=--max-old-space-size=512`

### TASK-MEM-007: Написать тесты (BCK)
- Тесты для исправленного health route
- Тесты для исправленного analytics events route

---

## 5. Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/app/api/health/route.ts` | Переписать на синглтоны |
| `src/app/api/analytics/events/route.ts` | Переписать агрегацию, убрать мёртвый код |
| `src/app/api/metrics/route.ts` | Убрать syntax error |
| `src/lib/prometheus.ts` | SCAN вместо KEYS, исправить async/variables |
| `src/lib/cache.ts` | SCAN вместо KEYS, ограничить memoryCache |
| `src/services/pdf/generator.ts` | Динамический import jspdf |
| `src/services/word/estimateWordGenerator.ts` | Динамический import docx |
| `src/lib/utils/fileUpload.ts` | Динамический import sharp |
| `src/app/api/admin/estimates/export/route.ts` | Динамический import xlsx |
| `src/services/admin/exportService.ts` | Динамический import xlsx |
| `next.config.js` | Добавить output: 'standalone' |
| `docker/Dockerfile` | Standalone build + heap limit |
