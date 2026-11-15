# ЧТЗ: Фикс GSC «Вариант страницы с тегом canonical» — SearchAction и клон портфолио

**Дата:** 2026-11-15
**Источник:** Google Search Console → Индексирование → Страницы, категория «Вариант страницы с тегом canonical» (3 URL, выявлено 21.04.2026, последние сканирования 23.10–05.11.2026)
**Маршрут:** 1 — Стандартная задача (Аналитик → Разработчик → Тестировщик → DevOps)
**Тип:** Малая задача (2 файла кода + тесты + контентная правка в БД через админку)
**Решения пользователя (2026-11-15):** удалить SearchAction; клон портфолио уникализировать

---

## 1. Диагностика

### 1.1. `/services?q={search_term_string}` — фиктивный Sitelinks Searchbox

- `generateWebSiteJsonLd()` (src/lib/seo/jsonld.ts:106-119) отдаёт SearchAction с target
  `https://zabor-i-naves.ru/services?q={search_term_string}` (введён ЧТЗ SEO P1 2.1).
- Поиск по параметру `q` на `/services` **не реализован** (страница не читает searchParams).
- Google сканирует шаблонный URL → вечные записи в GSC, траты краулинг-бюджета.
- По документации Google Sitelinks Searchbox требует реально работающего поиска — разметка вводит в заблуждение.
- Canonical `/services` на варианте с query стоит верно (проверено curl-ом), поэтому статус не «ошибка», но URL не должен сканироваться вовсе.

### 1.2. `/portfolio/zabory-vorota-kalitki-iz-evroshtaketnika-pod-klyuch` — уже исправлено

- Canonical-механика починена 2026-11-15 (ЧТЗ_Фикс_Canonical_Портфолио_GSC): generateMetadata
  в `[slug]/page.tsx`, canonical самоссылающийся (проверено curl-ом на проде).
- Даты последних сканирований в GSC (04–05.11.2026) старее фикса → отчёт очистится после переобхода.
- Действий в коде не требуется.

### 1.3. `/portfolio/...-pod-klyuch-2` — клон-контент в БД

- Curl-проверка прода: title и description обеих записей **посимвольно идентичны**
  («Заборы, ворота, калитки из евроштакетника под ключ — Заборы и Навесы» и общий текст про евроштакетник).
- Записи — два реальных фото-кейса (разные фото), slug `-2` сгенерирован при повторном вводе того же названия.
- Идентичный title+description при слабом теле страницы → Google считает страницы дублями и сам
  выбирает канон (Panda / Omitted results, правило 8 SEO-скилла: клоны запрещены).
- Решение пользователя: уникализировать тексты второй записи через админку.

### 1.4. Попутно: мёртвый `services/[slug]/metadata.tsx`

- Тот же антипаттерн, что чинили в портфолио: Next.js App Router не читает metadata из отдельного
  файла. В `services/[slug]/page.tsx` есть собственный `generateMetadata` (page.tsx:25) — файл не используется.

## 2. Задачи

### TASK-BCK-001: Удалить SearchAction из WebSite JSON-LD
Файлы: `src/lib/seo/jsonld.ts`, `src/lib/seo/types.ts`, `__tests__/jsonld.test.ts`

1. В `generateWebSiteJsonLd()` убрать `potentialAction` (закомментированный контекст ЧТЗ SEO P1 2.1 удалить).
2. В типе `JsonLdWebSite` (src/lib/seo/types.ts) поле `potentialAction` и его интерфейс удалить.
3. Обновить тест `__tests__/jsonld.test.ts`: убрать ожидания SearchAction, добавить негативный тест —
   результат НЕ содержит `potentialAction` и строки `search_term_string`.

### TASK-INF-001: Удалить мёртвый файл
Файл: `src/app/(public)/services/[slug]/metadata.tsx` — удалить (не используется, page.tsx имеет свой generateMetadata).

### TASK-CNT-001: Уникализировать клон портфолио (контент, через админку на проде)
Запись: slug `zabory-vorota-kalitki-iz-evroshtaketnika-pod-klyuch-2`

Готовые тексты (лимиты: полный title ≤ 74 с учётом суффикса « — Заборы и Навесы» (18 симв.) → title записи ≤ 56; description ≤ 160):

- **title:** `Евроштакетник: забор, ворота и калитка — проект 2` (49 симв., полный — 67 ✅)
- **description:** `Второй проект под ключ: забор из евроштакетника с воротами и калиткой. Своё производство, монтаж за 1–2 дня, гарантия по договору. Смотрите фото.` (155 симв. ✅)

Внести через админку: Админ → Портфолио → запись «…под ключ 2» → изменить title/description → сохранить.

## 3. Критерии приёмки

1. `generateWebSiteJsonLd()` не содержит SearchAction; на проде в JSON-LD главной нет `search_term_string`.
2. `/services?q=%7Bsearch_term_string%7D` больше не находится Google (после переобхода) — организационно.
3. Запись портфолио `-2` на проде имеет уникальные title/description (≠ первой записи).
4. `npm test && npm run lint && npx tsc --noEmit` — зелёные; тесты из TASK-BCK-001 проходят.
5. Файл `services/[slug]/metadata.tsx` удалён; `/services/[slug]` отдаёт метаданные как раньше (регресс).
6. Регресс: метаданные `/services`, портфолио `[slug]` не изменились (кроме контента из TASK-CNT-001).

## 4. Организационные меры (после деплоя, вне кода)

1. GSC: пересдать sitemap.xml, запросить переобход `/services?q={search_term_string}` и обеих страниц портфолио.
2. Категория «Вариант страницы с тегом canonical» сократится по мере переобхода (недели).
3. Яндекс.Вебмастер: переобход главной (SearchAction удалён — переиндексация WebSite JSON-LD).

## 5. Файлы

| Файл | Действие |
|---|---|
| `src/lib/seo/jsonld.ts` | удалить SearchAction из generateWebSiteJsonLd |
| `src/lib/seo/types.ts` | убрать potentialAction из JsonLdWebSite |
| `__tests__/jsonld.test.ts` | обновить тесты (негативный тест на SearchAction) |
| `src/app/(public)/services/[slug]/metadata.tsx` | удалить (мёртвый код) |
| Прод-БД (админка) | уникализировать title/description записи `-2` |
