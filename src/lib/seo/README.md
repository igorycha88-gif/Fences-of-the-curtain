# SEO Module

SEO-модуль для проекта "Заборы и Навесы" предоставляет инструменты для оптимизации сайта для поисковых систем.

## Структура

```
src/lib/seo/
├── constants.ts      # SEO-константы и метаданные страниц
├── types.ts         # TypeScript типы для SEO
├── metadata.ts      # Функции генерации метаданных
└── jsonld.ts        # Функции генерации JSON-LD разметки
```

## Использование

### 1. Добавление метаданных на страницу

Создайте файл `metadata.tsx` в директории страницы:

```tsx
import { Metadata } from 'next';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.home.title,
  description: PAGE_METADATA.home.description,
  keywords: PAGE_METADATA.home.keywords,
  ogImage: PAGE_METADATA.home.ogImage,
  canonical: '/custom-path',
});
```

### 2. Добавление JSON-LD разметки

Создайте файл `layout.tsx` в директории страницы:

```tsx
import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateOrganizationJsonLd } from '@/lib/seo/jsonld';

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const organizationJsonLd = generateOrganizationJsonLd();

  return (
    <>
      <JsonLdScript data={organizationJsonLd} />
      {children}
    </>
  );
}
```

## Константы

### PAGE_METADATA

Содержит предустановленные метаданные для всех страниц:

- `home` - главная страница
- `services` - страница услуг
- `calculatorFence` - калькулятор забора
- `calculatorCanopy` - калькулятор навеса
- `portfolio` - портфолио
- `contacts` - контакты

### SEO_CONFIG

Глобальные настройки SEO:

- `BASE_URL` - базовый URL сайта
- `SITE_NAME` - название сайта
- `DEFAULT_TITLE` - заголовок по умолчанию
- `DEFAULT_DESCRIPTION` - описание по умолчанию
- `DEFAULT_KEYWORDS` - ключевые слова по умолчанию
- `DEFAULT_OG_IMAGE` - изображение Open Graph по умолчанию
- `TWITTER_SITE` - Twitter аккаунт
- `LOCALE` - локаль

## Функции генерации

### generatePageMetadata

Генерирует объект метаданных для страницы.

```typescript
generatePageMetadata(options: {
  title: string;
  description: string;
  keywords?: readonly string[];
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}): Metadata
```

### JSON-LD функции

- `generateOrganizationJsonLd()` - организация
- `generateWebSiteJsonLd()` - сайт
- `generateServiceJsonLd(name, description, priceRange)` - услуга
- `generateWebApplicationJsonLd(name, description, url)` - веб-приложение
- `generateBreadcrumbJsonLd(items)` - хлебные крошки
- `generateContactPageJsonLd()` - страница контактов

## Компоненты

### JsonLdScript

Компонент для вставки JSON-LD разметки.

```tsx
<JsonLdScript data={jsonLdData} />
```

## Тестирование

Запуск тестов SEO-модуля:

```bash
npm test -- --testPathPattern="sitemap|metadata|jsonld"
```

## robots.txt

Статический файл в `public/robots.txt` содержит правила для поисковых роботов.

## sitemap.xml

Динамическая генерация в `src/app/sitemap.ts` автоматически включает все публичные страницы.

## Дополнительно

- Создайте OG-изображения в директории `public/og/`
- Обновите константы в `constants.ts` при изменении информации о компании
- Используйте валидаторы для проверки разметки:
  - https://validator.schema.org/
  - https://search.google.com/test/rich-results
