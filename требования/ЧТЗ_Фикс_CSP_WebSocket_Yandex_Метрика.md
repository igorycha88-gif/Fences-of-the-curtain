# ЧТЗ: Фикс CSP для Yandex Метрика WebSocket + ERR_CONNECTION_RESET

## Проблема

На главной странице две ошибки:

1. **CSP блокирует WebSocket Яндекс Метрики**: `wss://mc.yandex.ru/solid.ws` violates CSP `connect-src`. В директиве `connect-src` разрешён только `https://mc.yandex.ru`, но Метрика также использует WebSocket (`wss://`).

2. **ERR_CONNECTION_RESET на `/api/analytics/events`**: Сервер периодически перезапускается из-за порога потребления памяти (`Server is approaching the used memory threshold, restarting...`), что обрывает соединения с API.

## Маршрут: Стандартная задача (Разработчик)

## Критерии приёмки

1. В CSP `connect-src` добавлен `wss://mc.yandex.ru` — WebSocket Метрики больше не блокируется
2. В логах нет ошибок CSP Violation для `mc.yandex.ru`
3. `/api/analytics/events` корректно обрабатывает запросы (200)

## Файлы для изменения

- `src/middleware.ts` — добавить `wss://mc.yandex.ru` в `connect-src` (строка 11)

## Декомпозиция

- **TASK-FIX-001**: Добавить `wss://mc.yandex.ru` в `connect-src` CSP в `src/middleware.ts`
