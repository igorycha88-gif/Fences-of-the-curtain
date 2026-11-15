# ЧТЗ: Фикс canonical/title детальных страниц портфолио (ошибки индексации GSC)

**Дата:** 2026-11-15
**Источник:** Отчёт Google Search Console «Страница с переадресацией» (10 URL, проверка 07.09–15.09.2026) + экспорт Coverage от 2026-11-15
**Маршрут:** 1 — Стандартная задача (Аналитик → Разработчик → Тестировщик → DevOps)
**Тип:** Малая задача (2 файла + тесты, без БД/API/архитектуры) — упрощённое ЧТЗ

---

## 1. Диагностика (что выявлено)

### 1.1. Категория «Страница с переадресацией» (10 URL) — НЕ ошибка сайта

Проверено curl-ом на проде (2026-11-15):

| URL в GSC | HTTP | Цель | Вердикт |
|---|---|---|---|
| `http://zabor-i-naves.ru/` | 301 | `https://zabor-i-naves.ru/` | ✅ норма (nginx HTTP→HTTPS) |
| `https://www.zabor-i-naves.ru/*` | 301 | non-www | ✅ норма (next.config.js) |
| `/services/navesy-iz-polikarbonata` | 308 | `/services/naves-iz-polikarbonata` | ✅ норма (переименование слагов, коммит 6db4b12) |
| `/services/navesy-dlya-avto` | 308 | `/services/naves-pod-mashinu` | ✅ норма |
| `/portfolio/{cuid|uuid}` | 308 | `/portfolio/{slug}` | ✅ норма (ЧТЗ SEO P1 2.5) |

Все целевые страницы отвечают **200**, canonical самоссылающийся, sitemap содержит только финальные URL, внутренних ссылок на старые URL нет, llms.txt чист.

**Вывод:** «Страница с переадресацией» — информационный статус GSC для URL-источников редиректа. Отчёт очистится сам по мере переобхода (недели). Код менять не нужно.

### 1.2. РЕАЛЬНЫЙ БАГ: метаданные детальных страниц портфолио

**Симптом на проде:** `/portfolio/zabory-i-vorota-iz-profnastila` (200, slug-URL) отдаёт:
- `<title>` каталога: «Фото заборов и навесов в Москве — Портфолио работ | Заборы и Навесы»
- `<link rel="canonical" href="https://zabor-i-naves.ru/portfolio">` ← canonical на КАТАЛОГ

**Корневая причина:** `generateMetadata` определена в `src/app/(public)/portfolio/[slug]/metadata.tsx`. Next.js App Router читает метаданные ТОЛЬКО из `page.tsx`/`layout.tsx`. Файл `metadata.tsx` никем не импортируется → мёртвый код. Metadata наследуется от `src/app/(public)/portfolio/layout.tsx` (title + canonical каталога).

**Следствие в GSC (экспорт Coverage 2026-11-15):**
- «Вариант страницы с тегом canonical» — 3 стр.
- «Страница является копией. Канонический вариант не выбран пользователем» — 4 стр.
- Итого 7 детальных страниц портфолио из sitemap не индексируются Google.

Остальные динамические маршруты (`services/[slug]`, `blog/[slug]`, `navesy/[slug]`, `zabory-navesy/[slug]`) — generateMetadata экспортирована в page.tsx корректно, не затронуты.

## 2. Задачи

### TASK-FRT-001: Подключить generateMetadata детальной страницы портфолио
Файл: `src/app/(public)/portfolio/[slug]/page.tsx`, `src/app/(public)/portfolio/[slug]/metadata.tsx`

1. Перенести `generateMetadata` (двойной lookup slug/legacy-id, fallback title/description, canonical через `portfolioHref()`) в `[slug]/page.tsx` как экспорт.
2. Удалить мёртвый файл `[slug]/metadata.tsx`.
3. Поведение не менять: notFound → metadata с `path: '/portfolio'`; найденный item → title `${title} — Заборы и Навесы`, description из БД или фолбэк, ogImage = первая картинка, canonical = `/portfolio/{slug}`.

### TASK-TST-001: Автотесты
Файл: `__tests__` (по конвенции проекта)

Тесты generateMetadata `[slug]/page.tsx` (мок prisma):
- happy path по slug: canonical = `/portfolio/{slug}`, title = `${title} — Заборы и Навесы`, description из БД
- happy path по legacy id (slug не найден, id найден): canonical на slug-URL
- item не найден → canonical `/portfolio`, title «Проект не найден»
- `active: false` → как not-found
- description fallback при пустом description
- ogImage из первой картинки; без картинок — без ogImage
- регресс-гард: `page.tsx` экспортирует `generateMetadata` (защита от повторной потери)

## 3. Критерии приёмки

1. На проде `/portfolio/{slug}` отдаёт `<title>` детальной страницы и `<link rel="canonical" href="https://zabor-i-naves.ru/portfolio/{slug}">` (проверить минимум 2 страницы).
2. `npx tsc --noEmit && npm run lint && npm test` — зелёные.
3. Автотесты из TASK-TST-001 существуют и проходят.
4. Файл `[slug]/metadata.tsx` удалён, мёртвого кода не осталось.
5. Редиректы 308 legacy-id → slug работают без изменений (регресс).

## 4. Организационные меры (после деплоя, вне кода)

1. GSC → «Индексирование → Страницы»: пересдать sitemap.xml.
2. GSC → «Проверка URL»: запросить переобход 7 детальных страниц портфолио + `/portfolio`.
3. Категория «Страница с переадресацией» не требует действий: URL-источники (http/www/старые слаги/ID) выпадут из отчёта автоматически по мере переобхода Google.
4. Категорию «Не найдено (404)» (3 URL) — посмотреть точный список в GSC и при необходимости завести отдельную задачу на 301.

## 5. Файлы

| Файл | Действие |
|---|---|
| `src/app/(public)/portfolio/[slug]/page.tsx` | добавить export generateMetadata |
| `src/app/(public)/portfolio/[slug]/metadata.tsx` | удалить (мёртвый код) |
| `__tests__/…` | новые тесты |
