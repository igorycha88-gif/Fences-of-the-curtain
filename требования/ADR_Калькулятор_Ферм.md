# ADR: Калькулятор расчёта нагрузки и проектирования ферм для навесов

**Дата:** 2026-04-13
**Статус:** Принято
**Автор:** Архитектор

---

## 1. Контекст

Необходимо разработать калькулятор ферм для навесов с 4 типами крыш:
- Односкатная
- Двухскатная
- Арочная
- Односкатная в дуге

Калькулятор должен:
1. Рассчитывать нагрузки (снеговая, ветровая, собственный вес) для Московской области
2. Проектировать геометрию фермы (количество и расположение перемычек)
3. Проверять достаточность сечения профиля и предлагать альтернативы
4. Генерировать чертёж фермы (SVG) с размерами и углами
5. Формировать Word-документ с чертежом, сметой и расчётами
6. Сохранять историю расчётов в БД

---

## 2. Решение

### 2.1. Архитектурная схема

```
┌──────────────────────────────────────────────────────┐
│                 Admin UI Layer                        │
│  /admin/truss-calculator (React Client Component)     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Input Form  │→ │ SVG Drawing  │  │ Load Report  │ │
│  └─────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌────────────────────────────────┐ │
│  │ Material List│  │ Word Export Button              │ │
│  └──────────────┘  └────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────┘
                       │ API Calls
┌──────────────────────▼───────────────────────────────┐
│              API Routes Layer                         │
│  POST /api/admin/truss-calculations/calculate         │
│  GET/POST /api/admin/truss-calculations               │
│  GET/PUT/DELETE /api/admin/truss-calculations/[id]    │
│  GET /api/admin/truss-calculations/[id]/export        │
│  GET/POST/PUT/DELETE /api/admin/truss-profiles        │
│  GET/POST/PUT/DELETE /api/admin/truss-roof-coverings  │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│            Service Layer (src/services/truss/)         │
│  ┌─────────────────┐  ┌─────────────────────────────┐│
│  │ loadCalculator  │  │ trussGeometry               ││
│  │ (снег/ветер/    │  │ (узлы, длины, углы,         ││
│  │  собственный)   │  │  координаты для SVG)        ││
│  └────────┬────────┘  └──────────┬──────────────────┘│
│           └──────────┬───────────┘                    │
│                      ▼                                │
│           ┌─────────────────────┐                     │
│           │ profileSelector     │                     │
│           │ (проверка/выбор     │                     │
│           │  сечения профиля)   │                     │
│           └─────────┬───────────┘                     │
│                     ▼                                 │
│           ┌─────────────────────┐                     │
│           │ trussCalculator     │                     │
│           │ (главный оркестратор)│                    │
│           └─────────┬───────────┘                     │
│                     ▼                                 │
│  ┌──────────────────┴──────────────────┐              │
│  │ svgGenerator   │ wordGenerator      │              │
│  │ (SVG чертёж)   │ (Word документ)    │              │
│  └────────────────┴────────────────────┘              │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│               Database Layer (Prisma)                 │
│  TrussProfileType │ TrussRoofCovering │ TrussCalculation
└──────────────────────────────────────────────────────┘
```

### 2.2. Новые модели БД

#### TrussProfileType — Справочник профильных труб
```prisma
model TrussProfileType {
  id                   String   @id @default(cuid())
  name                 String   // "80x80x2", "60x40x2.5"
  category             String   // POST | CROSSBEAM | STRUT | ARCH
  sectionWidth         Float    // mm (ширина сечения)
  sectionHeight        Float    // mm (высота сечения)
  wallThickness        Float    // mm (толщина стенки)
  steelGrade           String   @default("S235")
  yieldStrength        Float    @default(235) // MPa
  sectionArea          Float    // cm² (площадь сечения)
  momentOfInertiaX     Float    // cm⁴ (момент инерции X)
  momentOfInertiaY     Float    // cm⁴ (момент инерции Y)
  sectionModulusX      Float    // cm³ (момент сопротивления X)
  sectionModulusY      Float    // cm³ (момент сопротивления Y)
  radiusOfGyrationX    Float    // cm (радиус инерции X)
  radiusOfGyrationY    Float    // cm (радиус инерции Y)
  weightPerMeter       Float    // kg/m
  retailPricePerMeter  Float    // руб/м
  purchasePricePerMeter Float?  // закупочная руб/м
  isActive             Boolean  @default(true)
  priority             Int      @default(0)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

#### TrussRoofCovering — Справочник кровельных покрытий
```prisma
model TrussRoofCovering {
  id                   String   @id @default(cuid())
  name                 String   // "Металлочерепица", "Поликарбонат 8мм"
  weightPerSqm         Float    // kg/m² (вес на квадратный метр)
  thickness            Float?   // mm
  width                Float?   // mm (ширина листа)
  usefulWidth          Float?   // mm (полезная ширина)
  standardLength       Float?   // mm (стандартная длина)
  coating              String?  // тип покрытия
  color                String?
  retailPricePerSqm    Float    // руб/м²
  purchasePricePerSqm  Float?   // закупочная руб/м²
  isActive             Boolean  @default(true)
  priority             Int      @default(0)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

#### TrussCalculation — Сохранённые расчёты
```prisma
model TrussCalculation {
  id                  String   @id @default(cuid())
  name                String?  // Название расчёта (пользовательское)
  canopyType          String   // SINGLE_SLOPE | DOUBLE_SLOPE | ARCH | SINGLE_SLOPE_CURVED
  width               Float    // mm (пролёт навеса)
  length              Float    // mm (длина навеса вдоль фасада)
  ridgeHeight         Float    // mm (высота в центре/коньке)
  wallHeight          Float?   // mm (высота у низкой стены, для односкатных)
  trussSpacing        Float    // mm (шаг установки ферм)
  roofCoveringId      String
  roofCovering        TrussRoofCovering @relation(fields: [roofCoveringId], references: [id])
  snowRegion          String   @default("III") // Снеговой район

  postProfileId       String
  crossbeamProfileId  String
  strutProfileId      String
  archProfileId       String?  // Только для арочных

  postProfile         TrussProfileType @relation("CalcPost", fields: [postProfileId], references: [id])
  crossbeamProfile    TrussProfileType @relation("CalcCrossbeam", fields: [crossbeamProfileId], references: [id])
  strutProfile        TrussProfileType @relation("CalcStrut", fields: [strutProfileId], references: [id])
  archProfile         TrussProfileType? @relation("CalcArch", fields: [archProfileId], references: [id])

  // Результаты расчёта нагрузок
  snowLoad            Float    // kg/m²
  windLoad            Float    // kg/m²
  deadLoad            Float    // kg/m²
  totalLoad           Float    // kg/m²
  loadPerTruss        Float    // kg (нагрузка на одну ферму)
  safetyFactor        Float    // Коэффициент запаса прочности

  // Геометрия фермы (JSON)
  trussGeometry       Json     // Узлы, перемычки, углы, длины

  // Смета материалов (JSON)
  materialList        Json     // Перечень материалов с количеством

  // Рекомендации по профилям (если текущие недостаточны)
  profileRecommendations Json?  // Рекомендуемые сечения

  isActive            Boolean  @default(true)
  createdBy           String?
  user                User?    @relation(fields: [createdBy], references: [id])
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### 2.3. Расчётные алгоритмы

#### 2.3.1. Нагрузки (СП 20.13330.2016)

**Снеговая нагрузка:**
```
S = ce × ct × μ × Sg
```
- `Sg = 1.8 кПа (180 кг/м²)` — Московская область, снеговой район III
- `ce = 1.0` — коэффициент exposures
- `ct = 1.0` — температурный коэффициент
- `μ` — коэффициент перехода от веса снега на землю к нагрузке на покрытие:
  - Односкатная: μ = 1.0 при α ≤ 25°, μ = (60°-α)/35° при 25°<α<60°, μ = 0 при α ≥ 60°
  - Двухскатная: μ₁ = 1.0, μ₂ = 0.75 (вариант 2 по СП)
  - Арочная: μ = cos(1.5×α) при α ≤ 30°, μ = 0 при α > 60°
  - Односкатная в дуге: аналогично арочной с корректировкой

**Ветровая нагрузка:**
```
Wm = w0 × k(ze) × c
```
- `w0 = 0.23 кПа (23 кг/м²)` — Московская область, ветровой район I
- `k(ze)` — коэффициент высоты (зависит от типа местности и высоты)
- `c` — аэродинамический коэффициент (зависит от формы крыши)

**Собственный вес:**
- Профиль: из справочника (weightPerMeter)
- Покрытие: из справочника (weightPerSqm)

**Итого:**
```
q_total = (S + Wm + q_dead) × γf × truss_spacing
```
где `γf = 1.4` — коэффициент надёжности для снеговой, `γf = 1.1` для собственного веса

#### 2.3.2. Геометрия ферм

**Панель фермы:** расстояние между узлами 0.8-1.2м
**Количество панелей:** `n = round(span / panelLength)`

Для каждого типа фермы рассчитываются:
- Координаты всех узлов (x, y)
- Длины всех элементов (стержней)
- Углы наклона элементов
- Площадь кровли

**Односкатная ферма:**
```
  low_h ──────── high_h
  |\  /|\  /|\  /|
  | \/ | \/ | \/ |
  | /\ | /\ | /\ |
  |/  \|/  \|/  \|
  ─────────────────
  bottom chord (span)
```

**Двухскатная ферма:**
```
          ridge
         /\
        /  \
  /| /\/    \/|\ 
 / |/  \    / \| \
/───────────────\
  bottom chord
```

**Арочная ферма:**
```
      ╭────────╮
     ╱  |  |  | ╲
    ╱ | |  |  | | ╲
   ╱  ||   |   ||  ╲
  ──────────────────
   bottom chord
```
Дуга: парабола или дуга окружности с радиусом R = (span² + 4×rise²) / (8×rise)

**Односкатная в дуге:**
```
     ╭──────────╮
    ╱ |  |  |  | ╲
   ╱  |  |  |  |  │
  ──────────────────
   bottom chord
```
Одна сторона ниже, дуга несимметричная.

#### 2.3.3. Проверка профилей

Для каждого элемента фермы проверяется:
- **Растяжение:** `N / A ≤ Ry × γc`
- **Сжатие:** `N / (φ × A) ≤ Ry × γc`, где φ = f(λ), λ = lef/i
- **Изгиб:** `M / W ≤ Ry × γc`

Если проверка не проходит — калькулятор подбирает профиль из справочника с бóльшим сечением.

### 2.4. SVG чертёж

SVG генерируется на сервере как строка. В браузере рендерится через `dangerouslySetInnerHTML` или inline SVG.

Масштаб: динамический, чтобы ферма помещалась в viewport (800×400px по умолчанию).

Элементы чертежа:
1. Стержни фермы (полилинии)
2. Узлы (кружки)
3. Размерные линии с значениями в мм
4. Угловые аннотации
5. Подписи профиля для каждого элемента
6. Легенда

### 2.5. Word-документ

Используется существующая библиотека `docx`. Структура документа:

1. **Титульный лист:** "Техническое задание на изготовление навеса"
2. **Исходные данные:** тип крыши, размеры, покрытие
3. **Расчёт нагрузок:** таблица (снеговая, ветровая, собственный, итого)
4. **Чертёж фермы:** SVG → PNG (через sharp) → встроить как ImageRun
5. **Спецификация материалов:** таблица (наименование, сечение, длина, количество, вес)
6. **Смета:** таблица (материал + количество + цена + сумма)

---

## 3. Альтернативы

### 3.1. Калькуляция нагрузок

| Альтернатива | Плюсы | Минусы | Решение |
|---|---|---|---|
| Упрощённый расчёт по СП 20.13330.2016 | Достаточно точен для частных навесов, реализуем в коде | Не заменяет полноценный инженерный расчёт | **Выбрано** |
| Интеграция с внешним API расчёта | Максимальная точность | Зависимость от внешнего сервиса, стоимость | Отклонено — избыточно |

### 3.2. Генерация чертежей

| Альтернатива | Плюсы | Минусы | Решение |
|---|---|---|---|
| SVG (inline в React) | Вектор, масштабируется, просто внедрить в Word через sharp | Нужно писать генератор | **Выбрано** |
| Canvas | Производительный | Растровый, сложнее внедрить в Word | Отклонено |
| D3.js | Мощный | Избыточен для чертежей | Отклонено |
| Отчёт в PDF вместо Word | Проще генерация | Пользователь просил Word | Отклонено |

### 3.3. Хранение данных

| Альтернатива | Плюсы | Минусы | Решение |
|---|---|---|---|
| Справочники в БД (Prisma) | Масштабируемо, редактируемо из админки | Миграции | **Выбрано** |
| Константы в коде | Быстро | Нужен деплой для изменения | Отклонено |

---

## 4. Риски

1. **Точность расчётов:** Калькулятор не заменяет полноценный инженерный расчёт с сертификацией. Рекомендация: добавить дисклеймер в UI и Word-документ.
2. **SVG → PNG конверсия:** Для внедрения SVG в Word нужна конверсия. Библиотека `sharp` уже есть в зависимостях.
3. **Объём задачи:** ~20 новых файлов. Разбито на подзадачи в ЧТЗ.

---

## 5. Последствия

- 3 новых модели в Prisma (миграция БД)
- Новая вкладка в админ-панели перед «О нас»
- Новые API routes (7 endpoints)
- ~15 новых файлов в services/truss/, components/admin/TrussCalculator/
- Seed-данные для справочников (профили, покрытия)
