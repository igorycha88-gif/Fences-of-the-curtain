# ЧТЗ: Серверная передача контактных данных (SSR видимого контента страницы «Контакты»)

- **Дата:** 2026-10-22
- **Автор:** Аналитик (конвейер)
- **Маршрут:** Стандартный (Аналитик → Разработчик → Тестировщик → DevOps)
- **Исполнитель:** Разработчик
- **Приоритет:** Средний (SEO/NAP-консистентность, AEO-извлекаемость)

## 1. Проблема

`ContactInfoProvider` (`src/components/providers/ContactInfoProvider.tsx`) получает `address`, `email`, `workHours` только через клиентский `fetch('/api/contact-info')` в `useEffect`. При серверном пререндере эти поля пустые (DEFAULT_CONTACT), поэтому:

- YandexBot в сыром HTML `/contacts` видит «Данные не указаны» в блоке «Адрес» и пустые email/часы (подтверждено curl-проверкой прода 2026-10-22).
- Нарушение NAP-консистентности (SEO-скилл §5, Pigeon/Possum) и AEO-правил (видимый текст важнее JSON-LD для ИИ-извлечения).
- Попутное нарушение Правила 8: `src/app/api/contact-info/route.ts:61` — голый `console.error` вместо структурированного logger.

## 2. Решение

Серверная выборка контактных данных в root layout (server component) и передача их в провайдер как `initialData`. Клиентский fetch сохраняется как «освежение» данных после правок в админке (progressive enhancement), но начальный HTML уже содержит полный контент.

## 3. Задачи

### TASK-BCK-001: Сервис контактных данных
- Создать `src/services/contact/contactInfoService.ts`:
  - `getContactInfo(): Promise<ContactInfoResponse>` — перенос логики из API route (Prisma `contactInfo.findFirst`, авто-создание пустой записи, Redis-кэш `contact_info` TTL 300, флаг `hasData`).
  - Структурированное логирование (`@/lib/logger`): начало/конец операции, ошибки с контекстом.
  - Тип `ContactInfoResponse` экспортировать для переиспользования.
- Отрефакторить `src/app/api/contact-info/route.ts`: делегирует сервису; `console.error` → `logger.error({ error, context, operation })`.

### TASK-BCK-002: Серверные initialData в провайдере
- `src/components/providers/ContactInfoProvider.tsx`: опциональный prop `initialData` — начальное состояние вместо DEFAULT_CONTACT (при наличии). Логика мержа в useEffect сохраняется без изменений.
- `src/app/layout.tsx`: server-side вызов `getContactInfo()` и передача результата в `<ContactInfoProvider initialData={...}>`. При ошибке — fallback на DEFAULT (try/catch, лог).

### TASK-TST-003: Автотесты
- `__tests__/services/contactInfoService.test.ts` (node): кэш hit; кэш miss + запись с данными (hasData=true); пустая запись (hasData=false); авто-создание при отсутствии; ошибка Prisma → fallback + logger.error; вызовы логгера.
- `__tests__/components/ContactInfoProvider.test.tsx` (dom): с `initialData` данные в контексте сразу (без fetch); без `initialData` — дефолт; дочерний компонент читает контекст.
- `__tests__/api/contact-info.test.ts` (node): route делегирует сервису; ошибка сервиса → 200 + `hasData:false`.

## 4. Файлы

| Файл | Действие |
|---|---|
| `src/services/contact/contactInfoService.ts` | новый |
| `src/app/api/contact-info/route.ts` | правка |
| `src/components/providers/ContactInfoProvider.tsx` | правка |
| `src/app/layout.tsx` | правка |
| 3 тест-файла | новые |

## 5. Критерии приёмки

1. В сыром HTML `/contacts` (без JS) видны адрес, email, часы работы из БД — «Данные не указаны» отсутствует (проверка после деплоя через curl).
2. Обратная совместимость: провайдер без `initialData` работает как раньше (Header/Footer/виджеты не сломаны).
3. Клиентский fetch сохранён (данные обновляются после правки в админке без ребилда).
4. Голых `console.log/error` в изменённых файлах нет — только структурированный logger.
5. `npm test && npm run lint && npx tsc --noEmit` — зелёные; покрытие новых файлов ≥ 60%.
6. Регрессия: существующие тесты не падают; ISR-страницы рендерятся без ошибок.

## 6. Риски и ограничения

- Root layout добавляет DB/Redis-запрос — выполняется в рамках ISR-цикла (revalidate 300–86400), нагрузка на БД не растёт (замена пособытийного клиентского fetch).
- `output: 'standalone'`: layout остаётся server component — новых клиентских бандлей нет.
- Layout исключён из coverage-требований (jest.config), покрытие обеспечивается сервисом и провайдером.
