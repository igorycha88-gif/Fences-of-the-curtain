# ЧТЗ: Параметры забора в смете (админка + Word)

**Дата:** 2026-11-03
**Маршрут:** Стандартный (Аналитик → Разработчик → Тестировщик → DevOps)
**Исполнитель после ЧТЗ:** Разработчик

---

## 1. Проблема

В калькуляторе забора клиент выбирает параметры (евроштакетник: тип монтажа/шаг/профиль; сетка-рабица: покрытие/ячейка/пруток; автоматика ворот), которые сохраняются в БД (`FenceEstimate`), но НЕ отображаются:

- в карточке сметы в админке (`/admin/estimates/[id]`, блок «Параметры забора»);
- в заявке в админке (`FenceParameters` в `OrderDetailPage`);
- в экспорте сметы в Word (`estimateWordGenerator.ts`, строка параметров расчёта).

## 2. Что выводить

### Евроштакетник (если заполнены picket-поля)
- Тип монтажа: `picketMountingType`: SINGLE → «Односторонний», CHESS → «В шахматном порядке»
- Шаг: `picketStep` см (подпись «Шаг евроштакетника», для шахматки — «Шаг евроштакетника (шахматка)» — единая подпись «Шаг: N см» допустима)
- Тип профиля: `picketProfileType` (строка — имя профиля)
- Покрытие: `picketCoatingName` (если задано; публичный калькулятор может не передавать)

### Сетка-рабица (если заполнен meshId)
Параметры берутся из `MeshType` по `meshId` (fetch в сервисах):
- Покрытие: `MeshType.coating` (уже русская строка: «Оцинковка»/«Полимерное»)
- Размер ячейки: `MeshType.cellSize` мм
- Толщина прутка: `MeshType.wireThickness` мм

### Автоматика (если hasAutomation)
- `automationNomenclatureName` — рядом с воротами или отдельной строкой.

### Ворота/калитка
- В Word уже выводятся — оставить. В `/admin/estimates/[id]` — добавить в блок «Параметры забора» (сейчас есть только в таблице-items).

## 3. Изменяемые файлы

| # | Файл | Изменение |
|---|------|-----------|
| 1 | `src/services/word/estimateWordGenerator.ts` | Расширить `WordEstimateSection` полями: `picketMountingType` ('SINGLE'\|'CHESS'\|null), `picketStep` (number\|null), `picketProfileType` (string\|null), `picketCoatingName` (string\|null), `meshCoating` (string\|null), `meshCellSize` (number\|null), `meshWireThickness` (number\|null), `automationName` (string\|null). Вывести в строке параметров расчёта. |
| 2 | `src/services/admin/ordersService.ts` (`getOrderFull`) | В estimate, adminEstimate, multiEstimates и adminCorrection добавить picket-поля (`picketStep`, `picketMountingType`, `picketProfileType`, `picketCoatingName`, `picketNomenclatureName`), mesh-поля (`meshId`, `meshNomenclatureName`, `meshCoating`, `meshCellSize`, `meshWireThickness` — MeshType fetch по meshId, batch-запрос), automation (`hasAutomation`, `automationNomenclatureName`). |
| 3 | `src/app/api/admin/orders/[id]/export-estimate-word/route.ts` | Передать новые поля в `WordEstimateSection` (для одиночной, мульти-сметы и админ-корректировки). |
| 4 | `src/services/admin/estimatesService.ts` (`getEstimateByIdWithMargin`) | Вернуть picket-поля, automation и mesh-параметры (fetch MeshType по meshId) + `gateType`. |
| 5 | `src/app/(admin)/admin/estimates/[id]/page.tsx` | В блоке «Параметры забора» вывести: евроштакетник (профиль, шаг, тип монтажа с подписью «В шахматном порядке»), сетку (покрытие, ячейка, пруток), ворота/калитку, автоматику. Скрытая секция «Покрытие» для сетки-рабицы (не применяется). |
| 6 | `src/components/admin/Orders/FenceParameters.tsx` | Добавить блоки параметров евроштакетника, сетки-рабицы, автоматики. |
| 7 | `src/components/admin/Orders/OrderDetailPage.tsx` | Прокинуть новые пропсы в `FenceParameters`. |
| 8 | `__tests__/services/word/estimateWordGenerator.test.ts` | Тесты: шахматка/шаг в docx XML, mesh-параметры, автоматика, отсутствие параметров (профнастил — без picket/mesh строк). |
| 9 | Новые тесты `__tests__/services/admin/estimatesServiceMeshParams.test.ts` (или расширить существующие) | Тесты getEstimateByIdWithMargin с mock prisma: picket/mesh/automation поля. |

## 4. Формат вывода в Word (строка параметров расчёта)

Сейчас: `Длина: X м | Высота: X м | Покрытие: X | Лаги: X | Ворота: ... | Калитка: ...`

Станет (пример евроштакетник):
`Длина: 50 м | Высота: 2 м | Покрытие: Полимерное одностороннее | Лаги: 2 | Профиль: П-образный | Шаг: 5 см | Монтаж: В шахматном порядке | Ворота: Откатные, 4 м | Калитка: 1 м | Автоматика: <название>`

Сетка-рабица:
`Длина: 50 м | Высота: 2 м | Покрытие сетки: Оцинковка | Ячейка: 50 мм | Пруток: 2.5 мм | Ворота: ...`

Для сетки-рабицы не выводить «Лаги» и общее «Покрытие» (lagRows=0 не информативен; покрытие общее не относится к сетке — выводится покрытие сетки). Для 3D-панелей — без изменений.

Числа: шаг — целое см; ячейка — целое мм; пруток — как в БД (может быть 2.5) — выводить без лишних нулей (2.5, а не 2.50).

## 5. Требования по правилам проекта

- Логирование: новые fetch MeshType в сервисах — через существующий паттерн (logger/console по образцу файла); catch-блоки логировать с контекстом.
- Автотесты: happy path + отсутствие параметров (null) + мульти-смета. Покрытие новых веток ≥ 60%.
- Quality Gate: `npm test && npm run lint && npx tsc --noEmit`.

## 6. Критерии приёмки

1. Смета евроштакетника с шахматкой в админке (`/admin/estimates/[id]`) и в заявке показывает: «Тип монтажа: В шахматном порядке», «Шаг: N см», профиль.
2. Word-экспорт той же сметы содержит те же параметры в строке параметров расчёта.
3. Смета сетки-рабицы показывает: покрытие, размер ячейки (мм), толщину прутка (мм) — в админке и Word.
4. Автоматика выводится в админке и Word при её наличии.
5. Сметы профнастила/3D-панелей отображаются без новых блоков (регресс нет).
6. Старые сметы (созданные до изменений; picket/mesh поля могут быть null) отображаются корректно, без ошибок.
7. Все три команды Quality Gate зелёные.

## 7. Декомпозиция

- TASK-BCK-001: ordersService.getOrderFull — picket/mesh/automation поля (+batch fetch MeshType)
- TASK-BCK-002: estimatesService.getEstimateByIdWithMargin — те же поля
- TASK-BCK-003: estimateWordGenerator — новые поля WordEstimateSection + вывод + экспорт-роут
- TASK-FRT-001: /admin/estimates/[id] — блок параметров
- TASK-FRT-002: FenceParameters + OrderDetailPage — блоки параметров
- TASK-TST-001: автотесты Word + сервисов
