# ЧТЗ: Audit Log для критических операций

## Версия: 1.0
## Дата: 2026-03-18
## Автор: AI-аналитик (ИБ)
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Создать единую систему аудита для критических операций с заказами, ценами и справочниками, обеспечивающую:
- **Неотказуемость** — кто, что, когда изменил
- **Отслеживаемость** — возможность восстановления истории изменений
- **Соответствие стандартам ИБ** — OWASP ASVS V7 (Audit Logging)
- **Расследование инцидентов** — who/what/when/where для всех критических операций

### 1.2 Пользовательская ценность
- **Прозрачность**: Полная история изменений для расследования инцидентов
- **Безопасность**: Выявление несанкционированных изменений
- **Соответствие**: Выполнение требований регуляторов по логированию
- **Аналитика**: Понимание паттернов использования системы

### 1.3 Метрики успеха
- 100% критических операций логируются
- Время записи в лог: < 50ms (асинхронно)
- Хранение oldValues/newValues для всех операций изменения
- IP-адрес фиксируется в 100% записей
- Покрытие unit-тестами ≥80%

---

## 2. Анализ текущего состояния

### 2.1 Существующие механизмы логирования

| Модель | Назначение | Проблемы |
|--------|------------|----------|
| `AdminActionLog` | Логирование действий админов | Не все операции логируются, нет oldValues/newValues |
| `ReferenceChangeLog` | Изменения справочников | Дублирование логики, нет IP |
| `PriceHistory` | История цен | Дублирование, только цены |

### 2.2 Решение по существующим моделям логирования

После создания единого `AuditLog` существующие модели `PriceHistory` и `ReferenceChangeLog` становятся дублирующими. Принятое решение:

| Модель | Решение | Причина |
|--------|---------|---------|
| `PriceHistory` | **Deprecated → удалить в следующем спринте** | Заменяется `AuditLog` с action=`UPDATE_PRICE` и oldValues/newValues |
| `ReferenceChangeLog` | **Deprecated → удалить в следующем спринте** | Заменяется `AuditLog` с action=`UPDATE_REFERENCE` и oldValues/newValues |
| `AdminActionLog` | **Переименовать в `AuditLog`** | Единая точка аудита |

**Порядок действий**:
1. В рамках данного ЧТЗ: создать `AuditLog`, новые записи писать только туда
2. Сервисы, пишущие в `PriceHistory`/`ReferenceChangeLog` — переключить на `AuditLog`
3. После стабилизации (2 недели) — выполнить миграцию и удалить старые модели

### 2.3 Выявленные проблемы

| Файл | Строка | Проблема | Критичность |
|------|--------|----------|-------------|
| `src/services/admin/ordersService.ts` | 342-346 | `deleteOrder()` не логирует удаление | High |
| `src/services/admin/ordersService.ts` | 348+ | `batchUpdateOrders()` не логирует изменения | High |
| `src/services/admin/ordersService.ts` | 304-340 | `updateStatusHistoryEntry()` не логирует редактирование истории | High |
| `src/app/api/admin/orders/route.ts` | - | Создание заказа через публичный API не логируется | High |
| `src/services/admin/ordersService.ts` | 175-186, 283-295 | Прямой вызов `prisma.adminActionLog.create` вместо auditLogService | Medium |
| `prisma/schema.prisma` | 263-274 | `AdminActionLog` не имеет полей oldValues/newValues | High |
| `src/services/admin/*Service.ts` | - | Несколько разных механизмов логирования | Medium |
| `src/services/admin/postTypeService.ts` | 341-380 | Собственный `logChange()` вместо единого подхода | Medium |
| `src/app/api/admin/orders/[id]/route.ts` | 342 | `deleteOrder()` вызывается без `userId` — нет возможности логировать кто удалил | High |

### 2.4 Текущее покрытие критических операций

| Операция | Логируется? | Где | Механизм |
|----------|-------------|-----|----------|
| Создание заказа (публичное) | ❌ Нет | - | - |
| Создание заказа (админ) | ❌ Нет | - | - |
| Изменение заказа | ⚠️ Частично | ordersService:131-194 | AdminActionLog |
| Смена статуса заказа | ✅ Да | ordersService:196-302 | AdminActionLog |
| Удаление заказа | ❌ Нет | ordersService:342-346 | - |
| Массовое обновление заказов | ❌ Нет | ordersService:348+ | - |
| Редактирование истории статусов | ❌ Нет | ordersService:304-340 | - |
| Изменение цен справочников | ⚠️ Частично | *Service.ts | ReferenceChangeLog |
| Изменение цен в сметах | ❌ Нет | - | - |
| Создание справочников | ⚠️ Частично | *Service.ts | ReferenceChangeLog |
| Удаление справочников | ⚠️ Частично | *Service.ts | ReferenceChangeLog |

---

## 3. Функциональные требования

### 3.1 User Stories с Acceptance Criteria

#### US-001: Переименование модели AdminActionLog → AuditLog
**Как** разработчик,  
**Я хочу** переименовать модель AdminActionLog в AuditLog с сохранением данных,  
**Чтобы** использовать единый термин для системы аудита.

**Acceptance Criteria**:
```
Given модель AdminActionLog существует в Prisma схеме
When выполняется миграция
Then модель переименована в AuditLog
And все существующие данные сохранены
And все relation в User модели обновлены (actionLogs → auditLogs)
And TypeScript типы обновлены
```

#### US-002: Расширение структуры AuditLog
**Как** система безопасности,  
**Я хочу** хранить oldValues и newValues для каждой операции,  
**Чтобы** иметь полную историю изменений.

**Acceptance Criteria**:
```
Given AuditLog модель существует
When добавляются поля oldValues и newValues (Json?)
Then можно хранить полные снимки данных до и после изменения
And для операций CREATE: oldValues = null, newValues = созданная сущность
And для операций UPDATE: oldValues = старые значения, newValues = новые значения
And для операций DELETE: oldValues = удалённая сущность, newValues = null
```

#### US-003: Логирование создания заказов
**Как** аудитор,  
**Я хочу** видеть в логах все создания заказов,  
**Чтобы** отслеживать кто и когда создал заказ.

**Acceptance Criteria**:
```
Given пользователь создаёт заказ через POST /api/orders или POST /api/admin/orders
When заказ успешно создан
Then создаётся запись в AuditLog:
  - action = "CREATE_ORDER"
  - entityType = "Order"
  - entityId = order.id
  - userId = session.user.id (или system для публичных)
  - oldValues = null
  - newValues = { clientName, phone, email, serviceType, parameters, calculatedCost }
  - ipAddress = IP клиента
```

#### US-004: Логирование удаления заказов
**Как** аудитор,  
**Я хочу** видеть в логах все удаления заказов,  
**Чтобы** расследовать инциденты с исчезновением данных.

**Acceptance Criteria**:
```
Given администратор удаляет заказ через DELETE /api/admin/orders/:id
When заказ успешно удалён
Then создаётся запись в AuditLog:
  - action = "DELETE_ORDER"
  - entityType = "Order"
  - entityId = id (сохраняем даже после удаления)
  - userId = session.user.id
  - oldValues = { полная копия заказа до удаления }
  - newValues = null
  - ipAddress = IP клиента
```

#### US-005: Логирование изменений цен справочников
**Как** финансовый контролёр,  
**Я хочу** отслеживать все изменения цен в справочниках,  
**Чтобы** выявлять несанкционированные изменения.

**Acceptance Criteria**:
```
Given администратор изменяет цену в любом справочнике:
  - PostType, LagType, GateType, WicketType
  - ProfnastilType, PicketType
  - MountingHardware, Work
When изменяются поля:
  - *Price (retailPricePerUnit, purchasePricePerUnit, retailPrice, etc.)
  - pricePerUnit, price
Then создаётся запись в AuditLog:
  - action = "UPDATE_PRICE"
  - entityType = имя модели (e.g., "PostType")
  - entityId = id сущности
  - userId = session.user.id
  - oldValues = { изменённые поля со старыми значениями }
  - newValues = { изменённые поля с новыми значениями }
  - ipAddress = IP клиента
```

#### US-006: Логирование изменений цен в сметах
**Как** финансовый контролёр,  
**Я хочу** отслеживать изменения итоговых цен в сметах,  
**Чтобы** выявлять манипуляции с расчётами.

**Acceptance Criteria**:
```
Given пользователь изменяет смету FenceEstimate
When изменяются поля:
  - grandTotal, materialsTotal, installationTotal
  - postsTotal, lagsTotal, profnastilTotal
Then создаётся запись в AuditLog:
  - action = "UPDATE_ESTIMATE_PRICES"
  - entityType = "FenceEstimate"
  - entityId = estimate.id
  - userId = session.user.id (или sessionId для анонимов)
  - oldValues = { старые значения цен }
  - newValues = { новые значения цен }
  - ipAddress = IP клиента
```

#### US-008: Логирование массового обновления заказов
**Как** аудитор,
**Я хочу** видеть в логах массовые обновления заказов,
**Чтобы** отслеживать операции batch-изменений.

**Acceptance Criteria**:
```
Given администратор выполняет PUT /api/admin/orders с массивом ids
When заказы успешно обновлены (статус или assignedTo)
Then для каждого обновлённого заказа создаётся запись в AuditLog:
  - action = "BATCH_UPDATE_ORDERS"
  - entityType = "Order"
  - entityId = order.id
  - userId = session.user.id
  - oldValues = { status, assignedTo } до изменения
  - newValues = { status, assignedTo } после изменения
  - ipAddress = IP клиента
```

#### US-009: Логирование редактирования истории статусов
**Как** аудитор,
**Я хочу** видеть в логах все изменения записей истории статусов,
**Чтобы** выявлять манипуляции с историей заказов.

**Acceptance Criteria**:
```
Given администратор редактирует запись истории через PATCH /api/admin/orders/:id/status-history/:index
When запись истории успешно обновлена
Then создаётся запись в AuditLog:
  - action = "EDIT_STATUS_HISTORY"
  - entityType = "Order"
  - entityId = orderId
  - userId = session.user.id
  - oldValues = { data: entry.data до изменения }
  - newValues = { data: entry.data после изменения, historyIndex }
  - ipAddress = IP клиента
```

#### US-007: API endpoint для просмотра AuditLog
**Как** администратор,  
**Я хочу** просматривать логи аудита через API,  
**Чтобы** анализировать историю изменений.

**Acceptance Criteria**:
```
Given администратор авторизован с ролью ADMIN
When отправляется GET /api/admin/audit-logs с параметрами:
  - userId (optional)
  - action (optional)
  - entityType (optional)
  - entityId (optional)
  - dateFrom (optional)
  - dateTo (optional)
  - page (default: 1)
  - pageSize (default: 50, max: 100)
Then возвращается список логов с пагинацией:
  - logs[] с полями: id, userId, action, entityType, entityId, oldValues, newValues, ipAddress, createdAt
  - user: { id, name, email }
  - total, page, pageSize, totalPages
And статус 200
```

---

## 4. Нефункциональные требования

### 4.1 Производительность
- Запись в AuditLog **асинхронная** (не блокирует основную операцию)
- Время добавления записи: < 50ms
- Индексы на полях: `userId`, `action`, `entityType`, `entityId`, `createdAt`

### 4.2 Безопасность
- Доступ к API `/api/admin/audit-logs` только для роли ADMIN
- Логи **нельзя изменять или удалять** через API
- IP-адрес извлекается из `x-forwarded-for` с учётом прокси
- Защита от log injection (санитизация input)

### 4.3 Масштабируемость
- Партиционирование таблицы по `createdAt` (месяц) при достижении 1M записей
- Retention policy: хранение логов 2 года
- Возможность экспорта в SIEM/ELK в будущем

### 4.4 Надёжность
- Ошибка записи в AuditLog **не должна** блокировать основную операцию
- Логирование ошибок аудита в console с пометкой `[AUDIT_ERROR]`

---

## 5. Техническая архитектура

### 5.1 Изменения в БД (Prisma Schema)

#### Миграция 1: Переименование AdminActionLog → AuditLog

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String
  entityType String?
  entityId   String?
  oldValues  Json?
  newValues  Json?
  details    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

#### Миграция 2: Обновление User модели

```prisma
model User {
  // ... existing fields ...
  auditLogs AuditLog[]  // переименовано с actionLogs
}
```

#### SQL Migration

```sql
-- Rename table
ALTER TABLE "AdminActionLog" RENAME TO "audit_logs";

-- Add new columns
ALTER TABLE "audit_logs" ADD COLUMN "oldValues" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN "newValues" JSONB;

-- Create indexes
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- Update foreign key in User relation (handled by Prisma)
```

#### Rollback

```sql
-- Drop new columns
ALTER TABLE "audit_logs" DROP COLUMN "oldValues";
ALTER TABLE "audit_logs" DROP COLUMN "newValues";

-- Drop indexes
DROP INDEX IF EXISTS "audit_logs_userId_idx";
DROP INDEX IF EXISTS "audit_logs_action_idx";
DROP INDEX IF EXISTS "audit_logs_entity_idx";
DROP INDEX IF EXISTS "audit_logs_createdAt_idx";

-- Rename table back
ALTER TABLE "audit_logs" RENAME TO "AdminActionLog";
```

### 5.2 Утилита для аудита

**Файл**: `src/lib/audit.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { getClientIPFromHeaders } from '@/lib/utils';

export type AuditAction =
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER'
  | 'UPDATE_ORDER_STATUS'
  | 'DELETE_ORDER'
  | 'BATCH_UPDATE_ORDERS'
  | 'EDIT_STATUS_HISTORY'
  | 'UPDATE_PRICE'
  | 'UPDATE_ESTIMATE_PRICES'
  | 'CREATE_REFERENCE'
  | 'UPDATE_REFERENCE'
  | 'DELETE_REFERENCE';

export interface AuditLogParams {
  userId: string;
  action: AuditAction | string;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  details?: Record<string, any>;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const headersList = await headers();
    const ipAddress = getClientIPFromHeaders(headersList) || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues ?? undefined,
        newValues: params.newValues ?? undefined,
        details: params.details,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('[AUDIT_ERROR] Failed to create audit log:', error);
  }
}

export async function createAuditLogAsync(params: AuditLogParams): Promise<void> {
  setImmediate(() => createAuditLog(params));
}
```

### 5.3 API Specification

#### GET /api/admin/audit-logs

**Auth**: Bearer JWT (role: ADMIN)

**Request Query Parameters**:
```
userId?: string
action?: string
entityType?: string
entityId?: string
dateFrom?: ISO8601 date
dateTo?: ISO8601 date
page?: number (default: 1)
pageSize?: number (default: 50, max: 100)
```

**Response 200**:
```json
{
  "logs": [
    {
      "id": "clx123abc",
      "userId": "user456",
      "action": "UPDATE_ORDER_STATUS",
      "entityType": "Order",
      "entityId": "order789",
      "oldValues": { "status": "NEW" },
      "newValues": { "status": "ESTIMATE_APPROVAL" },
      "details": { "changedBy": "admin@example.com" },
      "ipAddress": "192.168.1.100",
      "createdAt": "2026-03-18T10:30:00Z",
      "user": {
        "id": "user456",
        "name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ],
  "total": 156,
  "page": 1,
  "pageSize": 50,
  "totalPages": 4
}
```

**Response 403**:
```json
{
  "error": "Forbidden",
  "message": "Only ADMIN can access audit logs"
}
```

### 5.4 Структура файлов

```
src/
├── lib/
│   ├── audit.ts                    # NEW: Утилита для аудита
│   └── utils.ts                    # EXISTS: getClientIPFromHeaders
├── services/
│   └── admin/
│       ├── auditService.ts         # RENAME: auditLogService.ts → auditService.ts
│       └── ordersService.ts        # UPDATE: Использовать createAuditLog
├── app/
│   └── api/
│       └── admin/
│           └── audit-logs/
│               └── route.ts        # NEW: GET endpoint
prisma/
└── migrations/
    └── YYYYMMDDHHMMSS_rename_audit_log/
        └── migration.sql           # NEW: Миграция
```

---

## 6. Декомпозиция на задачи

### Backend

#### TASK-BCK-001: Prisma миграция AdminActionLog → AuditLog
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 1 час  
**Зависимости**: нет

**Описание**:
Переименовать модель AdminActionLog в AuditLog, добавить поля oldValues и newValues, создать миграцию.

**Критерии приемки**:
- [ ] Модель переименована в schema.prisma
- [ ] Добавлены поля `oldValues Json?` и `newValues Json?`
- [ ] Создана миграция с rename + alter table
- [ ] Написан rollback скрипт
- [ ] Миграция протестирована на тестовых данных
- [ ] Обновлена связь в User модели (actionLogs → auditLogs)

**Технические детали**:
- Файлы: `prisma/schema.prisma`, `prisma/migrations/...`
- Prisma команда: `npx prisma migrate dev --name rename_to_audit_log`

---

#### TASK-BCK-002: Создание утилиты audit.ts
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 1.5 часа  
**Зависимости**: TASK-BCK-001

**Описание**:
Создать утилиту для создания записей аудита с типизацией действий, извлечением IP и async поддержкой.

**Критерии приемки**:
- [ ] Создан файл `src/lib/audit.ts`
- [ ] Экспортируется `createAuditLog()` — синхронная версия
- [ ] Экспортируется `createAuditLogAsync()` — асинхронная (setImmediate)
- [ ] Тип `AuditAction` для валидных действий
- [ ] Извлечение IP через `getClientIPFromHeaders`
- [ ] Ошибки логируются в console с `[AUDIT_ERROR]`
- [ ] Unit-тесты ≥80% coverage

**Технические детали**:
- Файлы: `src/lib/audit.ts`, `__tests__/lib/audit.test.ts`
- Типы: `AuditAction`, `AuditLogParams`

---

#### TASK-BCK-003: Рефакторинг auditLogService → auditService
**Направление**: Backend  
**Приоритет**: Medium  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-BCK-001

**Описание**:
Переименовать auditLogService.ts в auditService.ts, обновить импорты, использовать новый Prisma тип.

**Критерии приемки**:
- [ ] Файл переименован: `auditLogService.ts` → `auditService.ts`
- [ ] Обновлены все импорты в других файлах
- [ ] Используется `prisma.auditLog` вместо `prisma.adminActionLog`
- [ ] Метод `logAction` использует поля oldValues/newValues
- [ ] Тесты проходят

**Технические детали**:
- Файлы: `src/services/admin/auditService.ts`, все файлы с импортами

---

#### TASK-BCK-004: Логирование создания заказов
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 1 час  
**Зависимости**: TASK-BCK-002

**Описание**:
Добавить логирование создания заказов в публичном и админском API.

**Критерии приемки**:
- [ ] `POST /api/orders` логирует создание заказа
- [ ] userId = "system" или sessionId для неавторизованных
- [ ] action = "CREATE_ORDER"
- [ ] oldValues = null, newValues = { clientName, phone, ... }
- [ ] IP-адрес записывается
- [ ] Unit-тесты

**Технические детали**:
- Файлы: `src/app/api/orders/route.ts`, `src/services/admin/ordersService.ts`
- Типы: использовать `createAuditLogAsync`

---

#### TASK-BCK-005: Логирование удаления заказов
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-BCK-002

**Описание**:
Добавить логирование удаления заказов с сохранением полных данных.

**Критерии приемки**:
- [ ] `DELETE /api/admin/orders/:id` логирует удаление
- [ ] oldValues = полная копия заказа перед удалением
- [ ] newValues = null
- [ ] action = "DELETE_ORDER"
- [ ] Unit-тесты

**Технические детали**:
- Файлы: `src/services/admin/ordersService.ts`, `src/app/api/admin/orders/[id]/route.ts`
- Метод: `deleteOrder()` — **изменить сигнатуру** с `deleteOrder(id: string)` на `deleteOrder(id: string, userId: string)`
- В route handler передавать `session.user.id` в вызов `ordersService.deleteOrder(params.id, session.user.id)`

---

#### TASK-BCK-005b: Логирование массового обновления заказов
**Направление**: Backend
**Приоритет**: High
**Оценка**: 0.5 часа
**Зависимости**: TASK-BCK-002

**Описание**:
Добавить логирование в `batchUpdateOrders()` для каждого обновлённого заказа.

**Критерии приемки**:
- [ ] `batchUpdateOrders()` вызывает `createAuditLogAsync` для каждого заказа
- [ ] action = "BATCH_UPDATE_ORDERS"
- [ ] oldValues = состояние до, newValues = состояние после
- [ ] Тесты проходят

**Технические детали**:
- Файлы: `src/services/admin/ordersService.ts` (строки 348+)

---

#### TASK-BCK-005c: Логирование редактирования истории статусов
**Направление**: Backend
**Приоритет**: High
**Оценка**: 0.5 часа
**Зависимости**: TASK-BCK-002

**Описание**:
Добавить логирование в `updateStatusHistoryEntry()` — редактирование записи истории статусов.

**Критерии приемки**:
- [ ] `updateStatusHistoryEntry()` вызывает `createAuditLog`
- [ ] action = "EDIT_STATUS_HISTORY"
- [ ] oldValues = старое состояние записи, newValues = новое состояние + historyIndex
- [ ] Тесты проходят

**Технические детали**:
- Файлы: `src/services/admin/ordersService.ts` (строки 304-340)

---

#### TASK-BCK-006: Логирование изменений цен справочников
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 2 часа  
**Зависимости**: TASK-BCK-002

**Описание**:
Добавить логирование изменений цен во всех сервисах справочников (PostType, LagType, etc.).

**Критерии приемки**:
- [ ] PostTypeService.logChange использует createAuditLog
- [ ] Аналогично для LagType, GateType, WicketType
- [ ] Аналогично для ProfnastilType, PicketType
- [ ] Аналогично для MountingHardware, Work
- [ ] action = "UPDATE_PRICE" при изменении ценовых полей
- [ ] oldValues/newValues содержат только изменённые поля
- [ ] Unit-тесты для каждого сервиса

**Технические детали**:
- Файлы: 
  - `src/services/admin/postTypeService.ts`
  - `src/services/admin/lagTypeService.ts`
  - `src/services/admin/gateTypeService.ts`
  - `src/services/admin/wicketTypeService.ts`
  - `src/services/admin/profnastilTypeService.ts`
  - `src/services/admin/picketTypeService.ts`
  - `src/services/admin/mountingHardwareService.ts`
  - `src/services/admin/workService.ts`
- Ценовые поля: `retailPricePerUnit`, `purchasePricePerUnit`, `retailPrice`, `purchasePrice`, `pricePerUnit`, `price`, `pricePerMeter`

---

#### TASK-BCK-007: Логирование изменений цен в сметах
**Направление**: Backend  
**Приоритет**: Medium  
**Оценка**: 1 час  
**Зависимости**: TASK-BCK-002

**Описание**:
Добавить логирование изменений итоговых цен в FenceEstimate.

**Критерии приемки**:
- [ ] При обновлении FenceEstimate логируются изменения цен
- [ ] Отслеживаемые поля: grandTotal, materialsTotal, installationTotal
- [ ] action = "UPDATE_ESTIMATE_PRICES"
- [ ] userId или sessionId для анонимных пользователей
- [ ] Unit-тесты

**Технические детали**:
- Файлы: `src/app/api/calculator/fence/estimate/[id]/route.ts`, `src/services/admin/estimatesService.ts`
- Сущность: FenceEstimate

---

#### TASK-BCK-008: API endpoint GET /api/admin/audit-logs
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 1.5 часа  
**Зависимости**: TASK-BCK-003

**Описание**:
Создать API endpoint для просмотра логов аудита с фильтрацией и пагинацией.

**Критерии приемки**:
- [ ] Создан `src/app/api/admin/audit-logs/route.ts`
- [ ] GET запрос с query параметрами фильтрации
- [ ] Авторизация: только ADMIN
- [ ] Пагинация: page, pageSize (max 100)
- [ ] Возврат логов с user данными
- [ ] Сортировка по createdAt DESC
- [ ] Integration-тесты

**Технические детали**:
- Файлы: `src/app/api/admin/audit-logs/route.ts`, `__tests__/api/audit-logs.test.ts`
- Endpoint: `GET /api/admin/audit-logs`
- Использовать: `auditService.getAuditLogs()`

---

#### TASK-BCK-009: Рефакторинг ordersService для использования createAuditLog
**Направление**: Backend  
**Приоритет**: Medium  
**Оценка**: 1 час  
**Зависимости**: TASK-BCK-002

**Описание**:
Заменить прямые вызовы `prisma.adminActionLog.create` на `createAuditLog` в ordersService.

**Критерии приемки**:
- [ ] `updateOrder()` использует createAuditLog
- [ ] `updateOrderStatus()` использует createAuditLog
- [ ] Передаются oldValues и newValues
- [ ] Тесты проходят

**Технические детали**:
- Файлы: `src/services/admin/ordersService.ts`
- Строки: 175-186, 283-295

---

### Testing

#### TASK-TST-001: Unit-тесты для audit.ts
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 1 час  
**Зависимости**: TASK-BCK-002

**Критерии приемки**:
- [ ] Тест createAuditLog с моком prisma
- [ ] Тест createAuditLogAsync
- [ ] Тест извлечения IP из headers
- [ ] Тест обработки ошибок
- [ ] Coverage ≥80%

**Технические детали**:
- Файлы: `__tests__/lib/audit.test.ts`

---

#### TASK-TST-002: Integration-тесты для API audit-logs
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 1 час  
**Зависимости**: TASK-BCK-008

**Критерии приемки**:
- [ ] Тест GET /api/admin/audit-logs без авторизации → 401
- [ ] Тест GET с ролью MANAGER → 403
- [ ] Тест GET с ролью ADMIN → 200
- [ ] Тест фильтрации по userId
- [ ] Тест фильтрации по dateFrom/dateTo
- [ ] Тест пагинации

**Технические детали**:
- Файлы: `__tests__/api/admin/audit-logs.test.ts`

---

#### TASK-TST-003: Unit-тесты для логирования заказов
**Направление**: Testing  
**Приоритет**: Medium  
**Оценка**: 1.5 часа  
**Зависимости**: TASK-BCK-004, TASK-BCK-005

**Критерии приемки**:
- [ ] Тест логирования создания заказа
- [ ] Тест логирования удаления заказа
- [ ] Тест логирования обновления статуса
- [ ] Проверка oldValues/newValues

**Технические детали**:
- Файлы: `__tests__/services/ordersService.test.ts`

---

### Documentation

#### TASK-DOC-001: Обновление ARCHITECTURE.md
**Направление**: Documentation  
**Приоритет**: Low  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-BCK-008

**Критерии приемки**:
- [ ] Добавлен раздел Audit System
- [ ] Описана структура AuditLog
- [ ] Описан API endpoint

**Технические детали**:
- Файлы: `ARCHITECTURE.md`

---

#### TASK-DOC-002: Обновление API.md
**Направление**: Documentation  
**Приоритет**: Low  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-BCK-008

**Критерии приемки**:
- [ ] Добавлен endpoint GET /api/admin/audit-logs
- [ ] Описаны параметры и response

**Технические детали**:
- Файлы: `API.md`

---

## 7. Тестирование

### 7.1 Unit-тесты

| Модуль | Что тестируем | Файл |
|--------|---------------|------|
| `audit.ts` | createAuditLog, IP extraction | `__tests__/lib/audit.test.ts` |
| `ordersService` | CREATE, DELETE logging | `__tests__/services/ordersService.test.ts` |
| `postTypeService` | Price change logging | `__tests__/services/postTypeService.test.ts` |

### 7.2 Integration-тесты

| Endpoint | Сценарий | Ожидаемый результат |
|----------|----------|---------------------|
| `GET /api/admin/audit-logs` | Без авторизации | 401 Unauthorized |
| `GET /api/admin/audit-logs` | Роль MANAGER | 403 Forbidden |
| `GET /api/admin/audit-logs` | Роль ADMIN | 200 + logs array |
| `POST /api/orders` | Создание заказа | AuditLog создан |
| `DELETE /api/admin/orders/:id` | Удаление заказа | AuditLog с oldValues |

### 7.3 Тестовые данные

```typescript
const mockAuditLog = {
  id: 'test123',
  userId: 'user456',
  action: 'UPDATE_ORDER_STATUS',
  entityType: 'Order',
  entityId: 'order789',
  oldValues: { status: 'NEW' },
  newValues: { status: 'ESTIMATE_APPROVAL' },
  ipAddress: '192.168.1.100',
  createdAt: new Date('2026-03-18T10:30:00Z'),
};
```

---

## 8. Риски и зависимости

### 8.1 Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Потеря данных при миграции | Low | Critical | Backup БД, тест на staging |
| Деградация производительности | Medium | High | Асинхронная запись, индексы |
| Пропуск логирования | Medium | Medium | Code review, чеклист |
| Log injection | Low | Medium | Санитизация, валидация |
| Переполнение таблицы | Low | Medium | Retention policy, партиционирование |

### 8.2 Зависимости

- **TASK-BCK-001** должна быть выполнена первой (миграция БД)
- **TASK-BCK-002** зависит от TASK-BCK-001
- Все задачи логирования зависят от TASK-BCK-002
- API endpoint зависит от TASK-BCK-003

---

## 9. План миграции данных

### 9.1 Этап 1: Подготовка (TASK-BCK-001)

1. Создать backup БД
2. Разработать миграцию локально
3. Протестировать на staging
4. Выполнить `prisma migrate dev`

### 9.2 Этап 2: Код (TASK-BCK-002 — TASK-BCK-009)

1. Создать утилиту audit.ts
2. Рефакторинг сервисов
3. Добавить логирование в критические операции
4. Создать API endpoint

### 9.3 Этап 3: Тестирование (TASK-TST-001 — TASK-TST-003)

1. Unit-тесты
2. Integration-тесты
3. Ручное тестирование

### 9.4 Этап 4: Документация (TASK-DOC-001 — TASK-DOC-002)

1. Обновить ARCHITECTURE.md
2. Обновить API.md

---

## 10. Чек-лист Definition of Done

### Код
- [ ] Все задачи BCK выполнены
- [ ] Миграция протестирована на staging
- [ ] Все сервисы используют createAuditLog
- [ ] IP-адрес записывается корректно
- [ ] oldValues/newValues заполняются

### Тестирование
- [ ] Unit-тесты ≥80% coverage
- [ ] Integration-тесты проходят
- [ ] Ручное тестирование выполнено

### Безопасность
- [ ] API доступен только ADMIN
- [ ] Логи нельзя изменить/удалить
- [ ] Log injection защищён

### Документация
- [ ] ARCHITECTURE.md обновлён
- [ ] API.md обновлён
- [ ] Миграция задокументирована

---

## 11. Согласование

- [ ] Заказчик (Product Owner)
- [ ] Техлид
- [ ] Security Officer

---

## 12. Приложение: Список отслеживаемых операций

### Заказы (Order)

| Операция | Action | EntityType | OldValues | NewValues |
|----------|--------|------------|-----------|-----------|
| Создание | CREATE_ORDER | Order | null | { clientName, phone, ... } |
| Обновление | UPDATE_ORDER | Order | { старые поля } | { новые поля } |
| Смена статуса | UPDATE_ORDER_STATUS | Order | { status } | { status } |
| Удаление | DELETE_ORDER | Order | { полная копия } | null |
| Массовое обновление | BATCH_UPDATE_ORDERS | Order | { status, assignedTo } | { status, assignedTo } |
| Редактирование истории | EDIT_STATUS_HISTORY | Order | { data записи до } | { data записи после, historyIndex } |

### Цены справочников

| EntityType | Action | Отслеживаемые поля |
|------------|--------|-------------------|
| PostType | UPDATE_PRICE | retailPricePerUnit, purchasePricePerUnit |
| LagType | UPDATE_PRICE | retailPricePerUnit, purchasePricePerUnit |
| GateType | UPDATE_PRICE | retailPrice, purchasePrice |
| WicketType | UPDATE_PRICE | retailPrice, purchasePrice |
| ProfnastilType | UPDATE_PRICE | retailPricePerUnit, purchasePricePerUnit |
| PicketType | UPDATE_PRICE | retailPricePerMeter, purchasePricePerMeter |
| MountingHardware | UPDATE_PRICE | retailPrice, purchasePrice |
| Work | UPDATE_PRICE | price |

### Сметы (FenceEstimate)

| Операция | Action | OldValues | NewValues |
|----------|--------|-----------|-----------|
| Изменение цен | UPDATE_ESTIMATE_PRICES | { grandTotal, ... } | { grandTotal, ... } |

---

*ЧТЗ подготовлено для реализации AI-разработчиком.*
