# ЧТЗ: SEO-продвижение в Яндексе — Полная оптимизация v2

## Версия: 2.0
## Дата: 2026-04-10
## Автор: AI-аналитик
## Приоритет: High (весь спектр)
## Статус: Draft
## Предыдущая версия: ЧТЗ_SEO_оптимизация.md (v1.0, базовая инфраструктура — РЕАЛИЗОВАНА)

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Вывести сайт zabor-i-naves.ru на топовые позиции в Яндексе по целевым запросам в Москве и МО, превратить сайт в полноценный лидогенерирующий инструмент с органическим трафиком.

### 1.2 Пользовательская ценность
- Клиенты находят сайт по запросам «забор из профнастила Москва», «калькулятор забора», «навес для авто цена»
- Богатые сниппеты в выдаче Яндекса (звёзды отзывов, FAQ, контакты)
- Полезный контент (статьи, FAQ) удерживает пользователей и снижает отказы

### 1.3 Метрики успеха
| Метрика | Текущее | Цель (3 мес.) | Цель (6 мес.) |
|---------|---------|---------------|---------------|
| Проиндексированных страниц | 6 | 30+ | 50+ |
| Органический трафик (Яндекс) | ~0 | +200 визитов/мес | +1000 визитов/мес |
| Позиции по брендовым запросам | — | Топ-3 | Топ-1 |
| Позиции по ВЧ запросам | — | Топ-30 | Топ-10 |
| Core Web Vitals (LCP) | — | < 2.5s | < 2.0s |
| Отказы (Яндекс.Метрика) | — | < 40% | < 30% |

### 1.4 Контекст: что уже реализовано (v1.0)
- Централизованная система метаданных (`src/lib/seo/constants.ts`, `metadata.ts`, `types.ts`, `jsonld.ts`)
- JSON-LD схемы: LocalBusiness, WebSite, Service (4 шт), WebApplication (2 шт), ContactPage, BreadcrumbList
- Sitemap.xml (6 статических страниц)
- Robots.ts (динамический) + robots.txt (статический — конфликт)
- SSR рендеринг всех публичных страниц
- Yandex verification: `b82b0cfe086d3936`
- Компонент Breadcrumbs (используется на 2 страницах)

### 1.5 Контекст: бизнес-данные
- **Город:** Москва
- **Регион:** Московская область
- **Телефон:** +74993901595
- **Email:** zabori-naves@yandex.ru
- **Офис:** Нет (мобильная бригада, выезд к заказчику)
- **Яндекс.Метрика:** Счётчик не создан (нужно зарегистрировать)

---

## 2. Функциональные требования

### 2.1 User Stories

#### US-001: Реальные бизнес-данные (HIGH)
**Как** потенциальный клиент  
**Я хочу** видеть реальные контакты и адрес  
**Чтобы** связаться с компанией

```gherkin
Given я нахожусь на любой странице сайта
When смотрю контакты в футере/JSON-LD
Then вижу телефон +74993901595
And вижу email zabori-naves@yandex.ru
And вижу город Москва, Московская область
And НЕ вижу placeholder данные
```

#### US-002: Яндекс.Метрика (HIGH)
**Как** владелец бизнеса  
**Я хочу** отслеживать поведение пользователей из Яндекса  
**Чтобы** оптимизировать конверсию

```gherkin
Given я захожу на любую страницу сайта
When страница загружается
Then срабатывает счётчик Яндекс.Метрики
And отправляются события: calculator_start, calculator_complete, contact_form_submit, phone_click
```

#### US-003: Канонические URL (HIGH)
**Как** поисковый робот  
**Я хочу** видеть canonical URL на каждой странице  
**Чтобы** не индексировать дубли

```gherkin
Given я поисковый робот
When захожу на /services
Then вижу <link rel="canonical" href="https://zabor-i-naves.ru/services">
And для каждой страницы canonical указывает на саму себя
```

#### US-004: OG-изображения (HIGH)
**Как** пользователь соцсетей/мессенджеров  
**Я хочу** видеть красивую карточку при шаринге ссылки  
**Чтобы** понять о чём сайт

```gherkin
Given я делюсь ссылкой на сайт в Telegram/WhatsApp
When ссылка парсится мессенджером
Then отображается картинка og:image (1200x630)
And отображается заголовок og:title
And отображается описание og:description
```

#### US-005: Отдельные страницы услуг (MEDIUM)
**Как** потенциальный клиент из Яндекса  
**Я хочу** найти страницу «Забор из профнастила в Москве»  
**Чтобы** узнать цены и заказать

```gherkin
Given я ищу в Яндексе "забор из профнастила москва"
When нахожу страницу /services/zabory-iz-profnastila
Then вижу подробное описание услуги
And вижу цену за метр
And вижу примеры работ (портфолио)
And вижу CTA «Рассчитать стоимость»
And вижу FAQ по данной услуге
```

#### US-006: Детальные страницы портфолио (MEDIUM)
**Как** потенциальный клиент  
**Я хочу** посмотреть фото и описание конкретного проекта  
**Чтобы** оценить качество работ

```gherkin
Given я на странице портфолио
When кликаю на проект
Then попадаю на /portfolio/[slug]
And вижу фото-галерею проекта
And вижу описание, материалы, стоимость
And вижу JSON-LD ImageGallery
```

#### US-007: FAQ с разметкой (MEDIUM)
**Как** поисковая система  
**Я хочу** отображать FAQ в сниппете выдачи  
**Чтобы** привлекать больше кликов

```gherkin
Given я Яндекс
When индексирую страницу с FAQ
Then нахожу FAQPage schema.org разметку
And могу показать вопросы-ответы прямо в выдаче
```

#### US-008: Блог (MEDIUM)
**Как** потенциальный клиент  
**Я хочу** прочитать статью «Как выбрать забор для дачи»  
**Чтобы** принять решение

```gherkin
Given я ищу в Яндексе "как выбрать забор для дачи"
When нахожу статью /blog/kak-vybrat-zabor-dlya-dachi
Then вижу подробную статью 2000+ слов
And вижу CTA «Рассчитать стоимость»
And статья проиндексирована в sitemap
```

#### US-009: Гео-страницы (LOW)
**Как** житель Подмосковья  
**Я хочу** найти «Заборы в [моём городе]»  
**Чтобы** заказать локально

```gherkin
Given я ищу "забор москва"
Or "забор химки"
Or "забор балашиха"
When нахожу гео-страницу
Then вижу релевантный контент для моего города
And вижу LocalBusiness schema с areaServed
```

---

## 3. Нефункциональные требования

### 3.1 Производительность
| Метрика | Требование |
|---------|------------|
| LCP | < 2.5 сек |
| CLS | < 0.1 |
| FID | < 100 мс |
| TTFB | < 600 мс |
| Размер OG-изображения | < 200 KB |

### 3.2 SEO-совместимость
- Все публичные страницы — SSR (server-side rendering)
- Яндекс плохо рендерит JS — критический контент в HTML
- `lang="ru"` на `<html>` — уже реализовано
- Viewport meta tag — уже реализовано
- Mobile-first — адаптивная вёрстка Tailwind

### 3.3 Безопасность
- Счётчик Метрики не должен загружаться на админ-страницах
- robots.txt не должен раскрывать служебные пути
- Мета-теги без чувствительных данных

---

## 4. Техническая архитектура

### 4.1 Изменения в БД

#### Новая таблица: BlogPost
```sql
CREATE TABLE "BlogPost" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL UNIQUE,
    "excerpt" TEXT,
    "content" JSONB NOT NULL,
    "coverImage" VARCHAR(500),
    "seoTitle" VARCHAR(255),
    "seoDescription" TEXT,
    "seoKeywords" VARCHAR(500),
    "published" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blog_post_slug ON "BlogPost"("slug");
CREATE INDEX idx_blog_post_published ON "BlogPost"("published");
```

#### Новая таблица: FaqItem
```sql
CREATE TABLE "FaqItem" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" VARCHAR(100),
    "sortOrder" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faq_category ON "FaqItem"("category");
```

#### Новая таблица: ServicePage (необязательно, можно использовать PageContent)
Если используем существующую модель `PageContent`:
```sql
-- PageContent уже существует: slug, title, content, seoTitle, seoDescription, seoKeywords
-- Добавим поле category для привязки к типу услуги
ALTER TABLE "PageContent" ADD COLUMN "category" VARCHAR(100);
ALTER TABLE "PageContent" ADD COLUMN "coverImage" VARCHAR(500);
ALTER TABLE "PageContent" ADD COLUMN "priceRange" VARCHAR(100);
ALTER TABLE "PageContent" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "PageContent" ADD COLUMN "sortOrder" INTEGER DEFAULT 0;
```

#### Новая таблица: GeoPage
```sql
CREATE TABLE "GeoPage" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "city" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL UNIQUE,
    "content" JSONB NOT NULL,
    "seoTitle" VARCHAR(255),
    "seoDescription" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_geo_page_slug ON "GeoPage"("slug");
```

### 4.2 API спецификация

#### Публичные API (SEO-relevant):

| Method | Path | Описание |
|--------|------|----------|
| GET | `/services/[slug]` | Страница конкретной услуги |
| GET | `/portfolio/[slug]` | Страница проекта портфолио |
| GET | `/blog` | Список статей |
| GET | `/blog/[slug]` | Страница статьи |
| GET | `/faq` | Страница FAQ |
| GET | `/gorod/[slug]` | Гео-страница города |

#### Admin API:

| Method | Path | Описание |
|--------|------|----------|
| GET/POST/PUT/DELETE | `/admin/references/blog` | CRUD статей блога |
| GET/POST/PUT/DELETE | `/admin/references/faq` | CRUD FAQ |
| GET/POST/PUT/DELETE | `/admin/references/service-pages` | CRUD страниц услуг |
| GET/POST/PUT/DELETE | `/admin/references/geo-pages` | CRUD гео-страниц |

### 4.3 Структура файлов (новые)

```
src/
├── app/
│   ├── layout.tsx                    # ОБНОВИТЬ: убрать дубли JSON-LD, добавить Метрику
│   ├── sitemap.ts                    # ОБНОВИТЬ: динамические страницы
│   ├── robots.ts                     # ОБНОВИТЬ: Host: директива
│   ├── (public)/
│   │   ├── calculator/
│   │   │   ├── page.tsx              # ДОБАВИТЬ: metadata
│   │   │   └── metadata.tsx          # СОЗДАТЬ
│   │   ├── services/
│   │   │   ├── page.tsx              # ОБНОВИТЬ: ссылки на подстраницы
│   │   │   ├── layout.tsx            # ОБНОВИТЬ: breadcrumbs
│   │   │   ├── metadata.tsx          # ОБНОВИТЬ: title с гео
│   │   │   └── [slug]/
│   │   │       ├── page.tsx          # СОЗДАТЬ: страница услуги
│   │   │       ├── layout.tsx        # СОЗДАТЬ: JSON-LD Service
│   │   │       └── metadata.tsx      # СОЗДАТЬ
│   │   ├── portfolio/
│   │   │   ├── page.tsx              # ОБНОВИТЬ: ссылки на проекты
│   │   │   ├── layout.tsx            # ОБНОВИТЬ: breadcrumbs
│   │   │   └── [slug]/
│   │   │       ├── page.tsx          # СОЗДАТЬ: страница проекта
│   │   │       ├── layout.tsx        # СОЗДАТЬ: JSON-LD ImageGallery
│   │   │       └── metadata.tsx      # СОЗДАТЬ
│   │   ├── blog/
│   │   │   ├── page.tsx              # СОЗДАТЬ: список статей
│   │   │   ├── layout.tsx            # СОЗДАТЬ: breadcrumbs + BreadcrumbList
│   │   │   ├── metadata.tsx          # СОЗДАТЬ
│   │   │   └── [slug]/
│   │   │       ├── page.tsx          # СОЗДАТЬ: страница статьи
│   │   │       ├── layout.tsx        # СОЗДАТЬ: JSON-LD Article
│   │   │       └── metadata.tsx      # СОЗДАТЬ
│   │   ├── faq/
│   │   │   ├── page.tsx              # СОЗДАТЬ: FAQ страница
│   │   │   ├── layout.tsx            # СОЗДАТЬ: JSON-LD FAQPage
│   │   │   └── metadata.tsx          # СОЗДАТЬ
│   │   ├── gorod/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx          # СОЗДАТЬ: гео-страница
│   │   │       ├── layout.tsx        # СОЗДАТЬ: JSON-LD LocalBusiness (geo)
│   │   │       └── metadata.tsx      # СОЗДАТЬ
│   │   └── contacts/
│   │       └── layout.tsx            # ОБНОВИТЬ: breadcrumbs
│   ├── (admin)/
│   │   └── admin/
│   │       └── references/
│   │           ├── blog/             # СОЗДАТЬ: CRUD блога
│   │           ├── faq/              # СОЗДАТЬ: CRUD FAQ
│   │           ├── service-pages/    # СОЗДАТЬ: CRUD страниц услуг
│   │           └── geo-pages/        # СОЗДАТЬ: CRUD гео-страниц
│   └── api/
│       └── blog/
│           ├── route.ts              # СОЗДАТЬ: GET/POST
│           └── [id]/route.ts         # СОЗДАТЬ: GET/PUT/DELETE
├── components/
│   ├── seo/
│   │   ├── Breadcrumbs.tsx           # ОБНОВИТЬ: использовать везде
│   │   ├── YandexMetrika.tsx         # СОЗДАТЬ: счётчик Метрики
│   │   ├── FaqSection.tsx            # СОЗДАТЬ: блок FAQ
│   │   └── ReviewStars.tsx           # СОЗДАТЬ: звёзды отзывов
│   └── blog/
│       ├── BlogCard.tsx              # СОЗДАТЬ
│       └── BlogContent.tsx           # СОЗДАТЬ: рендеринг JSON-контента
├── lib/
│   ├── seo/
│   │   ├── constants.ts             # ОБНОВИТЬ: реальные данные
│   │   ├── metadata.ts             # ОБНОВИТЬ: canonical fix
│   │   ├── jsonld.ts               # ОБНОВИТЬ: FAQPage, Review, Article
│   │   └── metrika.ts              # СОЗДАТЬ: события Метрики
│   └── blog/
│       └── content-renderer.ts      # СОЗДАТЬ: рендеринг JSON -> HTML
public/
├── og/                              # СОЗДАТЬ: OG-изображения
│   ├── og-main.jpg
│   ├── og-services.jpg
│   ├── og-calculator.jpg
│   ├── og-portfolio.jpg
│   └── og-contacts.jpg
├── robots.txt                       # УДАЛИТЬ (используем robots.ts)
└── manifest.webmanifest             # СОЗДАТЬ (LOW)
```

### 4.4 Интерфейсы/типы данных

```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: Record<string, unknown>;
  coverImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface ServicePageData {
  slug: string;
  title: string;
  content: Record<string, unknown>;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  category: string;
  coverImage: string | null;
  priceRange: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface GeoPageData {
  id: string;
  city: string;
  slug: string;
  content: Record<string, unknown>;
  seoTitle: string;
  seoDescription: string;
  isActive: boolean;
}

interface MetrikaEvents {
  calculatorStart: (type: 'fence' | 'canopy') => void;
  calculatorComplete: (type: 'fence' | 'canopy', value: number) => void;
  contactFormSubmit: () => void;
  phoneClick: () => void;
  portfolioView: (slug: string) => void;
}
```

---

## 5. UI/UX требования

### 5.1 Обновлённые мета-теги (с гео-модификаторами)

| Страница | Title | Description |
|----------|-------|-------------|
| `/` | Установка заборов и навесов в Москве — Онлайн калькулятор | Заборы и навесы в Москве и МО. Калькулятор стоимости онлайн. Профнастил, евроштакетник, 3D-панели. Монтаж от 1 дня. Гарантия. Звоните: +7 (499) 390-15-95 |
| `/services` | Установка заборов в Москве и МО — Все виды | Заборы из профнастила, евроштакетника, 3D-панелей в Москве. Навесы для авто из поликарбоната. Монтаж под ключ. Бесплатный расчёт. |
| `/calculator/fence` | Калькулятор забора — Рассчитать цену онлайн за 30 сек | Рассчитайте стоимость забора из профнастила, евроштакетника или 3D-панелей в Москве. Онлайн-калькулятор с точной ценой за метр. |
| `/calculator/canopy` | Калькулятор навеса — Рассчитать цену онлайн | Рассчитайте стоимость навеса для авто, беседки или террасы в Москве. Онлайн-калькулятор с точной ценой. |
| `/portfolio` | Портфолио работ — Заборы и навесы в Москве | Примеры выполненных работ: заборы и навесы в Москве и МО. Фотографии проектов, цены, описания. |
| `/contacts` | Контакты — Заборы и Навесы | Москва. Телефон: +7 (499) 390-15-95. Email: zabori-naves@yandex.ru. Пн-Пт 9:00-18:00. |
| `/faq` | Часто задаваемые вопросы — Заборы и Навесы | Ответы на популярные вопросы о заборах и навесах. Стоимость, сроки, материалы, гарантии. |
| `/blog` | Статьи о заборах и навесах — Полезные советы | Полезные статьи о выборе забора, навеса, материалов. Советы по установке и уходу. |
| `/services/[slug]` | [Динамический title с гео] | [Динамический description] |
| `/portfolio/[slug]` | [Название проекта] — Заборы и Навесы | [Описание проекта] |
| `/blog/[slug]` | [Заголовок статьи] — Заборы и Навесы | [Excerpt статьи] |
| `/gorod/[slug]` | Заборы и навесы в [Городе] — Цены, фото работ | Установка заборов и навесов в [Городе]. Калькулятор стоимости. Профнастил, евроштакетник. Выезд бесплатно. |

### 5.2 Макет страницы услуги (/services/[slug])

```
┌─────────────────────────────────────────┐
│ [Breadcrumbs: Главная > Услуги > ...]   │
├─────────────────────────────────────────┤
│ H1: Забор из профнастила в Москве       │
│ Подзаголовок: Цены от 1500 руб/м        │
├─────────────────────────────────────────┤
│ [Hero изображение / coverImage]          │
├─────────────────────────────────────────┤
│ Описание услуги (контент из БД)         │
│ • Преимущества                          │
│ • Виды материалов                       │
│ • Этапы работ                           │
├─────────────────────────────────────────┤
│ Примеры работ (3-4 проекта из портфолио)│
│ [Фото] [Фото] [Фото]                    │
├─────────────────────────────────────────┤
│ CTA: [Рассчитать стоимость] [Позвонить] │
├─────────────────────────────────────────┤
│ FAQ (3-5 вопросов по услуге)            │
├─────────────────────────────────────────┤
│ Ссылки на другие услуги                 │
└─────────────────────────────────────────┘
```

### 5.3 Макет блога

```
┌─────────────────────────────────────────┐
│ [Breadcrumbs: Главная > Блог]           │
├─────────────────────────────────────────┤
│ H1: Полезные статьи о заборах и навесах │
├─────────────────────────────────────────┤
│ [Карточка статьи] [Карточка статьи]     │
│  Обложка           Обложка              │
│  Заголовок         Заголовок            │
│  Excerpt           Excerpt              │
│  Дата              Дата                 │
├─────────────────────────────────────────┤
│ [Карточка статьи] [Карточка статьи]     │
└─────────────────────────────────────────┘
```

---

## 6. Декомпозиция на задачи

### HIGH PRIORITY (7 задач)

---

### TASK-BCK-001: Обновить BUSINESS_INFO реальными данными

**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** Нет

**Описание:**
Заменить placeholder данные в `BUSINESS_INFO` на реальные бизнес-данные. Обновить все мета-теги, JSON-LD и тексты, ссылающиеся на контакты.

**Критерии приемки:**
- [ ] `BUSINESS_INFO.telephone` = `+7-499-390-15-95`
- [ ] `BUSINESS_INFO.email` = `zabori-naves@yandex.ru`
- [ ] `BUSINESS_INFO.address.locality` = `Москва`
- [ ] `BUSINESS_INFO.address.region` = `Московская область`
- [ ] Все PAGE_METADATA descriptions содержат «Москва» или «Москве»
- [ ] JSON-LD LocalBusiness содержит реальные данные
- [ ] `npm test` проходит

**Технические детали:**
- Файл: `src/lib/seo/constants.ts`
- Обновить все ссылки на телефон в формате `+7 (499) 390-15-95` для display

---

### TASK-BCK-002: Интеграция Яндекс.Метрики

**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 2 часа  
**Зависимости:** Нет

**Описание:**
Создать компонент Яндекс.Метрики, добавить на все публичные страницы, настроить отслеживание событий. Номер счётчика хранить в env-переменной. НЕ загружать на админ-страницах.

**Критерии приемки:**
- [ ] Создан компонент `src/components/seo/YandexMetrika.tsx`
- [ ] Создан модуль `src/lib/seo/metrika.ts` с типизированными событиями
- [ ] Компонент добавлен в `src/app/(public)/layout.tsx` (общий layout публичных страниц)
- [ ] Счётчик НЕ загружается на `/admin/*` страницах
- [ ] Настроены цели (цели): calculator_start, calculator_complete, contact_form_submit, phone_click
- [ ] `NEXT_PUBLIC_YANDEX_METRIKA_ID` — env-переменная для номера счётчика
- [ ] Если env не задан — компонент не рендерится (без ошибок)
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `src/components/seo/YandexMetrika.tsx`, `src/lib/seo/metrika.ts`
- env: `NEXT_PUBLIC_YANDEX_METRIKA_ID`
- Использовать `next/script` с `strategy="afterInteractive"`

```typescript
interface MetrikaEvents {
  calculatorStart(type: 'fence' | 'canopy'): void;
  calculatorComplete(type: 'fence' | 'canopy', value: number): void;
  contactFormSubmit(): void;
  phoneClick(): void;
  portfolioView(slug: string): void;
}
```

---

### TASK-BCK-003: Исправить канонические URL на всех страницах

**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** Нет

**Описание:**
Проставить корректные canonical URL на всех публичных страницах. Сейчас только `/calculator/fence` и `/calculator/canopy` имеют canonical — остальные страницы используют `SEO_CONFIG.BASE_URL` (URL главной).

**Критерии приемки:**
- [ ] Каждая публичная страница имеет `<link rel="canonical">` с собственным URL
- [ ] `/` → `https://zabor-i-naves.ru/`
- [ ] `/services` → `https://zabor-i-naves.ru/services`
- [ ] `/portfolio` → `https://zabor-i-naves.ru/portfolio`
- [ ] `/contacts` → `https://zabor-i-naves.ru/contacts`
- [ ] `/calculator` → `https://zabor-i-naves.ru/calculator`
- [ ] Обновить `generatePageMetadata()` чтобы canonical по умолчанию брался из переданного пути
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `src/lib/seo/metadata.ts`, все `metadata.tsx` файлы
- Добавить параметр `path` в `generatePageMetadata()`

---

### TASK-FRT-001: Создать OG-изображения

**Направление:** Frontend  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** Нет

**Описание:**
Создать OG-изображения для всех публичных страниц (1200x630 px). Использовать фирменные цвета, логотип, текст. Потребуется предоставить исходники заказчику или сгенерировать программно.

**Критерии приемки:**
- [ ] Созданы файлы в `public/og/`:
  - `og-main.jpg` — главная (заборы и навесы, калькулятор)
  - `og-services.jpg` — услуги (иконки услуг)
  - `og-calculator.jpg` — калькулятор (расчёт)
  - `og-portfolio.jpg` — портфолио (фото работ)
  - `og-contacts.jpg` — контакты (телефон, email)
- [ ] Размер каждого: 1200x630 px
- [ ] Размер файла: < 200 KB
- [ ] Формат: JPEG (quality 80-85)

**Технические детали:**
- Файлы: `public/og/*.jpg`
- Дизайн: фирменные цвета, логотип, название «Заборы и Навесы», телефон
- Временно можно использовать плейсхолдеры с градиентом и текстом

---

### TASK-BCK-004: Починить /calculator метаданные + robots конфликт

**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 1.5 часа  
**Зависимости:** TASK-BCK-003

**Описание:**
1. Добавить метаданные на страницу `/calculator` (создать metadata.tsx)
2. Добавить `/calculator` в sitemap
3. Удалить статический `public/robots.txt` (мёртвый код, конфликт с `robots.ts`)
4. Добавить директиву `Host: https://zabor-i-naves.ru` и `Crawl-delay: 1` для Yandex в robots.ts

**Критерии приемки:**
- [ ] Создан `src/app/(public)/calculator/metadata.tsx` с title, description, canonical
- [ ] `SITEMAP_CONFIG.pages` включает `/calculator` с priority 0.8
- [ ] Удалён `public/robots.txt`
- [ ] `src/app/robots.ts` содержит:
  - `User-agent: Yandex` → `Crawl-delay: 1`, `Host: https://zabor-i-naves.ru`
  - `User-agent: *` → `Allow: /`, `Disallow: /admin`, `Disallow: /api/auth`, `Disallow: /api/admin`
  - `Allow: /api/contact-info`, `Allow: /api/portfolio`, `Allow: /api/calculator`
  - `Sitemap: https://zabor-i-naves.ru/sitemap.xml`
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `src/app/(public)/calculator/metadata.tsx` (создать), `src/app/sitemap.ts`, `src/app/robots.ts`, `public/robots.txt` (удалить), `src/lib/seo/constants.ts`

---

### TASK-BCK-005: Исправить дубли JSON-LD и неработающий SearchAction

**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** Нет

**Описание:**
1. На главной странице дублируется LocalBusiness (из root layout + из page.tsx через HomeAndConstructionBusiness). Убрать дублирующий, оставить в root layout.
2. SearchAction в WebSite JSON-LD указывает на `/search` — страница не существует. Либо убрать SearchAction, либо создать простую страницу поиска.

**Критерии приемки:**
- [ ] На главной странице ОДИН LocalBusiness/Organization JSON-LD (из root layout)
- [ ] Inline HomeAndConstructionBusiness на главной убран или объединён с root layout
- [ ] SearchAction либо убран из WebSite schema, либо создана страница `/search`
- [ ] JSON-LD валиден через https://validator.schema.org/
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `src/app/page.tsx`, `src/app/layout.tsx`, `src/lib/seo/jsonld.ts`
- Рекомендация: убрать SearchAction (простой вариант), страница поиска не является приоритетом

---

### TASK-INF-001: Инструкция Яндекс.Вебмастер + Яндекс.Бизнес

**Направление:** Infrastructure  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-004 (robots.ts с Host:)

**Описание:**
Создать подробные пошаговые инструкции для владельца бизнеса:
1. Регистрация в Яндекс.Вебмастер, верификация, привязка региона
2. Регистрация в Яндекс.Бизнес / Яндекс.Карты
3. Создание счётчика Яндекс.Метрики
4. Регистрация в 2ГИС

**Критерии приемки:**
- [ ] Создан файл `docs/seo/yandex-webmaster-setup.md` с пошаговой инструкцией
- [ ] Создан файл `docs/seo/yandex-business-setup.md`
- [ ] Создан файл `docs/seo/yandex-metrika-setup.md` (создание счётчика, цели)
- [ ] Создан файл `docs/seo/external-listings.md` (2ГИС, Авито, Профи.ру)
- [ ] Инструкции содержат конкретные данные: телефон, email, город Москва
- [ ] Указано: привязать регион «Москва» в Яндекс.Вебмастер

**Технические детали:**
- Файлы: `docs/seo/*.md`
- Данные для заполнения: +7 (499) 390-15-95, zabori-naves@yandex.ru, Москва, МО

---

### MEDIUM PRIORITY (6 задач)

---

### TASK-BCK-006: Страницы услуг — Backend (Prisma + API)

**Направление:** Backend  
**Приоритет:** Medium  
**Оценка:** 3 часа  
**Зависимости:** Нет

**Описание:**
Активировать неиспользуемую модель `PageContent` для страниц услуг. Добавить поля category, coverImage, priceRange, isActive, sortOrder. Создать API для CRUD страниц услуг. Создать динамический маршрут `/services/[slug]`.

**Критерии приемки:**
- [ ] Миграция добавляет поля в PageContent: category, coverImage, priceRange, isActive, sortOrder
- [ ] Создан API: GET /api/service-pages (список), GET /api/service-pages/[slug] (одна страница)
- [ ] Создан API: POST/PUT/DELETE /api/admin/service-pages (CRUD для админки)
- [ ] Создан динамический маршрут `src/app/(public)/services/[slug]/page.tsx` (SSR, generateStaticParams)
- [ ] Каждая страница услуги имеет уникальные SEO-метаданные из БД
- [ ] JSON-LD: Service schema на каждой странице
- [ ] BreadcrumbList: Главная > Услуги > [Название]
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `prisma/schema.prisma`, `src/app/(public)/services/[slug]/page.tsx`, API routes
- Типы услуг (slug): `zabory-iz-profnastila`, `evroshtaketnik`, `3d-paneli`, `zabory-iz-setki`, `navesy-dlya-avto`, `navesy-iz-polikarbonata`, `vorota-i-kalitki`
- Каждый slug привязан к категории FenceType или CanopyType

---

### TASK-FRT-002: Страницы услуг — Frontend (UI)

**Направление:** Frontend  
**Приоритет:** Medium  
**Оценка:** 3 часа  
**Зависимости:** TASK-BCK-006

**Описание:**
Создать UI для страниц услуг: hero секция, контент, примеры работ из портфолио, FAQ, CTA. Обновить страницу `/services` чтобы показывала ссылки на подстраницы. Добавить хлебные крошки. Добавить CRUD в админ-панель.

**Критерии приемки:**
- [ ] Страница `/services` содержит карточки-ссылки на каждую услугу
- [ ] `/services/[slug]` рендерит: hero, контент, примеры работ, CTA, FAQ
- [ ] Breadcrumbs на всех страницах услуг
- [ ] CRUD в админке: `/admin/references/service-pages`
- [ ] Mobile-friendly адаптивная вёрстка
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `src/app/(public)/services/[slug]/page.tsx`, `src/app/(public)/services/page.tsx`, admin CRUD
- Использовать существующие паттерны из `/admin/references/*`

---

### TASK-BCK-007: Детальные страницы портфолио — Backend

**Направление:** Backend  
**Приоритет:** Medium  
**Оценка:** 2 часа  
**Зависимости:** Нет

**Описание:**
Создать динамический маршрут `/portfolio/[slug]` для каждого проекта. PortfolioItem уже имеет slug (или можно использовать id). Добавить SEO-метаданные для каждого проекта.

**Критерии приемки:**
- [ ] Создан маршрут `src/app/(public)/portfolio/[slug]/page.tsx` (SSR)
- [ ] Используется `generateStaticParams` для пререндера существующих проектов
- [ ] Каждый проект имеет уникальные title, description (из PortfolioItem)
- [ ] JSON-LD: ImageGallery или ItemList для фото
- [ ] BreadcrumbList: Главная > Портфолио > [Название проекта]
- [ ] Sitemap динамически включает все опубликованные проекты
- [ ] Canonical URL: `https://zabor-i-naves.ru/portfolio/[slug]`
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `src/app/(public)/portfolio/[slug]/page.tsx`, `src/app/sitemap.ts` (обновить)
- Данные: `PortfolioItem` из Prisma (title, description, images, category, type)

---

### TASK-BCK-008: FAQ — Backend + Frontend

**Направление:** Backend + Frontend  
**Приоритет:** Medium  
**Оценка:** 3 часа  
**Зависимости:** Нет

**Описание:**
Создать систему FAQ: таблица FaqItem в БД, CRUD в админке, публичная страница `/faq`, блок FAQ на главной и страницах услуг. JSON-LD разметка FAQPage.

**Критерии приемки:**
- [ ] Создана миграция для таблицы `FaqItem`
- [ ] API: GET /api/faq (публичный), CRUD /api/admin/faq
- [ ] Создана страница `/faq` с аккордеоном вопросов-ответов
- [ ] JSON-LD: `FAQPage` schema на странице /faq и в блоках FAQ
- [ ] Блок FAQ на главной странице (3-5 популярных вопросов)
- [ ] CRUD в админке: `/admin/references/faq`
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `prisma/schema.prisma`, `src/app/(public)/faq/`, API routes, admin CRUD
- Начальные данные: 10-15 вопросов о заборах и навесах

---

### TASK-BCK-009: Блог — Backend

**Направление:** Backend  
**Приоритет:** Medium  
**Оценка:** 4 часа  
**Зависимости:** Нет

**Описание:**
Создать полноценный блог: таблица BlogPost, CRUD в админке, публичные маршруты `/blog` и `/blog/[slug]`, SEO для каждой статьи, динамический sitemap.

**Критерии приемки:**
- [ ] Создана миграция для таблицы `BlogPost`
- [ ] API: GET /api/blog (список, пагинация), GET /api/blog/[slug], CRUD /api/admin/blog
- [ ] Маршрут `/blog` — список статей (только published=true)
- [ ] Маршрут `/blog/[slug]` — страница статьи с SSR
- [ ] JSON-LD: `Article` schema на каждой статье
- [ ] BreadcrumbList: Главная > Блог > [Название статьи]
- [ ] Sitemap динамически включает все опубликованные статьи
- [ ] SEO: seoTitle, seoDescription, seoKeywords из БД
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `prisma/schema.prisma`, `src/app/(public)/blog/`, API routes, admin CRUD
- Content: JSONB (TipTap/Editor.js формат) — рендерить через отдельный компонент
- Использовать `generateStaticParams` для ISR

---

### TASK-FRT-003: Блог — Frontend + Хлебные крошки везде

**Направление:** Frontend  
**Приоритет:** Medium  
**Оценка:** 3 часа  
**Зависимости:** TASK-BCK-009

**Описание:**
Создать UI для блога: список статей (карточки), страница статьи (контент + CTA), хлебные крошки на ВСЕХ публичных страницах. Добавить Review/AggregateRating JSON-LD.

**Критерии приемки:**
- [ ] Страница `/blog` — сетка карточек статей с обложкой, заголовком, excerpt, датой
- [ ] Страница `/blog/[slug]` — рендеринг JSON-контента + CTA
- [ ] CRUD в админке: `/admin/references/blog` (с визуальным редактором TipTap)
- [ ] Breadcrumbs компонент добавлен на ВСЕ публичные страницы
- [ ] BreadcrumbList JSON-LD на всех страницах (не только /portfolio)
- [ ] Review + AggregateRating JSON-LD на главной (из модели Review)
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `src/app/(public)/blog/`, admin CRUD, все layout.tsx публичных страниц
- Компонент BlogContent для рендеринга JSON -> HTML
- AggregateRating: средний балл из Review модели, количество отзывов

---

### LOW PRIORITY (3 задачи)

---

### TASK-BCK-010: Гео-страницы для городов МО

**Направление:** Backend + Frontend  
**Приоритет:** Low  
**Оценка:** 4 часа  
**Зависимости:** TASK-BCK-006 (страницы услуг)

**Описание:**
Создать посадочные страницы для городов Московского области: `/gorod/himki`, `/gorod/balashiha`, `/gorod/odintcovo` и т.д. Каждая страница — уникальный контент с названием города, LocalBusiness schema с areaServed, SEO под запросы «заборы в [городе]».

**Критерии приемки:**
- [ ] Создана таблица GeoPage в Prisma
- [ ] Маршрут `/gorod/[slug]` с SSR
- [ ] LocalBusiness JSON-LD с areaServed = [город]
- [ ] Sitemap включает все активные гео-страницы
- [ ] CRUD в админке
- [ ] Контент уникальный для каждого города (НЕ просто подмена названия)
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `prisma/schema.prisma`, `src/app/(public)/gorod/[slug]/`, API, admin
- Города: Химки, Балашиха, Одинцово, Мытищи, Люберцы, Красногорск, Домодедово, Подольск, Щёлково, Электросталь

---

### TASK-BCK-011: Активация CMS PageContent

**Направление:** Backend  
**Приоритет:** Low  
**Оценка:** 2 часа  
**Зависимости:** TASK-BCK-006 (если PageContent используется для услуг)

**Описание:**
Если PageContent НЕ используется для услуг (TASK-BCK-006), активировать его как универсальную CMS для SEO-текстов: блоки текста на главной, тексты в футере, описания категорий и т.д.

**Критерии приемки:**
- [ ] API: GET /api/page-content/[slug] (публичный)
- [ ] Компонент для рендеринга PageContent на любой странице
- [ ] CRUD в админке для управления текстами
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: API routes, admin CRUD
- Использовать поле `content: JSONB` для структурированного контента

---

### TASK-FRT-004: Web Manifest (PWA)

**Направление:** Frontend  
**Приоритет:** Low  
**Оценка:** 0.5 часа  
**Зависимости:** Нет

**Описание:**
Создать `manifest.webmanifest` для PWA-поддержки. Пользователи смогут «установить» сайт на телефон как приложение.

**Критерии приемки:**
- [ ] Создан `public/manifest.webmanifest`
- [ ] Добавлен `<link rel="manifest">` в root layout
- [ ] Указаны: name, short_name, icons (192, 512), theme_color, background_color
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят

**Технические детали:**
- Файлы: `public/manifest.webmanifest`, `src/app/layout.tsx`

---

## 7. Тестирование

### 7.1 Unit-тесты
- Тесты обновлённых SEO-констант (реальные данные)
- Тесты canonical URL для всех страниц
- Тесты новых JSON-LD генераторов (FAQPage, Article, Review)
- Тесты FAQ API
- Тесты Blog API
- Тесты Service Pages API

### 7.2 Integration-тесты
- Sitemap включает динамические страницы (blog, services, portfolio, geo)
- Robots.txt содержит Host: и Crawl-delay
- Каждая публичная страница возвращает корректные meta tags
- JSON-LD валиден на всех страницах
- Яндекс.Метрика загружается на публичных, но НЕ на админ-страницах

### 7.3 Ручное тестирование
- Валидация JSON-LD: https://validator.schema.org/ и https://webmaster.yandex.ru/tools/microtest/
- OG-теги: https://developers.facebook.com/tools/debug/
- Core Web Vitals: https://pagespeed.web.dev/
- Мобильная адаптивность: Chrome DevTools Device Mode

---

## 8. Риски и зависимости

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Яндекс.Метрика замедляет загрузку | Низкая | Среднее | `strategy="afterInteractive"`, загрузка после контента |
| Контент для блога/услуг не готов | Средняя | Высокое | Создать шаблоны с placeholder, заполнить позже через админку |
| Динамические страницы увеличивают время сборки | Средняя | Низкое | ISR вместо SSG для портфолио/блога |
| Яндекс медленно индексирует новые страницы | Высокая | Среднее | Использовать «Переобход страниц» в Яндекс.Вебмастер |
| Geo-страницы могут быть восприняты как дорвеи | Низкая | Высокое | Уникальный контент для каждого города, реальные отличия |

---

## 9. План реализации (рекомендуемый порядок)

### Этап 1: Критические исправления (5-7 часов)
1. **TASK-BCK-001:** Обновить BUSINESS_INFO (0.5h)
2. **TASK-BCK-003:** Исправить canonical URL (1h)
3. **TASK-BCK-004:** Починить /calculator + robots (1.5h)
4. **TASK-BCK-005:** Исправить дубли JSON-LD (1h)
5. **TASK-FRT-001:** OG-изображения (1h)
6. **TASK-BCK-002:** Яндекс.Метрика (2h)

### Этап 2: Инфраструктура контента (10-12 часов)
7. **TASK-BCK-006:** Страницы услуг — Backend (3h)
8. **TASK-FRT-002:** Страницы услуг — Frontend (3h)
9. **TASK-BCK-007:** Детальные страницы портфолио (2h)
10. **TASK-BCK-008:** FAQ — Backend + Frontend (3h)

### Этап 3: Блог и аналитика (8-10 часов)
11. **TASK-BCK-009:** Блог — Backend (4h)
12. **TASK-FRT-003:** Блог — Frontend + хлебные крошки + Review JSON-LD (3h)
13. **TASK-INF-001:** Инструкции Яндекс (1h)

### Этап 4: Дополнительные возможности (6-7 часов)
14. **TASK-BCK-010:** Гео-страницы (4h)
15. **TASK-BCK-011:** CMS PageContent (2h)
16. **TASK-FRT-004:** Web Manifest (0.5h)

**Общая оценка:** 29-36 часов

---

## 10. Согласование

- [ ] Заказчик (бизнес-данные подтверждены: Москва, +74993901595, zabori-naves@yandex.ru)
- [ ] Техлид

---

## 11. Приложения

### A. Целевые поисковые запросы для Яндекса

**Высокочастотные (ВЧ):**
- заборы под ключ москва
- забор из профнастила цена
- установка забора москва
- навес для автомобиля
- калькулятор забора онлайн

**Среднечастотные (СЧ):**
- евроштакетник купить москва
- забор из сетки рабицы цена
- навес из поликарбоната для авто
- 3d панели забор цена
- забор для дачи

**Низкочастотные (НЦ) — целевые:**
- калькулятор забора онлайн бесплатно
- расчёт стоимости забора из профнастила
- забор под ключ с установкой цена москва
- навес для машины из поликарбоната цена
- установка забора из евроштакетника москва

**Гео-запросы:**
- заборы химки
- забор балашиха
- навес одинцово
- забор из профнастила мытищи

### B. Рекомендуемые начальные статьи для блога

1. «Как выбрать забор для дачи: 7 видов материалов, плюсы и минусы»
2. «Забор из профнастила: пошаговая инструкция по установке»
3. «Евроштакетник vs профнастил: что выбрать для забора?»
4. «Навес для автомобиля: из поликарбоната или профнастила?»
5. «Сколько стоит забор на 10 соток: расчёт с примерами»
6. «Забор для частного дома: 50+ фото идей»
7. «3D-панели для забора: обзор, цены, установка»
8. «Какие столбы выбрать для забора: дерево, металл, кирпич»

### C. Начальные FAQ

1. Сколько стоит установка забора?
2. Какие материалы вы используете?
3. Какие гарантии вы даёте?
4. Сколько времени занимает монтаж забора?
5. Вы работаете по договору?
6. Возможна ли оплата в рассрочку?
7. Какой минимальный заказ?
8. Выезда замерщика бесплатный?
9. Работаете ли вы зимой?
10. Какие способы оплаты принимаете?

### D. Ссылки на инструменты

| Инструмент | URL |
|------------|-----|
| Яндекс.Вебмастер | https://webmaster.yandex.ru/ |
| Яндекс.Бизнес | https://business.yandex.ru/ |
| Яндекс.Метрика | https://metrika.yandex.ru/ |
| Валидатор микроданных Яндекса | https://webmaster.yandex.ru/tools/microtest/ |
| Валидатор schema.org | https://validator.schema.org/ |
| Rich Results Test | https://search.google.com/test/rich-results |
| PageSpeed Insights | https://pagespeed.web.dev/ |
| 2ГИС для бизнеса | https://business.2gis.ru/ |

---

*ЧТЗ v2 подготовлено AI-аналитиком на основе полного аудита кодовой базы и лучших практик SEO в Яндексе (2026).*
*Предыдущая версия (v1.0) — базовая инфраструктура — реализована.*
