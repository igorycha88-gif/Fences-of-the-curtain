# ЧТЗ: AEO-фиксы (AI-SEO по marketingskills) + раздел AI-SEO в скилле

**Дата:** 2026-10-20
**Источник:** анализ репозитория coreyhaines31/marketingskills (скиллы ai-seo, programmatic-seo, seo-audit, cro), вариант «А» утверждён пользователем
**Маршрут:** Стандартный (Аналитик → Разработчик → Тестировщик → DevOps)
**Архитектор:** не привлекается — нет новых сущностей БД, API-контекста и интеграций; изменения механические (2 статик-файла, правки robots/jsonld/скилла)

---

## Контекст

Аудит marketingskills выявил AEO-пробелы (цитируемость в ChatGPT/Perplexity/Google AI Overviews), которых нет в наших 4 книгах: нет `llms.txt`, машиночитаемого прайса, осознанной политики AI-ботов в robots, freshness-сигналов (dateModified + видимая дата), статистики с источниками. По Princeton GEO (KDD 2024): статистика с источниками +37–40% к цитируемости, keyword stuffing −10%.

## Задачи

### TASK-BCK-001: dateModified в Article JSON-LD
- `src/lib/seo/jsonld.ts`: `generateArticleJsonLd(..., dateModified?: string)` — добавляет `dateModified` в схему (ISO-строкой).
- `src/app/(public)/blog/[slug]/page.tsx`: передавать `post.updatedAt.toISOString()`.
- `src/app/(public)/blog/zabor-na-6-sotkah/page.tsx` и `src/app/(public)/calc/zabor-na-sotki/page.tsx`: передавать `SEO_CONFIG.CONTENT_LAST_UPDATED`.

### TASK-BCK-002: явная политика AI-ботов в robots.ts
- Группы по назначению (комментарии в коде): search-discovery (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`), user-triggered (`ChatGPT-User`, `Claude-User`, `Perplexity-User`), training (`GPTBot`, `ClaudeBot`) — всем `allow: '/'`; общий запрет `/admin`, `/api` сохраняется.
- В `host`-блок не добавлять ничего лишнего; правило для AI-ботов добавить отдельными records.

### TASK-FRT-001: public/llms.txt
По формату llmstxt.org: H1 название компании, blockquote-описание, разделы ссылок (услуги/цены/калькуляторы/гео/контакты). Данные из SEO_CONFIG/BUSINESS_INFO. Абсолютные URL.

### TASK-FRT-002: public/ceny.md
Машиночитаемый прайс в markdown (аналог pricing.md из ai-seo): профнастил от 2 600 ₽/м (что входит), евроштакетник/3D/рабица — по расчёту, навесы (арочный от 70 000 ₽, двускатный от 68 000 ₽, зимний от 39 000 ₽), гаражи от 40 000 ₽/м², откатные ворота от 32 000 ₽, жалюзи от 4 500 ₽/м, доставка по зонам (до 15 км включена; 16–40 км от 1 500 ₽; 40+ км от 3 000 ₽), замер бесплатно. Только цены, подтверждённые в кодовой базе (constants/content).

### TASK-FRT-003: видимая дата «Обновлено»
- `blog/[slug]/page.tsx`: строка «Обновлено: {post.updatedAt → D МММГГ по-русски}» рядом с заголовком/метаданными статьи.
- `blog/zabor-na-6-sotkah` и `calc/zabor-na-sotki`: «Обновлено: октябрь 2026» (из константы, без динамики).

### TASK-DOC-001: скилл seo-development — раздел «AI-SEO (AEO/GEO)»
Правила: llms.txt/ceny.md актуальны при каждом контентном релизе; dateModified + видимая дата обязательны для статей; статистика с источниками (СП/ГОСТ/Princeton-типа данных, где уместно); answer-блоки 40–60 слов в начале секций; заголовки = формулировки запросов; запрет отдельного «контента для ИИ» (Google scaled content abuse); AI-боты в robots — осознанная политика; keyword stuffing вредит АИ-цитируемости.

### TASK-TST-001: автотесты
1. robots(): содержит allow-правила для OAI-SearchBot, PerplexityBot, Claude-SearchBot, GPTBot (disallow /admin, /api у каждой группы).
2. generateArticleJsonLd с dateModified → поле присутствует; без — отсутствует.
3. fs-проверки: public/llms.txt существует, содержит BASE_URL и ссылки на /calculator, /zabory-navesy; public/ceny.md существует, содержит «2 600» и «Доставка».
4. blog/[slug] рендерит «Обновлено» (dom-тест с моком prisma — по образцу существующих).

## Критерии приёмки
1. `/llms.txt` и `/ceny.md` отдаются сервером (200) и покрыты тестами.
2. robots.txt содержит AI-ботов с allow; `/admin`, `/api` закрыты для них.
3. Article JSON-LD содержит dateModified.
4. На страницах блога видна дата обновления.
5. Скилл содержит раздел AI-SEO.
6. `npm test && npm run lint && npx tsc --noEmit` зелёные.

## Файлы
| Файл | Задача |
|---|---|
| `src/lib/seo/jsonld.ts` | BCK-001 |
| `src/app/(public)/blog/[slug]/page.tsx` | BCK-001, FRT-003 |
| `src/app/(public)/blog/zabor-na-6-sotkah/page.tsx` | BCK-001, FRT-003 |
| `src/app/(public)/calc/zabor-na-sotki/page.tsx` | BCK-001, FRT-003 |
| `src/app/robots.ts` | BCK-002 |
| `public/llms.txt` | FRT-001 |
| `public/ceny.md` | FRT-002 |
| `.opencode/skills/seo-development/SKILL.md` | DOC-001 |
| `__tests__/aeo/aeo-fixes.test.ts` (новый) + dom-тест | TST-001 |
