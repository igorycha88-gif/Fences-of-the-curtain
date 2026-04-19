# ЧТЗ: Фикс фильтрации столбов по признаку forMesh

> **Приоритет:** HIGH
> **Маршрут:** АНАЛИТИК → РАЗРАБОТЧИК → ТЕСТИРОВЩИК → DEVOPS
> **Исполнитель:** Разработчик
> **Дата:** 2026-04-19

---

## 1. Описание проблемы

В калькуляторе заборов обнаружены **два взаимосвязанных бага** в подборе столбов:

### Баг A: Столбы для сетки-рабицы (forMesh=true) попадают в расчёт Профнастила и Евроштакетника

`calculatePostsForProfnastil()` и `calculatePostsForPanel3D()` не исключают столбы с `forMesh=true`. Если в БД появятся столбы с `forMesh=true`, они могут быть подобраны для заборов типа Профнастил/Евроштакетник/3D-панели.

### Баг B: Столбы без галки «Для сетки-рабицы» (forMesh=false) НЕ используются для Сетки-рабицы, но должны

Это **ожидаемое поведение** — `calculatePostsForMesh()` корректно требует `forMesh=true`. Но проблема в том, что:
1. Сейчас в БД **нет** ни одного столба с `forMesh=true` (все имеют `forMesh=false`)
2. В результате расчёт Сетки-рабицы **всегда** падает с `NO_POSTS_FOUND`

**См. связанное ЧТЗ:** `ЧТЗ_Фикс_Калькулятор_Сетка_Нет_Столбов.md` — предыдущая попытка решения проблемы (только через добавление данных, без фикса кода фильтрации).

---

## 2. Анализ

### Текущая асимметрия фильтрации

| Тип забора | Функция | Фильтр `forMesh` | Результат |
|---|---|---|---|
| Профнастил / Евроштакетник | `calculatePostsForProfnastil` | **Нет** | Берутся ВСЕ столбы, включая forMesh=true |
| 3D-панели | `calculatePostsForPanel3D` | **Нет** | Берутся ВСЕ столбы, включая forMesh=true |
| Сетка-рабица | `calculatePostsForMesh` | `forMesh === true` | Берутся ТОЛЬКО сеточные столбы |

### Ожидаемое поведение

| Тип забора | Ожидаемый фильтр |
|---|---|
| Профнастил / Евроштакетник | `forMesh === false` (только обычные столбы) |
| 3D-панели | `forMesh === false` (только обычные столбы) |
| Сетка-рабица | `forMesh === true` (только сеточные столбы) |

---

## 3. Затронутые файлы

| Файл | Действие |
|---|---|
| `src/services/calculator/postCalculator.ts` | Добавить фильтр `forMesh === false` в `calculatePostsForProfnastil` (строка 64) и `calculatePostsForPanel3D` (строка 106) |
| `__tests__/services/postCalculator.test.ts` | Добавить тест: столбы с `forMesh=true` не попадают в расчёт профнастила |
| `__tests__/services/postCalculatorMesh.test.ts` | Убедиться что существующие тесты проходят |

---

## 4. Критерии приёмки

- [ ] `calculatePostsForProfnastil()` **исключает** столбы с `forMesh=true`
- [ ] `calculatePostsForPanel3D()` **исключает** столбы с `forMesh=true`
- [ ] `calculatePostsForMesh()` по-прежнему **требует** `forMesh=true` (без изменений)
- [ ] Добавлен тест: при наличии столбов с `forMesh=true` в БД, они НЕ попадают в расчёт профнастила
- [ ] Добавлен тест: при наличии столбов с `forMesh=true` в БД, они НЕ попадают в расчёт 3D-панелей
- [ ] Существующие тесты проходят без изменений
- [ ] `npm test && npm run lint && npx tsc --noEmit` — все проверки зелёные
- [ ] Регрессия: расчёт Профнастила, Евроштакетника, 3D-панелей, Сетки-рабицы работает корректно

---

## 5. Декомпозиция задач

| ID | Описание | Файл |
|----|----------|------|
| TASK-BCK-001 | Добавить фильтр `forMesh === false` в `calculatePostsForProfnastil` | `src/services/calculator/postCalculator.ts:64` |
| TASK-BCK-002 | Добавить фильтр `forMesh === false` в `calculatePostsForPanel3D` | `src/services/calculator/postCalculator.ts:106` |
| TASK-TEST-001 | Добавить тест: профнастил не берёт forMesh=true столбы | `__tests__/services/postCalculator.test.ts` |
| TASK-TEST-002 | Добавить тест: 3D-панели не берут forMesh=true столбы | `__tests__/services/postCalculator.test.ts` |

---

## 6. Технические детали

### Изменение в `calculatePostsForProfnastil` (строка 64)

**Было:**
```typescript
const matchingPosts = posts.filter(p => p.length >= requiredHeightMm / 1000);
```

**Стало:**
```typescript
const matchingPosts = posts.filter(p => !p.forMesh && p.length >= requiredHeightMm / 1000);
```

### Изменение в `calculatePostsForPanel3D` (строка 106)

**Было:**
```typescript
const matchingPosts = posts.filter(p => p.length >= requiredHeightMm / 1000);
```

**Стало:**
```typescript
const matchingPosts = posts.filter(p => !p.forMesh && p.length >= requiredHeightMm / 1000);
```

---

## 7. Маршрутизация

**Исполнитель:** Разработчик (💻)
**Причина:** Баг-фикс в backend логике, затрагивает 1 сервисный файл + тесты, не требует архитектурных изменений.
