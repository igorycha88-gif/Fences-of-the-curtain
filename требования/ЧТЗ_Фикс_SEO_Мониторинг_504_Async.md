# ЧТЗ: Фикс SEO-мониторинг — 504 Gateway Timeout при «Собрать сейчас»

## Проблема

На проде при нажатии кнопки «Собрать сейчас» в SEO-мониторинге nginx возвращает **504 Gateway Timeout**.

**Причина:** `POST /api/admin/seo-monitoring/collect` синхронно вызывает `positionCollector.startBatchSession()`, который работает 60+ секунд (задержки 20 сек между ключевыми словами, батчи по 4). Nginx `proxy_read_timeout` = 60 сек → соединение разрывается.

## Решение

Асинхронный паттерн: запуск сбора в фоне, мгновенный ответ (HTTP 202), поллинг статуса через отдельный endpoint.

## Маршрут: Разработчик

## Изменяемые файлы (3)

1. `src/app/api/admin/seo-monitoring/collect/route.ts` — fire-and-forget, возврат 202 + session info
2. `src/app/api/admin/seo-monitoring/collect/session/route.ts` — **новый** GET endpoint для поллинга статуса сессии
3. `src/app/(admin)/admin/seo-monitoring/page.tsx` — поллинг статуса, прогресс-бар, auto-refresh

## Критерии приёмки

1. Кнопка «Собрать сейчас» мгновенно показывает прогресс (не ждёт завершения)
2. Сбор позиций запускается в фоне, не блокирует HTTP-ответ
3. Фронтенд опрашивает статус сессии каждые 5 сек
4. При завершении сессии — автоматическое обновление таблицы и сводки
5. Ошибки сбора отображаются пользователю
6. Нет 504 ошибки
7. `npm test && npm run lint && npx tsc --noEmit` проходят

## Декомпозиция

- **TASK-001-BCK**: Переделать collect route (fire-and-forget + 202 Accepted)
- **TASK-002-BCK**: Создать session status endpoint
- **TASK-003-FRT**: Переделать handleCollect + добавить поллинг и прогресс
