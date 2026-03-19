# ЧТЗ: Внедрение Security Headers в Next.js

## Версия: 1.0
## Дата: 2026-03-18
## Автор: AI-аналитик
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Защитить веб-приложение от распространённых веб-уязвимостей (XSS, clickjacking, MIME sniffing, MITM) путём внедрения security headers согласно рекомендациям OWASP и современных стандартов безопасности.

### 1.2 Пользовательская ценность
- Защита пользовательских данных от кражи через XSS атаки
- Предотвращение фишинговых атак через iframe embedding (clickjacking)
- Гарантия использования защищённого HTTPS соединения
- Повышение доверия пользователей к безопасности приложения

### 1.3 Метрики успеха
- **Покрытие security headers**: 100% страниц имеют все 8 security headers
- **Score безопасности**: A+ на securityheaders.com
- **Отсутствие регрессий**: все существующие функции работают корректно
- **Производительность**: время загрузки страницы не увеличивается более чем на 5%

---

## 2. Функциональные требования

### 2.1 User Stories с Acceptance Criteria

#### US-001: Защита от XSS атак через CSP
**Как** пользователь системы  
**Я хочу**, чтобы все скрипты выполнялись только из доверенных источников  
**Чтобы** защитить свои данные от кражи через вредоносные скрипты

**Acceptance Criteria:**
```
GIVEN приложение развёрнуто в production
WHEN загружается любая страница
THEN в ответе присутствует заголовок Content-Security-Policy
AND CSP содержит nonce для inline-скриптов
AND CSP разрешает только указанные домены для скриптов
AND вредоносные скрипты блокируются браузером
```

#### US-002: Защита от clickjacking
**Как** пользователь системы  
**Я хочу**, чтобы приложение нельзя было встроить в iframe на сторонних сайтах  
**Чтобы** защититься от атак подмены интерфейса

**Acceptance Criteria:**
```
GIVEN злоумышленник пытается встроить приложение в iframe
WHEN пользователь заходит на страницу злоумышленника
THEN браузер блокирует отображение приложения в iframe
AND присутствует заголовок X-Frame-Options: SAMEORIGIN
```

#### US-003: Принудительное использование HTTPS
**Как** пользователь системы  
**Я хочу**, чтобы все соединения использовали HTTPS  
**Чтобы** защитить передаваемые данные от перехвата

**Acceptance Criteria:**
```
GIVEN приложение развёрнуто в production с HTTPS
WHEN пользователь пытается зайти на HTTP версию
THEN браузер автоматически перенаправляет на HTTPS
AND заголовок Strict-Transport-Security присутствует в ответе
AND HSTS max-age >= 31536000 (1 год)
```

#### US-004: Корректная работа Яндекс.Метрики
**Как** администратор системы  
**Я хочу**, чтобы Яндекс.Метрика продолжала работать после внедрения CSP  
**Чтобы** собирать аналитику использования приложения

**Acceptance Criteria:**
```
GIVEN внедрён CSP с nonce
WHEN загружается страница с Яндекс.Метрикой
THEN скрипты Метрики успешно загружаются и выполняются
AND данные отправляются на mc.yandex.ru
AND в console нет CSP violation ошибок
```

#### US-005: Корректная работа Google reCAPTCHA (если используется)
**Как** пользователь системы  
**Я хочу**, чтобы Google reCAPTCHA работала после внедрения CSP  
**Чтобы** могла пройти верификацию

**Acceptance Criteria:**
```
GIVEN внедрён CSP с nonce
WHEN загружается страница с reCAPTCHA
THEN iframe reCAPTCHA отображается корректно
AND верификация проходит успешно
AND в console нет CSP violation ошибок
```

---

## 3. Нефункциональные требования

### 3.1 Производительность
- **Время генерации nonce**: < 1ms на запрос
- **Влияние на время загрузки страницы**: увеличение не более 5%
- **Размер заголовков**: сумма всех security headers < 2KB

### 3.2 Безопасность

#### 3.2.1 Обязательные Security Headers

| Header | Value | OWASP Category |
|--------|-------|----------------|
| Content-Security-Policy | nonce-based, строгая политика | A10:2021 - SSRF |
| X-Frame-Options | SAMEORIGIN | A01:2021 - Broken Access Control |
| X-Content-Type-Options | nosniff | A05:2021 - Security Misconfiguration |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | A02:2021 - Cryptographic Failures |
| Referrer-Policy | strict-origin-when-cross-origin | A01:2021 - Broken Access Control |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | A05:2021 - Security Misconfiguration |
| X-DNS-Prefetch-Control | off | A05:2021 - Security Misconfiguration |
| X-XSS-Protection | 1; mode=block | Legacy (для старых браузеров) |

#### 3.2.2 CSP Content-Security-Policy спецификация

**Nonce-based CSP:**
```
default-src 'self';
script-src 'self' 'nonce-{RANDOM}' https://mc.yandex.ru https://www.google.com https://www.gstatic.com;
style-src 'self' 'nonce-{RANDOM}' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' https://mc.yandex.ru;
frame-src https://www.google.com https://www.gstatic.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'self';
```

**Примечания:**
- `'unsafe-inline'` в style-src допустим временно (CSS атаки менее критичны)
- `object-src 'none'` - блокирует Flash/Java плагины
- `base-uri 'self'` - защита от base tag injection
- `form-action 'self'` - защита от отправки форм на сторонние домены
- `frame-ancestors 'self'` - современная альтернатива X-Frame-Options

#### 3.2.3 HSTS спецификация
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- `max-age=31536000`: 1 год в секундах
- `includeSubDomains`: применяется ко всем поддоменам
- `preload`: возможность добавления в HSTS preload list браузеров

### 3.3 Масштабируемость
- Решение должно работать при горизонтальном масштабировании (несколько инстансов)
- Nonce генерация не требует синхронизации между инстансами

### 3.4 Совместимость
- Поддержка современных браузеров (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Graceful degradation для старых браузеров (IE11 не поддерживается)

---

## 4. Техническая архитектура

### 4.1 Изменения в файлах

#### 4.1.1 Модификация next.config.js
**Файл:** `next.config.js`

**Текущее состояние:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['localhost'],
    remotePatterns: [],
  },
};

module.exports = nextConfig;
```

**Требуемое состояние:**
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['localhost'],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ];
  }
};

module.exports = nextConfig;
```

#### 4.1.2 Создание middleware для CSP с nonce
**Файл:** `src/middleware.ts` (новый файл)

**Назначение:** Генерация nonce и добавление CSP header динамически

**Код:**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString('base64');
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://mc.yandex.ru https://www.google.com https://www.gstatic.com;
    style-src 'self' 'nonce-${nonce}' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https://mc.yandex.ru;
    frame-src https://www.google.com https://www.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  const response = NextResponse.next();
  
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### 4.1.3 Обновление _document.tsx для nonce
**Файл:** `src/pages/_document.tsx` или `src/app/layout.tsx` (в зависимости от используемого роутера)

**Изменения:**
- Добавить nonce к `<script>` тегам
- Добавить nonce к `<style>` тегам

**Пример для Pages Router (_document.tsx):**
```typescript
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document({ nonce }: { nonce?: string }) {
  return (
    <Html>
      <Head nonce={nonce} />
      <body>
        <Main />
        <NextScript nonce={nonce} />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: any) => {
  const initialProps = await ctx.defaultGetInitialProps(ctx);
  const nonce = ctx.req?.headers['x-nonce'] || '';
  return { ...initialProps, nonce };
};
```

**Пример для App Router (layout.tsx):**
```typescript
import { headers } from 'next/headers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get('x-nonce') || '';
  
  return (
    <html lang="ru">
      <head>
        <script nonce={nonce} src="https://mc.yandex.ru/metrika/tag.js" async />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 4.2 Интерфейсы/типы данных

```typescript
interface SecurityHeader {
  key: string;
  value: string;
}

interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'object-src': string[];
  'base-uri': string[];
  'form-action': string[];
  'frame-ancestors': string[];
}

type Nonce = string; // Base64 encoded 16 bytes
```

### 4.3 Зависимости от внешних сервисов

| Сервис | Домены в CSP | Назначение |
|--------|--------------|------------|
| Яндекс.Метрика | mc.yandex.ru | Аналитика |
| Google reCAPTCHA | www.google.com, www.gstatic.com | Антибот защита |

---

## 5. UI/UX требования

### 5.1 Отсутствие визуальных изменений
- Внедрение security headers НЕ должно влиять на UI/UX
- Все страницы должны отображаться идентично текущей версии

### 5.2 Обработка ошибок CSP

#### 5.2.1 CSP Violation Reporting (опционально)
**Рекомендуется добавить CSP reporting endpoint для мониторинга нарушений:**

```
report-uri /api/csp-report;
report-to csp-endpoint;
```

**Endpoint:** `POST /api/csp-report`

**Логирование:**
- Все CSP violations должны логироваться
- Не блокировать пользователя, только логировать (report-only режим на первом этапе)

### 5.3 Console Errors
- При корректной реализации в console браузера НЕ должно быть CSP violation ошибок
- Если ошибки есть - это баг, требующий исправления

---

## 6. Декомпозиция на задачи

### Backend / Infrastructure

#### TASK-INF-001: Добавление статических security headers в next.config.js
**Направление:** Infrastructure  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** Нет

**Описание:**
Добавить массив securityHeaders в next.config.js и функцию headers() для выдачи статических заголовков (все кроме CSP).

**Критерии приемки:**
- [ ] next.config.js содержит массив securityHeaders
- [ ] Функция headers() возвращает все статические заголовки
- [ ] Заголовки применяются ко всем маршрутам (source: '/:path*')
- [ ] `npm run build` завершается успешно
- [ ] `npm run dev` запускается без ошибок

**Технические детали:**
- Файлы: `next.config.js`
- Заголовки: X-DNS-Prefetch-Control, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, Strict-Transport-Security

---

#### TASK-INF-002: Создание middleware для генерации nonce и CSP
**Направление:** Infrastructure  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** Нет

**Описание:**
Создать middleware.ts, который генерирует уникальный nonce для каждого запроса и добавляет Content-Security-Policy header с этим nonce.

**Критерии приемки:**
- [ ] Файл `src/middleware.ts` создан
- [ ] Middleware генерирует криптографически стойкий nonce (16 bytes, base64)
- [ ] CSP header содержит nonce в директивах script-src и style-src
- [ ] Nonce передаётся через response header `x-nonce`
- [ ] Middleware НЕ применяется к /api, /_next/static, /_next/image, favicon.ico
- [ ] `npm run build` завершается успешно

**Технические детали:**
- Файлы: `src/middleware.ts`
- Использовать `crypto.randomBytes(16).toString('base64')`
- Matcher pattern: `/((?!api|_next/static|_next/image|favicon.ico).*)`

---

#### TASK-INF-003: Обновление _document.tsx для передачи nonce в компоненты
**Направление:** Infrastructure  
**Приоритет:** High  
**Оценка:** 1.5 часа  
**Зависимости:** TASK-INF-002

**Описание:**
Обновить _document.tsx для получения nonce из request headers и передачи его в Head, Main и NextScript компоненты.

**Критерии приемки:**
- [ ] _document.tsx извлекает nonce из req.headers['x-nonce']
- [ ] nonce передаётся в Head компонент
- [ ] nonce передаётся в NextScript компонент
- [ ] При отсутствии nonce (SSG) приложение не падает
- [ ] `npm run build` завершается успешно
- [ ] `npm run dev` работает корректно

**Технические детали:**
- Файлы: `src/pages/_document.tsx` (Pages Router) или `src/app/layout.tsx` (App Router)
- Использовать `Document.getInitialProps` для Pages Router
- Использовать `headers()` из `next/headers` для App Router

---

#### TASK-INF-004: Обновление inline скриптов для использования nonce
**Направление:** Infrastructure  
**Приоритет:** High  
**Оценка:** 2 часа  
**Зависимости:** TASK-INF-002, TASK-INF-003

**Описание:**
Найти все inline `<script>` теги в приложении и добавить к ним атрибут `nonce={nonce}`. Это включает Яндекс.Метрику и другие inline скрипты.

**Критерии приемки:**
- [ ] Все inline `<script>` теги имеют атрибут `nonce`
- [ ] Яндекс.Метрика загружается и работает
- [ ] В console браузера НЕТ CSP violation ошибок
- [ ] `npm run build` завершается успешно
- [ ] Ручное тестирование: метрика отправляет данные

**Технические детали:**
- Файлы: `src/pages/_document.tsx`, `src/app/layout.tsx`, компоненты с inline скриптами
- Искать: `<script>`, `<Script>` из next/script
- Для Next.js Script компонента: `<Script nonce={nonce} ... />`

---

#### TASK-INF-005: Обновление inline стилей для использования nonce (опционально)
**Направление:** Infrastructure  
**Приоритет:** Medium  
**Оценка:** 1 час  
**Зависимости:** TASK-INF-002, TASK-INF-003

**Описание:**
Найти все inline `<style>` теги и добавить к ним атрибут `nonce={nonce}`. Обновить styled-components или emotion конфигурацию, если используются.

**Критерии приемки:**
- [ ] Все inline `<style>` теги имеют атрибут `nonce`
- [ ] CSS-in-JS библиотеки (если есть) настроены для работы с nonce
- [ ] Стили применяются корректно
- [ ] В console браузера НЕТ CSP violation ошибок
- [ ] `npm run build` завершается успешно

**Технические детали:**
- Файлы: компоненты с inline стилями, конфигурация styled-components/emotion
- Для styled-components: использовать `StyleSheetManager` с `nonce`
- Для emotion: использовать `CacheProvider` с `nonce`

---

### Testing

#### TASK-TST-001: Unit-тесты для middleware nonce генерации
**Направление:** Testing  
**Приоритет:** Medium  
**Оценка:** 1 час  
**Зависимости:** TASK-INF-002

**Описание:**
Написать unit-тесты для middleware, проверяющие генерацию nonce и формирование CSP header.

**Критерии приемки:**
- [ ] Тест проверяет, что nonce генерируется (не пустой)
- [ ] Тест проверяет, что nonce уникален между запросами
- [ ] Тест проверяет наличие CSP header в ответе
- [ ] Тест проверяет корректность matcher pattern
- [ ] Покрытие middleware ≥ 90%
- [ ] `npm run test` проходит успешно

**Технические детали:**
- Файлы: `__tests__/middleware.test.ts`
- Использовать Jest + mock NextRequest/NextResponse

---

#### TASK-TST-002: Integration-тесты для security headers
**Направление:** Testing  
**Приоритет:** High  
**Оценка:** 1.5 часа  
**Зависимости:** TASK-INF-001, TASK-INF-002

**Описание:**
Написать integration-тесты, проверяющие наличие всех security headers в ответе сервера.

**Критерии приемки:**
- [ ] Тест проверяет наличие всех 8 security headers
- [ ] Тест проверяет корректность значений headers
- [ ] Тест проверяет наличие nonce в CSP header
- [ ] Тест проверяет, что nonce в CSP совпадает с x-nonce header
- [ ] Тест проверяет headers на разных маршрутах (/, /admin, /api)
- [ ] `npm run test` проходит успешно

**Технические детали:**
- Файлы: `__tests__/integration/security-headers.test.ts`
- Использовать supertest или fetch к запущенному серверу
- Проверять: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Content-Security-Policy и др.

---

#### TASK-TST-003: E2E тест для проверки работы Яндекс.Метрики с CSP
**Направление:** Testing  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** TASK-INF-004

**Описание:**
Написать E2E тест (Playwright/Cypress), проверяющий загрузку и работу Яндекс.Метрики с внедрённым CSP.

**Критерии приемки:**
- [ ] Тест открывает главную страницу
- [ ] Тест проверяет отсутствие CSP violation в console
- [ ] Тест проверяет, что скрипт Яндекс.Метрики загрузился
- [ ] Тест проверяет, что глобальный объект yaCounter существует
- [ ] Тест выполняется успешно в CI/CD

**Технические детали:**
- Файлы: `__tests__/e2e/yandex-metrica-csp.spec.ts` (Playwright) или аналогичный
- Проверять `window.yaCounterXXXXXX` или `window.ym`

---

#### TASK-TST-004: Ручное тестирование security headers
**Направление:** Testing  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** TASK-INF-001, TASK-INF-002, TASK-INF-003, TASK-INF-004

**Описание:**
Выполнить ручное тестирование для проверки корректности security headers с помощью внешних инструментов.

**Критерии приемки:**
- [ ] Проверка на https://securityheaders.com/ - score A или A+
- [ ] Проверка в Chrome DevTools → Network → Response Headers
- [ ] Проверка отсутствия CSP violations в Console
- [ ] Проверка работы Яндекс.Метрики (отправка hit)
- [ ] Проверка работы Google reCAPTCHA (если используется)
- [ ] Проверка HTTPS redirect (HSTS)

**Технические детали:**
- Инструменты: securityheaders.com, Chrome DevTools, Observatory by Mozilla
- Скриншоты результатов приложить к PR

---

### Documentation

#### TASK-DOC-001: Обновление README.md с информацией о security headers
**Направление:** Documentation  
**Приоритет:** Low  
**Оценка:** 0.5 часа  
**Зависимости:** TASK-INF-001, TASK-INF-002

**Описание:**
Добавить раздел о security headers в README.md с описанием внедрённых заголовков и их назначения.

**Критерии приемки:**
- [ ] README.md содержит раздел "Security"
- [ ] Описаны все внедрённые security headers
- [ ] Указано, как тестировать security headers
- [ ] Указаны домены, разрешённые в CSP
- [ ] Документация актуальна и понятна

**Технические детали:**
- Файлы: `README.md`
- Добавить ссылку на OWASP и securityheaders.com

---

#### TASK-DOC-002: Создание документа по CSP maintenance
**Направление:** Documentation  
**Приоритет:** Low  
**Оценка:** 0.5 часа  
**Зависимости:** TASK-INF-002

**Описание:**
Создать документ CSP_MAINTENANCE.md с инструкциями по обновлению CSP при добавлении новых внешних ресурсов.

**Критерии приемки:**
- [ ] Файл CSP_MAINTENANCE.md создан
- [ ] Описан процесс добавления нового домена в CSP
- [ ] Описан процесс отладки CSP violations
- [ ] Приведены примеры типичных проблем и решений
- [ ] Документ актуален для текущей реализации

**Технические детали:**
- Файлы: `CSP_MAINTENANCE.md`
- Включить примеры: как добавить новый CDN, аналитику, виджет

---

## 7. Тестирование

### 7.1 Unit-тесты
**Файлы:**
- `__tests__/middleware.test.ts`

**Покрытие:**
- Middleware: ≥ 90%

**Тест-кейсы:**
1. Генерация nonce - проверка формата и уникальности
2. Формирование CSP header - проверка всех директив
3. Matcher pattern - проверка исключения /api, /_next/static

### 7.2 Integration-тесты
**Файлы:**
- `__tests__/integration/security-headers.test.ts`

**Тест-кейсы:**
1. Проверка наличия всех security headers на GET /
2. Проверка значений headers (X-Frame-Options, HSTS, etc.)
3. Проверка CSP nonce в ответе
4. Проверка headers на разных маршрутах

### 7.3 E2E тесты
**Файлы:**
- `__tests__/e2e/yandex-metrica-csp.spec.ts`

**Тест-кейсы:**
1. Загрузка страницы без CSP violations
2. Корректная работа Яндекс.Метрики
3. Отсутствие ошибок в console

### 7.4 Ручное тестирование

#### 7.4.1 Инструменты для проверки
1. **securityheaders.com** - комплексная проверка
2. **Chrome DevTools → Network** - проверка response headers
3. **Chrome DevTools → Console** - проверка CSP violations
4. **curl** - проверка headers через CLI

#### 7.4.2 Команды для проверки

**Проверка всех headers:**
```bash
curl -I https://your-domain.com
```

**Проверка CSP:**
```bash
curl -I https://your-domain.com | grep -i content-security-policy
```

**Проверка HSTS:**
```bash
curl -I https://your-domain.com | grep -i strict-transport-security
```

### 7.5 Тестовые данные

#### 7.5.1 Ожидаемые значения headers

| Header | Expected Value |
|--------|---------------|
| X-DNS-Prefetch-Control | off |
| X-Frame-Options | SAMEORIGIN |
| X-Content-Type-Options | nosniff |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload |
| Content-Security-Policy | (содержит nonce) |

---

## 8. Риски и зависимости

### 8.1 Риски

#### Риск 1: Поломка inline скриптов (Вероятность: Medium, Влияние: High)
**Описание:** Inline скрипты без nonce перестанут выполняться  
**Митигация:** 
- Тщательный поиск всех inline скриптов
- Тестирование всех страниц
- CSP Report-Only режим на первом этапе

#### Риск 2: Поломка внешних сервисов (Вероятность: Medium, Влияние: High)
**Описание:** Яндекс.Метрика или другие сервисы перестанут работать  
**Митигация:**
- Явное разрешение доменов в CSP
- Тестирование работы сервисов после внедрения
- E2E тесты для критичных сервисов

#### Риск 3: HSTS preload list (Вероятность: Low, Влияние: High)
**Описание:** После добавления в preload list невозможно быстро отключить HTTPS  
**Митигация:**
- Не отправлять запрос на preload сразу
- Убедиться в стабильности HTTPS перед отправкой
- max-age установить на 1 год (стандарт)

#### Риск 4: Производительность middleware (Вероятность: Low, Влияние: Medium)
**Описание:** Middleware может увеличить время ответа  
**Митигация:**
- Оптимизация кода middleware
- Мониторинг времени ответа
- Ограничение matcher pattern

### 8.2 Зависимости

#### Зависимость 1: HTTPS должен быть настроен
**Описание:** HSTS требует работающего HTTPS  
**Статус:** Проверить перед началом работ  
**Действие:** Убедиться, что production использует HTTPS

#### Зависимость 2: Next.js версия 14.2+
**Описание:** Требуется для корректной работы middleware  
**Статус:** ✅ Выполнено (текущая версия 14.2.35)

#### Зависимость 3: Отсутствие критичных inline скриптов без возможности добавления nonce
**Описание:** Некоторые сторонние библиотеки могут использовать inline скрипты  
**Статус:** Проверить перед началом  
**Действие:** Провести аудит inline скриптов

### 8.3 Блокеры

**Нет критичных блокеров для начала работ.**

---

## 9. План внедрения (Phased Rollout)

### Фаза 1: Content-Security-Policy-Report-Only (1-2 дня)
**Цель:** Собрать статистику о CSP violations без блокировки

**Действия:**
1. Внедрить все статические headers (кроме CSP)
2. Внедрить CSP в Report-Only режиме
3. Настроить CSP reporting endpoint
4. Собрать логи violations в течение 1-2 дней
5. Проанализировать violations и скорректировать CSP

**CSP Report-Only:**
```javascript
response.headers.set('Content-Security-Policy-Report-Only', cspHeader);
```

### Фаза 2: Enforcing CSP (после Фазы 1)
**Цель:** Включить блокирующий CSP

**Действия:**
1. Переключить CSP из Report-Only в enforcing mode
2. Мониторинг console на CSP violations
3. Быстрый откат при критичных проблемах

### Фаза 3: HSTS Preload (опционально, через 1-2 месяца)
**Цель:** Добавить домен в HSTS preload list браузеров

**Действия:**
1. Убедиться в стабильности HTTPS (1-2 месяца работы)
2. Отправить запрос на https://hstspreload.org/
3. Дождаться включения в preload list браузеров

---

## 10. Критерии готовности (Definition of Done)

### Code Review
- [ ] Код прошел code review
- [ ] Все комментарии ревьюера учтены

### Тестирование
- [ ] Unit-тесты написаны и проходят (покрытие ≥ 80%)
- [ ] Integration-тесты написаны и проходят
- [ ] E2E тесты проходят
- [ ] Ручное тестирование выполнено
- [ ] Тестирование на securityheaders.com - score A или A+

### Функциональность
- [ ] Все security headers присутствуют в ответах
- [ ] Яндекс.Метрика работает корректно
- [ ] Google reCAPTCHA работает (если используется)
- [ ] Нет CSP violations в console
- [ ] Нет регрессий в существующем функционале

### Документация
- [ ] README.md обновлён
- [ ] CSP_MAINTENANCE.md создан
- [ ] Код задокументирован (комментарии в middleware)

### Развёртывание
- [ ] `npm run build` завершается успешно
- [ ] Развёртывание в staging успешно
- [ ] Smoke testing на staging пройден

---

## 11. Согласование

- [ ] **Заказчик:** Требования согласованы
- [ ] **Техлид:** Архитектура одобрена
- [ ] **Security:** Security headers соответствуют политике компании
- [ ] **DevOps:** Влияние на производительность приемлемо

---

## 12. Приложения

### Приложение А: Полный список security headers с пояснениями

| Header | Value | Назначение | OWASP |
|--------|-------|------------|-------|
| **X-DNS-Prefetch-Control** | off | Отключает DNS prefetching, уменьшая утечку информации о посещаемых доменах | A05:2021 |
| **X-Frame-Options** | SAMEORIGIN | Защита от clickjacking - разрешает iframe только с того же домена | A01:2021 |
| **X-Content-Type-Options** | nosniff | Запрещает браузеру MIME sniffing, предотвращая исполнение файлов как другого типа | A05:2021 |
| **X-XSS-Protection** | 1; mode=block | Включает XSS filter в старых браузерах (IE, старый Chrome), блокирует страницу при обнаружении атаки | Legacy |
| **Referrer-Policy** | strict-origin-when-cross-origin | Контролирует информацию в Referer header - отправляет origin при cross-origin запросах, полный URL при same-origin | A01:2021 |
| **Permissions-Policy** | camera=(), microphone=(), geolocation=() | Запрещает доступ к камере, микрофону, геолокации | A05:2021 |
| **Strict-Transport-Security** | max-age=31536000; includeSubDomains; preload | Принудительно использует HTTPS, защищает от MITM атак | A02:2021 |
| **Content-Security-Policy** | (см. ниже) | Контролирует источники загружаемых ресурсов, защищает от XSS и data injection | A10:2021 |

### Приложение Б: CSP директивы и их назначение

| Директива | Значение | Назначение |
|-----------|----------|------------|
| default-src | 'self' | Источник по умолчанию для всех ресурсов |
| script-src | 'self' 'nonce-{RANDOM}' https://... | Разрешённые источники JavaScript |
| style-src | 'self' 'nonce-{RANDOM}' 'unsafe-inline' | Разрешённые источники CSS |
| img-src | 'self' data: https: | Разрешённые источники изображений |
| font-src | 'self' | Разрешённые источники шрифтов |
| connect-src | 'self' https://mc.yandex.ru | Разрешённые endpoints для fetch/XHR |
| frame-src | https://www.google.com | Разрешённые источники для iframe |
| object-src | 'none' | Запрещает Flash, Java плагины |
| base-uri | 'self' | Защита от base tag injection |
| form-action | 'self' | Защита от отправки форм на сторонние домены |
| frame-ancestors | 'self' | Современная альтернатива X-Frame-Options |

### Приложение В: Ссылки и ресурсы

1. **OWASP Secure Headers Project:** https://owasp.org/www-project-secure-headers/
2. **MDN Content-Security-Policy:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
3. **securityheaders.com:** https://securityheaders.com/
4. **Observatory by Mozilla:** https://observatory.mozilla.org/
5. **HSTS Preload List:** https://hstspreload.org/
6. **Next.js Security Headers:** https://nextjs.org/docs/advanced-features/security-headers
7. **Next.js Middleware:** https://nextjs.org/docs/middleware

### Приложение Г: Пример CSP violation report

```json
{
  "csp-report": {
    "document-uri": "https://example.com/",
    "referrer": "",
    "violated-directive": "script-src",
    "effective-directive": "script-src",
    "original-policy": "default-src 'self'; script-src 'self' 'nonce-abc123';",
    "disposition": "report",
    "blocked-uri": "https://evil.com/malware.js",
    "line-number": 10,
    "column-number": 5,
    "source-file": "https://example.com/",
    "status-code": 200,
    "script-sample": ""
  }
}
```

---

**Документ подготовлен:** 2026-03-18  
**Версия:** 1.0  
**Статус:** Требует согласования с заказчиком
