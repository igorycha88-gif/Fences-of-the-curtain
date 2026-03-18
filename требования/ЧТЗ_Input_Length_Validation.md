# ЧТЗ: Input Length Validation (Валидация длины входных данных)

## Версия: 1.0
## Дата: 2026-03-18
## Автор: AI-аналитик
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Устранить уязвимость отсутствия валидации максимальной длины входных данных, которая может привести к DoS-атакам через передачу чрезмерно длинных строк, переполнению буфера в downstream системах и исчерпанию ресурсов БД.

### 1.2 Пользовательская ценность
- Защита от DoS-атак через длинные строки
- Соответствие требованиям OWASP ASVS L2
- Предотвращение ошибок при сохранении в БД
- Консистентная валидация во всех схемах заказов

### 1.3 Метрики успеха
- **Покрытие**: 100% текстовых полей имеют .max()
- **Security**: нет полей без ограничения длины
- **Отсутствие регрессий**: все существующие тесты проходят
- **Build**: `npm run build` завершается успешно

---

## 2. Функциональные требования

### 2.1 User Stories с Acceptance Criteria

#### US-001: Валидация имён (.max(100))
**Как** разработчик  
**Я хочу**, чтобы все поля имён имели ограничение 100 символов  
**Чтобы** предотвратить передачу чрезмерно длинных строк

**Acceptance Criteria:**
```
GIVEN поле clientName в createOrderSchema
WHEN пользователь вводит имя длиной 101 символ
THEN валидация отклоняет ввод с сообщением "Имя не может превышать 100 символов"
```

#### US-002: Валидация телефонов (.max(20))
**Как** разработчик  
**Я хочу**, чтобы поле телефона имело ограничение 20 символов  
**Чтобы** соответствовать международному формату +7 (XXX) XXX-XX-XX

**Acceptance Criteria:**
```
GIVEN поле phone в createOrderSchema
WHEN пользователь вводит телефон длиной 21 символ
THEN валидация отклоняет ввод с сообщением "Телефон не может превышать 20 символов"
```

#### US-003: Валидация текстовых полей (.max(255))
**Как** разработчик  
**Я хочу**, чтобы все текстовые поля имели ограничение 255 символов  
**Чтобы** предотвратить DoS и переполнение БД

**Acceptance Criteria:**
```
GIVEN любое текстовое поле (email, message, address, comment и т.д.)
WHEN пользователь вводит строку длиной 256 символов
THEN валидация отклоняет ввод с сообщением о превышении лимита
```

---

## 3. Нефункциональные требования

### 3.1 Безопасность

#### 3.1.1 OWASP ASVS L2 - V5.1 Input Validation Requirements
**Проблема:** Отсутствие .max() позволяет:
- DoS через отправку очень длинных строк (мегабайты данных)
- Переполнение буфера в downstream системах
- Исчерпание памяти при обработке запросов
- Ошибки при сохранении в БД (VARCHAR limit exceeded)

**Решение:** Добавить .max() для всех строковых полей.

#### 3.1.2 Лимиты по типам полей

| Тип поля | Лимит | Обоснование |
|----------|-------|-------------|
| Имена (clientName) | 100 | Стандартная длина ФИО |
| Телефоны (phone) | 20 | Международный формат с кодом |
| Текстовые поля | 255 | Стандарт VARCHAR(255) |
| Email | 255 | RFC 5321 limit |

### 3.2 Производительность
- Валидация длины — O(1) операция
- Нет влияния на производительность API

### 3.3 Совместимость
- Next.js 14.2+ (App Router)
- Zod 3.x
- PostgreSQL (VARCHAR лимиты)

---

## 4. Техническая архитектура

### 4.1 Изменения в файле

**Файл:** `src/lib/validators/order.ts`

### 4.2 Детальные изменения

#### 4.2.1 createOrderSchema (строки 3-8)

| Поле | Было | Стало |
|------|------|-------|
| clientName | `.max(100)` | `.max(100, 'Имя не может превышать 100 символов')` |
| phone | regex без max | `.max(20, 'Телефон не может превышать 20 символов')` |
| email | `.email()` без max | `.email().max(255, 'Email не может превышать 255 символов')` |
| message | `.max(1000)` | `.max(255, 'Сообщение не может превышать 255 символов')` |

#### 4.2.2 measurementDataSchema (строки 57-61)

| Поле | Было | Стало |
|------|------|-------|
| measurementAddress | `.min(10)` без max | `.min(10).max(255, 'Адрес не может превышать 255 символов')` |
| measurementComment | без max | `.max(255, 'Комментарий не может превышать 255 символов')` |

#### 4.2.3 productionDataSchema (строки 63-67)

| Поле | Было | Стало |
|------|------|-------|
| measurementResult | без max | `.max(255, 'Результат замера не может превышать 255 символов')` |

#### 4.2.4 installationDataSchema (строки 69-72)

| Поле | Было | Стало |
|------|------|-------|
| productionNotes | без max | `.max(255, 'Заметки не могут превышать 255 символов')` |

#### 4.2.5 completedDataSchema (строки 74-79)

| Поле | Было | Стало |
|------|------|-------|
| reviewLink | без max | `.max(255, 'Ссылка не может превышать 255 символов')` |

#### 4.2.6 cancelledDataSchema (строки 81-84)

| Поле | Было | Стало |
|------|------|-------|
| cancellationComment | `.min(10)` без max | `.min(10).max(255, 'Комментарий не может превышать 255 символов')` |

#### 4.2.7 statusChangeDataSchema (строки 86-103)

| Поле | Было | Стало |
|------|------|-------|
| measurementAddress | без max | `.max(255)` |
| measurementComment | без max | `.max(255)` |
| measurementResult | без max | `.max(255)` |
| productionNotes | без max | `.max(255)` |
| reviewLink | без max | `.max(255)` |
| cancellationComment | без max | `.max(255)` |

#### 4.2.8 updateOrderStatusSchema (строки 105-109)

| Поле | Было | Стало |
|------|------|-------|
| comment | `.max(500)` | `.max(255, 'Комментарий не может превышать 255 символов')` |

#### 4.2.9 orderListQuerySchema (строка 121)

| Поле | Было | Стало |
|------|------|-------|
| search | `z.string().optional()` | `.max(100, 'Поисковый запрос не может превышать 100 символов').optional()` |

> **Почему важно:** поисковый запрос без `.max()` — прямой вектор DoS через длинные строки, попадающие в SQL LIKE-запрос.

#### 4.2.10 photos в completedDataSchema и statusChangeDataSchema

| Поле | Было | Стало |
|------|------|-------|
| photos (элементы массива) | `z.array(z.string())` | `z.array(z.string().max(500, 'URL фото не может превышать 500 символов'))` |

> **Почему важно:** без ограничения длины каждый элемент массива может быть произвольно длинной строкой.

#### 4.2.11 Другие validator-файлы (out of scope текущего ЧТЗ — выделены в отдельный риск)

Файлы `fenceType.ts`, `gateType.ts`, `postType.ts`, `lagType.ts`, `picketType.ts`, `profnastilType.ts`, `wicketType.ts`, `mountingHardware.ts` содержат строковые поля (`name`, `description`, `image`) без `.max()`. Эти файлы затрагивают только admin-роуты, риск ниже, но требуют отдельного ЧТЗ или могут быть добавлены в этот как TASK-BCK-006.

### 4.3 Код изменений

```typescript
import { z } from 'zod';

export const createOrderSchema = z.object({
  clientName: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(100, 'Имя не может превышать 100 символов'),
  phone: z.string()
    .max(20, 'Телефон не может превышать 20 символов')
    .regex(/^\+7\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2}$/, 'Формат: +7 (XXX) XXX-XX-XX'),
  email: z.string().email('Некорректный email').max(255, 'Email не может превышать 255 символов').optional().or(z.literal('')),
  message: z.string().max(255, 'Сообщение не может превышать 255 символов').optional(),
});

// ... ORDER_STATUSES, CONTACT_RESULTS, CANCELLATION_REASONS без изменений ...

export const estimateApprovalDataSchema = z.object({
  contactResult: z.enum(CONTACT_RESULTS).optional(),
  preferredContactDate: z.string().optional(),
});

export const measurementDataSchema = z.object({
  measurementDate: z.string().optional(),
  measurementAddress: z.string()
    .min(10, 'Адрес должен содержать минимум 10 символов')
    .max(255, 'Адрес не может превышать 255 символов'),
  measurementComment: z.string().max(255, 'Комментарий не может превышать 255 символов').optional(),
});

export const productionDataSchema = z.object({
  measurementConfirmed: z.boolean().optional(),
  measurementResult: z.string()
    .min(10, 'Результат замера должен содержать минимум 10 символов')
    .max(255, 'Результат замера не может превышать 255 символов')
    .optional()
    .or(z.literal('')),
  adjustedCost: z.number().positive().optional(),
});

export const installationDataSchema = z.object({
  productionReadyDate: z.string().optional(),
  productionNotes: z.string().max(255, 'Заметки не могут превышать 255 символов').optional(),
});

export const completedDataSchema = z.object({
  completionDate: z.string().optional(),
  clientSatisfied: z.boolean().optional(),
  photos: z.array(z.string()).optional(),
  reviewLink: z.string().max(255, 'Ссылка не может превышать 255 символов').optional(),
});

export const cancelledDataSchema = z.object({
  cancellationReason: z.enum(CANCELLATION_REASONS),
  cancellationComment: z.string()
    .min(10, 'Комментарий должен содержать минимум 10 символов')
    .max(255, 'Комментарий не может превышать 255 символов'),
});

export const statusChangeDataSchema = z.object({
  contactResult: z.enum(CONTACT_RESULTS).optional(),
  preferredContactDate: z.string().optional(),
  measurementDate: z.string().optional(),
  measurementAddress: z.string().max(255).optional(),
  measurementComment: z.string().max(255).optional(),
  measurementConfirmed: z.boolean().optional(),
  measurementResult: z.string().max(255).optional(),
  adjustedCost: z.number().positive().optional(),
  productionReadyDate: z.string().optional(),
  productionNotes: z.string().max(255).optional(),
  completionDate: z.string().optional(),
  clientSatisfied: z.boolean().optional(),
  photos: z.array(z.string()).optional(),
  reviewLink: z.string().max(255).optional(),
  cancellationReason: z.enum(CANCELLATION_REASONS).optional(),
  cancellationComment: z.string().max(255).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  data: statusChangeDataSchema.optional(),
  comment: z.string().max(255, 'Комментарий не может превышать 255 символов').optional(),
});

// ... остальной код без изменений ...
```

---

## 5. UI/UX требования

### 5.1 Валидация на frontend
- Frontend должен отображать сообщения об ошибках валидации
- Текущая реализация уже поддерживает отображение Zod ошибок

### 5.2 Обработка ошибок
- При превышении лимита возвращается HTTP 400 с сообщением ошибки
- Frontend отображает сообщение пользователю

---

## 6. Декомпозиция на задачи

### Backend

#### TASK-BCK-001: Добавить .max() в createOrderSchema
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** Нет

**Описание:**
Добавить валидацию максимальной длины в createOrderSchema.

**Критерии приемки:**
- [ ] phone: добавлен `.max(20, 'Телефон не может превышать 20 символов')`
- [ ] email: добавлен `.max(255, 'Email не может превышать 255 символов')`
- [ ] message: изменён с `.max(1000)` на `.max(255, 'Сообщение не может превышать 255 символов')`
- [ ] clientName: добавлено сообщение ошибки для max
- [ ] TypeScript компиляция без ошибок
- [ ] `npm run build` завершается успешно

**Технические детали:**
- Файлы: `src/lib/validators/order.ts`
- Строки: 3-8

---

#### TASK-BCK-002: Добавить .max() в measurementDataSchema
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** Нет

**Описание:**
Добавить валидацию максимальной длины в measurementDataSchema.

**Критерии приемки:**
- [ ] measurementAddress: добавлен `.max(255, 'Адрес не может превышать 255 символов')`
- [ ] measurementComment: добавлен `.max(255, 'Комментарий не может превышать 255 символов')`
- [ ] TypeScript компиляция без ошибок

**Технические детали:**
- Файлы: `src/lib/validators/order.ts`
- Строки: 57-61

---

#### TASK-BCK-003: Добавить .max() в productionDataSchema, installationDataSchema, completedDataSchema
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** Нет

**Описание:**
Добавить валидацию максимальной длины в схемы производства, монтажа и завершения.

**Критерии приемки:**
- [ ] measurementResult: добавлен `.max(255, 'Результат замера не может превышать 255 символов')`
- [ ] productionNotes: добавлен `.max(255, 'Заметки не могут превышать 255 символов')`
- [ ] reviewLink: добавлен `.max(255, 'Ссылка не может превышать 255 символов')`
- [ ] TypeScript компиляция без ошибок

**Технические детали:**
- Файлы: `src/lib/validators/order.ts`
- Строки: 63-79

---

#### TASK-BCK-004: Добавить .max() в cancelledDataSchema
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 0.25 часа  
**Зависимости:** Нет

**Описание:**
Добавить валидацию максимальной длины в cancelledDataSchema.

**Критерии приемки:**
- [ ] cancellationComment: добавлен `.max(255, 'Комментарий не может превышать 255 символов')`
- [ ] TypeScript компиляция без ошибок

**Технические детали:**
- Файлы: `src/lib/validators/order.ts`
- Строки: 81-84

---

#### TASK-BCK-005b: Добавить .max() в orderListQuerySchema (search) и photos
**Направление:** Backend
**Приоритет:** High
**Оценка:** 0.25 часа
**Зависимости:** Нет

**Описание:**
Добавить валидацию максимальной длины для поля `search` в `orderListQuerySchema` и для элементов массива `photos`.

**Критерии приемки:**
- [ ] `search`: добавлен `.max(100, 'Поисковый запрос не может превышать 100 символов')`
- [ ] `photos`: `z.array(z.string().max(500, 'URL фото не может превышать 500 символов'))`
- [ ] TypeScript компиляция без ошибок

**Технические детали:**
- Файлы: `src/lib/validators/order.ts`
- Строки: 77 (completedDataSchema), 99 (statusChangeDataSchema), 121 (orderListQuerySchema)

---

#### TASK-BCK-005: Добавить .max() в statusChangeDataSchema и updateOrderStatusSchema
**Направление:** Backend  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** Нет

**Описание:**
Добавить валидацию максимальной длины в statusChangeDataSchema и updateOrderStatusSchema.

**Критерии приемки:**
- [ ] Все текстовые поля в statusChangeDataSchema имеют `.max(255)`
- [ ] comment в updateOrderStatusSchema: изменён с `.max(500)` на `.max(255)`
- [ ] TypeScript компиляция без ошибок

**Технические детали:**
- Файлы: `src/lib/validators/order.ts`
- Строки: 86-109

---

### Testing

#### TASK-TST-001: Unit-тесты для валидации длины
**Направление:** Testing  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** TASK-BCK-001, TASK-BCK-002, TASK-BCK-003, TASK-BCK-004, TASK-BCK-005

**Описание:**
Написать unit-тесты для проверки валидации максимальной длины.

**Критерии приемки:**
- [ ] Тест проверяет phone с 21 символом → ошибка
- [ ] Тест проверяет phone с 20 символами → успех
- [ ] Тест проверяет clientName с 101 символом → ошибка
- [ ] Тест проверяет clientName с 100 символами → успех
- [ ] Тест проверяет текстовые поля с 256 символами → ошибка
- [ ] Тест проверяет текстовые поля с 255 символами → успех
- [ ] Покрытие `src/lib/validators/order.ts` ≥ 80%
- [ ] `npm run test` проходит успешно

**Технические детали:**
- Файлы: `__tests__/lib/validators/order.test.ts`
- Использовать существующий файл тестов, добавить новые кейсы

---

#### TASK-TST-002: Проверка отсутствия регрессий
**Направление:** Testing  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** TASK-BCK-001 — TASK-BCK-005

**Описание:**
Запустить все существующие тесты и убедиться в отсутствии регрессий.

**Критерии приемки:**
- [ ] `npm run test` проходит без ошибок
- [ ] `npm run build` завершается успешно
- [ ] `npm run lint` не показывает новых ошибок
- [ ] Ручное тестирование: создание заявки работает
- [ ] Ручное тестирование: изменение статуса работает

---

## 7. Тестирование

### 7.1 Unit-тесты

**Файлы:**
- `__tests__/lib/validators/order.test.ts`

**Тест-кейсы:**
| ID | Поле | Ввод | Ожидаемый результат |
|----|------|------|---------------------|
| UT-001 | phone | 21 символ | Ошибка: max 20 |
| UT-002 | phone | 20 символов | Успех |
| UT-003 | clientName | 101 символ | Ошибка: max 100 |
| UT-004 | clientName | 100 символов | Успех |
| UT-005 | email | 256 символов | Ошибка: max 255 |
| UT-006 | email | 255 символов | Успех |
| UT-007 | message | 256 символов | Ошибка: max 255 |
| UT-008 | message | 255 символов | Успех |
| UT-009 | measurementAddress | 256 символов | Ошибка: max 255 |
| UT-010 | measurementComment | 256 символов | Ошибка: max 255 |
| UT-011 | comment | 256 символов | Ошибка: max 255 |
| UT-012 | search (orderListQuery) | 101 символ | Ошибка: max 100 |
| UT-013 | search (orderListQuery) | 100 символов | Успех |
| UT-014 | photos[0] | 501 символ (URL) | Ошибка: max 500 |
| UT-015 | photos[0] | 500 символов (URL) | Успех |

### 7.2 Ручное тестирование

#### 7.2.1 Тест-кейс: Создание заявки с длинным телефоном

**Шаги:**
1. Открыть форму создания заявки
2. Ввести телефон длиной 21 символ
3. Нажать "Отправить"

**Ожидаемый результат:**
- Валидация на frontend блокирует отправку
- Или API возвращает 400 с сообщением об ошибке

#### 7.2.2 Тест-кейс: Создание заявки с длинным сообщением

**Шаги:**
1. Открыть форму создания заявки
2. Ввести сообщение длиной 256 символов
3. Нажать "Отправить"

**Ожидаемый результат:**
- Валидация на frontend блокирует отправку
- Или API возвращает 400 с сообщением об ошибке

---

## 8. Риски и зависимости

### 8.1 Риски

#### Риск 0: Регрессия поля `message` (Вероятность: Medium, Влияние: Medium)
**Описание:** Поле `message` уменьшается с `.max(1000)` до `.max(255)`. В БД могут быть заявки с сообщениями длиной 256–1000 символов. При повторном сохранении такой заявки (если frontend отправит существующий текст) валидация вернёт 400.
**Митигация:**
- Запустить SQL-запрос: `SELECT COUNT(*) FROM "Order" WHERE LENGTH(parameters::text) > 255` (или аналогичный по полю message)
- Если есть записи — рассмотреть `max(500)` как компромисс, или оставить `max(1000)` только для этого поля
- Добавить миграционную проверку перед деплоем

#### Риск 1: Существующие данные превышают лимиты (Вероятность: Low, Влияние: Medium)
**Описание:** В БД могут быть записи с длинными строками  
**Митигация:**
- Проверить существующие данные в БД
- При необходимости увеличить лимиты или мигрировать данные

#### Риск 2: Frontend не обрабатывает новые сообщения об ошибках (Вероятность: Low, Влияние: Low)
**Описание:** Новые сообщения об ошибках могут не отображаться корректно  
**Митигация:**
- Проверить отображение ошибок на frontend
- Убедиться, что сообщения локализованы

### 8.2 Зависимости

| Зависимость | Статус | Описание |
|-------------|--------|----------|
| Zod 3.x | ✅ | Используется в проекте |
| TypeScript | ✅ | Проект на TypeScript |

---

## 9. Критерии готовности (Definition of Done)

### Code Review
- [ ] Код прошел code review
- [ ] Все комментарии ревьюера учтены

### Тестирование
- [ ] Unit-тесты написаны и проходят (покрытие ≥ 80%)
- [ ] Все существующие тесты проходят
- [ ] `npm run build` завершается успешно
- [ ] `npm run lint` не показывает новых ошибок

### Функциональность
- [ ] Все текстовые поля имеют `.max()`
- [ ] phone имеет `.max(20)`
- [ ] clientName имеет `.max(100)`
- [ ] Сообщения об ошибках информативны

### Безопасность
- [ ] OWASP ASVS L2 V5.1 — все строковые поля валидируются по длине
- [ ] Нет полей без ограничения длины

---

## 10. Согласование

- [ ] **Заказчик:** Требования согласованы
- [ ] **Техлид:** Архитектура одобрена
- [ ] **Security:** Решение соответствует политике безопасности

---

## 11. Приложения

### Приложение А: Сводная таблица изменений

| Схема | Поле | Было | Стало |
|-------|------|------|-------|
| createOrderSchema | clientName | `.max(100)` | `.max(100, 'Имя не может превышать 100 символов')` |
| createOrderSchema | phone | нет max | `.max(20, 'Телефон не может превышать 20 символов')` |
| createOrderSchema | email | нет max | `.max(255, 'Email не может превышать 255 символов')` |
| createOrderSchema | message | `.max(1000)` | `.max(255, 'Сообщение не может превышать 255 символов')` |
| measurementDataSchema | measurementAddress | нет max | `.max(255, 'Адрес не может превышать 255 символов')` |
| measurementDataSchema | measurementComment | нет max | `.max(255, 'Комментарий не может превышать 255 символов')` |
| productionDataSchema | measurementResult | нет max | `.max(255, 'Результат замера не может превышать 255 символов')` |
| installationDataSchema | productionNotes | нет max | `.max(255, 'Заметки не могут превышать 255 символов')` |
| completedDataSchema | reviewLink | нет max | `.max(255, 'Ссылка не может превышать 255 символов')` |
| cancelledDataSchema | cancellationComment | нет max | `.max(255, 'Комментарий не может превышать 255 символов')` |
| statusChangeDataSchema | measurementAddress | нет max | `.max(255)` |
| statusChangeDataSchema | measurementComment | нет max | `.max(255)` |
| statusChangeDataSchema | measurementResult | нет max | `.max(255)` |
| statusChangeDataSchema | productionNotes | нет max | `.max(255)` |
| statusChangeDataSchema | reviewLink | нет max | `.max(255)` |
| statusChangeDataSchema | cancellationComment | нет max | `.max(255)` |
| updateOrderStatusSchema | comment | `.max(500)` | `.max(255, 'Комментарий не может превышать 255 символов')` |
| orderListQuerySchema | search | нет max | `.max(100, 'Поисковый запрос не может превышать 100 символов')` |
| completedDataSchema | photos (элементы) | `z.string()` без max | `z.string().max(500)` |
| statusChangeDataSchema | photos (элементы) | `z.string()` без max | `z.string().max(500)` |

### Приложение Б: OWASP ASVS L2 - V5.1

**V5.1.1:** Verify that the application has defenses against HTTP parameter pollution attacks, particularly if the application framework makes no distinction about the source of request parameters (GET, POST, cookies, headers, or environment variables).

**V5.1.2:** Verify that frameworks protect against mass parameter assignment attacks, or that the application has countermeasures to protect against unsafe parameter assignment, such as marking fields private or similar.

**V5.1.3:** Verify that all input (HTML form fields, REST requests, URL parameters, HTTP headers, cookies, batch files, RSS feeds, etc) is validated using positive validation (allow lists).

**V5.1.4:** Verify that structured data is strongly typed and validated against a defined schema including allowed characters, length and pattern (e.g. credit card numbers, e-mail addresses, telephone numbers, or validating that two related fields are reasonable, such as checking suburb and zip code match).

---

**Документ подготовлен:** 2026-03-18  
**Версия:** 1.0  
**Статус:** Требует согласования с заказчиком
