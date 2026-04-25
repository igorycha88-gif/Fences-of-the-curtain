# ЧТЗ: Фикс timezone UTC+3 и cron статистики

**Дата:** 2026-04-25
**Приоритет:** Высокий
**Маршрут:** Разработчик → Тестировщик → DevOps

---

## Проблема

1. **Время событий в Telegram** — показывает UTC вместо UTC+3 (Москва). Docker-контейнер работает в UTC, `formatTime()` не указывает `timeZone: 'Europe/Moscow'`.
2. **Статистика за день не отправляется** — cron-эндпоинт `/api/cron/daily-summary` существует, но нет встроенного планировщика. Нет подтверждения, что внешний cron настроен на VPS.
3. **Рассинхрон дат** — `bot-commands.ts` использует UTC-дату для Redis-ключей, а `daily-summary` использует Moscow-дату. После 21:00 мск данные расходятся.

---

## Критерии приёмки

### AC-1: Время в уведомлениях — UTC+3
- Все события в Telegram-уведомлениях показывают время по Москве (UTC+3)
- Функция `formatTime()` в `analytics-notifier.ts` использует `timeZone: 'Europe/Moscow'`

### AC-2: Время в заказах и формах — UTC+3
- `sendOrderNotification` в `bot.ts` показывает дату/время по Москве
- `sendContactForm` в `bot.ts` показывает дату/время по Москве

### AC-3: Ежедневная статистика отправляется автоматически
- Встроенный планировщик отправляет итог дня в 20:00 по Москве
- Используется `node-cron` или аналогичный механизм
- Планировщик корректно работает в Docker-контейнере

### AC-4: Единый формат дат (Moscow timezone)
- `bot-commands.ts` (`getTodayDailyData`) использует Moscow-дату для Redis-ключей
- `analytics/events/route.ts` использует Moscow-дату для Redis-ключей
- Все даты консистентны между `/stats`, `/events`, daily-summary, analytics events

---

## Задачи

### TASK-BCK-001: Fix timezone в formatTime (analytics-notifier.ts)
**Файл:** `src/services/telegram/analytics-notifier.ts`
- Добавить `timeZone: 'Europe/Moscow'` в `formatTime()` line 40-47

### TASK-BCK-002: Fix timezone в bot.ts (заказы и контакты)
**Файл:** `src/services/telegram/bot.ts`
- `sendOrderNotification`: добавить `timeZone: 'Europe/Moscow'` в `toLocaleDateString` (line 51) + показать время
- `sendContactForm`: добавить метку времени с Moscow timezone

### TASK-BCK-003: Fix timezone в bot-commands.ts (дата для Redis)
**Файл:** `src/services/telegram/bot-commands.ts`
- Заменить `new Date().toISOString().split('T')[0]` на `new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' })` в `getTodayDailyData()` (line 52)

### TASK-BCK-004: Fix timezone в analytics/events/route.ts (дата для Redis)
**Файл:** `src/app/api/analytics/events/route.ts`
- Заменить `new Date().toISOString().split('T')[0]` на Moscow-дату в lines 66, 112
- Также в GET handler (lines 167-169) использовать Moscow-дату

### TASK-BCK-005: Добавить встроенный cron-планировщик
**Файлы:** Новый `src/services/cron.ts` + интеграция в `instrumentation.ts` или middleware
- Установить `node-cron` (или использовать `setInterval` с проверкой времени)
- Запускать daily-summary в 20:00 Europe/Moscow (= 17:00 UTC)
- Инициализация при старте приложения

### TASK-INF-001: Обновить тесты
- Обновить тесты `analytics-notifier.test.ts` — учесть `timeZone: 'Europe/Moscow'`
- Обновить тесты `bot-commands.test.ts` — учесть Moscow-дату
- Добавить тест для cron-планировщика

---

## Файлы для изменения

| Файл | Тип изменения |
|------|--------------|
| `src/services/telegram/analytics-notifier.ts` | Правка timezone |
| `src/services/telegram/bot.ts` | Правка timezone |
| `src/services/telegram/bot-commands.ts` | Правка даты |
| `src/app/api/analytics/events/route.ts` | Правка даты |
| `src/services/cron.ts` | Новый файл |
| `src/instrumentation.ts` или `src/app/api/...` | Подключение cron |
| `package.json` | Добавить node-cron + типы |
| `__tests__/services/telegram/analytics-notifier.test.ts` | Обновление |
| `__tests__/services/telegram/bot-commands.test.ts` | Обновление |
