# ЧТЗ: Исправление модели AuditLog и применение миграций БД

## Версия: 1.0
## Дата: 2026-03-20
## Автор: AI-аналитик
## Приоритет: Critical
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Исправить критический баг в схеме Prisma, который приводит к runtime ошибкам при работе с audit log. Обеспечить консистентность между схемой БД и кодом приложения.

### 1.2 Пользовательская ценность
- **Стабильность**: Устранение runtime ошибок при логировании критических операций
- **Безопасность**: Корректная работа audit log для отслеживания действий пользователей
- **Соответствие**: Выполнение требований OWASP ASVS V7 (Audit Logging)

### 1.3 Метрики успеха
- 100% миграций применены успешно
- `npm test` проходит без ошибок
- `npx prisma generate` создаёт корректный клиент
- Audit log записи создаются без ошибок

---

## 2. Анализ текущего состояния

### 2.1 Выявленные проблемы

| Файл | Строка | Проблема | Критичность |
|------|--------|----------|-------------|
| `prisma/schema.prisma` | 535 | Модель названа `audit_logs` вместо `AuditLog` | Critical |
| `prisma/schema.prisma` | 446 | Связь в User: `audit_logs audit_logs[]` вместо `auditLogs AuditLog[]` | Critical |
| `src/lib/audit.ts` | 68 | Код использует `prisma.auditLog` - несоответствие со схемой | Critical |
| `prisma/migrations/` | - | 8 неприменённых миграций | High |

### 2.2 Схема проблемы

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ТЕКУЩЕЕ СОСТОЯНИЕ (СЛОМАНО)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  prisma/schema.prisma:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ model audit_logs {              ← НЕВЕРНОЕ ИМЯ              │   │
│  │   id         String   @id                                    │   │
│  │   userId     String                                           │   │
│  │   ...                                                         │   │
│  │ }                                                             │   │
│  │                                                               │   │
│  │ model User {                                                  │   │
│  │   audit_logs  audit_logs[]   ← НЕВЕРНАЯ СВЯЗЬ                │   │
│  │ }                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  src/lib/audit.ts:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ await prisma.auditLog.create({  ← ПРАВИЛЬНОЕ ИМЯ            │   │
│  │   data: { ... }                                              │   │
│  │ });                                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  РЕЗУЛЬТАТ: Runtime Error                                           │
│  "Cannot read properties of undefined (reading 'create')"          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Целевое состояние

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ЦЕЛЕВОЕ СОСТОЯНИЕ (ИСПРАВЛЕНО)               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  prisma/schema.prisma:                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ model AuditLog {                 ← PASCAL CASE              │   │
│  │   id         String   @id                                    │   │
│  │   userId     String                                           │   │
│  │   ...                                                         │   │
│  │                                                               │   │
│  │   @@map("audit_logs")            ← МАППИНГ НА ТАБЛИЦУ        │   │
│  │ }                                                             │   │
│  │                                                               │   │
│  │ model User {                                                  │   │
│  │   auditLogs  AuditLog[]        ← ПРАВИЛЬНАЯ СВЯЗЬ            │   │
│  │ }                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  src/lib/audit.ts:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ await prisma.auditLog.create({  ← РАБОТАЕТ                  │   │
│  │   data: { ... }                                              │   │
│  │ });                                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  РЕЗУЛЬТАТ: Audit log работает корректно                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Функциональные требования

### 3.1 User Stories с Acceptance Criteria

#### US-1: Исправление имени модели AuditLog
**Как** разработчик,  
**Я хочу** чтобы модель в Prisma называлась `AuditLog` с маппингом на таблицу `audit_logs`,  
**Чтобы** код `prisma.auditLog` работал корректно.

**Acceptance Criteria**:
```
Given схема Prisma обновлена
When выполняется npx prisma generate
Then генерируется prisma.auditLog (не prisma.audit_logs)
And связь в User.auditLogs работает
And таблица в БД остаётся audit_logs
```

#### US-2: Применение миграций
**Как** администратор БД,  
**Я хочу** применить все отложенные миграции,  
**Чтобы** схема БД соответствовала коду приложения.

**Acceptance Criteria**:
```
Given есть 8 неприменённых миграций
When выполняется npx prisma migrate deploy
Then все миграции применяются успешно
And npx prisma migrate status показывает "No pending migrations"
```

#### US-3: Проверка работы audit log
**Как** система безопасности,  
**Я хочу** чтобы audit log создавал записи без ошибок,  
**Чтобы** отслеживать критические операции.

**Acceptance Criteria**:
```
Given исправлена схема и применены миграции
When вызывается createAuditLog()
Then запись создаётся в таблице audit_logs
And связь с User работает
And IP-адрес и userAgent сохраняются
```

---

## 4. Нефункциональные требования

### 4.1 Производительность

| Операция | Целевое время |
|----------|---------------|
| Применение миграций | < 30 секунд |
| Генерация Prisma Client | < 10 секунд |
| Создание audit log | < 50ms |

### 4.2 Безопасность

- Бэкап БД перед применением миграций (опционально для dev)
- Миграции применяются в транзакции
- Rollback план на случай ошибок

---

## 5. Техническая архитектура

### 5.1 Изменения в prisma/schema.prisma

```prisma
// ДО:
model User {
  // ...
  audit_logs  audit_logs[]
}

model audit_logs {
  id         String   @id
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
  User       User     @relation(fields: [userId], references: [id])

  @@index([action])
  @@index([createdAt])
  @@index([entityType, entityId])
  @@index([userId])
}

// ПОСЛЕ:
model User {
  // ...
  auditLogs  AuditLog[]
}

model AuditLog {
  id         String   @id
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
  User       User     @relation(fields: [userId], references: [id])

  @@index([action])
  @@index([createdAt])
  @@index([entityType, entityId])
  @@index([userId])
  @@map("audit_logs")
}
```

### 5.2 Структура файлов

```
prisma/
├── schema.prisma              # ИЗМЕНИТЬ: AuditLog вместо audit_logs
├── migrations/
│   ├── 20260320000000_fix_audit_log_model/  # НОВАЯ миграция
│   │   └── migration.sql
│   └── ... (существующие миграции)
```

### 5.3 Обновление кода (если нужно)

Проверить и обновить файлы, использующие Prisma типы:
- `src/lib/audit.ts` - использует `prisma.auditLog` (уже правильно)
- `src/services/admin/auditLogService.ts` - проверить типы

---

## 6. Декомпозиция на задачи

### TASK-BCK-001: Проверка текущего состояния БД
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 0.5ч

**Описание**: Проверить есть ли таблица audit_logs в БД и её структуру.

**Критерии приемки**:
- [ ] Проверено наличие таблицы audit_logs
- [ ] Зафиксирована текущая структура таблицы
- [ ] Определён план миграции

**Технические детали**:
```bash
# Проверить структуру таблицы
psql -h localhost -p 5433 -U postgres -d fences -c "\d audit_logs"
```

---

### TASK-BCK-002: Исправление модели AuditLog в schema.prisma
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 0.5ч

**Описание**: Переименовать модель audit_logs в AuditLog и добавить @@map.

**Критерии приемки**:
- [ ] Модель переименована в `AuditLog`
- [ ] Добавлен `@@map("audit_logs")`
- [ ] Связь в User изменена на `auditLogs AuditLog[]`
- [ ] Все индексы сохранены

**Технические детали**:
- Файл: `prisma/schema.prisma`
- Строки: 446, 535-553

---

### TASK-BCK-003: Создание миграции для переименования
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 0.5ч  
**Зависимости**: TASK-BCK-002

**Описание**: Создать SQL миграцию для обновления схемы (если нужно).

**Критерии приемки**:
- [ ] Миграция создана через `npx prisma migrate dev`
- [ ] SQL файл содержит только необходимые изменения
- [ ] Миграция валидна

**Технические детали**:
```bash
# Создать миграцию
npx prisma migrate dev --name fix_audit_log_model
```

Примечание: Поскольку мы используем @@map, таблица в БД остаётся audit_logs, 
миграция может быть пустой или содержать только обновление _prisma_migrations.

---

### TASK-BCK-004: Применение отложенных миграций
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 0.5ч  
**Зависимости**: TASK-BCK-002, TASK-BCK-003

**Описание**: Применить все отложенные миграции к БД.

**Критерии приемки**:
- [ ] Все 8 миграций применены успешно
- [ ] `npx prisma migrate status` показывает "No pending migrations"
- [ ] Нет ошибок в процессе применения

**Технические детали**:
```bash
# Проверить статус
npx prisma migrate status

# Применить миграции
npx prisma migrate deploy
```

---

### TASK-BCK-005: Регенерация Prisma Client
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 0.25ч  
**Зависимости**: TASK-BCK-004

**Описание**: Перегенерировать Prisma Client после изменений схемы.

**Критерии приемки**:
- [ ] `npx prisma generate` выполняется без ошибок
- [ ] Сгенерирован `prisma.auditLog`
- [ ] Типы обновлены

**Технические детали**:
```bash
npx prisma generate
```

---

### TASK-TST-001: Проверка работы audit log
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 1ч  
**Зависимости**: TASK-BCK-005

**Описание**: Проверить что audit log создаётся без ошибок.

**Критерии приемки**:
- [ ] Unit тесты проходят: `npm test -- audit`
- [ ] Интеграционный тест создания audit log проходит
- [ ] Запись создаётся в БД с корректными полями

**Технические детали**:
```bash
npm test -- __tests__/lib/audit.test.ts
```

---

### TASK-TST-002: Полный прогон тестов
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 0.5ч  
**Зависимости**: TASK-BCK-005

**Описание**: Запустить все тесты проекта для проверки отсутствия регрессий.

**Критерии приемки**:
- [ ] `npm test` проходит без ошибок
- [ ] Нет regressions в существующем функционале

**Технические детали**:
```bash
npm test
npm run lint
npx tsc --noEmit
```

---

## 7. Тестирование

### 7.1 Unit-тесты

**Файл**: `__tests__/lib/audit.test.ts` (уже существует)

```typescript
describe('Audit Log', () => {
  it('should create audit log entry', async () => {
    const userId = await getSystemUserId();
    await createAuditLog({
      userId,
      action: 'TEST_ACTION',
      entityType: 'Test',
      entityId: 'test-1',
    });
    // Проверить что запись создана
  });
});
```

### 7.2 Integration-тесты

```bash
# Проверка через API
curl -X GET http://localhost:3001/api/admin/audit-logs \
  -H "Cookie: next-auth.session-token=..."
```

### 7.3 Проверочные команды

```bash
# 1. Статус миграций
npx prisma migrate status

# 2. Генерация клиента
npx prisma generate

# 3. Тесты
npm test

# 4. Lint
npm run lint

# 5. Type check
npx tsc --noEmit
```

---

## 8. Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Миграции конфликтуют | Средняя | Высокое | Последовательное применение, бэкап БД |
| Тесты падают | Низкая | Среднее | Пофиксить тесты перед коммитом |
| Audit log не работает | Низкая | Высокое | Интеграционный тест |

---

## 9. Rollback план

Если что-то пойдёт не так:

### 9.1 Откат схемы Prisma
```bash
git checkout HEAD -- prisma/schema.prisma
npx prisma generate
```

### 9.2 Откат миграций (если применены)
```bash
# Откатить последнюю миграцию
npx prisma migrate resolve --rolled-back <migration_name>
```

### 9.3 Восстановление БД из бэкапа
```bash
# Восстановить из дампа
psql -h localhost -p 5433 -U postgres -d fences < backup.sql
```

---

## 10. Порядок выполнения

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ПОРЯДОК ВЫПОЛНЕНИЯ                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. TASK-BCK-001: Проверка текущего состояния БД                   │
│     ↓                                                               │
│  2. TASK-BCK-002: Исправление модели AuditLog в schema.prisma      │
│     ↓                                                               │
│  3. TASK-BCK-003: Создание миграции                                │
│     ↓                                                               │
│  4. TASK-BCK-004: Применение отложенных миграций                   │
│     ↓                                                               │
│  5. TASK-BCK-005: Регенерация Prisma Client                        │
│     ↓                                                               │
│  6. TASK-TST-001: Проверка работы audit log                        │
│     ↓                                                               │
│  7. TASK-TST-002: Полный прогон тестов                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 11. Контрольный список (Checklist)

### Before Development
- [ ] ЧТЗ согласовано
- [ ] Понятен план миграции
- [ ] Готов rollback план

### After Development
- [ ] Модель AuditLog исправлена
- [ ] @@map("audit_logs") добавлен
- [ ] Связь в User исправлена
- [ ] Миграции применены
- [ ] Prisma Client перегенерирован
- [ ] `npm test` проходит
- [ ] `npm run lint` проходит
- [ ] `npx tsc --noEmit` проходит
- [ ] Audit log работает

---

## 12. Согласование

**Согласовано с**:
- [ ] Заказчик: _______________
- [ ] Техлид: AI-аналитик

**Дата согласования**: 2026-03-20
**Версия для реализации**: 1.0

---

*ЧТЗ создано для исправления критического бага в схеме Prisma и применения отложенных миграций.*
