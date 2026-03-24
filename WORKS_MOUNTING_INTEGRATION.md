# Работы по монтажу - Интеграция с калькулятором заборов

## Обзор

Система работ по монтажу (`Work`) интегрирована с калькулятором заборов для автоматического расчета стоимости работ при выборе типа забора.

## Новая функциональность

### 1. Единица измерения "метр погонный"

Добавлена новая единица измерения `MP` (метр погонный) для гибкого ценообразования работ по монтажу.

**Характеристики:**
- Обозначение: "м.п."
- Расчет стоимости: `длина забора × цена за метр погонный`
- Применение: работы с привязкой к типу забора, рассчитываемые по погонным метрам

### 2. Поддерживаемые единицы измерения

| Единица | Обозначение | Формула расчета | Описание |
|---------|-------------|------------|------------|
| `MP` | м.п. | `длина × цена` | Метр погонный - длина забора умножается на цену |
| `FIXED` | шт | `1 × цена` | Фиксированная цена (например, выезд специалиста) |
| `PCS` | шт | `1 × цена` | Количество работ (например, установка калитки) |
| `M` | м | `1 × цена` | Метры (используется редко) |
| `M2` | м² | `1 × цена` | Квадратные метры (для специфических работ) |
| `KM` | км | `1 × цена` | Километры (для крупных объектов) |

### 3. Модель данных

**Работа по монтажу:**
```prisma
model Work {
  id              String         @id @default(cuid())
  name            String
  description     String?
  category        String         // MOUNTING, DELIVERY, ADDITIONAL, MEASUREMENT
  unit            String         // M, KM, PCS, FIXED, M2, MP
  price           Float
  useInCalculator Boolean        @default(false)  // Флаг использования в калькуляторе
  sortOrder       Int            @default(0)
  active          Boolean        @default(true)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  relations       WorkRelation[]  // Связи с типами заборов и номенклатурой
}
```

**Связи с типами заборов:**
```prisma
model WorkRelation {
  id            String   @id @default(cuid())
  workId        String
  fenceType     String?   // Тип забора (Профнастил, Евроштакетник, и т.д.)
  referenceType String?   // Тип справочника (GATE, WICKET, PANEL_3D, и т.д.)
  referenceId   String?   // ID конкретной номенклатуры
  createdAt     DateTime @default(now())
  work          Work     @relation(fields: [workId], references: [id], onDelete: Cascade)

  @@unique([workId, fenceType, referenceType, referenceId])
  @@index([fenceType])
  @@index([referenceType])
  @@index([referenceId])
}
```

**Ключевые особенности:**
1. Обратная совместимость с существующими привязками по типам забора
2. Поддержка разных единиц измерения для гибкого ценообразования
3. Автоматический расчет стоимости работ в калькуляторе по типу забора
4. Фильтрация: работы добавляются в смету только если `useInCalculator = true`

### 4. Логика работы калькулятора

```typescript
// services/calculator/fenceEstimateService.ts

// Получение работ по монтажу с привязкой к типу забора
const fenceTypeWorks = await workService.getWorksForCalculator(fenceType.name);
const mountingWorks = fenceTypeWorks.filter(w => w.category === 'MOUNTING');

// Добавление работ в смету с учетом единицы измерения
for (const work of mountingWorks) {
  let quantity = 1;
  let totalPrice = work.price;

  if (work.unit === 'MP') {
    // Метр погонный: количество = длина забора
    quantity = length;
    totalPrice = length * work.price;
  } else if (work.unit === 'FIXED') {
    // Фиксированная цена
    quantity = 1;
    totalPrice = work.price;
  } else if (work.unit === 'PCS') {
    // Штуки
    quantity = 1;
    totalPrice = work.price;
  }

  items.push({
    category: 'installation',
    nomenclatureId: work.id,
    nomenclatureName: work.name,
    quantity,
    unit: work.unit === 'MP' ? 'м.п.' : 'шт',
    pricePerUnit: work.price,
    totalPrice
  });
}
```

### 5. Пример использования

**Пример 1: Монтаж забора с ценой за метр погонный**
```
// Работа в БД
{
  "id": "work-mp-001",
  "name": "Монтаж 3D-панели",
  "category": "MOUNTING",
  "unit": "MP",
  "price": 1500,
  "useInCalculator": true
}

// Привязка к типу забора
{
  "workId": "work-mp-001",
  "fenceType": "3D-панели"
}

// Расчет для забора длиной 50 метров
quantity = 50  // метров
totalPrice = 50 * 1500 = 75000  // рублей
```

**Пример 2: Фиксированная цена**
```
// Работа
{
  "id": "work-fixed-001",
  "name": "Выезд замерщика",
  "category": "MOUNTING",
  "unit": "FIXED",
  "price": 5000,
  "useInCalculator": true
}

// Расчет
quantity = 1
totalPrice = 5000  // рублей (один раз)
```

### 6. Администрирование

**Админ-панель → Работы по монтажу:**
- Создание и редактирование работ
- Настройка привязок к типам заборов
- Управление флагом "Использовать в калькуляторе"
- Выбор единицы измерения для каждой работы
- Установка цены и категории

**Валидация:**
```typescript
// lib/validators/work.ts
export const createWorkSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['MOUNTING', 'DELIVERY', 'ADDITIONAL', 'MEASUREMENT']),
  unit: z.enum(['M', 'KM', 'PCS', 'FIXED', 'M2', 'MP']),  // MP добавлена!
  price: z.number().min(0),
  useInCalculator: z.boolean().default(false),
  sortOrder: z.number().default(0),
  active: z.boolean().default(true),
  relations: z.array(relationSchema).optional(),
});
```

### 7. API Endpoints

**Работы по монтажу:**

| Метод | Endpoint | Описание |
|-------|----------|------------|
| GET | `/api/admin/works` | Получение списка работ |
| GET | `/api/admin/works/[id]` | Получение работы по ID |
| POST | `/api/admin/works` | Создание новой работы |
| PUT | `/api/admin/works/[id]` | Обновление работы |
| DELETE | `/api/admin/works/[id]` | Удаление работы |
| GET | `/api/admin/works/reference-options` | Получение справочников для привязки |

### 8. Требования к ЧТЗ

✅ **Реализовано:**
1. Добавлена единица измерения MP в WorkUnit enum
2. Обновлены валидаторы для поддержки MP
3. Исправлен баг в workService.ts (добавлено include: { relations: true })
4. Обновлена логика fenceEstimateService.ts:
   - Получение работ по монтажу с привязкой к типу забора
   - Расчет стоимости по единицам измерения (MP, FIXED, PCS)
   - Добавление работ в общую смету забора
5. Написаны и успешно пройдены тесты

### 9. Технические детали

**Enum единиц измерения:**
```typescript
// src/lib/enums/work.ts
export enum WorkUnit {
  M = 'M',
  KM = 'KM',
  PCS = 'PCS',
  FIXED = 'FIXED',
  M2 = 'M2',
  MP = 'MP',  // Новая единица!
}

export const WorkUnitNames: Record<WorkUnit, string> = {
  [WorkUnit.M]: 'м',
  [WorkUnit.KM]: 'км',
  [WorkUnit.PCS]: 'шт',
  [WorkUnit.FIXED]: 'фикс.',
  [WorkUnit.M2]: 'м²',
  [WorkUnit.MP]: 'м.п.',  // Новое!
};

export const WORK_UNITS = [
  { value: WorkUnit.M, label: 'м (погонные метры)' },
  { value: WorkUnit.KM, label: 'км (километры)' },
  { value: WorkUnit.PCS, label: 'шт (штуки)' },
  { value: WorkUnit.FIXED, label: 'фикс. (фиксированная сумма)' },
  { value: WorkUnit.M2, label: 'м² (квадратные метры)' },
  { value: WorkUnit.MP, label: 'м.п. (метр погонный)' },  // Новое!
];
```

---

**Дата создания:** 2026-03-24  
**Версия:** 1.0
