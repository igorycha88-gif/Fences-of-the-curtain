# Добавление цен закупки для лаг и столбов

## ✅ Статус: Завершено

Реализован функционал добавления цен закупки в справочники Лаги и Столбы для расчета маржинальности.

## 📋 Выполненные задачи

### 1. База данных (Prisma Schema)

#### Изменения в модели LagType
```prisma
model LagType {
  id                    String   @id @default(cuid())
  name                  String
  description           String?
  width                 Float
  height                Float
  metalThickness        Float
  basePricePerMeter     Float
  availableLengths      Json?
  purchasePrices        Json?    // НОВОЕ ПОЛЕ: [{ length: 2.5, purchasePrice: 120 }, ...]
  image                 String?
  active                Boolean  @default(true)
  sortOrder             Int      @default(0)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([active])
  @@index([sortOrder])
  @@unique([width, height, metalThickness])
}
```

#### Изменения в модели PostType
```prisma
model PostType {
  id                    String   @id @default(cuid())
  name                  String
  description           String?
  sectionWidth          Float
  sectionHeight         Float
  wallThickness         Float
  pricePerMeter         Float
  availableLengths      Json?
  purchasePrices        Json?    // НОВОЕ ПОЛЕ: [{ length: 2.5, purchasePrice: 280 }, ...]
  image                 String?
  active                Boolean  @default(true)
  sortOrder             Int      @default(0)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([active])
  @@index([sortOrder])
  @@unique([sectionWidth, sectionHeight, wallThickness])
}
```

**Breaking Changes:**
- Поле `priceWithConcrete` удалено из модели PostType
- API больше не возвращает поле `priceWithConcrete`

### 2. Утилита расчета маржи

Создан файл `src/lib/utils/marginCalculator.ts` с функциями:
- `calculateMargin(salePrice, purchasePrice)` - расчет маржи (процент и абсолютное значение)
- `getMarginColor(marginPercent)` - цветовая индикация маржи
- `getMarginEmoji(marginPercent)` - эмодзи индикация маржи

Формула расчета маржи:
```
Маржа (%) = (Цена продажи - Цена закупки) / Цена продажи * 100%
Маржа (₽) = Цена продажи - Цена закупки
```

### 3. Валидация (Zod)

Обновлены валидаторы:
- `src/lib/validators/lagType.ts` - добавлена валидация purchasePrices
- `src/lib/validators/postType.ts` - добавлена валидация purchasePrices, удалена priceWithConcrete

Схема purchasePrices:
```typescript
{
  length: z.number().min(1.5).max(6.0),
  purchasePrice: z.number().min(0).nullable().optional()
}
```

### 4. API Endpoints

#### Контроль доступа
- **ADMIN**: видит и редактирует цены закупки
- **MANAGER/CONTENT_MANAGER**: не видит цены закупки

#### Обновленные endpoints

**GET /api/admin/lag-types**
- Возвращает поле purchasePrices только для ADMIN
- Для других ролей поле исключено из ответа

**POST /api/admin/lag-types**
- Только ADMIN может устанавливать purchasePrices
- Возвращает 403 для не-ADMIN

**PUT /api/admin/lag-types/:id**
- Только ADMIN может изменять purchasePrices
- Возвращает 403 при попытке изменить purchasePrices для не-ADMIN

**GET /api/admin/post-types**
- Возвращает поле purchasePrices только для ADMIN
- Поле priceWithConcrete больше не возвращается

**POST /api/admin/post-types**
- Только ADMIN может устанавливать purchasePrices
- Поле priceWithConcrete больше не принимается

**PUT /api/admin/post-types/:id**
- Только ADMIN может изменять purchasePrices
- Поле priceWithConcrete больше не принимается

### 5. UI Компоненты

#### Новый компонент PurchasePriceSection
Файл: `src/components/admin/References/PurchasePriceSection.tsx`

Функционал:
- Таблица с колонками: Длина, Цена продажи, Цена закупки, Маржа
- Автоматический расчет маржи в реальном времени
- Цветовая индикация маржи:
  - 🟢 Зеленый: маржа ≥ 30%
  - 🟡 Желтый: маржа 10-30%
  - 🔴 Красный: маржа < 10%
  - ⚪ Серый: цена закупки не указана
- Валидация в реальном времени
- Видимость только для ADMIN

#### Обновленные страницы
- `src/app/(admin)/admin/references/lags/page.tsx` - интегрирован PurchasePriceSection
- `src/app/(admin)/admin/references/posts/page.tsx` - интегрирован PurchasePriceSection, удалено поле priceWithConcrete

### 6. Seed данные

Обновлен файл `prisma/seeds/reference-guides.ts`:
- Добавлены purchasePrices для всех LagType
- Добавлены purchasePrices для всех PostType
- Удалены priceWithConcrete из всех PostType

### 7. Тесты

#### Unit-тесты
- `__tests__/lib/utils/marginCalculator.test.ts` - тесты для утилиты расчета маржи
- `__tests__/validators/lagType.test.ts` - добавлены тесты для purchasePrices

Результаты тестов:
```
Test Suites: 10 passed, 10 total
Tests:       90 passed, 90 total
```

## 🚀 Запуск

### 1. Применение изменений базы данных
```bash
npx prisma db push --accept-data-loss
```

### 2. Генерация Prisma клиента
```bash
npx prisma generate
```

### 3. Заполнение тестовыми данными
```bash
npx tsx prisma/seeds/reference-guides.ts
```

### 4. Запуск тестов
```bash
npm test
```

### 5. Запуск сервера
```bash
npm run dev
```

## 📊 Примеры использования

### Создание лаги с ценами закупки (ADMIN)
```typescript
const lagData = {
  name: 'Профиль 40x20x2.0',
  width: 40,
  height: 20,
  metalThickness: 2.0,
  basePricePerMeter: 150,
  availableLengths: [
    { length: 2.5, priceCoef: 1.0 },
    { length: 3.0, priceCoef: 1.1 }
  ],
  purchasePrices: [
    { length: 2.5, purchasePrice: 120 },
    { length: 3.0, purchasePrice: 145 }
  ],
  active: true
};

// POST /api/admin/lag-types
```

### Создание столба с ценами закупки (ADMIN)
```typescript
const postData = {
  name: 'Столб 60x60x2.5',
  sectionWidth: 60,
  sectionHeight: 60,
  wallThickness: 2.5,
  pricePerMeter: 350,
  availableLengths: [
    { length: 2.5, pricePerMeter: 350 },
    { length: 3.0, pricePerMeter: 420 }
  ],
  purchasePrices: [
    { length: 2.5, purchasePrice: 280 },
    { length: 3.0, purchasePrice: 340 }
  ],
  active: true
};

// POST /api/admin/post-types
```

## 🔒 Контроль доступа

| Роль | Видит цены закупки | Редактирует цены закупки |
|------|-------------------|------------------------|
| ADMIN | ✅ | ✅ |
| MANAGER | ❌ | ❌ |
| CONTENT_MANAGER | ❌ | ❌ |

## 📈 Формула расчета маржи

```typescript
// Расчет маржи
const margin = calculateMargin(150, 120);
// Результат: { marginPercent: 20.0, marginAbsolute: 30 }

// Цветовая индикация
const color = getMarginColor(20);
// Результат: 'yellow' (10-30%)

// Эмодзи индикация
const emoji = getMarginEmoji(20);
// Результат: '🟡'
```

## ⚠️ Breaking Changes

### API Changes
- **POST /api/admin/post-types**: поле `priceWithConcrete` больше не принимается
- **PUT /api/admin/post-types/:id**: поле `priceWithConcrete` больше не принимается
- **GET /api/admin/post-types**: поле `priceWithConcrete` больше не возвращается

### Database Changes
- Колонка `priceWithConcrete` удалена из таблицы PostType
- Данные без возможности восстановления

### Frontend Changes
- Формы создания/редактирования столбов не содержат поле priceWithConcrete
- Таблица столбов не отображает колонку priceWithConcrete

## 🎯 Ключевые особенности

1. **Опциональность** - цены закупки можно не указывать
2. **Автоматический расчет** - маржа рассчитывается в реальном времени
3. **Цветовая индикация** - визуальное отображение уровня маржи
4. **Контроль доступа** - только ADMIN видит и редактирует цены закупки
5. **Валидация** - проверка на клиенте и сервере
6. **Логирование** - все изменения логируются в ReferenceChangeLog

## 📚 Дополнительная документация

- [ЧТЗ: Добавление цены закупки](./требования/ЧТЗ_Добавление_цены_закупки_лаги_столбы.md)
- [Architecture](./ARCHITECTURE.md) - архитектура проекта
- [API Documentation](./API.md) - документация API

---

**Дата завершения:** 07.03.2026
**Версия:** 1.0
**Статус:** ✅ Готово к production
