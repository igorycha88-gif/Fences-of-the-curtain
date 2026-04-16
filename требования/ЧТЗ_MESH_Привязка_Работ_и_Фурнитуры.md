# ЧТЗ: Привязка Работ по монтажу и Монтажной фурнитуры к Сетке-рабице

## Версия: 1.0
## Дата: 2026-04-16
## Приоритет: High
## Статус: ✅ Утверждён

---

## 1. Постановка задачи

### 1.1 Описание
Необходимо предусмотреть возможность добавления Работ по монтажу и привязать их к типу забора «Сетка-рабица», а также добавить возможность привязать Монтажную фурнитуру к номенклатуре «Сетка-рабица».

### 1.2 Текущее состояние
- БД-модели `WorkRelation` и `MountingHardwareRelation` **уже поддерживают** привязку к MESH (произвольные `referenceType` + `referenceId`)
- Калькулятор **уже поддерживает** MESH: `fenceEstimateService.ts` вызывает `workService.getWorksForCalculatorByReference('MESH', meshId)` и `mountingHardwareCalculator.ts` обрабатывает `meshId`
- `referenceRegistry` **уже зарегистрирован** тип MESH с моделью `MeshType`
- Страница справочника Сетка-рабица **уже отображает** привязанные Работы и Фурнитуру через компоненты `RelatedWorksByReference` и `RelatedMountingHardware`

### 1.3 Проблема
Валидаторы, сервисы и API-маршруты **НЕ включают MESH** в списки допустимых типов привязки:
- `src/lib/validators/work.ts` — enum `referenceType` не содержит 'MESH'
- `src/lib/validators/mountingHardware.ts` — `ReferenceTypeEnum` не содержит 'MESH'
- `src/services/admin/workService.ts` — `getFenceTypes()`, `getReferenceOptions()`, `getFenceTypeName()`, `getReferenceTypeName()` не включают MESH
- `src/app/api/admin/mounting-hardware/by-reference/route.ts` — `VALID_REFERENCE_TYPES` не содержит 'MESH'
- `src/app/api/admin/mounting-hardware/references/route.ts` — справочник labels не содержит MESH

**Итог:** Администратор не может создать Работу или Фурнитуру с привязкой к MESH через UI, хотя калькулятор готов это обрабатывать.

---

## 2. Критерии приёмки

- [ ] В админ-панели при создании/редактировании Работы можно выбрать привязку «Сетка-рабица» как тип забора (fenceType = 'MESH')
- [ ] В админ-панели при создании/редактировании Работы можно выбрать привязку к конкретной номенклатуре Сетка-рабица (referenceType = 'MESH', referenceId = конкретный MeshType)
- [ ] В админ-панели при создании/редактировании Монтажной фурнитуры можно выбрать привязку к конкретной номенклатуре Сетка-рабица
- [ ] Калькулятор корректно подбирает привязанные Работы и Фурнитуру при расчёте забора «Сетка-рабица»
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят без ошибок

---

## 3. Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/lib/validators/work.ts` | Добавить 'MESH' в enum `referenceType` (строка 6, 49) |
| `src/lib/validators/mountingHardware.ts` | Добавить 'MESH' в `ReferenceTypeEnum` (строка 3) |
| `src/services/admin/workService.ts` | Добавить MESH в `getFenceTypes()`, `getReferenceOptions()`, `getFenceTypeName()`, `getReferenceTypeName()` |
| `src/app/api/admin/mounting-hardware/by-reference/route.ts` | Добавить 'MESH' в `VALID_REFERENCE_TYPES` |
| `src/app/api/admin/mounting-hardware/references/route.ts` | Добавить MESH в `referenceTypes` labels |

**Не требуются изменения:** schema.prisma, calculator, admin UI pages (загружают данные из API).

---

## 4. Маршрут конвейера

**Маршрут 1:** Стандартная задача (код/фича) → АНАЛИТИК → РАЗРАБОТЧИК → ТЕСТИРОВЩИК → DEVOPS
