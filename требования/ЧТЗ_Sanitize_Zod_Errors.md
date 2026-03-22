# ЧТЗ: Sanitize Zod ошибки (Санитизация ошибок валидации)

## Версия: 1.0
## Дата: 2026-03-18
## Автор: AI-аналитик
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Устранить утечку информации о внутренней структуре валидации через API responses, раскрывая злоумышленнику детали схемы валидации и структуру данных приложения.

### 1.2 Пользовательская ценность
- Защита от reconnaissance атак (сбор информации о системе)
- Соответствие требованиям информационной безопасности
- Единообразная обработка ошибок валидации во всех admin routes

### 1.3 Метрики успеха
- **Покрытие**: 100% admin routes используют sanitized error handler
- **Security**: в production нет раскрытия деталей Zod schema
- **Dev Experience**: в development сохраняются детали для отладки
- **Отсутствие регрессий**: все существующие тесты проходят

---

## 2. Функциональные требования

### 2.1 User Stories с Acceptance Criteria

#### US-001: Безопасная обработка ошибок валидации в production
**Как** администратор безопасности  
**Я хочу**, чтобы ошибки валидации не раскрывали детали схемы данных  
**Чтобы** злоумышленник не мог использовать эту информацию для атак

**Acceptance Criteria:**
```
GIVEN приложение развёрнуто в production (NODE_ENV=production)
WHEN отправляется невалидный запрос к любому admin route
THEN возвращается HTTP 400 с сообщением { "error": "Validation failed" }
AND детали ZodError НЕ раскрываются в response body
```

#### US-002: Детальные ошибки в development для отладки
**Как** разработчик  
**Я хочу**, видеть детали ошибок валидации при разработке  
**Чтобы** быстро находить и исправлять проблемы

**Acceptance Criteria:**
```
GIVEN приложение запущено в development (NODE_ENV=development)
WHEN отправляется невалидный запрос к любому admin route
THEN возвращается HTTP 400 с полным массивом error.errors
AND разработчик видит какие поля не прошли валидацию и почему
```

#### US-003: Единообразная обработка ошибок во всех admin routes
**Как** разработчик  
**Я хочу**, иметь единый хелпер для обработки ZodError  
**Чтобы** не дублировать логику и избежать ошибок

**Acceptance Criteria:**
```
GIVEN создан хелпер validationError в src/lib/api-error.ts
WHEN разработчик обрабатывает ZodError в любом route
THEN он использует единый хелпер validationError(error)
AND поведение консистентно во всём приложении
```

---

## 3. Нефункциональные требования

### 3.1 Безопасность

#### 3.1.1 OWASP A05:2021 - Security Misconfiguration / CWE-209: Information Exposure Through Error Messages
**Проблема:** Раскрытие деталей Zod schema даёт злоумышленнику информацию:
- Ожидаемые поля и их типы
- Правила валидации (min/max, regex patterns)
- Внутреннюю структуру бизнес-логики

**Решение:** В production возвращать только общее сообщение без деталей.

#### 3.1.2 Требования к sanitized response
| Environment | Response Body | Status Code |
|-------------|---------------|-------------|
| production | `{ "error": "Validation failed" }` | 400 |
| development | `{ "error": [...] }` (ZodError.errors array) | 400 |

### 3.2 Производительность
- Проверка `process.env.NODE_ENV` — O(1), влияние на производительность минимальное
- Время ответа не увеличивается более чем на 1ms

### 3.3 Совместимость
- Next.js 14.2+ (App Router)
- Zod 3.x
- TypeScript

---

## 4. Техническая архитектура

### 4.1 Создание нового файла

#### 4.1.1 Хелпер для санитизации ошибок
**Файл:** `src/lib/api-error.ts` (новый файл)

```typescript
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function validationError(error: ZodError): NextResponse {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { error: error.errors },
    { status: 400 }
  );
}
```

### 4.2 Изменение существующих файлов

#### 4.2.1 Список файлов для модификации (29 файлов)

| Файл | Строка | Текущий код |
|------|--------|-------------|
| src/app/api/admin/post-types/route.ts | 78 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/works/route.ts | 66 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/wicket-types/route.ts | 79 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/profnastil-types/route.ts | 94 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/lag-types/route.ts | 88 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/picket-types/route.ts | 94 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/mounting-hardware/route.ts | 81 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/materials/fence-types/route.ts | 67 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/gate-types/route.ts | 81 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/gate-types/[id]/route.ts | 82 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/lag-types/[id]/route.ts | 82 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/mounting-hardware/[id]/route.ts | 82 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/materials/fence-types/[id]/route.ts | 65 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/post-types/[id]/route.ts | 82 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/picket-types/[id]/route.ts | 82 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/profnastil-types/[id]/route.ts | 82 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/wicket-types/[id]/route.ts | 82 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/works/[id]/route.ts | 58 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/wicket-types/reorder/route.ts | 40 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/profnastil-types/reorder/route.ts | 40 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/reorder/[entityType]/route.ts | 59 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/post-types/reorder/route.ts | 40 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/picket-types/reorder/route.ts | 40 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/materials/fence-types/reorder/route.ts | 40 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/lag-types/reorder/route.ts | 40 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |
| src/app/api/admin/gate-types/reorder/route.ts | 40 | `return NextResponse.json({ error: error.errors }, { status: 400 });` |

**Файлы с нестандартным форматом ответа** (поле `details` вместо `error`):

| Файл | Строка | Текущий код |
|------|--------|-------------|
| src/app/api/admin/contact-info/route.ts | 92 | `NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })` |
| src/app/api/admin/rate-limit/config/route.ts | 57 | `NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })` |
| src/app/api/admin/orders/[id]/status/route.ts | 88 | `NextResponse.json({ error: 'VALIDATION_ERROR', details: error.errors }, { status: 400 })` |

> ⚠️ Эти 3 файла используют поле `details` для ZodError. Хелпер `validationError` нужно расширить или обработать отдельно (см. TASK-BCK-005).

(полный список в Приложении А)

#### 4.2.2 Паттерн изменения

**До:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
// ...
import { someSchema } from '@/lib/validators/someValidator';

export async function POST(request: NextRequest) {
  try {
    // ...
    const validatedData = someSchema.parse(body);
    // ...
  } catch (error: any) {
    console.error('Error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**После:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { validationError } from '@/lib/api-error';
// ...
import { someSchema } from '@/lib/validators/someValidator';

export async function POST(request: NextRequest) {
  try {
    // ...
    const validatedData = someSchema.parse(body);
    // ...
  } catch (error: any) {
    console.error('Error:', error);
    
    if (error instanceof ZodError) {
      return validationError(error);
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4.3 Интерфейсы/типы данных

```typescript
import { ZodError } from 'zod';
import { NextResponse } from 'next/server';

export function validationError(error: ZodError): NextResponse<{
  error: string | ZodError['errors'];
}>;
```

---

## 5. UI/UX требования

### 5.1 Отсутствие визуальных изменений
- Изменения касаются только backend (API responses)
- UI остаётся без изменений

### 5.2 Frontend обработка ошибок
- Frontend должен корректно обрабатывать как `{ error: "Validation failed" }`, так и `{ error: [...] }`
- Текущая реализация уже поддерживает оба формата (отображается error как строка или массив)

---

## 6. Декомпозиция на задачи

### Backend

#### TASK-BCK-001: Создание хелпера validationError
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** Нет

**Описание:**
Создать файл `src/lib/api-error.ts` с функцией `validationError`, которая санитизирует ZodError в зависимости от окружения.

**Критерии приемки:**
- [ ] Файл `src/lib/api-error.ts` создан
- [ ] Функция `validationError` принимает `ZodError` и возвращает `NextResponse`
- [ ] В production возвращается `{ error: "Validation failed" }`
- [ ] В development возвращается `{ error: error.errors }`
- [ ] TypeScript компиляция без ошибок
- [ ] `npm run build` завершается успешно

**Технические детали:**
- Файлы: `src/lib/api-error.ts`
- Импорты: `NextResponse` from `next/server`, `ZodError` from `zod`

---

#### TASK-BCK-002: Обновление admin routes — базовые CRUD (часть 1)
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 2 часа  
**Зависимости:** TASK-BCK-001

**Описание:**
Обновить базовые CRUD routes для использования `validationError` хелпера.

**Файлы (12 шт):**
- `src/app/api/admin/post-types/route.ts`
- `src/app/api/admin/post-types/[id]/route.ts`
- `src/app/api/admin/lag-types/route.ts`
- `src/app/api/admin/lag-types/[id]/route.ts`
- `src/app/api/admin/picket-types/route.ts`
- `src/app/api/admin/picket-types/[id]/route.ts`
- `src/app/api/admin/profnastil-types/route.ts`
- `src/app/api/admin/profnastil-types/[id]/route.ts`
- `src/app/api/admin/gate-types/route.ts`
- `src/app/api/admin/gate-types/[id]/route.ts`
- `src/app/api/admin/wicket-types/route.ts`
- `src/app/api/admin/wicket-types/[id]/route.ts`

**Критерии приемки:**
- [ ] Во всех файлах добавлен импорт `validationError` и `ZodError`
- [ ] Заменено `error.name === 'ZodError'` на `error instanceof ZodError`
- [ ] Заменено `NextResponse.json({ error: error.errors }, ...)` на `validationError(error)`
- [ ] TypeScript компиляция без ошибок
- [ ] `npm run build` завершается успешно

---

#### TASK-BCK-003: Обновление admin routes — reorder routes
**Направление:** Backend
**Приоритет:** High
**Оценка:** 1 час
**Зависимости:** TASK-BCK-001

**Описание:**
Обновить reorder routes для использования `validationError` хелпера.

**Файлы (8 шт):**
- `src/app/api/admin/post-types/reorder/route.ts`
- `src/app/api/admin/lag-types/reorder/route.ts`
- `src/app/api/admin/picket-types/reorder/route.ts`
- `src/app/api/admin/profnastil-types/reorder/route.ts`
- `src/app/api/admin/gate-types/reorder/route.ts`
- `src/app/api/admin/wicket-types/reorder/route.ts`
- `src/app/api/admin/materials/fence-types/reorder/route.ts`
- `src/app/api/admin/reorder/[entityType]/route.ts`

**Критерии приемки:**
- [ ] Во всех файлах добавлен импорт `validationError` и `ZodError`
- [ ] Заменено `error.name === 'ZodError'` на `error instanceof ZodError`
- [ ] Заменено `NextResponse.json({ error: error.errors }, ...)` на `validationError(error)`
- [ ] TypeScript компиляция без ошибок
- [ ] `npm run build` завершается успешно

---

#### TASK-BCK-004: Обновление admin routes — materials и works
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-001

**Описание:**
Обновить materials и works routes для использования `validationError` хелпера.

**Файлы:**
- `src/app/api/admin/materials/fence-types/route.ts`
- `src/app/api/admin/materials/fence-types/[id]/route.ts`
- `src/app/api/admin/works/route.ts`
- `src/app/api/admin/works/[id]/route.ts`
- `src/app/api/admin/mounting-hardware/route.ts`
- `src/app/api/admin/mounting-hardware/[id]/route.ts`

**Критерии приемки:**
- [ ] Во всех файлах добавлен импорт `validationError` и `ZodError`
- [ ] Заменено `error.name === 'ZodError'` на `error instanceof ZodError`
- [ ] Заменено `NextResponse.json({ error: error.errors }, ...)` на `validationError(error)`
- [ ] TypeScript компиляция без ошибок
- [ ] `npm run build` завершается успешно

---

#### TASK-BCK-005: Обновление routes с нестандартным форматом ответа
**Направление:** Backend
**Приоритет:** High
**Оценка:** 0.5 часа
**Зависимости:** TASK-BCK-001

**Описание:**
Три файла используют поле `details` вместо `error` для передачи ZodError. Унифицировать с остальными routes: заменить на `validationError(error)`.

**Файлы (3 шт):**
- `src/app/api/admin/contact-info/route.ts`
- `src/app/api/admin/rate-limit/config/route.ts`
- `src/app/api/admin/orders/[id]/status/route.ts`

**Критерии приемки:**
- [ ] Паттерн `details: error.errors` заменён на `return validationError(error)`
- [ ] Импорты `ZodError` и `validationError` добавлены
- [ ] TypeScript компиляция без ошибок

---

### Testing

#### TASK-TST-001: Unit-тесты для validationError хелпера
**Направление:** Testing  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-001

**Описание:**
Написать unit-тесты для функции `validationError`, проверяющие поведение в разных окружениях.

**Критерии приемки:**
- [ ] Тест проверяет возврат sanitized response в production режиме
- [ ] Тест проверяет возврат детального response в development режиме
- [ ] Тест проверяет корректный HTTP статус (400)
- [ ] Покрытие `src/lib/api-error.ts` ≥ 95%
- [ ] `npm run test` проходит успешно

**Технические детали:**
- Файлы: `__tests__/lib/api-error.test.ts`
- Мокать `process.env.NODE_ENV`

---

#### TASK-TST-002: Integration-тесты для admin routes
**Направление:** Testing  
**Приоритет:** Medium  
**Оценка:** 1.5 часа  
**Зависимости:** TASK-BCK-002, TASK-BCK-003, TASK-BCK-004

**Описание:**
Написать integration-тесты для проверки санитизации ошибок валидации.

**Критерии приемки:**
- [ ] Тест отправляет невалидный POST запрос к `/api/admin/post-types`
- [ ] Тест проверяет ответ в development (детали ошибок)
- [ ] Тест проверяет ответ в production (sanitized)
- [ ] Тест проверяет несколько routes (post-types, gate-types, works)
- [ ] `npm run test` проходит успешно

**Технические детали:**
- Файлы: `__tests__/integration/validation-error-sanitization.test.ts`
- Использовать test server или supertest

---

#### TASK-TST-003: Проверка отсутствия регрессий
**Направление:** Testing  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** TASK-BCK-002, TASK-BCK-003, TASK-BCK-004

**Описание:**
Запустить все существующие тесты и убедиться в отсутствии регрессий.

**Критерии приемки:**
- [ ] `npm run test` проходит без ошибок
- [ ] `npm run build` завершается успешно
- [ ] `npm run lint` не показывает новых ошибок
- [ ] Ручное тестирование: создание/редактирование записи работает

---

## 7. Тестирование

### 7.1 Unit-тесты
**Файлы:**
- `__tests__/lib/api-error.test.ts`

**Тест-кейсы:**
| ID | Описание | Ожидаемый результат |
|----|----------|---------------------|
| UT-001 | validationError в production | `{ error: "Validation failed" }`, status 400 |
| UT-002 | validationError в development | `{ error: [...] }`, status 400 |
| UT-003 | Корректный тип возврата | `NextResponse<{ error: ... }>` |

### 7.2 Integration-тесты
**Файлы:**
- `__tests__/integration/validation-error-sanitization.test.ts`

**Тест-кейсы:**
| ID | Endpoint | Request | Environment | Expected Response |
|----|----------|---------|-------------|-------------------|
| IT-001 | POST /api/admin/post-types | `{}` (empty) | development | `{ error: [...] }` |
| IT-002 | POST /api/admin/post-types | `{}` (empty) | production | `{ error: "Validation failed" }` |
| IT-003 | PUT /api/admin/gate-types/1 | `{ name: "" }` | development | `{ error: [...] }` |
| IT-004 | PUT /api/admin/gate-types/1 | `{ name: "" }` | production | `{ error: "Validation failed" }` |

### 7.3 Ручное тестирование

#### 7.3.1 Тест-кейс: Проверка sanitized response в production

**Шаги:**
1. Установить `NODE_ENV=production`
2. Отправить POST запрос к `/api/admin/post-types` с пустым телом `{}`
3. Проверить response body

**Ожидаемый результат:**
```json
{
  "error": "Validation failed"
}
```

#### 7.3.2 Тест-кейс: Проверка детального response в development

**Шаги:**
1. Установить `NODE_ENV=development`
2. Отправить POST запрос к `/api/admin/post-types` с пустым телом `{}`
3. Проверить response body

**Ожидаемый результат:**
```json
{
  "error": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["name"],
      "message": "Required"
    },
    ...
  ]
}
```

---

## 8. Риски и зависимости

### 8.1 Риски

#### Риск 1: Изменение поведения API (Вероятность: Low, Влияние: Medium)
**Описание:** Frontend может ожидать массив ошибок  
**Митигация:** 
- Frontend должен обрабатывать оба формата (строка или массив)
- Проверить текущую реализацию обработки ошибок на frontend

#### Риск 2: Пропущенные файлы (Вероятность: Medium, Влияние: Medium)
**Описание:** Часть файлов может быть не обновлена  
**Митигация:**
- Использовать grep для поиска оставшихся `error.errors`
- Добавить ESLint правило для обнаружения паттерна

#### Риск 3: Тесты ожидают детальные ошибки (Вероятность: Medium, Влияние: Low)
**Описание:** Существующие тесты могут проверять формат error.errors  
**Митигация:**
- Запустить все тесты после изменений
- Обновить тесты при необходимости

### 8.2 Зависимости

| Зависимость | Статус | Описание |
|-------------|--------|----------|
| Next.js 14.2+ | ✅ | Текущая версия 14.2.35 |
| Zod 3.x | ✅ | Используется в проекте |
| TypeScript | ✅ | Проект на TypeScript |

---

## 9. Критерии готовности (Definition of Done)

### Code Review
- [ ] Код прошел code review
- [ ] Все комментарии ревьюера учтены

### Тестирование
- [ ] Unit-тесты написаны и проходят (покрытие ≥ 80%)
- [ ] Integration-тесты проходят
- [ ] Все существующие тесты проходят
- [ ] `npm run build` завершается успешно
- [ ] `npm run lint` не показывает новых ошибок

### Функциональность
- [ ] В production возвращается sanitized response
- [ ] В development возвращаются детали ошибок
- [ ] Все 29 файлов обновлены (26 стандартных + 3 с полем `details`)
- [ ] Нет файлов с `NextResponse.json({ error: error.errors }` или `details: error.errors`

### Безопасность
- [ ] OWASP A05:2021 / CWE-209 mitigated — информация о схеме не раскрывается
- [ ] Penetration test: невалидные запросы не раскрывают детали схемы

---

## 10. Согласование

- [ ] **Заказчик:** Требования согласованы
- [ ] **Техлид:** Архитектура одобрена
- [ ] **Security:** Решение соответствует политике безопасности

---

## 11. Приложения

### Приложение А: Полный список файлов для модификации

```
src/app/api/admin/post-types/route.ts
src/app/api/admin/post-types/[id]/route.ts
src/app/api/admin/post-types/reorder/route.ts
src/app/api/admin/lag-types/route.ts
src/app/api/admin/lag-types/[id]/route.ts
src/app/api/admin/lag-types/reorder/route.ts
src/app/api/admin/picket-types/route.ts
src/app/api/admin/picket-types/[id]/route.ts
src/app/api/admin/picket-types/reorder/route.ts
src/app/api/admin/profnastil-types/route.ts
src/app/api/admin/profnastil-types/[id]/route.ts
src/app/api/admin/profnastil-types/reorder/route.ts
src/app/api/admin/gate-types/route.ts
src/app/api/admin/gate-types/[id]/route.ts
src/app/api/admin/gate-types/reorder/route.ts
src/app/api/admin/wicket-types/route.ts
src/app/api/admin/wicket-types/[id]/route.ts
src/app/api/admin/wicket-types/reorder/route.ts
src/app/api/admin/materials/fence-types/route.ts
src/app/api/admin/materials/fence-types/[id]/route.ts
src/app/api/admin/materials/fence-types/reorder/route.ts
src/app/api/admin/works/route.ts
src/app/api/admin/works/[id]/route.ts
src/app/api/admin/mounting-hardware/route.ts
src/app/api/admin/mounting-hardware/[id]/route.ts
src/app/api/admin/reorder/[entityType]/route.ts
# Нестандартный формат (details: error.errors) — также требуют обновления:
src/app/api/admin/contact-info/route.ts
src/app/api/admin/rate-limit/config/route.ts
src/app/api/admin/orders/[id]/status/route.ts
```

### Приложение Б: OWASP A01:2021 — Broken Access Control

**Контекст:**
Раскрытие информации о схеме валидации может помочь злоумышленнику:
1. Понять структуру бизнес-данных
2. Определить границы валидации для exploitation
3. Собрать информацию для дальнейших атак (SQL injection, business logic abuse)

**Пример информации, которая раскрывается:**
```json
{
  "error": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "number",
      "inclusive": true,
      "path": ["price"],
      "message": "Number must be greater than or equal to 1"
    },
    {
      "code": "invalid_string",
      "validation": {
        "startsWith": "RU"
      },
      "path": ["code"],
      "message": "Invalid input: must start with \"RU\""
    }
  ]
}
```

**Mitigation:**
Возвращать только общее сообщение `"Validation failed"` без деталей.

### Приложение В: Скрипт для проверки полноты изменений

```bash
# Проверка отсутствия оставшихся unsanitized обработок
grep -r "error\.errors" --include="*.ts" src/app/api/admin/

# Ожидаемый результат: пусто (или только в console.error — в логах утечки нет)

# Отдельная проверка нестандартного паттерна с details:
grep -r "details: error\.errors" --include="*.ts" src/app/api/admin/

# Ожидаемый результат: пусто
```

---

**Документ подготовлен:** 2026-03-18  
**Версия:** 1.0  
**Статус:** Требует согласования с заказчиком
