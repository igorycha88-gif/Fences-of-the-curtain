# ЧТЗ: Rate Limiting Contact Form

## Версия: 1.0
## Дата: 2026-03-20
## Автор: AI-аналитик (ИБ)
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Защитить форму обратной связи `/api/contact` от:
- **Spam-атак** — массовая отправка спам-сообщений
- **DoS-атак** — исчерпание ресурсов сервера через множественные запросы
- **Bot-сканирования** — автоматический перебор и эксплуатация формы

Путём внедрения rate limiting (5 запросов / 5 минут / IP) и honeypot-защиты от простых ботов.

### 1.2 Пользовательская ценность
- **Качество заявок**: Снижение количества спама в очереди заявок
- **Доступность сервиса**: Предотвращение DoS на contact endpoint
- **Соответствие стандартам**: OWASP ASVS V5.1 (Input Validation), V11.1 (Rate Limiting)

### 1.3 Метрики успеха
- 100% запросов contact form проходят через rate limiter
- Блокировка после 5 запросов за 5 минут с одного IP
- Honeypot отклоняет 100% запросов с заполненным скрытым полем
- Время проверки rate limit: < 10ms (Redis)
- Время добавления honeypot-проверки: < 1ms

---

## 2. Анализ текущего состояния

### 2.1 Выявленные проблемы

| Файл | Строка | Проблема | Критичность |
|------|--------|----------|-------------|
| `src/app/api/contact/route.ts` | 4-28 | Нет rate limiting | High |
| `src/app/api/contact/route.ts` | 4-28 | Нет honeypot-защиты | Medium |
| `src/lib/rate-limit.ts` | 4 | EndpointType не содержит 'contact' | Medium |
| `prisma/schema.prisma` | - | Нет записи RateLimitConfig для 'contact' | Medium |

### 2.2 Схема потока данных (AS-IS)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ТЕКУЩЕЕ СОСТОЯНИЕ (НЕБЕЗОПАСНО)              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Спам-бот]                                                         │
│       │                                                             │
│       │ for i in 1..10000:                                         │
│       │   POST /api/contact                                        │
│       │   { name: "Spam", phone: "+79999999999", message: "..." }  │
│       ▼                                                             │
│  [Next.js API Route: /api/contact]                                  │
│       │                                                             │
│       │ ❌ НЕТ ПРОВЕРКИ RATE LIMIT                                  │
│       │ ❌ НЕТ HONEYPOT ЗАЩИТЫ                                      │
│       ▼                                                             │
│  [Валидация Zod: OK]                                                │
│       │                                                             │
│       │ console.log('Contact form submitted:', ...)                │
│       ▼                                                             │
│  [10,000 спам-сообщений в логах / email]                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Схема потока данных (TO-BE)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ЦЕЛЕВОЕ СОСТОЯНИЕ (БЕЗОПАСНО)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Спам-бот]                                                         │
│       │                                                             │
│       │ POST /api/contact                                          │
│       │ { ..., honeypot: "spam-value" }  ← ✅ HONEYPOT TRIGGER      │
│       ▼                                                             │
│  [Honeypot Check]                                                   │
│       │                                                             │
│       │ if (honeypot !== '') → 400 Bad Request                      │
│       │ (бот автоматически заполнил скрытое поле)                   │
│       ▼                                                             │
│  [Rate Limit Check: Redis]                                          │
│       │                                                             │
│       │ Ключ: "rate_limit:contact:{ip}"                             │
│       │ TTL: 300s (5 минут)                                         │
│       │                                                             │
│       ├─ Попытки 1-5: ALLOW (обработка формы)                       │
│       │                                                             │
│       └─ Попытки 6+: BLOCK (429 Too Many Requests)                  │
│                                                                     │
│  [Результат]                                                        │
│       │                                                             │
│       │ ✅ Максимум 5 сообщений за 5 минут                          │
│       │ ✅ Простые боты блокируются honeypot                        │
│       │ ✅ Распределённые атаки ограничены rate limit               │
│       │ ✅ Легитимные пользователи не затронуты                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Функциональные требования

### 3.1 User Stories с Acceptance Criteria

#### US-001: Rate Limiting на contact form
**Как** система безопасности,  
**Я хочу** ограничить количество отправок формы до 5 за 5 минут с одного IP,  
**Чтобы** предотвратить спам-атаки и DoS.

**Acceptance Criteria**:
```
Given клиент с IP "192.168.1.100"
When выполняется 6-я отправка формы за 5 минут
Then запрос отклоняется с HTTP 429 Too Many Requests
And ответ содержит JSON: { "error": "Слишком много запросов. Попробуйте позже." }
And заголовки содержат: X-RateLimit-Remaining: 0
And заголовки содержат: X-RateLimit-Reset: [timestamp]
And в логах фиксируется: "[RATE LIMIT] Blocked: IP=192.168.1.100, EndpointType=contact, Attempts=6"
And счётчик хранится в Redis с ключом "rate_limit:contact:192.168.1.100"
And TTL ключа = 300 секунд (5 минут)
```

#### US-002: Honeypot-защита
**Как** система безопасности,  
**Я хочу** отклонять запросы с заполненным honeypot-полем,  
**Чтобы** блокировать простых ботов, которые автоматически заполняют все поля формы.

**Acceptance Criteria**:
```
Given запрос POST /api/contact с телом { ..., honeypot: "any-value" }
When сервер обрабатывает запрос
Then запрос отклоняется с HTTP 400 Bad Request
And ответ содержит JSON: { "error": "Ошибка отправки заявки" }
And в логах НЕ фиксируется факт honeypot-блокировки (тихий отказ)
And форма не обрабатывается (не логируется, не отправляется email)
```

#### US-003: Graceful degradation при недоступности Redis
**Как** система,  
**Я хочу**, чтобы при недоступности Redis форма продолжала работать,  
**Чтобы** избежать полной остановки сервиса для пользователей.

**Acceptance Criteria**:
```
Given Redis недоступен (connection refused)
When выполняется отправка формы
Then rate limiting пропускается (fail-open)
And форма обрабатывается нормально
And в логах фиксируется warning: "[RATE LIMIT] Redis unavailable, skipping rate limit..."
```

#### US-004: Frontend honeypot-поле
**Как** разработчик,  
**Я хочу** добавить скрытое honeypot-поле в форму контактов,  
**Чтобы** простые боты заполнили его и были заблокированы.

**Acceptance Criteria**:
```
Given компонент ContactForm рендерится на странице
When форма отображается пользователю
Then honeypot-поле присутствует в DOM
And honeypot-поле скрыто через CSS (display: none или opacity: 0)
And honeypot-поле имеет name="website" или name="url" (типичное для ботов)
And honeypot-поле имеет autocomplete="off"
And tabindex="-1" для исключения из навигации клавиатурой
```

#### US-005: Автоматическая разблокировка
**Как** легитимный пользователь,  
**Я хочу**, чтобы блокировка автоматически снималась через 5 минут,  
**Чтобы** я мог отправить новые сообщения.

**Acceptance Criteria**:
```
Given пользователь заблокирован после 5 отправок
When прошло 5 минут с первого запроса
Then счётчик автоматически сбрасывается (TTL ключа истекает)
And пользователь может отправить новые 5 сообщений
```

#### US-006: Rate limit заголовки в ответе
**Как** клиент (браузер),  
**Я хочу** получать информацию о лимитах в заголовках ответа,  
**Чтобы** корректно отображать пользователю состояние лимитов.

**Acceptance Criteria**:
```
Given любой запрос POST /api/contact
When сервер возвращает ответ
Then заголовки содержат:
  - X-RateLimit-Remaining: [оставшиеся попытки, число 0-5]
  - X-RateLimit-Reset: [Unix timestamp сброса лимита]
```

---

## 4. Нефункциональные требования

### 4.1 Производительность
- **Время проверки rate limit**: < 10ms (Redis in-memory)
- **Время проверки honeypot**: < 1ms (проверка строки)
- **Влияние на время обработки формы**: увеличение не более 15ms

### 4.2 Безопасность

#### 4.2.1 Защита от обхода rate limiting
| Вектор атаки | Защита | Комментарий |
|--------------|--------|-------------|
| Смена IP (TOR, proxies) | Лимит по IP | Распределённые атаки сложнее, но не невозможны |
| Timing attack | Постоянное время ответа | Honeypot возвращает ту же ошибку, что и валидация |
| Bot automation | Honeypot + rate limit | Двухуровневая защита |

#### 4.2.2 Honeypot требования
| Требование | Значение | Обоснование |
|------------|----------|-------------|
| Имя поля | `website` или `url` | Типичные имена, которые боты заполняют |
| Скрытие | CSS `position: absolute; left: -9999px` | Не `display: none` (некоторые боты умные) |
| Autocomplete | `off` | Браузер не должен автозаполнять |
| Tabindex | `-1` | Исключить из навигации |

### 4.3 Масштабируемость
- **Горизонтальное масштабирование**: Redis поддерживает cluster mode
- **Память Redis**: ~100 bytes на активный IP
- **TTL автоматическая очистка**: ключи удаляются через 5 минут

---

## 5. Техническая архитектура

### 5.1 Структура файлов

```
src/lib/
├── rate-limit.ts (ИЗМЕНЯЕМЫЙ ФАЙЛ)
│   ├── EndpointType = 'auth' | 'orders' | 'contact' (NEW)
│   └── DEFAULT_CONFIGS.contact = { maxAttempts: 5, windowMs: 300000 }
│
├── validators/
│   └── calculator.ts (ИЗМЕНЯЕМЫЙ ФАЙЛ)
│       └── contactFormSchema с honeypot полем (опционально)
│
src/app/api/contact/
└── route.ts (ИЗМЕНЯЕМЫЙ ФАЙЛ)
    ├── honeypot check (NEW)
    ├── rate limit check (NEW)
    └── ... существующая логика ...

src/components/
└── contact/
    └── ContactForm.tsx (ИЗМЕНЯЕМЫЙ ФАЙЛ)
        └── honeypot field (NEW)

prisma/
└── seeds/seed.ts (ИЗМЕНЯЕМЫЙ ФАЙЛ)
    └── rateLimitConfig для 'contact' (NEW)
```

### 5.2 API спецификация

#### 5.2.1 POST /api/contact (изменённый)

**Request:**
```typescript
{
  name: string;        // 2-100 символов
  phone: string;       // формат +7XXXXXXXXXX
  email?: string;      // опционально, валидный email
  message: string;     // 5-1000 символов
  honeypot?: string;   // СКРЫТОЕ поле, должно быть пустым
}
```

**Response 200 OK:**
```typescript
{
  success: true,
  message: "Заявка отправлена"
}
```

**Response 400 Bad Request (honeypot triggered):**
```typescript
{
  error: "Ошибка отправки заявки"
}
```

**Response 429 Too Many Requests:**
```typescript
{
  error: "Слишком много запросов. Попробуйте через {N} секунд."
}
```

**Response Headers:**
```
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1710937800
```

### 5.3 Интерфейсы/типы данных

```typescript
// src/lib/rate-limit.ts

export type EndpointType = 'auth' | 'orders' | 'contact';

const DEFAULT_CONFIGS: Record<EndpointType, RateLimitConfig> = {
  auth: { maxAttempts: 5, windowMs: 900000, keyPrefix: 'rate_limit:auth' },
  orders: { maxAttempts: 5, windowMs: 3600000, keyPrefix: 'rate_limit:orders' },
  contact: { maxAttempts: 5, windowMs: 300000, keyPrefix: 'rate_limit:contact' },
};

// src/lib/validators/calculator.ts

export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+7\d{10}$/, 'Формат: +7XXXXXXXXXX'),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().min(5).max(1000),
  honeypot: z.string().max(0).optional(),
});
```

### 5.4 Зависимости

| Пакет | Версия | Назначение | Статус |
|-------|--------|-----------|--------|
| `ioredis` | ^5.10.0 | Redis client | ✅ Уже установлен |
| `zod` | ^3.22.4 | Валидация | ✅ Уже установлен |

---

## 6. Декомпозиция на задачи

### Backend

#### TASK-BCK-001: Добавить 'contact' в EndpointType и DEFAULT_CONFIGS
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: Нет

**Описание**:
Расширить существующий модуль `src/lib/rate-limit.ts` для поддержки endpoint'а 'contact' с конфигурацией 5 запросов / 5 минут.

**Критерии приемки**:
- [ ] В `EndpointType` добавлено значение 'contact'
- [ ] В `DEFAULT_CONFIGS` добавлена конфигурация для 'contact'
- [ ] Параметры: maxAttempts: 5, windowMs: 300000 (5 минут)
- [ ] keyPrefix: 'rate_limit:contact'

**Технические детали**:
- Файлы: `src/lib/rate-limit.ts`
- Изменения:
```typescript
export type EndpointType = 'auth' | 'orders' | 'contact';

const DEFAULT_CONFIGS: Record<EndpointType, RateLimitConfig> = {
  auth: { maxAttempts: 5, windowMs: 900000, keyPrefix: 'rate_limit:auth' },
  orders: { maxAttempts: 5, windowMs: 3600000, keyPrefix: 'rate_limit:orders' },
  contact: { maxAttempts: 5, windowMs: 300000, keyPrefix: 'rate_limit:contact' },
};
```

---

#### TASK-BCK-002: Добавить seed для RateLimitConfig 'contact'
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-BCK-001

**Описание**:
Добавить начальную конфигурацию rate limiting для contact form в seed-скрипт.

**Критерии приемки**:
- [ ] В `prisma/seeds/seed.ts` добавлен upsert для 'contact'
- [ ] Параметры: id: 'contact', maxAttempts: 5, windowMs: 300000
- [ ] Seed выполняется без ошибок

**Технические детали**:
- Файлы: `prisma/seeds/seed.ts`
- Изменения:
```typescript
await prisma.rateLimitConfig.upsert({
  where: { id: 'contact' },
  update: {},
  create: {
    id: 'contact',
    maxAttempts: 5,
    windowMs: 300000,
  },
});
```

---

#### TASK-BCK-003: Добавить honeypot в contactFormSchema
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: Нет

**Описание**:
Добавить опциональное honeypot-поле в схему валидации. Поле должно быть пустым для легитимных запросов.

**Критерии приемки**:
- [ ] В `contactFormSchema` добавлено поле `honeypot`
- [ ] Поле опциональное (optional)
- [ ] Если поле присутствует, оно должно быть пустой строкой или undefined
- [ ] Валидация: `z.string().max(0).optional()` или `z.literal('').optional()`

**Технические детали**:
- Файлы: `src/lib/validators/calculator.ts`
- Изменения:
```typescript
export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+7\d{10}$/, 'Формат: +7XXXXXXXXXX'),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().min(5).max(1000),
  honeypot: z.string().max(0).optional(),
});
```

---

#### TASK-BCK-004: Интегрировать rate limiting и honeypot в /api/contact
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 1.5 часа  
**Зависимости**: TASK-BCK-001, TASK-BCK-003

**Описание**:
Добавить проверку honeypot и rate limiting в API route `/api/contact/route.ts`.

**Критерии приемки**:
- [ ] Импортирована `applyRateLimitByEndpoint` из `@/lib/rate-limit`
- [ ] Реализована функция `extractClientIP(req: NextRequest): string`
- [ ] Honeypot проверка выполняется ПЕРЕД rate limit
- [ ] Если honeypot заполнен → return 400 (тихо, без логирования honeypot)
- [ ] Rate limit проверка с использованием `applyRateLimitByEndpoint(ip, 'contact')`
- [ ] Если rate limit превышен → return 429 с JSON { error: "Слишком много запросов..." }
- [ ] Заголовки X-RateLimit-Remaining и X-RateLimit-Reset добавляются в успешный ответ
- [ ] Graceful degradation при ошибке Redis (fail-open)
- [ ] Существующая логика обработки формы не изменена

**Технические детали**:
- Файлы: `src/app/api/contact/route.ts`
- Изменения:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validators';
import { applyRateLimitByEndpoint } from '@/lib/rate-limit';

function extractClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Honeypot check (тихая блокировка ботов)
    if (body.honeypot && body.honeypot.length > 0) {
      return NextResponse.json(
        { error: 'Ошибка отправки заявки' },
        { status: 400 }
      );
    }

    // Rate limiting
    const clientIp = extractClientIP(req);
    const rateLimitResult = await applyRateLimitByEndpoint(clientIp, 'contact');

    const headers = {
      'X-RateLimit-Remaining': String(rateLimitResult.remaining),
      'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt.getTime() / 1000)),
    };

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Слишком много запросов. Попробуйте через ${retryAfter} секунд.` },
        { status: 429, headers: { ...headers, 'Retry-After': String(retryAfter) } }
      );
    }

    // Валидация данных
    const validatedData = contactFormSchema.parse(body);

    console.log('Contact form submitted:', validatedData);

    return NextResponse.json(
      { success: true, message: 'Заявка отправлена' },
      { status: 200, headers }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error('Contact form error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Ошибка отправки заявки' },
      { status: 500 }
    );
  }
}
```

---

### Frontend

#### TASK-FRT-001: Добавить honeypot-поле в ContactForm
**Направление**: Frontend  
**Приоритет**: High  
**Оценка**: 1 час  
**Зависимости**: Нет

**Описание**:
Добавить скрытое honeypot-поле в компонент формы контактов для защиты от простых ботов.

**Критерии приемки**:
- [ ] Honeypot-поле добавлено в форму
- [ ] Поле скрыто через CSS (не display: none, а position: absolute + left: -9999px)
- [ ] Атрибут name="website" (типичное для ботов имя)
- [ ] Атрибут autocomplete="off"
- [ ] Атрибут tabindex="-1"
- [ ] Атрибут aria-hidden="true"
- [ ] Поле отправляется пустым при сабмите легитимным пользователем

**Технические детали**:
- Файлы: Найти компонент ContactForm (предположительно `src/components/contact/ContactForm.tsx` или в `src/app/(public)/contacts/page.tsx`)
- Изменения:
```tsx
{/* Honeypot field - скрыт от пользователей, заполняется ботами */}
<div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
  <input
    type="text"
    name="website"
    tabIndex={-1}
    autoComplete="off"
    {...register('honeypot')}
  />
</div>
```

---

### Testing

#### TASK-TST-001: Unit-тесты для rate limiting contact form
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 1.5 часа  
**Зависимости**: TASK-BCK-004

**Описание**:
Написать unit-тесты для API route `/api/contact` с проверкой rate limiting и honeypot.

**Критерии приемки**:
- [ ] Файл `__tests__/api/contact/route.test.ts` создан
- [ ] Тестовые сценарии:
  - [ ] Успешная отправка формы (200)
  - [ ] Honeypot блокировка (400 при заполненном поле)
  - [ ] Rate limit: 5 успешных запросов разрешены
  - [ ] Rate limit: 6-й запрос отклонён (429)
  - [ ] Rate limit заголовки присутствуют в ответе
  - [ ] Graceful degradation при недоступности Redis
- [ ] Покрытие кода ≥ 80%

**Технические детали**:
- Файлы: `__tests__/api/contact/route.test.ts`
- Mock: `ioredis`, `@/lib/prisma`

---

#### TASK-TST-002: Ручное тестирование rate limiting
**Направление**: Testing  
**Приоритет**: Medium  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-BCK-004, TASK-FRT-001

**Описание**:
Выполнить ручное тестирование rate limiting и honeypot на локальном окружении.

**Критерии приемки**:
- [ ] Redis запущен
- [ ] 5 отправок формы успешны
- [ ] 6-я отправка возвращает 429
- [ ] Заголовки X-RateLimit-* присутствуют
- [ ] После 5 минут лимит сбрасывается
- [ ] Honeypot-поле скрыто в браузере
- [ ] Запрос с заполненным honeypot возвращает 400
- [ ] Тестовый сценарий задокументирован

**Технические детали**:
- Команда проверки Redis: `redis-cli GET rate_limit:contact:127.0.0.1`
- Команда проверки TTL: `redis-cli TTL rate_limit:contact:127.0.0.1`

---

### Documentation

#### TASK-DOC-001: Обновить ARCHITECTURE.md
**Направление**: Documentation  
**Приоритет**: Low  
**Оценка**: 0.25 часа  
**Зависимости**: TASK-BCK-004

**Описание**:
Добавить информацию о rate limiting contact form в архитектурную документацию.

**Критерии приемки**:
- [ ] В `ARCHITECTURE.md` в разделе Rate Limiting добавлена информация о contact form
- [ ] Указано: 5 запросов / 5 минут / IP
- [ ] Указано: honeypot защита

---

## 7. Тестирование

### 7.1 Unit-тесты

**Файл**: `__tests__/api/contact/route.test.ts`

```typescript
import { POST } from '@/app/api/contact/route';
import { NextRequest } from 'next/server';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/redis');
jest.mock('@/lib/prisma');

describe('POST /api/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (prisma.rateLimitConfig.findUnique as jest.Mock).mockResolvedValue({
      id: 'contact',
      maxAttempts: 5,
      windowMs: 300000,
    });
  });

  const createRequest = (body: Record<string, unknown>): NextRequest => {
    return new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.100' },
      body: JSON.stringify(body),
    });
  };

  describe('Honeypot', () => {
    it('should reject request with filled honeypot', async () => {
      const req = createRequest({
        name: 'Test',
        phone: '+79991234567',
        message: 'Test message',
        honeypot: 'spam-value',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Ошибка отправки заявки');
    });

    it('should allow request with empty honeypot', async () => {
      (redis.incr as jest.Mock).mockResolvedValue(1);
      (redis.expire as jest.Mock).mockResolvedValue(1);
      (redis.ttl as jest.Mock).mockResolvedValue(300);

      const req = createRequest({
        name: 'Test',
        phone: '+79991234567',
        message: 'Test message',
        honeypot: '',
      });

      const response = await POST(req);

      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow 5 requests', async () => {
      for (let i = 1; i <= 5; i++) {
        (redis.incr as jest.Mock).mockResolvedValue(i);
        (redis.expire as jest.Mock).mockResolvedValue(1);
        (redis.ttl as jest.Mock).mockResolvedValue(300);

        const req = createRequest({
          name: 'Test',
          phone: '+79991234567',
          message: 'Test message',
        });

        const response = await POST(req);
        expect(response.status).toBe(200);
      }
    });

    it('should block 6th request', async () => {
      (redis.incr as jest.Mock).mockResolvedValue(6);
      (redis.ttl as jest.Mock).mockResolvedValue(200);

      const req = createRequest({
        name: 'Test',
        phone: '+79991234567',
        message: 'Test message',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Слишком много запросов');
    });

    it('should include rate limit headers', async () => {
      (redis.incr as jest.Mock).mockResolvedValue(1);
      (redis.expire as jest.Mock).mockResolvedValue(1);
      (redis.ttl as jest.Mock).mockResolvedValue(300);

      const req = createRequest({
        name: 'Test',
        phone: '+79991234567',
        message: 'Test message',
      });

      const response = await POST(req);

      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should fail-open when Redis is unavailable', async () => {
      (redis.incr as jest.Mock).mockRejectedValue(new Error('Connection refused'));

      const req = createRequest({
        name: 'Test',
        phone: '+79991234567',
        message: 'Test message',
      });

      const response = await POST(req);

      expect(response.status).toBe(200);
    });
  });
});
```

### 7.2 Redis команды для тестирования

```bash
# Просмотр ключей contact
redis-cli KEYS "rate_limit:contact:*"

# Получить значение счётчика
redis-cli GET "rate_limit:contact:127.0.0.1"

# Проверить TTL
redis-cli TTL "rate_limit:contact:127.0.0.1"

# Сбросить счётчик
redis-cli DEL "rate_limit:contact:127.0.0.1"
```

---

## 8. Риски и зависимости

### 8.1 Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Redis недоступен | Medium | Medium | Fail-open: пропускать rate limit при ошибке |
| Ложные срабатывания | Low | Low | Honeypot скрыт корректно, легитимные пользователи не заполняют |
| Распределённые атаки | Low | Medium | Rate limit по IP, мониторинг аномалий |
| Умные боты обходят honeypot | Medium | Low | Honeypot + rate limit = двухуровневая защита |

### 8.2 Зависимости

| Зависимость | Тип | Статус | Комментарий |
|-------------|-----|--------|-------------|
| ioredis | NPM пакет | ✅ Установлен | Версия ^5.10.0 |
| Redis сервер | Infrastructure | ✅ Развёрнут | Docker |
| rate-limit.ts | Существующий модуль | ✅ Существует | Нужно расширить EndpointType |
| contactFormSchema | Существующая схема | ✅ Существует | Нужно добавить honeypot |

---

## 9. Согласование

- [ ] Заказчик
- [ ] Техлид

---

## 10. Контрольный список перед разработкой

### Definition of Ready

- [x] Понятны всем членам команды
- [x] Можно протестировать
- [x] Технически выполним
- [x] Приносит ценность бизнесу (защита от спама)
- [x] Размер позволяет реализовать за 0.5-1 день
- [x] Зависимости идентифицированы (rate-limit.ts, Redis)
- [x] Acceptance Criteria определены
- [ ] Утверждены стейкхолдерами

---

## 11. Итого

| Категория | Количество задач | Оценка времени |
|-----------|------------------|----------------|
| Backend | 4 | 3 часа |
| Frontend | 1 | 1 час |
| Testing | 2 | 2 часа |
| Documentation | 1 | 0.25 часа |
| **Всего** | **8** | **6.25 часа** |

---

*ЧТЗ подготовлено AI-аналитиком*
*Дата: 2026-03-20*
