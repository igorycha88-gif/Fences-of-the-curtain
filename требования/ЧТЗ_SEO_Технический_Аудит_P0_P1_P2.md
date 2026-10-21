# ЧТЗ: SEO-оптимизация сайта zabor-i-naves.ru

**Проект:** zabor-i-naves.ru  
**Дата анализа:** 2026-10-21  
**Приоритеты:** P0 (критические, блокируют индексацию) → P1 (важные, улучшают ранжирование) → P2 (дополнительные улучшения)

---

## P0 — Критические задачи

### 1.1 Создать файл /public/logo.png

**Проблема:** `generateOrganizationJsonLd()` в `src/lib/seo/jsonld.ts` ссылается на `${BASE_URL}/logo.png` в полях `logo` и `image[]`. Файла `/public/logo.png` не существует — ошибка 404 в структурированных данных. Google Rich Results Test и Яндекс.Вебмастер не смогут извлечь логотип организации, JSON-LD-блок Organization будет считаться невалидным.

**Что сделать:**

- Создать файл `/public/logo.png`
- Формат: PNG с прозрачным фоном
- Размер: 600×60 px (горизонтальный логотип) или 400×400 px (квадратный); минимум 112×112 px
- Логотип с читаемым названием компании

**Проверка:** Google Rich Results Test по URL главной — поле `logo` в Organization не должно давать предупреждение о недоступном ресурсе.

---

### 1.2 Добавить /calculator/gates в SITEMAP_CONFIG

**Проблема:** Страница `/calculator/gates` существует и имеет metadata, но отсутствует в `SITEMAP_CONFIG.pages` (`src/lib/seo/constants.ts`, ~строка 340). Поисковики не получают сигнал о странице через sitemap.xml.

**Что сделать:**

В `src/lib/seo/constants.ts`, в массив `SITEMAP_CONFIG.pages`, добавить после записи `/calculator`:

```ts
{ path: '/calculator/gates', priority: 0.9, changefreq: 'weekly' }
```

**Проверка:** `curl https://zabor-i-naves.ru/sitemap.xml | grep calculator/gates` — должна появиться запись.

---

### 1.3 Установить NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

**Проблема:** В `src/app/layout.tsx` верификация Google задана через `process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined`. Если переменная не установлена — мета-тег не рендерится, сайт не верифицирован в Google Search Console.

**Что сделать:**

В `.env.production` добавить:

```
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<код_из_Google_Search_Console>
```

Код взять: Google Search Console → Настройки → Право собственности → HTML-метатег → скопировать значение атрибута `content`.

**Проверка:** `curl https://zabor-i-naves.ru/ | grep google-site-verification` — должен вернуть непустое значение.

---

## P1 — Важные задачи

### 2.1 Добавить SearchAction в generateWebSiteJsonLd()

**Проблема:** `generateWebSiteJsonLd()` в `src/lib/seo/jsonld.ts` возвращает WebSite-схему без `potentialAction`. Без SearchAction Яндекс не показывает «Поиск по сайту» (Sitelinks Searchbox) в результатах выдачи.

**Что сделать:**

В `src/lib/seo/jsonld.ts`, функция `generateWebSiteJsonLd()`, добавить поле:

```ts
potentialAction: {
  '@type': 'SearchAction',
  target: `${SEO_CONFIG.BASE_URL}/services?q={search_term_string}`,
  'query-input': 'required name=search_term_string',
}
```

**Проверка:** Яндекс.Вебмастер → Структурированные данные → тип WebSite — должен появиться узел SearchAction.

---

### 2.2 Расширить BUSINESS_INFO.sameAs

**Проблема:** `BUSINESS_INFO.sameAs` содержит только Яндекс.Карты. Для локального SEO важны упоминания в 2GIS, ВКонтакте, Авито, Фламп — поисковики используют их для подтверждения NAP-консистентности (Name, Address, Phone).

**Что сделать:**

В `src/lib/seo/constants.ts`, в `BUSINESS_INFO.sameAs`, добавить:

- URL профиля компании в 2GIS
- URL группы/страницы ВКонтакте
- URL объявления или профиля на Авито
- URL профиля на Фламп (если зарегистрирован)

**Проверка:** В Organization JSON-LD на главной должно быть 4+ ссылок в массиве `sameAs`.

---

### 2.3 Добавить полный адрес в BUSINESS_INFO

**Проблема:** `BUSINESS_INFO.address` содержит только `locality` и `region`. Без `streetAddress` и `postalCode` LocalBusiness-схема неполная — снижает шансы на показ в Google Maps и панели знаний Яндекса.

**Что сделать:**

В `src/lib/seo/constants.ts`, в `BUSINESS_INFO.address`, добавить:

```ts
streetAddress: 'КП «Гжельские узоры», Раменский муниципальный округ',
postalCode: '140155',
```

В `src/lib/seo/jsonld.ts`, в `generateOrganizationJsonLd()`, передавать новые поля в `PostalAddress`:

```ts
address: {
  '@type': 'PostalAddress',
  streetAddress: BUSINESS_INFO.address.streetAddress,
  postalCode: BUSINESS_INFO.address.postalCode,
  addressLocality: BUSINESS_INFO.address.locality,
  addressRegion: BUSINESS_INFO.address.region,
  addressCountry: BUSINESS_INFO.address.country,
},
```

---

### 2.4 Исправить datePublished в generateArticleJsonLd()

**Проблема:** В `src/lib/seo/jsonld.ts`, строка 235:

```ts
datePublished: datePublished || new Date().toISOString(),
```

Для статических лендингов, где `datePublished` не передаётся, каждый SSR-рендер устанавливает сегодняшнюю дату как дату публикации. Это ложный freshness-сигнал, который может быть расценён как попытка манипуляции.

**Что сделать:**

В `src/lib/seo/jsonld.ts`, строка 235, изменить:

```ts
// Было:
datePublished: datePublished || new Date().toISOString(),

// Стало:
datePublished: datePublished || undefined,
```

Для каждого статического лендинга, вызывающего `generateArticleJsonLd()`, передавать хардкоженную дату первой публикации страницы (ISO 8601, например `'2025-03-15'`).

---

### 2.5 Slug-based URLs для портфолио

**Проблема:** Страницы портфолио доступны по UUID (`/portfolio/550e8400-e29b-41d4-...`). UUID-URL неинформативны для поисковиков и не содержат ключевых слов.

**Что сделать:**

1. `prisma/schema.prisma` — добавить поле `slug String @unique` в модель `PortfolioItem`, создать миграцию
2. `src/app/(public)/portfolio/[id]/page.tsx` — переименовать в `[slug]/page.tsx`, обновить запрос: `findFirst({ where: { slug } })` вместо `findFirst({ where: { id } })`
3. `src/app/sitemap.ts` — заменить `item.id` на `item.slug` при формировании URL (строка ~185)
4. `next.config.js` — добавить 301-редиректы со старых UUID-URL на новые slug-URL для уже проиндексированных страниц

---

## P2 — Дополнительные улучшения

### 3.1 Описательные alt-тексты для изображений портфолио

**Проблема:** Изображения портфолио используют `alt={post.title}` — общее название без контекста типа ограждения и города монтажа. Упущенный сигнал для Google Image Search.

**Шаблон alt-текста:**

```
{title} — {тип_ограждения} в {город} | Заборы и Навесы
```

Пример: «Забор из профнастила — установка в Жуковском | Заборы и Навесы»

Для этого в модели `PortfolioItem` должны быть поля `fenceType` и `city` (или добавить их).

---

### 3.2 Добавить AVIF в форматы Next.js Image

**Файл:** `next.config.js`

```js
// Было:
formats: ['image/webp']

// Стало:
formats: ['image/avif', 'image/webp']
```

AVIF даёт 20–50% меньший размер по сравнению с WebP при том же визуальном качестве. Улучшает LCP (Largest Contentful Paint) — один из Core Web Vitals.

---

### 3.3 Повысить приоритет /about в sitemap

**Файл:** `src/lib/seo/constants.ts`

Для страницы `/about` в `SITEMAP_CONFIG.pages`:

```ts
// Было: priority: 0.6
// Стало: priority: 0.7
```

Страница «О нас» с реквизитами (ИНН, ОГРНИП) — важный E-E-A-T-сигнал (Experience, Expertise, Authoritativeness, Trustworthiness). Приоритет 0.6 занижен относительно её значимости.
