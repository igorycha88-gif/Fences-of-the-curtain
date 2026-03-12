# ЧТЗ: Миграция поля length в LagType - Float → Int (мм)

## Версия: 1.0
## Дата создания: 11.03.2026
## Автор: Business/System Analyst
## Приоритет: High
## Статус: 📝 Черновик для согласования

---

## 1. Общая информация

### 1.1 Название проекта
Миграция поля length в справочнике Лаги: изменение типа с Float (м) на Int (мм)

### 1.2 Версия документа
1.0 (черновик для согласования)

### 1.3 Ответственные
- Инициатор: Заказчик
- Аналитик: Business/System Analyst
- Техлид: TBD

### 1.4 Приоритет
**High** - требуется для корректной работы сервиса расчета стоимости заборов

---

## 2. Цели и задачи

### 2.1 Бизнес-цель
Унифицировать единицы измерения длины в справочнике Лаги с другими справочниками (Столбы, Профнастил), где длина хранится в миллиметрах (Int). Это обеспечит консистентность данных и упростит логику расчетов.

### 2.2 Пользовательская ценность
- Единообразие единиц измерения во всех справочниках
- Упрощение формул расчета (все в мм)
- Снижение ошибок при конвертации единиц

### 2.3 Ключевые метрики успеха
- Все существующие данные мигрированы корректно
- UI отображает длину в понятном формате (м)
- API возвращает длину в мм

---

## 3. Текущее состояние

### 3.1 Модель LagType (текущая)
```prisma
model LagType {
  id                    String    @id @default(cuid())
  name                  String
  description           String?
  width                 Float
  height                Float
  metalThickness        Float
  basePricePerMeter     Float
  length                Float     // ← Float, хранится в метрах
  purchasePricePerMeter Float?
  image                 String?
  active                Boolean   @default(true)
  priority              Int       @default(0)
  validFrom             DateTime?
  expirationDate        DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([active])
  @@index([length])
  @@index([validFrom])
  @@index([expirationDate])
  @@index([priority])
  @@index([width, height, metalThickness, length])
}
```

### 3.2 Проблема
- Длина хранится в метрах (Float): 2.5, 3.0, 6.0
- В других справочниках длина в мм (Int): 2500, 3000, 6000
- При расчетах нужна конвертация, что усложняет код

---

## 4. Целевое состояние

### 4.1 Модель LagType (целевая)
```prisma
model LagType {
  id                    String    @id @default(cuid())
  name                  String
  description           String?
  width                 Float
  height                Float
  metalThickness        Float
  basePricePerMeter     Float
  length                Int       // ← Int, хранится в миллиметрах
  purchasePricePerMeter Float?
  image                 String?
  active                Boolean   @default(true)
  priority              Int       @default(0)
  validFrom             DateTime?
  expirationDate        DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([active])
  @@index([length])
  @@index([validFrom])
  @@index([expirationDate])
  @@index([priority])
  @@index([width, height, metalThickness, length])
}
```

---

## 5. Функциональные требования

### 5.1 Миграция данных (FR-1)

**FR-1.1: Формула конвертации**
```
Новое значение length (мм) = Старое значение length (м) × 1000
```

**FR-1.2: Примеры конвертации**

| Старое значение (м) | Новое значение (мм) |
|---------------------|---------------------|
| 2.5 | 2500 |
| 3.0 | 3000 |
| 6.0 | 6000 |
| 1.5 | 1500 |

**FR-1.3: Округление**
- Результат округляется до целого числа
- Если дробная часть > 0, округляется вверх

---

### 5.2 Обновление UI (FR-2)

**FR-2.1: Отображение в таблице**
- В БД хранится в мм (2500, 3000)
- В UI отображается в метрах с суффиксом "м" (2.5 м, 3.0 м)
- Формат: `(length / 1000).toFixed(1) + ' м'`

**FR-2.2: Отображение в форме**
- Label: "Длина (м)"
- Input: ввод в метрах (2.5, 3.0)
- При сохранении: конвертация в мм (× 1000)
- При редактировании: конвертация из мм (÷ 1000)

---

### 5.3 Обновление API (FR-3)

**FR-3.1: Ответ API**
- Поле `length` возвращается в мм (Int)
- Пример: `"length": 3000`

**FR-3.2: Входящие данные**
- Поле `length` принимается в мм (Int)
- Валидация: мин 1500, макс 6000

---

## 6. Миграция БД

### 6.1 SQL скрипт

```sql
-- Migration: lag_length_float_to_int_mm
-- Date: 2026-03-11
-- Description: Конвертация поля length из Float (м) в Int (мм)

BEGIN;

-- Шаг 1: Создать временную колонку
ALTER TABLE "LagType" ADD COLUMN "length_new" INTEGER;

-- Шаг 2: Мигрировать данные (м → мм)
UPDATE "LagType"
SET "length_new" = CEIL("length" * 1000)::INTEGER;

-- Шаг 3: Удалить старую колонку
ALTER TABLE "LagType" DROP COLUMN "length";

-- Шаг 4: Переименовать новую колонку
ALTER TABLE "LagType" RENAME COLUMN "length_new" TO "length";

-- Шаг 5: Установить NOT NULL
ALTER TABLE "LagType" ALTER COLUMN "length" SET NOT NULL;

-- Шаг 6: Пересоздать индекс
DROP INDEX IF EXISTS "LagType_length_idx";
CREATE INDEX "LagType_length_idx" ON "LagType"("length");

COMMIT;
```

### 6.2 Rollback скрипт

```sql
-- Rollback: lag_length_float_to_int_mm
-- Date: 2026-03-11

BEGIN;

-- Шаг 1: Создать временную колонку
ALTER TABLE "LagType" ADD COLUMN "length_new" DOUBLE PRECISION;

-- Шаг 2: Мигрировать данные обратно (мм → м)
UPDATE "LagType"
SET "length_new" = "length" / 1000.0;

-- Шаг 3: Удалить текущую колонку
ALTER TABLE "LagType" DROP COLUMN "length";

-- Шаг 4: Переименовать новую колонку
ALTER TABLE "LagType" RENAME COLUMN "length_new" TO "length";

-- Шаг 5: Установить NOT NULL
ALTER TABLE "LagType" ALTER COLUMN "length" SET NOT NULL;

-- Шаг 6: Пересоздать индекс
DROP INDEX IF EXISTS "LagType_length_idx";
CREATE INDEX "LagType_length_idx" ON "LagType"("length");

COMMIT;
```

---

## 7. Обновление кода

### 7.1 Валидатор (src/lib/validators/lagType.ts)

**Было:**
```typescript
length: z.number().min(1.5).max(6.0)
```

**Стало:**
```typescript
length: z.number().int().min(1500).max(6000)
```

### 7.2 Сервис (src/services/admin/lagTypeService.ts)

**Изменения:**
- Убрать конвертацию единиц (теперь всё в мм)
- Обновить типы TypeScript

### 7.3 UI компонент (src/app/(admin)/admin/references/lags/page.tsx)

**Изменения:**
- Добавить конвертацию для отображения: `length / 1000`
- Добавить конвертацию при сохранении: `length * 1000`

```typescript
// Отображение в таблице
const formatLength = (lengthMm: number) => {
  return `${(lengthMm / 1000).toFixed(1)} м`;
};

// Преобразование при сохранении
const handleSubmit = (data: FormData) => {
  const lengthMm = Math.round(parseFloat(data.length) * 1000);
  // ...
};

// Преобразование при редактировании
const editData = {
  ...lagType,
  length: lagType.length / 1000  // мм → м для формы
};
```

---

## 8. Декомпозиция на задачи

### TASK-BCK-001: Обновление Prisma схемы

**Направление:** Backend
**Приоритет:** Critical
**Оценка:** 30 мин
**Зависимости:** Нет

**Критерии приемки:**
- [ ] Тип поля `length` изменен на `Int`
- [ ] Комментарий добавлен: `// Длина в мм`

---

### TASK-BCK-002: Создание миграции

**Направление:** Backend
**Приоритет:** Critical
**Оценка:** 1 час
**Зависимости:** TASK-BCK-001

**Критерии приемки:**
- [ ] SQL скрипт миграции создан
- [ ] Rollback скрипт создан
- [ ] Миграция протестирована на dev
- [ ] Данные конвертированы корректно

---

### TASK-BCK-003: Обновление валидатора

**Направление:** Backend
**Приоритет:** Critical
**Оценка:** 30 мин
**Зависимости:** TASK-BCK-001

**Критерии приемки:**
- [ ] Валидация обновлена (Int, min 1500, max 6000)
- [ ] Unit тесты обновлены

---

### TASK-BCK-004: Обновление сервиса

**Направление:** Backend
**Приоритет:** High
**Оценка:** 1 час
**Зависимости:** TASK-BCK-001

**Критерии приемки:**
- [ ] lagTypeService.ts обновлен
- [ ] Integration тесты обновлены

---

### TASK-FRT-001: Обновление UI таблицы

**Направление:** Frontend
**Приоритет:** High
**Оценка:** 1 час
**Зависимости:** TASK-BCK-004

**Критерии приемки:**
- [ ] Длина отображается в метрах
- [ ] Сортировка работает корректно

---

### TASK-FRT-002: Обновление UI формы

**Направление:** Frontend
**Приоритет:** High
**Оценка:** 1.5 часа
**Зависимости:** TASK-FRT-001

**Критерии приемки:**
- [ ] Ввод в метрах
- [ ] Конвертация при сохранении
- [ ] Конвертация при редактировании
- [ ] Валидация на клиенте

---

### TASK-TST-001: Обновление тестов

**Направление:** Testing
**Приоритет:** High
**Оценка:** 1 час
**Зависимости:** Все задачи

**Критерии приемки:**
- [ ] Unit тесты обновлены
- [ ] Integration тесты обновлены
- [ ] Все тесты проходят

---

## 9. Риски

| Риск | Вероятность | Влияние | План управления |
|------|-------------|---------|-----------------|
| Потеря данных при миграции | Низкая | Высокое | Бэкап БД, rollback скрипт |
| Некорректная конвертация | Низкая | Среднее | Unit тесты, ручная проверка |
| Проблемы в UI | Средняя | Среднее | E2E тесты |

---

## 10. Критерии готовности

### 10.1 Definition of Done

- [ ] Миграция выполнена успешно
- [ ] Все данные конвертированы корректно
- [ ] UI отображает длину в метрах
- [ ] API работает с длиной в мм
- [ ] Все тесты проходят
- [ ] Rollback протестирован

---

## 11. Согласование

**Статус:** 📝 Черновик для согласования

**Решённые вопросы:**
1. ✅ Тип данных: Float → Int
2. ✅ Единицы измерения: м → мм
3. ✅ UI: ввод/отображение в метрах

---

**Дата создания:** 11.03.2026
**Версия:** 1.0
**Статус:** Черновик для согласования
