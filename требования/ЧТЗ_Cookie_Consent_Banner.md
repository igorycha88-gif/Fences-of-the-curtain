# ЧТЗ: Cookie Consent Banner — уведомление и сбор согласия посетителей

## Версия: 1.0
## Дата: 2026-04-10
## Автор: AI Analyst
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Реализовать cookie consent banner в соответствии с лучшими практиками и требованиями ФЗ-152 «О персональных данных», чтобы информировать посетителей сайта о сборе cookies и получать их согласие перед загрузкой аналитических скриптов (Яндекс.Метрика и др.).

### 1.2 Пользовательская ценность
- Посетитель информирован о том, какие данные собираются
- Посетитель может дать или отклонить согласие
- Прозрачность обработки данных повышает доверие к компании

### 1.3 Метрики успеха
- [ ] Banner отображается при первом визите для новых посетителей
- [ ] Аналитические скрипты (Яндекс.Метрика) загружаются ТОЛЬКО после согласия
- [ ] Согласие сохраняется в БД с IP, User Agent, датой
- [ ] Посетитель может изменить своё решение через настройки в футере
- [ ] На админ-панели доступна статистика согласий

---

## 2. Анализ лучших практик Cookie Consent

### 2.1 Ключевые принципы (на основе GDPR/EU Cookie Law и ФЗ-152)

1. **Prior Consent** — аналитические/маркетинговые cookies НЕ загружаются до получения явного согласия
2. **Granular Control** — пользователь может отдельно принять/отклонить категории: необходимые, аналитические, маркетинговые
3. **Easy Withdraw** — пользователь может отозвать согласие в любой момент через видимый элемент интерфейса
4. **Record Keeping** — каждое согласие фиксируется с доказательствами (IP, дата, версия текста)
5. **Non-intrusive UX** — баннер не блокирует контент полностью, даёт ясные опции

### 2.2 UX Best Practices
- Banner внизу экрана (менее навязчивый, чем модальное окно)
- Две кнопки: «Принять все» и «Настроить»
- Настройки — компактная панель с переключателями категорий
- Ссылка на Политику конфиденциальности
- Не использовать тёмные паттерны (кнопка отклонения не должна быть скрыта)

---

## 3. Функциональные требования

### 3.1 User Stories с Acceptance Criteria

#### US-1: Первый визит — отображение banner
**Given** пользователь впервые заходит на сайт
**When** страница загружается
**Then** внизу экрана отображается cookie consent banner с текстом о сборе данных, кнопкой «Принять все» и ссылкой «Настроить»

**AC-1.1:** Banner виден только если в localStorage нет записи `cookie_consent`
**AC-1.2:** Banner не показывается в админ-панели (`/admin/*`)
**AC-1.3:** Banner фиксирован внизу экрана, не перекрывает основной контент критично
**AC-1.4:** Яндекс.Метрика НЕ инициализируется до получения согласия

#### US-2: Принять все cookies
**Given** пользователь видит cookie banner
**When** нажимает «Принять все»
**Then** согласие сохраняется, banner закрывается, аналитические скрипты активируются

**AC-2.1:** В localStorage сохраняется `{accepted: true, analytics: true, timestamp: ISO}`
**AC-2.2:** В БД создаётся запись CookieConsent с IP, User Agent, типом согласия
**AC-2.3:** Яндекс.Метрика инициализируется
**AC-2.4:** Banner плавно исчезает (animation)

#### US-3: Настроить cookies
**Given** пользователь видит cookie banner
**When** нажимает «Настроить»
**Then** открывается панель настроек с категориями cookies

**AC-3.1:** Панель содержит категории:
  - Необходимые (всегда включены, нельзя отключить) — для работы сайта
  - Аналитические (Яндекс.Метрика) — можно включить/выключить
**AC-3.2:** Кнопки: «Сохранить выбранные» и «Принять все»
**AC-3.3:** Выбор сохраняется в localStorage и БД

#### US-4: Отклонить все cookies
**Given** пользователь видит панель настроек cookies
**When** оставляет все категории выключенными и нажимает «Сохранить»
**Then** отказ сохраняется, аналитические скрипты НЕ загружаются

**AC-4.1:** В localStorage: `{accepted: false, analytics: false, timestamp: ISO}`
**AC-4.2:** В БД создаётся запись CookieConsent с consentGiven=false
**AC-4.3:** Яндекс.Метрика НЕ инициализируется
**AC-4.4:** Banner закрывается

#### US-5: Изменить решение
**Given** пользователь ранее дал или отклонил согласие
**When** нажимает на иконку/ссылку cookie настроек в футере
**Then** открывается панель настроек cookies

**AC-5.1:** В футере добавлена ссылка «Настройка cookies»
**AC-5.2:** Панель открывается с ранее сохранёнными настройками
**AC-5.3:** Пользователь может изменить выбор

---

## 4. Техническая архитектура

### 4.1 Изменения в БД (Prisma Schema)

```prisma
model CookieConsent {
  id              String   @id @default(cuid())
  sessionId       String?  @unique
  consentGiven    Boolean  @default(false)
  analytics       Boolean  @default(false)
  consentText     String   @default("Текущая версия текста согласия")
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([sessionId])
  @@index([createdAt])
  @@index([consentGiven])
  @@map("cookie_consents")
}
```

### 4.2 API спецификация

#### POST /api/cookie-consent
**Описание:** Сохранение согласия/отказа пользователя

**Request:**
```json
{
  "consentGiven": true,
  "analytics": true
}
```

**Response 201:**
```json
{
  "id": "clxxx",
  "consentGiven": true,
  "analytics": true,
  "createdAt": "2026-04-10T12:00:00Z"
}
```

#### GET /api/admin/cookie-consent/stats
**Описание:** Статистика согласий для админ-панели (только ADMIN)

**Response 200:**
```json
{
  "total": 1500,
  "accepted": 1200,
  "rejected": 300,
  "analyticsAccepted": 1100,
  "last30Days": {
    "total": 200,
    "accepted": 170,
    "rejected": 30
  }
}
```

### 4.3 Структура файлов

```
src/
├── app/
│   └── api/
│       ├── cookie-consent/
│       │   └── route.ts              # POST - сохранение согласия
│       └── admin/
│           └── cookie-consent/
│               └── stats/
│                   └── route.ts      # GET - статистика
├── components/
│   └── cookie-consent/
│       ├── CookieConsentProvider.tsx  # Провайдер (управляет состоянием)
│       ├── CookieConsentBanner.tsx    # Banner внизу экрана
│       └── CookieConsentSettings.tsx  # Панель настроек категорий
├── hooks/
│   └── useCookieConsent.ts           # Хук для работы с consent
└── types/
    └── cookie-consent.ts             # TypeScript типы
```

### 4.4 Интерфейсы/типы

```typescript
interface CookieConsentState {
  accepted: boolean | null;
  analytics: boolean;
  timestamp: string | null;
}

interface CookieConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
  onSettings: () => void;
}

interface CookieConsentApiResponse {
  id: string;
  consentGiven: boolean;
  analytics: boolean;
  createdAt: string;
}
```

---

## 5. UI/UX требования

### 5.1 Макет Cookie Banner

```
┌──────────────────────────────────────────────────────────────────────┐
│  🍪 Мы используем файлы cookie для улучшения работы сайта и          │
│     аналитики. Подробнее в Политике конфиденциальности.              │
│                                                                      │
│     [Настроить]                      [Принять все]                   │
└──────────────────────────────────────────────────────────────────────┘
```

- Позиция: `fixed bottom-0 left-0 right-0 z-40`
- Фон: `bg-white border-t shadow-lg` (для тёмного: `dark:bg-gray-900`)
- Анимация: slide-up при появлении, slide-down при закрытии
- Mobile: адаптивная, текст и кнопки в столбик на экранах <640px

### 5.2 Макет панели настроек

```
┌──────────────────────────────────────────────────────────────────────┐
│  Настройка файлов cookie                                             │
│                                                                      │
│  ● Необходимые (всегда активны)                                      │
│    Необходимы для работы сайта. Не могут быть отключены.             │
│                                                                      │
│  ○ Аналитические                                                     │
│    Помогают понять, как посетители взаимодействуют с сайтом          │
│    (Яндекс.Метрика).                                                 │
│                                                                      │
│  [Сохранить выбранные]                         [Принять все]         │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.3 Цветовая схема
- Кнопка «Принять все»: `bg-blue-600 text-white hover:bg-blue-700` (основной CTA)
- Кнопка «Настроить»: `border border-gray-300 hover:bg-gray-50` (secondary)
- Кнопка «Сохранить выбранные»: `bg-blue-600 text-white`
- Фон: белый с тенью

---

## 6. Декомпозиция на задачи

### Backend

#### TASK-BCK-001: Миграция БД — таблица CookieConsent

**Направление**: Backend
**Приоритет**: High
**Оценка**: 0.5 часа
**Зависимости**: Нет

**Описание**:
Добавить модель CookieConsent в prisma/schema.prisma и выполнить миграцию

**Критерии приемки**:
- [ ] Модель CookieConsent добавлена в schema.prisma с полями: id, sessionId, consentGiven, analytics, consentText, ipAddress, userAgent, createdAt, updatedAt
- [ ] Маппинг на таблицу cookie_consents
- [ ] Индексы на sessionId, createdAt, consentGiven
- [ ] Миграция создана и применена

**Технические детали**:
- Файлы: `prisma/schema.prisma`

#### TASK-BCK-002: API endpoint POST /api/cookie-consent

**Направление**: Backend
**Приоритет**: High
**Оценка**: 1.5 часа
**Зависимости**: TASK-BCK-001

**Описание**:
Создать API endpoint для сохранения согласия/отказа cookie. Генерирует sessionId, сохраняет в БД.

**Критерии приемки**:
- [ ] POST /api/cookie-consent принимает { consentGiven, analytics }
- [ ] Валидация через Zod (consentGiven: boolean, analytics: boolean)
- [ ] Генерация sessionId (crypto.randomUUID) и установка в cookie response
- [ ] Сохранение в БД: sessionId, consentGiven, analytics, IP, UserAgent
- [ ] Возврат 201 с { id, consentGiven, analytics, createdAt }
- [ ] Rate limiting: max 10 запросов в минуту с одного IP

**Технические детали**:
- Файлы: `src/app/api/cookie-consent/route.ts`, `src/lib/validators/cookieConsent.ts`
- Prisma: CookieConsent
- Env: нет дополнительных

#### TASK-BCK-003: API endpoint GET /api/admin/cookie-consent/stats

**Направление**: Backend
**Приоритет**: Medium
**Оценка**: 1 час
**Зависимости**: TASK-BCK-001

**Описание**:
Создать API для статистики cookie consent для админ-панели

**Критерии приемки**:
- [ ] GET /api/admin/cookie-consent/stats — только для ADMIN роли
- [ ] Возвращает: total, accepted, rejected, analyticsAccepted, last30Days
- [ ] Кеширование Redis на 5 минут
- [ ] При отсутствии Redis — прямой запрос к БД

**Технические детали**:
- Файлы: `src/app/api/admin/cookie-consent/stats/route.ts`

### Frontend

#### TASK-FRT-001: TypeScript типы и хук useCookieConsent

**Направление**: Frontend
**Приоритет**: High
**Оценка**: 1 час
**Зависимости**: Нет

**Описание**:
Создать типы и кастомный хук для управления cookie consent состоянием

**Критерии приемки**:
- [ ] Типы: CookieConsentState, CookieConsentApiResponse
- [ ] Хук возвращает: { consent, isBannerVisible, isSettingsOpen, acceptAll, declineAll, saveSettings, openSettings, closeSettings }
- [ ] Чтение состояния из localStorage при монтировании
- [ ] Отправка POST /api/cookie-consent при изменении согласия
- [ ] Управление видимостью banner/settings

**Технические детали**:
- Файлы: `src/types/cookie-consent.ts`, `src/hooks/useCookieConsent.ts`

#### TASK-FRT-002: CookieConsentBanner компонент

**Направление**: Frontend
**Приоритет**: High
**Оценка**: 2 часа
**Зависимости**: TASK-FRT-001

**Описание**:
Создать компонент баннера, отображаемого внизу экрана

**Критерии приемки**:
- [ ] Фиксированное позиционирование внизу экрана (z-40)
- [ ] Текст: «Мы используем файлы cookie для улучшения работы сайта и аналитики...»
- [ ] Ссылка на /privacy-policy
- [ ] Кнопки: «Принять все» + «Настроить»
- [ ] Анимация slide-up/slide-down
- [ ] Адаптив: на мобильных кнопки в столбик
- [ ] НЕ показывается в /admin/*
- [ ] Показывается только если в localStorage нет cookie_consent

**Технические детали**:
- Файлы: `src/components/cookie-consent/CookieConsentBanner.tsx`
- Стили: Tailwind CSS

#### TASK-FRT-003: CookieConsentSettings компонент

**Направление**: Frontend
**Приоритет**: High
**Оценка**: 1.5 часа
**Зависимости**: TASK-FRT-001

**Описание**:
Создать панель настроек cookie с переключателями категорий

**Критерии приемки**:
- [ ] Категории: Необходимые (disabled, включено), Аналитические (toggle)
- [ ] Кнопки: «Сохранить выбранные» + «Принять все»
- [ ] Описание каждой категории
- [ ] Может открываться из banner (Настроить) и из футера

**Технические детали**:
- Файлы: `src/components/cookie-consent/CookieConsentSettings.tsx`

#### TASK-FRT-004: CookieConsentProvider — интеграция в layout

**Направление**: Frontend
**Приоритет**: High
**Оценка**: 1.5 часа
**Зависимости**: TASK-FRT-002, TASK-FRT-003

**Описание**:
Создать провайдер, который управляет отображением banner/settings и условной загрузкой Яндекс.Метрики

**Критерии приемки**:
- [ ] CookieConsentProvider оборачивает {children} в layout.tsx
- [ ] Если consent.analytics === true → Яндекс.Метрика загружается
- [ ] Если consent.analytics === false/null → Яндекс.Метрика НЕ загружается
- [ ] Banner и Settings рендерятся внутри Provider
- [ ] В футере добавлена ссылка «Настройка cookies»
- [ ] Provider НЕ рендерит banner в /admin/*

**Технические детали**:
- Файлы: `src/components/cookie-consent/CookieConsentProvider.tsx`
- Изменения: `src/app/layout.tsx`, `src/components/layout/Footer.tsx`

### Testing

#### TASK-TST-001: Unit-тесты cookie consent

**Направление**: Testing
**Приоритет**: High
**Оценка**: 2 часа
**Зависимости**: TASK-BCK-002, TASK-FRT-001

**Критерии приемки**:
- [ ] Тесты API: POST /api/cookie-consent (accept, decline, validation errors)
- [ ] Тесты хука: useCookieConsent (initial state, accept, decline, save settings)
- [ ] Моки: localStorage, fetch, Prisma
- [ ] Покрытие ≥ 80%

---

## 7. Порядок реализации

```
TASK-BCK-001 (миграция)
    ↓
TASK-BCK-002 (API consent) + TASK-FRT-001 (типы/хук)
    ↓
TASK-BCK-003 (API stats) + TASK-FRT-002 (banner) + TASK-FRT-003 (settings)
    ↓
TASK-FRT-004 (provider + layout интеграция)
    ↓
TASK-TST-001 (тесты)
```

---

## 8. Риски и зависимости

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Яндекс.Метрика загружается до consent | Среднее | Высокое | Условный рендеринг через Provider |
| localStorage заблокирован (Private mode) | Низкое | Среднее | Fallback к cookie |
| Пользователь очистил localStorage | Среднее | Низкое | Banner покажется снова, новая запись в БД |

---

## 9. Согласование

- [ ] Заказчик
- [ ] Техлид
