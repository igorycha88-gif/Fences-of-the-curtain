# ЧТЗ: Улучшение UI админки - единицы измерения, навигация и интерактивность

## Версия: 1.0 (согласовано)
## Дата создания: 09.03.2026
## Дата согласования: 09.03.2026
## Автор: Business/System Analyst
## Приоритет: Medium
## Статус: ✅ Согласовано, готово к разработке

---

## 1. Общая информация

### 1.1 Название проекта
Улучшение пользовательского интерфейса админ-панели: упрощение единиц измерения, улучшение навигации и интерактивности

### 1.2 Версия документа
1.0 (согласовано 09.03.2026)

### 1.3 Ответственные
- Инициатор: Заказчик
- Аналитик: Business/System Analyst
- Техлид: TBD

### 1.4 Приоритет
**Medium** - улучшения UX, не блокируют основной функционал

---

## 2. Цели и задачи

### 2.1 Бизнес-цель
Улучшить пользовательский опыт работы с админ-панелью: сделать интерфейс более чистым, современным и интуитивно понятным. Упростить отображение единиц измерения, улучшить навигацию и интерактивность элементов управления.

### 2.2 Пользовательская ценность
- Более лаконичное отображение цен (₽ вместо руб/м.п.)
- Понятная навигация с визуальным выделением активной вкладки
- Корректное отображение кнопки "Выйти" на всех устройствах
- Интерактивные элементы управления (чекбоксы) с понятной обратной связью

### 2.3 Ключевые метрики успеха
- Улучшение UX удовлетворенности ≥ 4.5/5
- Снижение количества ошибок при навигации
- Все элементы интерфейса корректно отображаются на разрешениях от 320px

---

## 3. Требования к продукту

### 3.1 Функциональные требования

#### 3.1.1 Изменение единиц измерения в справочнике Лаги

**User Story 1: Упрощение единицы измерения в поле "Розничная стоимость"**
*Как администратор, я хочу видеть лаконичное обозначение валюты (₽) вместо детализированного (руб/м.п.), чтобы интерфейс был чище.*

**Acceptance Criteria:**
- В таблице лагов колонка "Розничная стоимость" отображает `150 ₽` вместо `150 ₽/м.п.`
- В форме создания/редактирования поле имеет label `Розничная стоимость (₽)` вместо `Розничная стоимость (руб/м.п.)`
- Tooltip при наведении показывает `150 ₽`
- Изменение применяется ко всем лагам в таблице

**User Story 2: Упрощение единицы измерения в поле "Цена закупки за единицу"**
*Как администратор, я хочу видеть лаконичное обозначение валюты (₽) вместо (₽/м.п.).*

**Acceptance Criteria:**
- В компоненте SimplifiedPurchasePriceInput поле отображает `Цена закупки за единицу (₽)` вместо `Цена закупки за единицу (₽/м.п.)`
- В таблице лагов tooltip для цены закупки показывает `120 ₽` вместо `120 ₽/м.п.`
- Tooltip текст: `Цена закупки: 120 ₽` вместо `Цена закупки: 120 ₽/м.п.`
- Placeholder поля: "Не указана" (без изменений)

**User Story 3: Упрощение единицы измерения в поле "Цена продажи за единицу"**
*Как администратор, я хочу видеть лаконичное обозначение валюты (₽) вместо (₽/м.п.).*

**Acceptance Criteria:**
- В компоненте SimplifiedPurchasePriceInput поле "Цена продажи за единицу" отображает `150.00 ₽` вместо `150.00 ₽/м.п.`
- Tooltip при наведении показывает `150.00 ₽`

---

#### 3.1.2 Изменение единиц измерения в справочнике Столбы

**User Story 4: Упрощение единиц измерения в столбах**
*Как администратор, я хочу видеть аналогичное упрощение единиц измерения в справочнике Столбы.*

**Acceptance Criteria:**
- Аналогичные изменения как в User Story 1-3 для справочника Столбы
- Поле "Розничная стоимость" отображает `350 ₽` вместо `350 ₽/м.п.`
- Поле "Цена закупки за единицу" отображает `280 ₽` вместо `280 ₽/м.п.`
- Поле "Цена продажи за единицу" отображает `350.00 ₽` вместо `350.00 ₽/м.п.`
- Tooltip'ы обновлены аналогично

---

#### 3.1.3 Выделение цветом активной вкладки в навигации

**User Story 5: Визуальное выделение активной вкладки**
*Как администратор, я хочу видеть визуальное выделение активной вкладки в навигации админ-панели, чтобы понимать, в каком разделе я нахожусь.*

**Acceptance Criteria:**
- Активная вкладка в навигации выделена цветом согласно дизайн-системе проекта
- Визуальное выделение включает:
  - Изменение цвета фона активной вкладки
  - Изменение цвета текста активной вкладки
  - Возможна нижняя граница (underline) или другой визуальный маркер
- При наведении на неактивные вкладки появляется hover-эффект
- Активная вкладка остается выделенной при обновлении страницы
- Выделение работает на всех страницах админ-панели:
  - /admin (Dashboard)
  - /admin/references/lags (Лаги)
  - /admin/references/posts (Столбы)
  - /admin/references/heights (Высоты)
  - /admin/references/additional-works (Дополнительные работы)
  - /admin/users (Пользователи)
  - /admin/orders (Заказы)
  - /admin/settings (Настройки)

**Технические требования:**
- Использовать текущую цветовую схему проекта (tailwind.config.ts)
- Применить CSS классы для активного состояния
- Обеспечить контрастность для accessibility (WCAG 2.1 AA)

---

#### 3.1.4 Адаптация кнопки "Выйти"

**User Story 6: Корректное размещение кнопки "Выйти"**
*Как администратор, я хочу видеть кнопку "Выйти" полностью отображаемой на экране, чтобы иметь возможность выйти из системы.*

**Acceptance Criteria:**
- Кнопка "Выйти" полностью видима на всех разрешениях экрана (от 320px)
- Кнопка не обрезается и не выходит за пределы видимой области
- Адаптивные решения:
  - На desktop: полная надпись "Выйти" с иконкой
  - На tablet/mobile: возможна только иконка с tooltip "Выйти"
  - Или перенос кнопки в выпадающее меню профиля
- Кнопка сохраняет функциональность на всех разрешениях
- Кнопка имеет достаточный размер для нажатия (min 44x44px для touch-устройств)
- При наведении появляется hover-эффект
- При клике происходит выход из системы и редирект на страницу входа

**Технические требования:**
- Использовать CSS media queries для адаптации
- Применить flexbox/grid для корректного позиционирования
- Протестировать на разрешениях: 320px, 375px, 768px, 1024px, 1440px

---

#### 3.1.5 Интерактивность чекбокса "Активен" в справочнике Лаги

**User Story 7: Улучшение интерактивности чекбокса "Активен"**
*Как администратор, я хочу видеть зеленый и интерактивный чекбокс "Активен", чтобы понимать, что это поле можно редактировать.*

**Acceptance Criteria:**
- Чекбокс "Активен" в форме создания/редактирования лаги имеет:
  - Зеленый цвет при установленной галочке
  - Четкий визуальный контур (border)
  - Hover-эффект при наведении курсора
  - Cursor: pointer при наведении
  - Анимация при изменении состояния (transition)
- Tooltip при наведении: "Нажмите, чтобы изменить статус активности"
- В таблице лагов чекбокс в колонке "Активен" также интерактивный:
  - Можно кликнуть для быстрого изменения статуса
  - Зеленый цвет при активном статусе
  - Серый цвет при неактивном статусе
  - Hover-эффект
- После изменения статуса появляется toast-уведомление "Статус изменен"
- Изменение сохраняется без перезагрузки страницы

**Технические требования:**
- Использовать компонент Checkbox из shadcn/ui или создать кастомный
- Цвета: 
  - Активен: green-500 (#10b981) или green-600 (#059669)
  - Неактивен: gray-300 (#d1d5db)
  - Hover: зеленый с увеличенной яркостью
- Анимация: transition duration-200ms
- Размер: минимум 20x20px для удобства клика

---

### 3.2 Нефункциональные требования

#### 3.2.1 Производительность
- Изменения не должны влиять на производительность загрузки страниц
- Все анимации должны быть плавными (60fps)
- Время отклика на клик чекбокса < 100ms

#### 3.2.2 Доступность (Accessibility)
- Контрастность цветов соответствует WCAG 2.1 AA (минимум 4.5:1)
- Все интерактивные элементы доступны с клавиатуры (Tab navigation)
- Фокус-состояния четко видны
- Tooltip'ы доступны для screen readers

#### 3.2.3 Совместимость
- Поддержка браузеров: Chrome, Firefox, Safari, Edge (последние 2 версии)
- Адаптивность для разрешений: 320px - 1920px+
- Корректное отображение на touch-устройствах

#### 3.2.4 Поддерживаемость
- Использование существующей дизайн-системы (Tailwind CSS, shadcn/ui)
- Минимум кастомных CSS стилей
- Документирование изменений в коде

---

## 4. Техническая архитектура

### 4.1 Стек технологий (существующий)

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Frontend | Next.js | 14.x (App Router) |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui | latest |
| Language | TypeScript | 5.x |

### 4.2 Файлы для изменения

#### 4.2.1 Изменение единиц измерения в Лагах

**Файл:** `src/app/(admin)/admin/references/lags/page.tsx`

**Изменения:**
```typescript
// Строка 259: таблица - Розничная стоимость
render: (lag: LagType) => `${lag.basePricePerMeter} ₽`  // было: ₽/м.п.

// Строка 271-272: tooltip - Цена закупки
title={`Цена закупки: ${lag.purchasePricePerMeter} ₽\nМаржа: ${margin?.marginPercent.toFixed(1)}%`}
// было: ₽/м.п.

// Строка 272: таблица - Цена закупки
{lag.purchasePricePerMeter} ₽ {marginEmoji}  // было: ₽/м.п.

// Строка 322: форма - label поля
label: 'Розничная стоимость (₽)',  // было: (руб/м.п.)
```

**Файл:** `src/components/admin/References/SimplifiedPurchasePriceInput.tsx`

**Изменения:**
```typescript
// Строка 41: label поля
Цена закупки за единицу (₽)  // было: (₽/м.п.)

// Строка 60: отображение цены продажи
{basePricePerMeter.toFixed(2)} ₽  // было: ₽/м.п.
```

#### 4.2.2 Изменение единиц измерения в Столбах

**Файл:** `src/app/(admin)/admin/references/posts/page.tsx`

**Изменения:**
Аналогично изменениям в lags/page.tsx:
- Розничная стоимость: `₽` вместо `₽/м.п.`
- Цена закупки: `₽` вместо `₽/м.п.`
- Label полей: `(₽)` вместо `(₽/м.п.)`

#### 4.2.3 Выделение активной вкладки

**Файл:** `src/components/admin/Layout/Sidebar.tsx` (или аналогичный компонент навигации)

**Изменения:**
```typescript
// Добавить CSS класс для активной вкладки
const navItemClasses = isActive 
  ? 'bg-primary text-white font-semibold border-l-4 border-primary'
  : 'text-gray-700 hover:bg-gray-100';

// Пример структуры
<nav>
  <Link href="/admin" className={pathname === '/admin' ? activeClasses : inactiveClasses}>
    Dashboard
  </Link>
  <Link href="/admin/references/lags" className={pathname.includes('/lags') ? activeClasses : inactiveClasses}>
    Лаги
  </Link>
  {/* ... другие вкладки */}
</nav>
```

**CSS классы (Tailwind):**
```css
/* Активная вкладка */
.active-tab {
  @apply bg-blue-600 text-white font-semibold;
  @apply border-l-4 border-blue-600;
}

/* Неактивная вкладка */
.inactive-tab {
  @apply text-gray-700 hover:bg-gray-100;
}

/* Hover эффект */
.inactive-tab:hover {
  @apply bg-gray-200 text-gray-900;
}
```

#### 4.2.4 Адаптация кнопки "Выйти"

**Файл:** `src/components/admin/Layout/Header.tsx` (или компонент с кнопкой выхода)

**Изменения:**
```typescript
// Desktop версия
<div className="flex items-center gap-2">
  <Button 
    variant="outline" 
    onClick={handleLogout}
    className="hidden md:flex items-center gap-2"
  >
    <LogOutIcon className="w-4 h-4" />
    <span>Выйти</span>
  </Button>
  
  {/* Mobile версия - только иконка */}
  <Button 
    variant="outline" 
    onClick={handleLogout}
    className="md:hidden p-2"
    title="Выйти"
  >
    <LogOutIcon className="w-5 h-5" />
  </Button>
</div>
```

**CSS для адаптивности:**
```css
.logout-button {
  @apply flex items-center gap-2 px-4 py-2;
  @apply min-h-[44px] min-w-[44px]; /* Touch-friendly */
}

@media (max-width: 768px) {
  .logout-button {
    @apply px-2;
  }
  .logout-button span {
    @apply hidden;
  }
}
```

#### 4.2.5 Интерактивность чекбокса "Активен"

**Файл:** `src/app/(admin)/admin/references/lags/page.tsx`

**Изменения в форме:**
```typescript
// Добавить кастомный чекбокс или использовать shadcn/ui
import { Checkbox } from '@/components/ui/checkbox';

// В форме
<div className="flex items-center space-x-2">
  <Checkbox
    id="active"
    checked={formValues.active}
    onCheckedChange={(checked) => handleFormChange('active', checked)}
    className="cursor-pointer"
  />
  <label 
    htmlFor="active" 
    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
  >
    Активен
  </label>
</div>
```

**Файл:** `src/components/ui/checkbox.tsx` (если нужно создать кастомный)

```typescript
// Стилизация чекбокса
const checkboxVariants = cva(
  "peer h-5 w-5 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-all duration-200",
  {
    variants: {
      checked: {
        true: "bg-green-600 border-green-600 text-white hover:bg-green-700",
        false: "bg-gray-100 border-gray-300 hover:border-green-500",
      },
    },
  }
);
```

**Изменения в таблице:**
```typescript
// Колонка "Активен" в таблице
{
  key: 'active',
  label: 'Активен',
  render: (lag: LagType) => (
    <button
      onClick={() => handleToggleActive(lag)}
      className="cursor-pointer hover:scale-110 transition-transform duration-200"
      title="Нажмите, чтобы изменить статус"
    >
      {lag.active ? (
        <CheckCircleIcon className="w-6 h-6 text-green-600" />
      ) : (
        <XCircleIcon className="w-6 h-6 text-gray-400" />
      )}
    </button>
  )
}
```

---

## 5. UI/UX требования

### 5.1 Цветовая схема

**Активная вкладка навигации:**
- Background: blue-600 (#2563eb)
- Text: white (#ffffff)
- Border left: blue-600 (#2563eb), 4px

**Чекбокс "Активен":**
- Checked background: green-600 (#059669)
- Checked border: green-600 (#059669)
- Unchecked background: gray-100 (#f3f4f6)
- Unchecked border: gray-300 (#d1d5db)
- Hover: green-500 (#10b981)

**Кнопка "Выйти":**
- Default: outline variant (серая граница)
- Hover: bg-gray-100

### 5.2 Анимации

**Чекбокс:**
- Transition: all 200ms ease-in-out
- Transform on hover: scale(1.05)

**Активная вкладка:**
- Transition: background-color 150ms ease

**Кнопка "Выйти":**
- Transition: background-color 150ms ease

### 5.3 Tooltip'ы

**Чекбокс "Активен":**
- Текст: "Нажмите, чтобы изменить статус активности"
- Position: top
- Delay: 500ms

**Цена закупки (в таблице):**
```
Цена закупки: 120 ₽
Маржа: 20.0%
```

### 5.4 Адаптивность

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Кнопка "Выйти":**
- Mobile: только иконка (24x24px)
- Tablet/Desktop: иконка + текст

**Навигация:**
- Mobile: hamburger menu
- Tablet/Desktop: sidebar

---

## 6. Тестирование

### 6.1 Unit-тесты

**Файл:** `__tests__/components/admin/References/SimplifiedPurchasePriceInput.test.tsx`

```typescript
describe('SimplifiedPurchasePriceInput - currency display', () => {
  test('should display purchase price with ₽ symbol', () => {
    render(
      <SimplifiedPurchasePriceInput
        purchasePricePerMeter={120}
        basePricePerMeter={150}
        onChange={jest.fn()}
      />
    );
    
    expect(screen.getByText(/120/)).toBeInTheDocument();
    expect(screen.queryByText(/₽\/м\.п\./)).not.toBeInTheDocument();
  });

  test('should display sale price with ₽ symbol', () => {
    render(
      <SimplifiedPurchasePriceInput
        purchasePricePerMeter={120}
        basePricePerMeter={150}
        onChange={jest.fn()}
      />
    );
    
    expect(screen.getByText(/150\.00 ₽/)).toBeInTheDocument();
  });
});
```

**Файл:** `__tests__/components/ui/Checkbox.test.tsx`

```typescript
describe('Interactive Checkbox', () => {
  test('should have green color when checked', () => {
    render(<Checkbox checked={true} onChange={jest.fn()} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('bg-green-600');
  });

  test('should have cursor pointer', () => {
    render(<Checkbox checked={false} onChange={jest.fn()} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('cursor-pointer');
  });

  test('should show hover effect', () => {
    render(<Checkbox checked={false} onChange={jest.fn()} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.mouseOver(checkbox);
    expect(checkbox).toHaveClass('hover:border-green-500');
  });
});
```

### 6.2 Integration-тесты

**Файл:** `__tests__/integration/admin-navigation.test.tsx`

```typescript
describe('Admin Navigation - Active Tab Highlighting', () => {
  test('should highlight active tab', () => {
    render(<AdminLayout />);
    
    const lagsTab = screen.getByText('Лаги');
    fireEvent.click(lagsTab);
    
    expect(lagsTab).toHaveClass('bg-blue-600');
    expect(lagsTab).toHaveClass('text-white');
  });

  test('should update active tab on route change', () => {
    const { rerender } = render(<AdminLayout pathname="/admin/references/lags" />);
    
    const lagsTab = screen.getByText('Лаги');
    expect(lagsTab).toHaveClass('bg-blue-600');
    
    rerender(<AdminLayout pathname="/admin/references/posts" />);
    const postsTab = screen.getByText('Столбы');
    expect(postsTab).toHaveClass('bg-blue-600');
    expect(lagsTab).not.toHaveClass('bg-blue-600');
  });
});
```

### 6.3 E2E-тесты

**Сценарий 1: Проверка единиц измерения**

```typescript
test('Currency units should display as ₽ not ₽/м.п.', async ({ page }) => {
  await page.goto('/admin/references/lags');
  await page.click('button:has-text("Добавить")');
  
  // Проверить label поля
  const label = await page.locator('label:has-text("Розничная стоимость")').textContent();
  expect(label).toContain('(₽)');
  expect(label).not.toContain('(руб/м.п.)');
  
  // Заполнить форму
  await page.fill('input[name="basePricePerMeter"]', '150');
  await page.fill('input[name="purchasePricePerMeter"]', '120');
  
  // Проверить отображение в компоненте
  const salePrice = await page.locator('text=150.00 ₽').textContent();
  expect(salePrice).toContain('₽');
  expect(salePrice).not.toContain('₽/м.п.');
});
```

**Сценарий 2: Проверка активной вкладки**

```typescript
test('Active tab should be highlighted', async ({ page }) => {
  await page.goto('/admin/references/lags');
  
  // Проверить, что вкладка "Лаги" выделена
  const lagsTab = page.locator('nav a:has-text("Лаги")');
  await expect(lagsTab).toHaveClass(/bg-blue-600/);
  await expect(lagsTab).toHaveClass(/text-white/);
  
  // Перейти на другую вкладку
  await page.click('nav a:has-text("Столбы")');
  
  // Проверить, что вкладка "Столбы" теперь выделена
  const postsTab = page.locator('nav a:has-text("Столбы")');
  await expect(postsTab).toHaveClass(/bg-blue-600/);
  await expect(lagsTab).not.toHaveClass(/bg-blue-600/);
});
```

**Сценарий 3: Проверка кнопки "Выйти" на разных разрешениях**

```typescript
test('Logout button should be visible on all screen sizes', async ({ page }) => {
  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin');
  
  const logoutButton = page.locator('button:has-text("Выйти")');
  await expect(logoutButton).toBeVisible();
  await expect(logoutButton).toContainText('Выйти');
  
  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/admin');
  
  const logoutIcon = page.locator('button[title="Выйти"]');
  await expect(logoutIcon).toBeVisible();
  
  // Проверить, что кнопка кликабельна
  await logoutIcon.click();
  await expect(page).toHaveURL('/auth/login');
});
```

**Сценарий 4: Проверка интерактивности чекбокса**

```typescript
test('Active checkbox should be interactive and green', async ({ page }) => {
  await page.goto('/admin/references/lags');
  await page.click('button:has-text("Добавить")');
  
  // Проверить, что чекбокс имеет cursor pointer
  const checkbox = page.locator('button[role="checkbox"]');
  const cursor = await checkbox.evaluate(el => 
    window.getComputedStyle(el).cursor
  );
  expect(cursor).toBe('pointer');
  
  // Кликнуть на чекбокс
  await checkbox.click();
  
  // Проверить, что цвет изменился на зеленый
  const bgColor = await checkbox.evaluate(el => 
    window.getComputedStyle(el).backgroundColor
  );
  expect(bgColor).toMatch(/rgb\(.*\)/); // Зеленый цвет
  
  // Проверить tooltip
  await checkbox.hover();
  const tooltip = page.locator('text=Нажмите, чтобы изменить статус');
  await expect(tooltip).toBeVisible();
});
```

### 6.4 Визуальное тестирование

**Инструмент:** Percy, Chromatic или Playwright screenshots

**Сценарии:**
1. Скриншот таблицы лагов с обновленными единицами измерения
2. Скриншот формы создания лаги с зеленым чекбоксом
3. Скриншот навигации с выделенной активной вкладкой
4. Скриншот header'а с кнопкой "Выйти" на разных разрешениях

---

## 7. Декомпозиция на задачи

### TASK-FRT-001: Изменение единиц измерения в Лагах

**Направление:** Frontend  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** Нет

**Описание:**
Обновить отображение единиц измерения во всех местах справочника Лаги.

**Критерии приемки:**
- [ ] Таблица: Розничная стоимость отображает `₽` вместо `₽/м.п.`
- [ ] Таблица: Цена закупки отображает `₽` вместо `₽/м.п.`
- [ ] Tooltip: Цена закупки отображает `₽` вместо `₽/м.п.`
- [ ] Форма: Label "Розничная стоимость (₽)" вместо "(руб/м.п.)"
- [ ] SimplifiedPurchasePriceInput: "Цена закупки за единицу (₽)" вместо "(₽/м.п.)"
- [ ] SimplifiedPurchasePriceInput: Цена продажи отображает `₽` вместо `₽/м.п.`

**Технические детали:**
- Файлы: `src/app/(admin)/admin/references/lags/page.tsx`, `src/components/admin/References/SimplifiedPurchasePriceInput.tsx`
- Изменить строки: 259, 271-272, 322 (в page.tsx), 41, 60 (в SimplifiedPurchasePriceInput.tsx)

---

### TASK-FRT-002: Изменение единиц измерения в Столбах

**Направление:** Frontend  
**Приоритет:** High  
**Оценка:** 1 час  
**Зависимости:** TASK-FRT-001

**Описание:**
Обновить отображение единиц измерения во всех местах справочника Столбы (аналогично Лагам).

**Критерии приемки:**
- [ ] Все критерии аналогичны TASK-FRT-001 для Столбов

**Технические детали:**
- Файл: `src/app/(admin)/admin/references/posts/page.tsx`
- Аналогичные изменения как в TASK-FRT-001

---

### TASK-FRT-003: Выделение активной вкладки в навигации

**Направление:** Frontend  
**Приоритет:** High  
**Оценка:** 2 часа  
**Зависимости:** Нет

**Описание:**
Реализовать визуальное выделение активной вкладки в навигации админ-панели.

**Критерии приемки:**
- [ ] Активная вкладка выделена цветом (bg-blue-600, text-white)
- [ ] Неактивные вкладки имеют hover-эффект
- [ ] Выделение работает на всех страницах админ-панели
- [ ] Выделение сохраняется при обновлении страницы
- [ ] Контрастность соответствует WCAG 2.1 AA

**Технические детали:**
- Файл: `src/components/admin/Layout/Sidebar.tsx` (или Header.tsx)
- Добавить логику определения активного маршрута
- Применить CSS классы для активного состояния

---

### TASK-FRT-004: Адаптация кнопки "Выйти"

**Направление:** Frontend  
**Приоритет:** Medium  
**Оценка:** 2 часа  
**Зависимости:** Нет

**Описание:**
Адаптировать кнопку "Выйти" для корректного отображения на всех разрешениях экрана.

**Критерии приемки:**
- [ ] Кнопка полностью видима на разрешениях от 320px
- [ ] Desktop: иконка + текст "Выйти"
- [ ] Mobile: только иконка с tooltip
- [ ] Минимальный размер для touch: 44x44px
- [ ] Hover-эффект на всех разрешениях
- [ ] Функциональность сохраняется

**Технические детали:**
- Файл: `src/components/admin/Layout/Header.tsx`
- Добавить responsive классы (hidden md:flex и т.д.)
- Протестировать на всех breakpoints

---

### TASK-FRT-005: Интерактивность чекбокса "Активен" в форме

**Направление:** Frontend  
**Приоритет:** Medium  
**Оценка:** 2 часа  
**Зависимости:** Нет

**Описание:**
Улучшить интерактивность чекбокса "Активен" в форме создания/редактирования лаги.

**Критерии приемки:**
- [ ] Чекбокс имеет зеленый цвет при checked
- [ ] Hover-эффект при наведении
- [ ] Cursor: pointer
- [ ] Transition анимация (200ms)
- [ ] Tooltip при наведении
- [ ] Минимальный размер 20x20px

**Технические детали:**
- Файл: `src/app/(admin)/admin/references/lags/page.tsx`
- Файл: `src/components/ui/checkbox.tsx` (если нужно создать кастомный)
- Использовать shadcn/ui Checkbox или создать кастомный

---

### TASK-FRT-006: Интерактивность чекбокса "Активен" в таблице

**Направление:** Frontend  
**Приоритет:** Medium  
**Оценка:** 1.5 часа  
**Зависимости:** TASK-FRT-005

**Описание:**
Сделать чекбокс "Активен" в таблице лагов кликабельным для быстрого изменения статуса.

**Критерии приемки:**
- [ ] Иконка кликабельна (cursor: pointer)
- [ ] Зеленый цвет при активном статусе
- [ ] Серый цвет при неактивном статусе
- [ ] Hover-эффект (scale(1.1))
- [ ] Toast-уведомление "Статус изменен"
- [ ] Изменение сохраняется без перезагрузки

**Технические детали:**
- Файл: `src/app/(admin)/admin/references/lags/page.tsx`
- Обновить render функцию для колонки "active"
- Использовать handleToggleActive для изменения статуса

---

### TASK-TST-001: Unit-тесты для компонентов

**Направление:** Testing  
**Приоритет:** Medium  
**Оценка:** 2 часа  
**Зависимости:** TASK-FRT-001, TASK-FRT-005

**Описание:**
Написать unit-тесты для обновленных компонентов.

**Критерии приемки:**
- [ ] Тесты для SimplifiedPurchasePriceInput (единицы измерения)
- [ ] Тесты для Checkbox (цвет, интерактивность)
- [ ] Все тесты проходят успешно
- [ ] Покрытие ≥80%

**Технические детали:**
- Файлы: `__tests__/components/admin/References/SimplifiedPurchasePriceInput.test.tsx`, `__tests__/components/ui/Checkbox.test.tsx`

---

### TASK-TST-002: E2E-тесты

**Направление:** Testing  
**Приоритет:** Medium  
**Оценка:** 3 часа  
**Зависимости:** Все TASK-FRT-*

**Описание:**
Написать E2E-тесты для всех сценариев.

**Критерии приемки:**
- [ ] Тест: Единицы измерения отображаются корректно
- [ ] Тест: Активная вкладка выделена
- [ ] Тест: Кнопка "Выйти" видима на всех разрешениях
- [ ] Тест: Чекбокс интерактивен и зеленый
- [ ] Все тесты проходят успешно

**Технические детали:**
- Файлы: `__tests__/e2e/admin/ui-improvements.spec.ts`
- Использовать Playwright

---

### TASK-DOC-001: Обновление документации

**Направление:** Documentation  
**Приоритет:** Low  
**Оценка:** 1 час  
**Зависимости:** Все задачи

**Описание:**
Обновить документацию проекта.

**Критерии приемки:**
- [ ] README.md: добавлена информация об изменениях UI
- [ ] UI_STYLE_GUIDE.md: обновлены примеры использования компонентов (если есть)

**Технические детали:**
- Файлы: `README.md`, `UI_STYLE_GUIDE.md` (если существует)

---

## 8. Итерации и планы

### Итерация 1 (Основные изменения) - 1 день
**Цель:** Реализовать основные UI улучшения

**Задачи:**
- TASK-FRT-001: Изменение единиц измерения в Лагах
- TASK-FRT-002: Изменение единиц измерения в Столбах
- TASK-FRT-003: Выделение активной вкладки
- TASK-FRT-004: Адаптация кнопки "Выйти"
- TASK-FRT-005: Интерактивность чекбокса в форме
- TASK-FRT-006: Интерактивность чекбокса в таблице

**Критерии завершения:**
- Все единицы измерения обновлены
- Навигация работает корректно
- Кнопка "Выйти" видима на всех разрешениях
- Чекбоксы интерактивны

### Итерация 2 (Тестирование и документация) - 0.5 дня
**Цель:** Обеспечить качество кода

**Задачи:**
- TASK-TST-001: Unit-тесты
- TASK-TST-002: E2E-тесты
- TASK-DOC-001: Обновление документации

**Критерии завершения:**
- Все тесты проходят
- Покрытие ≥80%
- Документация актуальна

---

## 9. Риски и зависимости

### 9.1 Технические риски

**Risk 1: Несовместимость с существующими стилями**

**Category:** Technical  
**Probability:** Low  
**Impact:** Low

**Description:**
Изменение CSS классов может повлиять на другие компоненты, использующие те же классы.

**Mitigation Strategies:**
1. Использовать уникальные классы для новых стилей
2. Тестировать все страницы админ-панели после изменений
3. Использовать CSS modules или Tailwind для изоляции стилей

---

**Risk 2: Проблемы с адаптивностью на специфических устройствах**

**Category:** Technical  
**Probability:** Medium  
**Impact:** Low

**Description:**
Кнопка "Выйти" может некорректно отображаться на некоторых разрешениях.

**Mitigation Strategies:**
1. Протестировать на реальных устройствах (iOS, Android)
2. Использовать Chrome DevTools для проверки всех разрешений
3. Добавить дополнительные breakpoints при необходимости

---

## 10. Критерии готовности (Definition of Done)

### 10.1 Definition of Ready (DoR)

**Перед началом разработки требования должны быть:**
- [ ] **Clear:** Понятны всем членам команды
- [ ] **Testable:** Можно протестировать
- [ ] **Feasible:** Технически выполнимы
- [ ] **Valuable:** Приносят ценность бизнесу
- [ ] **Sized:** Размер позволяет реализовать за 1 спринт
- [ ] **Dependencies:** Все зависимости идентифицированы
- [ ] **Acceptance Criteria:** Полностью определены
- [ ] **Design:** Цветовая схема согласована
- [ ] **Approved:** Утверждены стейкхолдерами

### 10.2 Definition of Done (DoD)

**Считать выполненным, когда:**
- [ ] **Code:** Код написан и прошел code review
- [ ] **Tests:** Unit тесты написаны (≥80% покрытие)
- [ ] **Integration:** Интеграционные тесты прошли
- [ ] **E2E:** E2E тесты прошли
- [ ] **Visual:** Визуальное тестирование пройдено
- [ ] **Responsive:** Проверена адаптивность на всех разрешениях
- [ ] **Accessibility:** Проверена доступность (WCAG 2.1 AA)
- [ ] **Documentation:** Документация обновлена
- [ ] **Manual Testing:** Ручное тестирование завершено
- [ ] **Acceptance:** Критерии приемки выполнены
- [ ] **Browser Testing:** Проверено в Chrome, Firefox, Safari, Edge

---

## 11. Согласование (ОБЯЗАТЕЛЬНО)

### 11.1 Согласованная версия

**✅ ДОКУМЕНТ СОГЛАСОВАН**

**Дата согласования:** 09.03.2026  
**Версия:** 1.0  
**Согласовано с:** Заказчик

**Решённые вопросы:**
1. ✅ Изменение единиц измерения с "руб/м.п." и "₽/м.п." на "₽" в Лагах
2. ✅ Аналогичное изменение для Столбов
3. ✅ Выделение цветом активной вкладки в навигации
4. ✅ Адаптация кнопки "Выйти"
5. ✅ Интерактивность чекбокса "Активен" в Лагах

**Статус:** Готово к разработке

---

## 12. Контактная информация

**По вопросам данного ЧТЗ обращаться:**
- Аналитик: Business/System Analyst
- Email: analyst@company.com
- Slack: #fences-project

---

**Документ создан:** 09.03.2026  
**Дата согласования:** 09.03.2026  
**Последнее обновление:** 09.03.2026  
**Версия:** 1.0 (согласовано)
