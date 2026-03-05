# Справочники материалов - Руководство разработчика

## Обзор

Реализована система управления справочниками материалов для гибкой настройки калькулятора заборов.

## Компоненты

### 1. Схема базы данных (Prisma)

**Новые модели:**
- `CoatingType` - типы покрытия
- `LagType` - типы лаг
- `ReferenceChangeLog` - логирование изменений

**Расширенные модели:**
- `FenceType` - добавлены поля: `postSpacing`, `defaultLagRows`, `sortOrder`
- `FenceMaterial` - добавлены поля: `availableHeights`, `fenceTypeId`
- `PostType` - добавлены поля: `sectionWidth`, `sectionHeight`, `availableLengths`, `sortOrder`

### 2. Валидаторы (Zod)

Все валидаторы находятся в `src/lib/validators/`:
- `fenceType.ts` - валидация типов заборов
- `fenceHeight.ts` - валидация высот материалов
- `coatingType.ts` - валидация типов покрытия
- `lagType.ts` - валидация лаг
- `postType.ts` - валидация столбов

### 3. Сервисы

Все сервисы находятся в `src/services/admin/`:
- `fenceTypeService.ts` - CRUD типов заборов
- `fenceHeightService.ts` - управление высотами
- `coatingTypeService.ts` - CRUD типов покрытия
- `lagTypeService.ts` - CRUD лаг
- `postTypeService.ts` - CRUD столбов

### 4. API Endpoints

Все endpoints находятся в `src/app/api/admin/`:

**Типы заборов:**
- `GET /api/admin/materials/fence-types` - список
- `POST /api/admin/materials/fence-types` - создание
- `GET /api/admin/materials/fence-types/[id]` - получение
- `PUT /api/admin/materials/fence-types/[id]` - обновление
- `DELETE /api/admin/materials/fence-types/[id]` - удаление
- `PATCH /api/admin/materials/fence-types/[id]` - переключение активности

**Высоты материалов:**
- `GET /api/admin/fence-heights` - список материалов с высотами
- `POST /api/admin/fence-heights` - добавление высоты
- `PUT /api/admin/fence-heights/[materialId]/[height]` - обновление высоты
- `DELETE /api/admin/fence-heights/[materialId]/[height]` - удаление высоты

**Типы покрытия:**
- `GET /api/admin/coating-types` - список
- `POST /api/admin/coating-types` - создание
- `GET /api/admin/coating-types/[id]` - получение
- `PUT /api/admin/coating-types/[id]` - обновление
- `DELETE /api/admin/coating-types/[id]` - удаление
- `PATCH /api/admin/coating-types/[id]` - переключение активности

**Лаги:**
- `GET /api/admin/lag-types` - список
- `POST /api/admin/lag-types` - создание
- `GET /api/admin/lag-types/[id]` - получение
- `PUT /api/admin/lag-types/[id]` - обновление
- `DELETE /api/admin/lag-types/[id]` - удаление
- `PATCH /api/admin/lag-types/[id]` - переключение активности

**Столбы:**
- `GET /api/admin/post-types` - список
- `POST /api/admin/post-types` - создание
- `GET /api/admin/post-types/[id]` - получение
- `PUT /api/admin/post-types/[id]` - обновление
- `DELETE /api/admin/post-types/[id]` - удаление
- `PATCH /api/admin/post-types/[id]` - переключение активности

## Запуск

### 1. Применение миграций

```bash
npx prisma migrate dev --name add_reference_guides
```

### 2. Заполнение начальными данными

```bash
npx tsx prisma/seeds/reference-guides.ts
```

### 3. Генерация Prisma клиента

```bash
npx prisma generate
```

## Права доступа

- **ADMIN**: полный доступ (создание, редактирование, удаление)
- **MANAGER**: чтение и редактирование, без удаления
- **CONTENT_MANAGER**: только чтение

## Логирование изменений

Все изменения автоматически логируются в таблицу `ReferenceChangeLog`:
- `entityType` - тип сущности (FenceType, CoatingType, etc.)
- `entityId` - ID сущности
- `fieldName` - измененное поле
- `oldValue` - старое значение
- `newValue` - новое значение
- `changedBy` - ID пользователя
- `changedAt` - время изменения

## Формулы расчета

### Высота материала
```typescript
finalMaterialCost = baseMaterialCost * heightCoef
```

### Покрытие
```typescript
coatingCost = baseCoatingCost * area * markupCoef
totalCost = materialCost + coatingCost
```

### Лаги
```typescript
lagLength = fenceType.postSpacing
lengthCoef = lag.availableLengths.find(l => l.length === lagLength)?.priceCoef || 1.0
totalLagCost = lag.basePricePerMeter * lagsCount * lengthCoef
```

### Столбы
```typescript
postLength = selectedFenceHeight + 0.7
lengthPrice = post.availableLengths.find(l => l.length === postLength)
totalPostCost = postsCount * postLength * pricePerMeter
```

## Тестирование

Для тестирования API можно использовать Postman или curl:

```bash
# Получить список типов заборов
curl -X GET http://localhost:3000/api/admin/materials/fence-types \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Создать новый тип забора
curl -X POST http://localhost:3000/api/admin/materials/fence-types \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "name": "Новый тип",
    "postSpacing": 2.5,
    "defaultLagRows": 2
  }'
```

## Дальнейшее развитие

1. UI компоненты для управления справочниками (React components)
2. Интеграция с калькулятором
3. Экспорт/импорт справочников в Excel
4. Версионирование справочников
5. Массовое редактирование
