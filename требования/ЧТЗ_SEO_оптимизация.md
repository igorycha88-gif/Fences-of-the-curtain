# ЧТЗ: SEO-оптимизация сайта "Заборы и Навесы"

## Версия: 1.0
## Дата: 2026-03-23
## Автор: AI-аналитик
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Увеличить органический трафик из поисковых систем (преимущественно Яндекс) для привлечения целевых клиентов — владельцев частных домов и участков, заинтересованных в установке заборов и навесов.

### 1.2 Пользовательская ценность
- Пользователи находят сайт по релевантным запросам в поиске
- Корректное отображение сниппетов в выдаче с привлекательным описанием
- Быстрая индексация новых страниц портфолио

### 1.3 Метрики успеха
| Метрика | Текущее | Цель (3 мес.) | Цель (6 мес.) |
|---------|---------|---------------|---------------|
| Проиндексированных страниц | ~0 | 10+ | 15+ |
| Органический трафик | — | +30% | +100% |
| Позиции по брендовым запросам | — | Топ-10 | Топ-5 |
| Позиции по целевым запросам | — | Топ-50 | Топ-20 |
| Core Web Vitals (LCP) | — | < 2.5s | < 2.0s |

---

## 2. Анализ трендов SEO (2025-2026)

### 2.1 Мировые тренды

| Тренд | Описание | Применимость |
|-------|----------|--------------|
| **Core Web Vitals** | Метрики скорости и стабильности — ключевой фактор ранжирования Google | Обязательно |
| **Mobile-First** | Индексация в первую очередь мобильной версии | Обязательно |
| **E-E-A-T** | Опыт, Экспертиза, Авторитетность, Надёжность | Через контент и отзывы |
| **Structured Data** | JSON-LD разметка для богатых сниппетов | Обязательно |
| **AI в поиске** | SGE (Google), нейропоиск (Яндекс) — ответы прямо в выдаче | Оптимизация под вопросы |

### 2.2 Российские тренды (Яндекс)

| Тренд | Описание | Применимость |
|-------|----------|--------------|
| **Яндекс Вебмастер** | Основной инструмент для работы с индексацией | Обязательно |
| **Толока** | Краудсорсинг для оценки качества сайтов | Косвенно |
| **Яндекс.Карты** | Локальное SEO для геозависимых запросов | Обязательно |
| **Яндекс.Бизнес** | Бесплатное размещение организации | Обязательно |
| **Мобильная версия** | Приоритет мобильной выдачи | Обязательно |
| **Поведенческие факторы** | Время на сайте, отказы, глубина просмотра | Через UX |
| **Региональность** | Геопривязка для разных регионов | Обязательно |

### 2.3 Специфика ниши "Заборы и Навесы"

**Целевые запросы (примеры):**
- "забор из профнастила цена"
- "калькулятор забора онлайн"
- "установка забора под ключ"
- "навес для автомобиля из поликарбоната"
- "заборы и навесы [город]"
- "евроштакетник купить"

**Конкурентные преимущества для SEO:**
- Онлайн-калькулятор (уникальный функционал)
- Портфолио с реальными работами
- Детальные описания услуг

---

## 3. Функциональные требования

### 3.1 User Stories с Acceptance Criteria

#### US-001: Robots.txt
**Как** поисковый робот  
**Я хочу** получать инструкции о том, какие страницы сканировать  
**Чтобы** не тратить ресурсы на служебные страницы

**Acceptance Criteria:**
```gherkin
Given я поисковый робот
When я запрашиваю /robots.txt
Then я получаю ответ 200
And файл содержит разрешение на сканирование публичных страниц
And файл содержит запрет на сканирование /admin, /api/auth
And файл содержит ссылку на sitemap.xml
```

#### US-002: Sitemap.xml
**Как** поисковый робот  
**Я хочу** получать карту сайта  
**Чтобы** быстро найти все страницы для индексации

**Acceptance Criteria:**
```gherkin
Given я поисковый робот
When я запрашиваю /sitemap.xml
Then я получаю ответ 200
And файл содержит все публичные страницы
And файл содержит lastmod для каждой страницы
And файл содержит priority для страниц
And файл валиден по протоколу sitemap 0.9
```

#### US-003: Meta-теги страниц
**Как** пользователь в поиске  
**Я хочу** видеть релевантные заголовки и описания  
**Чтобы** понять, подходит ли мне сайт

**Acceptance Criteria:**
```gherkin
Given я просматриваю выдачу поисковика
When нахожу страницу сайта
Then вижу уникальный title (50-60 символов)
And вижу уникальный description (150-160 символов)
And заголовок содержит ключевые слова
```

#### US-004: Open Graph
**Как** пользователь соцсетей  
**Я хочу** видеть красивую превью-карточку при шаринге  
**Чтобы** понять, о чём ссылка

**Acceptance Criteria:**
```gherkin
Given я делюсь ссылкой в соцсети
When ссылка загружается
Then вижу картинку og:image
And вижу заголовок og:title
And вижу описание og:description
```

#### US-005: Структурированные данные (JSON-LD)
**Как** поисковая система  
**Я хочу** получать структурированную информацию о бизнесе  
**Чтобы** показывать расширенные сниппеты

**Acceptance Criteria:**
```gherkin
Given я поисковая система
When сканирую главную страницу
Then нахожу JSON-LD разметку Organization
And нахожу JSON-LD разметку LocalBusiness
And нахожу JSON-LD разметку WebSite
```

---

## 4. Нефункциональные требования

### 4.1 Производительность

| Метрика | Требование | Приоритет |
|---------|------------|-----------|
| LCP (Largest Contentful Paint) | < 2.5 сек | High |
| FID (First Input Delay) | < 100 мс | High |
| CLS (Cumulative Layout Shift) | < 0.1 | High |
| TTFB (Time to First Byte) | < 600 мс | Medium |
| Размер HTML страницы | < 100 KB | Medium |

### 4.2 Совместимость

| Платформа | Требование |
|-----------|------------|
| Яндекс.Вебмастер | Корректная валидация robots.txt и sitemap.xml |
| Google Search Console | Корректная валидация |
| Валидатор структурированных данных | Без ошибок |
| Mobile-Friendly Test | Пройден |

### 4.3 Безопасность

- robots.txt НЕ должен раскрывать служебные пути
- sitemap.xml НЕ должен содержать секретные URL
- Мета-теги НЕ должны содержать чувствительную информацию

---

## 5. Техническая архитектура

### 5.1 Структура файлов

```
public/
├── robots.txt           # Статический файл (или динамический через API route)
├── sitemap.xml          # Динамическая генерация через API route
└── favicon.svg          # Уже существует

src/app/
├── robots.ts            # API route для robots.txt (опционально)
├── sitemap.ts           # API route для sitemap.xml
├── layout.tsx           # Базовые метаданные (обновить)
├── (public)/
│   ├── page.tsx         # Главная — добавить метаданные
│   ├── services/
│   │   └── page.tsx     # Услуги — добавить метаданные
│   ├── portfolio/
│   │   └── page.tsx     # Портфолио — добавить метаданные
│   ├── contacts/
│   │   └── page.tsx     # Контакты — добавить метаданные
│   └── calculator/
│       ├── page.tsx     # Калькулятор (общий) — добавить метаданные
│       ├── fence/
│       │   └── page.tsx # Калькулятор забора — добавить метаданные
│       └── canopy/
│           └── page.tsx # Калькулятор навеса — добавить метаданные
└── api/
    └── sitemap/
        └── route.ts     # Динамическая генерация sitemap

src/lib/
└── seo/
    ├── metadata.ts      # Функции генерации метаданных
    ├── jsonld.ts        # Шаблоны JSON-LD разметки
    └── constants.ts     # SEO-константы (название компании, домен)
```

### 5.2 API спецификация

#### GET /sitemap.xml

**Описание:** Генерация XML карты сайта

**Response 200:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://zabor-i-naves.ru/</loc>
    <lastmod>2026-03-23</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://zabor-i-naves.ru/services</loc>
    <lastmod>2026-03-23</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... другие страницы ... -->
</urlset>
```

#### GET /robots.txt

**Response 200:**
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Allow: /api/contact-info
Allow: /api/portfolio

Sitemap: https://zabor-i-naves.ru/sitemap.xml
```

### 5.3 Интерфейсы/типы данных

```typescript
// src/lib/seo/types.ts

interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

interface JsonLdOrganization {
  '@context': 'https://schema.org';
  '@type': 'Organization' | 'LocalBusiness';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: {
    '@type': 'PostalAddress';
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    streetAddress?: string;
  };
  telephone?: string;
  email?: string;
  geo?: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification?: {
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }[];
  priceRange?: string;
}

interface JsonLdWebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

interface JsonLdService {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  description: string;
  provider: {
    '@type': 'Organization';
    name: string;
  };
  areaServed?: string[];
  offers?: {
    '@type': 'Offer';
    priceRange?: string;
  };
}
```

---

## 6. UI/UX требования

### 6.1 Мета-теги по страницам

| Страница | Title | Description | Keywords |
|----------|-------|-------------|----------|
| `/` (Главная) | Заборы и Навесы — Онлайн расчёт стоимости | Профессиональная установка заборов и навесов. Калькулятор стоимости онлайн. Гарантия качества, быстрый монтаж. | заборы, навесы, калькулятор забора, установка забора |
| `/services` | Услуги — Заборы и Навесы | Установка заборов из профнастила, евроштакетника, сетки-рабицы. Навесы для авто, беседки, террасы. | забор из профнастила, евроштакетник, навес для авто |
| `/calculator/fence` | Калькулятор забора — Онлайн расчёт цены | Рассчитайте стоимость забора онлайн за 30 секунд. Профнастил, евроштакетник, 3D-панели. | калькулятор забора, расчёт забора, цена забора |
| `/calculator/canopy` | Калькулятор навеса — Онлайн расчёт цены | Рассчитайте стоимость навеса онлайн. Навесы для авто, беседки, террасы из поликарбоната. | калькулятор навеса, расчёт навеса, навес для машины |
| `/portfolio` | Портфолио — Заборы и Навесы | Примеры наших работ: заборы и навесы. Фотографии выполненных проектов с описанием. | портфолио заборы, примеры работ, фото заборов |
| `/contacts` | Контакты — Заборы и Навесы | Свяжитесь с нами для консультации и расчёта стоимости. Телефон, email, адрес. | контакты, телефон, адрес |

### 6.2 Open Graph по страницам

| Страница | og:title | og:description | og:image |
|----------|----------|----------------|----------|
| `/` | Заборы и Навесы | Онлайн расчёт стоимости заборов и навесов | /og-main.jpg |
| `/services` | Наши услуги | Заборы и навесы под ключ | /og-services.jpg |
| `/calculator/*` | Калькулятор | Рассчитайте стоимость онлайн | /og-calculator.jpg |
| `/portfolio` | Портфолио | Примеры наших работ | /og-portfolio.jpg |
| `/contacts` | Контакты | Свяжитесь с нами | /og-contacts.jpg |

### 6.3 Структурированные данные (JSON-LD)

#### Главная страница
```json
[
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://zabor-i-naves.ru/#organization",
    "name": "Заборы и Навесы",
    "url": "https://zabor-i-naves.ru",
    "logo": "https://zabor-i-naves.ru/logo.png",
    "description": "Профессиональная установка заборов и навесов",
    "telephone": "+7-900-123-45-67",
    "email": "info@fences.ru",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Город",
      "addressRegion": "Регион"
    },
    "priceRange": "$$",
    "areaServed": ["Россия"],
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Заборы и Навесы",
    "url": "https://zabor-i-naves.ru",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://zabor-i-naves.ru/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
]
```

#### Страница услуг
```json
[
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Установка забора из профнастила",
    "description": "Профессиональный монтаж заборов из профнастила",
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://zabor-i-naves.ru/#organization"
    },
    "areaServed": "Россия",
    "offers": {
      "@type": "Offer",
      "priceRange": "от 1500 руб/м"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Установка навеса для автомобиля",
    "description": "Навесы из поликарбоната и профнастила для авто",
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://zabor-i-naves.ru/#organization"
    }
  }
]
```

#### Страница калькулятора
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Калькулятор забора",
  "description": "Онлайн расчёт стоимости забора",
  "url": "https://zabor-i-naves.ru/calculator/fence",
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "RUB"
  }
}
```

---

## 7. Декомпозиция на задачи

### Backend

#### TASK-BCK-001: Создание SEO-констант и типов
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** Нет

**Описание:**
Создать файлы с SEO-константами (название компании, домен, контакты) и TypeScript типами для метаданных.

**Критерии приемки:**
- [ ] Создан файл `src/lib/seo/constants.ts` с константами
- [ ] Создан файл `src/lib/seo/types.ts` с интерфейсами
- [ ] Константы включают: BASE_URL, SITE_NAME, DEFAULT_OG_IMAGE
- [ ] Типы включают: PageMetadata, SitemapUrl, JsonLdOrganization и др.

**Технические детали:**
- Файлы: `src/lib/seo/constants.ts`, `src/lib/seo/types.ts`
- BASE_URL = `https://zabor-i-naves.ru`

---

#### TASK-BCK-002: Генерация robots.txt
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** TASK-BCK-001

**Описание:**
Создать статический файл robots.txt в public/ с правилами индексации.

**Критерии приемки:**
- [ ] Создан файл `public/robots.txt`
- [ ] Разрешена индексация публичных страниц
- [ ] Запрещена индексация /admin, /api/auth
- [ ] Указана ссылка на sitemap.xml с полным URL
- [ ] Файл доступен по GET /robots.txt

**Технические детали:**
- Файлы: `public/robots.txt`

```txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Allow: /api/contact-info
Allow: /api/portfolio

Sitemap: https://zabor-i-naves.ru/sitemap.xml
```

---

#### TASK-BCK-003: Динамическая генерация sitemap.xml
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 2 часа  
**Зависимости:** TASK-BCK-001

**Описание:**
Реализовать динамическую генерацию sitemap.xml с использованием Next.js App Router.

**Критерии приемки:**
- [ ] Создан файл `src/app/sitemap.ts` (Next.js 14+ встроенная поддержка)
- [ ] Sitemap включает все статические публичные страницы
- [ ] Для каждой страницы указаны: loc, lastmod, changefreq, priority
- [ ] Файл валиден по протоколу sitemap 0.9
- [ ] Sitemap доступен по GET /sitemap.xml

**Технические детали:**
- Файлы: `src/app/sitemap.ts`
- Страницы для включения:
  - `/` (priority: 1.0, changefreq: weekly)
  - `/services` (priority: 0.8, changefreq: monthly)
  - `/calculator/fence` (priority: 0.9, changefreq: weekly)
  - `/calculator/canopy` (priority: 0.9, changefreq: weekly)
  - `/portfolio` (priority: 0.7, changefreq: weekly)
  - `/contacts` (priority: 0.6, changefreq: monthly)

---

#### TASK-BCK-004: Функции генерации метаданных
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 2 часа  
**Зависимости:** TASK-BCK-001

**Описание:**
Создать утилиты для генерации метаданных страниц с поддержкой Open Graph.

**Критерии приемки:**
- [ ] Создан файл `src/lib/seo/metadata.ts`
- [ ] Функция `generatePageMetadata()` генерирует Metadata объект
- [ ] Поддержка title, description, keywords, canonical, ogImage
- [ ] Поддержка Open Graph тегов
- [ ] Поддержка Twitter Cards
- [ ] Поддержка alternate (canonical URL)

**Технические детали:**
- Файлы: `src/lib/seo/metadata.ts`
- Типы: использовать Metadata из `next`

```typescript
// Пример сигнатуры
export function generatePageMetadata(options: {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}): Metadata;
```

---

#### TASK-BCK-005: JSON-LD утилиты
**Направление:** Backend  
**Приоритет:** Medium  
**Оценка:** 1.5 часа  
**Зависимости:** TASK-BCK-001

**Описание:**
Создать утилиты для генерации JSON-LD разметки.

**Критерии приемки:**
- [ ] Создан файл `src/lib/seo/jsonld.ts`
- [ ] Функция `generateOrganizationJsonLd()` для Organization/LocalBusiness
- [ ] Функция `generateWebSiteJsonLd()` для WebSite
- [ ] Функция `generateServiceJsonLd()` для Service
- [ ] Функция `generateWebApplicationJsonLd()` для калькуляторов
- [ ] Функция `generateBreadcrumbJsonLd()` для хлебных крошек

**Технические детали:**
- Файлы: `src/lib/seo/jsonld.ts`

---

### Frontend

#### TASK-FRT-001: Обновление метаданных layout.tsx
**Направление:** Frontend  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** TASK-BCK-004

**Описание:**
Обновить базовые метаданные в корневом layout с использованием новых утилит.

**Критерии приемки:**
- [ ] Обновлён файл `src/app/layout.tsx`
- [ ] Добавлены Open Graph теги по умолчанию
- [ ] Добавлены Twitter Cards теги
- [ ] Установлен canonical URL
- [ ] Добавлен JSON-LD для Organization

**Технические детали:**
- Файлы: `src/app/layout.tsx`

---

#### TASK-FRT-002: Метаданные главной страницы
**Направление:** Frontend  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-004, TASK-BCK-005

**Описание:**
Добавить метаданные и JSON-LD для главной страницы.

**Критерии приемки:**
- [ ] Добавлен export const metadata в `src/app/page.tsx`
- [ ] Title: "Заборы и Навесы — Онлайн расчёт стоимости"
- [ ] Description: 150-160 символов
- [ ] Добавлен JSON-LD для Organization + WebSite
- [ ] Добавлен canonical URL

**Технические детали:**
- Файлы: `src/app/page.tsx`

---

#### TASK-FRT-003: Метаданные страницы услуг
**Направление:** Frontend  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-004, TASK-BCK-005

**Описание:**
Добавить метаданные и JSON-LD для страницы услуг.

**Критерии приемки:**
- [ ] Добавлен export const metadata в `src/app/(public)/services/page.tsx`
- [ ] Title: "Услуги — Заборы и Навесы"
- [ ] Description: 150-160 символов с ключевыми словами
- [ ] Добавлен JSON-LD для Service (несколько услуг)
- [ ] Добавлен canonical URL

**Технические детали:**
- Файлы: `src/app/(public)/services/page.tsx`

---

#### TASK-FRT-004: Метаданные калькулятора забора
**Направление:** Frontend  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-004, TASK-BCK-005

**Описание:**
Добавить метаданные и JSON-LD для калькулятора забора.

**Критерии приемки:**
- [ ] Добавлен export const metadata
- [ ] Title: "Калькулятор забора — Онлайн расчёт цены"
- [ ] Description: 150-160 символов
- [ ] Добавлен JSON-LD для WebApplication
- [ ] Добавлен canonical URL

**Технические детали:**
- Файлы: `src/app/(public)/calculator/fence/page.tsx`

---

#### TASK-FRT-005: Метаданные калькулятора навеса
**Направление:** Frontend  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** TASK-BCK-004, TASK-BCK-005

**Описание:**
Добавить метаданные и JSON-LD для калькулятора навеса.

**Критерии приемки:**
- [ ] Добавлен export const metadata
- [ ] Title: "Калькулятор навеса — Онлайн расчёт цены"
- [ ] Description: 150-160 символов
- [ ] Добавлен JSON-LD для WebApplication
- [ ] Добавлен canonical URL

**Технические детали:**
- Файлы: `src/app/(public)/calculator/canopy/page.tsx`

---

#### TASK-FRT-006: Метаданные страницы портфолио
**Направление:** Frontend  
**Приоритет:** Medium  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-004, TASK-BCK-005

**Описание:**
Добавить метаданные и JSON-LD для страницы портфолио.

**Критерии приемки:**
- [ ] Добавлен export const metadata
- [ ] Title: "Портфолио — Заборы и Навесы"
- [ ] Description: 150-160 символов
- [ ] Добавлен JSON-LD для ItemList (галерея работ)
- [ ] Добавлен canonical URL

**Технические детали:**
- Файлы: `src/app/(public)/portfolio/page.tsx`

---

#### TASK-FRT-007: Метаданные страницы контактов
**Направление:** Frontend  
**Приоритет:** Medium  
**Оценка:** 0.5 часа  
**Зависимости:** TASK-BCK-004, TASK-BCK-005

**Описание:**
Добавить метаданные и JSON-LD для страницы контактов.

**Критерии приемки:**
- [ ] Добавлен export const metadata
- [ ] Title: "Контакты — Заборы и Навесы"
- [ ] Description: с телефоном и email
- [ ] Добавлен JSON-LD для ContactPage
- [ ] Добавлен canonical URL

**Технические детали:**
- Файлы: `src/app/(public)/contacts/page.tsx`

---

#### TASK-FRT-008: Компонент JsonLdScript
**Направление:** Frontend  
**Приоритет:** Medium  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-005

**Описание:**
Создать React-компонент для вставки JSON-LD разметки в страницы.

**Критерии приемки:**
- [ ] Создан компонент `src/components/seo/JsonLdScript.tsx`
- [ ] Принимает данные JSON-LD в props
- [ ] Рендерит <script type="application/ld+json">
- [ ] Поддерживает массив схем
- [ ] Работает как Client Component

**Технические детали:**
- Файлы: `src/components/seo/JsonLdScript.tsx`

```typescript
interface JsonLdScriptProps {
  data: object | object[];
}

export default function JsonLdScript({ data }: JsonLdScriptProps);
```

---

#### TASK-FRT-009: OG-изображения
**Направление:** Frontend  
**Приоритет:** Medium  
**Оценка:** 2 часа  
**Зависимости:** Нет

**Описание:**
Создать или подготовить OG-изображения для страниц.

**Критерии приемки:**
- [ ] Созданы изображения в `public/og/`:
  - `og-main.jpg` (1200x630 px)
  - `og-services.jpg` (1200x630 px)
  - `og-calculator.jpg` (1200x630 px)
  - `og-portfolio.jpg` (1200x630 px)
  - `og-contacts.jpg` (1200x630 px)
- [ ] Изображения оптимизированы (< 200 KB каждое)
- [ ] Формат: JPEG или PNG

**Технические детали:**
- Файлы: `public/og/*.jpg`
- Размер: 1200x630 px (рекомендация Facebook/LinkedIn)

---

### Infrastructure

#### TASK-INF-001: Проверка Core Web Vitals
**Направление:** Infrastructure  
**Приоритет:** Medium  
**Оценка:** 1 час  
**Зависимости:** TASK-FRT-001..TASK-FRT-007

**Описание:**
Провести аудит Core Web Vitals и выявить проблемы производительности.

**Критерии приемки:**
- [ ] Проведён тест через PageSpeed Insights
- [ ] Зафиксированы метрики LCP, FID, CLS
- [ ] Выявлены проблемы (если есть)
- [ ] Создан отчёт с рекомендациями

**Технические детали:**
- Инструменты: PageSpeed Insights, Lighthouse

---

#### TASK-INF-002: Настройка Яндекс.Вебмастер
**Направление:** Infrastructure  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-002, TASK-BCK-003

**Описание:**
Подготовить инструкции по добавлению сайта в Яндекс.Вебмастер.

**Критерии приемки:**
- [ ] Создана инструкция в `docs/yandex-webmaster-setup.md`
- [ ] Описаны шаги: добавление сайта, подтверждение прав
- [ ] Описана отправка sitemap.xml на индексацию
- [ ] Описана проверка robots.txt

**Технические детали:**
- Файлы: `docs/yandex-webmaster-setup.md`

---

#### TASK-INF-003: Настройка Яндекс.Бизнес
**Направление:** Infrastructure  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** Нет

**Описание:**
Подготовить инструкции по регистрации в Яндекс.Бизнес для локального SEO.

**Критерии приемки:**
- [ ] Создана инструкция в `docs/yandex-business-setup.md`
- [ ] Описаны шаги регистрации организации
- [ ] Указаны данные для заполнения: название, адрес, телефон, часы работы
- [ ] Описана привязка к Яндекс.Картам

**Технические детали:**
- Файлы: `docs/yandex-business-setup.md`

---

### Testing

#### TASK-TST-001: Тесты валидации sitemap
**Направление:** Testing  
**Приоритет:** Medium  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-003

**Описание:**
Написать тесты для проверки корректности генерации sitemap.xml.

**Критерии приемки:**
- [ ] Создан тест `src/app/__tests__/sitemap.test.ts`
- [ ] Тест проверяет наличие всех статических страниц
- [ ] Тест проверяет валидность XML структуры
- [ ] Тест проверяет наличие обязательных полей (loc, lastmod, priority)

**Технические детали:**
- Файлы: `src/app/__tests__/sitemap.test.ts`

---

#### TASK-TST-002: Тесты метаданных страниц
**Направление:** Testing  
**Приоритет:** Medium  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-004

**Описание:**
Написать тесты для функций генерации метаданных.

**Критерии приемки:**
- [ ] Создан тест `src/lib/seo/__tests__/metadata.test.ts`
- [ ] Тест проверяет генерацию title с правильным форматом
- [ ] Тест проверяет ограничение description (150-160 символов)
- [ ] Тест проверяет генерацию Open Graph тегов

**Технические детали:**
- Файлы: `src/lib/seo/__tests__/metadata.test.ts`

---

#### TASK-TST-003: Тесты JSON-LD
**Направление:** Testing  
**Приоритет:** Medium  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-005

**Описание:**
Написать тесты для функций генерации JSON-LD.

**Критерии приемки:**
- [ ] Создан тест `src/lib/seo/__tests__/jsonld.test.ts`
- [ ] Тест проверяет структуру Organization schema
- [ ] Тест проверяет структуру WebSite schema
- [ ] Тест проверяет наличие обязательных полей @context, @type

**Технические детали:**
- Файлы: `src/lib/seo/__tests__/jsonld.test.ts`

---

### Documentation

#### TASK-DOC-001: Документация SEO-модуля
**Направление:** Documentation  
**Приоритет:** Low  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-001..TASK-BCK-005

**Описание:**
Создать документацию по SEO-модулю для разработчиков.

**Критерии приемки:**
- [ ] Создан файл `src/lib/seo/README.md`
- [ ] Описаны все экспортируемые функции
- [ ] Приведены примеры использования
- [ ] Описано добавление метаданных для новых страниц

**Технические детали:**
- Файлы: `src/lib/seo/README.md`

---

## 8. Тестирование

### 8.1 Unit-тесты
- Тесты функций генерации метаданных
- Тесты функций генерации JSON-LD
- Тесты генерации sitemap

### 8.2 Integration-тесты
- Проверка доступности /robots.txt
- Проверка доступности /sitemap.xml
- Проверка мета-тегов на страницах

### 8.3 Ручное тестирование
- Валидация robots.txt через Яндекс.Вебмастер
- Валидация sitemap.xml через Яндекс.Вебмастер
- Валидация структурированных данных через:
  - https://validator.schema.org/
  - https://search.google.com/test/rich-results
- Проверка OG-тегов через:
  - https://developers.facebook.com/tools/debug/
  - https://cards-dev.twitter.com/validator
- Проверка Core Web Vitals через PageSpeed Insights

### 8.4 Тестовые данные
```typescript
const TEST_PAGES = [
  { path: '/', expectedTitle: 'Заборы и Навесы' },
  { path: '/services', expectedTitle: 'Услуги' },
  { path: '/calculator/fence', expectedTitle: 'Калькулятор забора' },
  { path: '/calculator/canopy', expectedTitle: 'Калькулятор навеса' },
  { path: '/portfolio', expectedTitle: 'Портфолио' },
  { path: '/contacts', expectedTitle: 'Контакты' },
];
```

---

## 9. Риски и зависимости

### 9.1 Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Клиентские компоненты ('use client') не поддерживают generateMetadata | Средняя | Высокое | Использовать layout.tsx или отдельный файл metadata.ts |
| Динамические данные из БД для метаданных | Низкая | Среднее | Использовать generateStaticParams или ISR |
| Изменение домена | Низкая | Высокое | Вынести домен в константу |

### 9.2 Зависимости

| Зависимость | Тип | Описание |
|-------------|-----|----------|
| Next.js 14+ | Техническая | Встроенная поддержка sitemap.ts и metadata API |
| Production домен | Внешняя | Необходим для тестирования в поисковых системах |
| Доступ к Яндекс.Вебмастер | Внешний | Для проверки индексации |

---

## 10. План реализации (рекомендуемый порядок)

### Этап 1: Базовая инфраструктура (2-3 часа)
1. TASK-BCK-001: SEO-константы и типы
2. TASK-BCK-002: robots.txt
3. TASK-BCK-003: sitemap.xml
4. TASK-BCK-004: Функции метаданных

### Этап 2: Мета-теги страниц (4-5 часов)
5. TASK-FRT-001: Обновление layout.tsx
6. TASK-FRT-002: Главная страница
7. TASK-FRT-003: Страница услуг
8. TASK-FRT-004: Калькулятор забора
9. TASK-FRT-005: Калькулятор навеса
10. TASK-FRT-006: Портфолио
11. TASK-FRT-007: Контакты

### Этап 3: Структурированные данные (2-3 часа)
12. TASK-BCK-005: JSON-LD утилиты
13. TASK-FRT-008: Компонент JsonLdScript

### Этап 4: OG-изображения и тестирование (3-4 часа)
14. TASK-FRT-009: OG-изображения
15. TASK-TST-001..TASK-TST-003: Тесты
16. TASK-INF-001: Core Web Vitals

### Этап 5: Документация и инструкции (2 часа)
17. TASK-INF-002: Яндекс.Вебмастер
18. TASK-INF-003: Яндекс.Бизнес
19. TASK-DOC-001: Документация

**Общая оценка:** 13-17 часов

---

## 11. Согласование

- [ ] Заказчик
- [ ] Техлид

---

## 12. Приложения

### A. Ссылки на инструменты

| Инструмент | URL |
|------------|-----|
| Яндекс.Вебмастер | https://webmaster.yandex.ru/ |
| Яндекс.Бизнес | https://business.yandex.ru/ |
| Google Search Console | https://search.google.com/search-console |
| Валидатор schema.org | https://validator.schema.org/ |
| Rich Results Test | https://search.google.com/test/rich-results |
| Facebook Debugger | https://developers.facebook.com/tools/debug/ |
| Twitter Card Validator | https://cards-dev.twitter.com/validator |
| PageSpeed Insights | https://pagespeed.web.dev/ |
| Robots.txt Tester | https://webmaster.yandex.ru/tools/robotstxt/ |

### B. Рекомендуемые целевые запросы

**Высокочастотные:**
- заборы под ключ
- забор из профнастила цена
- установка забора
- навес для автомобиля
- калькулятор забора

**Среднечастотные:**
- евроштакетник купить
- забор из сетки рабицы
- навес из поликарбоната
- 3d панели забор
- калькулятор навеса

**Низкочастотные (целевые):**
- калькулятор забора онлайн бесплатно
- расчёт стоимости забора из профнастила
- забор под ключ с установкой цена
- навес для машины из поликарбоната цена

---

*ЧТЗ подготовлено AI-аналитиком в соответствии с методологией SKILL_ANALYST.md*
