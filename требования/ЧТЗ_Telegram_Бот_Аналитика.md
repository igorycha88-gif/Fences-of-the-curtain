# ЧТЗ: Telegram-бот уведомлений аналитики сайта

## Версия: 1.0
## Дата: 2026-04-24
## Автор: AI Analyst
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Автоматически уведомлять менеджеров в Telegram-группу о ключевых конверсионных событиях на сайте (заявки, звонки, расчёты калькулятора, экспорты), которые сейчас отслеживаются только через Grafana User Analytics - Fences.

### 1.2 Пользовательская ценность
- Менеджеры получают мгновенные уведомления о лидогенерирующих событиях
- Можно запросить статистику через бот-команды (/stats, /events) прямо из Telegram
- Не нужно постоянно мониторить Grafana-дашборд

### 1.3 Метрики успеха
- Уведомление доставляется в Telegram < 3 сек после события на сайте
- Бот-команды отвечают < 2 сек
- 0 ложных срабатываний (rate-limit защита от спама)

---

## 2. Функциональные требования

### 2.1 User Stories

**US-1: Уведомление о конверсионном событии**
- **Given:** Пользователь на сайте совершил конверсионное действие
- **When:** Сервер получает событие через `/api/analytics/events`
- **Then:** В Telegram-группу отправляется форматированное уведомление с типом события, страницей и временем

**US-2: Интерактивная команда /stats**
- **Given:** Менеджер отправляет `/stats` в Telegram-группу
- **When:** Бот получает webhook-обновление
- **Then:** Бот отвечает сводкой аналитики за сегодня (уникальные пользователи, ключевые события, конверсия)

**US-3: Интерактивная команда /events**
- **Given:** Менеджер отправляет `/events` в Telegram-группу
- **When:** Бот получает webhook-обновление
- **Then:** Бот отвечает списком последних ключевых событий за сегодня с количеством

**US-4: Команда /help**
- **Given:** Менеджер отправляет `/help`
- **When:** Бот получает webhook-обновление
- **Then:** Бот отвечает списком доступных команд

**US-5: Anti-spam защита**
- **Given:** Событие одного типа с одной сессии
- **When:** Повторное событие приходит в течение 10 секунд
- **Then:** Уведомление NOT отправляется (dedup по eventName + sessionId)

### 2.2 События для уведомлений

| Событие | Emoji | Описание в уведомлении |
|---------|-------|----------------------|
| `contact_form_submit` | 📨 | Новая заявка с формы контактов |
| `phone_click` | 📞 | Клиент нажал на номер телефона |
| `lead_submit` | 🎯 | Отправлена заявка (лид) |
| `calculator_calculate` | 🧮 | Выполнен расчёт в калькуляторе |
| `calculator_export` | 📤 | Экспорт результата калькулятора |

---

## 3. Нефункциональные требования

### 3.1 Производительность
- Отправка уведомлений — fire-and-forget (не блокирует ответ API)
- Redis TTL для dedup: 10 сек
- Таймаут запроса к Telegram API: 5 сек

### 3.2 Безопасность
- Webhook endpoint валидирует `TELEGRAM_WEBHOOK_SECRET` (query param)
- Секретное слово предотвращает несанкционированные вызовы
- Rate limiting на webhook endpoint

### 3.3 Масштабируемость
- Нет новых зависимостей (используем raw fetch как в существующем боте)
- Уведомления через Redis pipeline — минимальная нагрузка

---

## 4. Техническая архитектура

### 4.1 Изменения в БД
Нет. Все данные хранятся в существующих Redis-ключах аналитики.

### 4.2 API спецификация

#### POST /api/telegram/webhook
**Auth:** Query param `?secret={TELEGRAM_WEBHOOK_SECRET}`

**Request** (Telegram Update):
```json
{
  "update_id": 123,
  "message": {
    "message_id": 1,
    "chat": { "id": 123456, "type": "group" },
    "text": "/stats"
  }
}
```

**Response:** 200 OK (пустое тело)

**Обработка:**
- `/start`, `/help` — список команд
- `/stats` — аналитика за сегодня
- `/events` — последние ключевые события

### 4.3 Структура файлов

**Новые файлы:**
```
src/services/telegram/analytics-notifier.ts   — Формирование и отправка уведомлений о событиях
src/services/telegram/bot-commands.ts         — Обработчики команд бота (/stats, /events, /help)
src/app/api/telegram/webhook/route.ts         — Webhook endpoint для Telegram
```

**Модифицируемые файлы:**
```
src/app/api/analytics/events/route.ts         — Добавить вызов уведомления для ключевых событий
src/services/telegram/index.ts                — Экспорт новых функций
```

### 4.4 Интерфейсы/типы данных

```typescript
type NotifiableEvent = 
  | 'contact_form_submit'
  | 'phone_click'
  | 'lead_submit'
  | 'calculator_calculate'
  | 'calculator_export';

interface AnalyticsNotification {
  eventName: NotifiableEvent;
  page: string;
  sessionId: string;
  timestamp: string;
}

interface TodayStats {
  uniqueUsers: number;
  pageViews: number;
  calculatorCalculates: number;
  calculatorExports: number;
  contactFormSubmits: number;
  phoneClicks: number;
  leadSubmits: number;
  avgSessionDuration: string;
  funnelRate: string;
}
```

### 4.5 Формат уведомлений

**Для calculator_calculate:**
```
🧮 <b>Расчёт калькулятора</b>

📄 Страница: /calculator
🕐 Время: 24.04.2026 14:30:05
```

**Для contact_form_submit:**
```
📨 <b>Заявка с формы контактов</b>

📄 Страница: /contacts
🕐 Время: 24.04.2026 14:30:05
```

**Для /stats:**
```
📊 <b>Статистика за сегодня</b>

👥 Уникальные посетители: 42
👁 Просмотров: 156
🧮 Расчётов калькулятора: 18
📤 Экспортов: 5
📨 Заявок с форм: 3
📞 Кликов по телефону: 7
🎯 Лидов: 2

⏱ Средняя сессия: 3м 24с
📈 Конверсия (формы/просмотры): 1.9%
```

**Для /events:**
```
📋 <b>Ключевые события за сегодня</b>

🧮 Расчёты калькулятора: 18
📤 Экспорты: 5
📨 Заявки с форм: 3
📞 Клики по телефону: 7
🎯 Лиды: 2
```

### 4.6 Env-переменные

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Да (уже есть) | Токен бота |
| `TELEGRAM_CHAT_ID` | Да (уже есть) | ID чата для уведомлений |
| `TELEGRAM_WEBHOOK_SECRET` | Да (новая) | Секрет для webhook endpoint |

---

## 5. Декомпозиция на задачи

### Backend

### TASK-BCK-001: Сервис уведомлений аналитики

**Направление**: Backend
**Приоритет**: High
**Оценка**: 1 час
**Зависимости**: Нет

**Описание:**
Создать `src/services/telegram/analytics-notifier.ts` с функциями:
- `sendAnalyticsNotification(event)` — форматирование и отправка уведомления о событии
- `isNotifiableEvent(eventName)` — проверка что событие в списке отслеживаемых
- `shouldDedup(eventName, sessionId)` — проверка Redis dedup (TTL 10 сек)
- `NOTIFIABLE_EVENTS` — константа-массив ключевых событий

**Критерии приемки:**
- [ ] Уведомления отправляются для 5 ключевых событий
- [ ] Dedup работает: повторное событие в течение 10 сек не отправляется
- [ ] Отправка fire-and-forget (не блокирует)
- [ ] Форматирование HTML с emoji и данными события

**Технические детали:**
- Файлы: `src/services/telegram/analytics-notifier.ts`
- Использует `redis` из `@/lib/redis` для dedup
- Использует `fetch()` к Telegram Bot API (как в существующем `bot.ts`)
- Redis ключ для dedup: `telegram:dedup:{eventName}:{sessionId}` TTL=10

---

### TASK-BCK-002: Интеграция уведомлений в analytics events route

**Направление**: Backend
**Приоритет**: High
**Оценка**: 0.5 часа
**Зависимости**: TASK-BCK-001

**Описание:**
Добавить вызов `sendAnalyticsNotification()` в `src/app/api/analytics/events/route.ts` после успешной обработки события (после строки 83 — после `await pipeline.exec()`).

**Критерии приемки:**
- [ ] После `pipeline.exec()` вызывается проверка `isNotifiableEvent(eventName)`
- [ ] Если да — вызывается `shouldDedup()` и при отсутствии дубликата — `sendAnalyticsNotification()`
- [ ] Вызов обёрнут в `.catch()` — ошибки отправки не влияют на ответ API
- [ ] Существующая логика route не нарушена

**Технические детали:**
- Файлы: `src/app/api/analytics/events/route.ts`
- Добавить импорт `sendAnalyticsNotification, isNotifiableEvent, shouldDedup` из `@/services/telegram/analytics-notifier`
- Добавить блок после строки 83 (после `await pipeline.exec()`)

---

### TASK-BCK-003: Обработчики команд бота

**Направление**: Backend
**Приоритет**: High
**Оценка**: 1.5 часа
**Зависимости**: Нет

**Описание:**
Создать `src/services/telegram/bot-commands.ts` с обработчиками:
- `handleCommand(command, chatId)` — роутер команд
- `handleStats(chatId)` — читать Redis аналитику за сегодня, форматировать и отправить
- `handleEvents(chatId)` — читать Redis аналитику за сегодня, показать только ключевые события
- `handleHelp(chatId)` — отправить список команд

**Критерии приемки:**
- [ ] /stats показывает: уникальные пользователи, просмотры, все 5 ключевых событий, средняя сессия, конверсия
- [ ] /events показывает только ключевые события с количеством
- [ ] /help показывает: /stats, /events, /help с описанием
- [ ] /start аналогичен /help
- [ ] Неизвестная команда — подсказка "Используйте /help"
- [ ] Данные читаются из Redis (существующие ключи analytics:metrics:* и analytics:daily:*)

**Технические детали:**
- Файлы: `src/services/telegram/bot-commands.ts`
- Redis ключи для чтения:
  - `analytics:metrics:unique_users_today` — уникальные пользователи
  - `analytics:metrics:avg_session_duration` — средняя сессия
  - `analytics:metrics:rates:funnel_completion` — конверсия
  - `analytics:daily:{today}` — хеш со всеми событиями за сегодня (hgetall)
- Форматировать числа через `toLocaleString('ru-RU')`
- Длительность сессии конвертировать в минуты и секунды

---

### TASK-BCK-004: Webhook endpoint для Telegram бота

**Направление**: Backend
**Приоритет**: High
**Оценка**: 1 час
**Зависимости**: TASK-BCK-003

**Описание:**
Создать `src/app/api/telegram/webhook/route.ts` — POST endpoint для получения webhook-обновлений от Telegram.

**Критерии приемки:**
- [ ] POST обработчик проверяет query param `secret` совпадает с `TELEGRAM_WEBHOOK_SECRET`
- [ ] При несовпадении — 403 Forbidden
- [ ] Парсит `update.message.text` и `update.message.chat.id`
- [ ] Роутит команду к соответствующему handler из bot-commands
- [ ] Возвращает 200 OK сразу (обработка async)
- [ ] Обрабатывает edge case: message отсутствует (возвращает 200)

**Технические детали:**
- Файлы: `src/app/api/telegram/webhook/route.ts`
- URL: `POST /api/telegram/webhook?secret={TELEGRAM_WEBHOOK_SECRET}`
- Telegram Update format: `update.message.text`, `update.message.chat.id`

---

### TASK-BCK-005: Обновление экспортов telegram/index.ts

**Направление**: Backend
**Приоритет**: Low
**Оценка**: 0.1 часа
**Зависимости**: TASK-BCK-001, TASK-BCK-003

**Описание:**
Добавить реэкспорт новых функций из `analytics-notifier.ts` и `bot-commands.ts` в `src/services/telegram/index.ts`.

**Критерии приемки:**
- [ ] `sendAnalyticsNotification`, `isNotifiableEvent`, `shouldDedup` экспортируются
- [ ] Существующие экспорты не нарушены

---

### Infrastructure

### TASK-INF-001: Настройка Telegram Webhook

**Направление**: Infrastructure
**Приоритет**: Medium
**Оценка**: 0.5 часа
**Зависимости**: TASK-BCK-004

**Описание:**
Добавить скрипт `scripts/setup-telegram-webhook.sh` для регистрации webhook URL в Telegram.
Добавить `TELEGRAM_WEBHOOK_SECRET` в `.env.example`.

**Критерии приемки:**
- [ ] Скрипт вызывает `setWebhook` API Telegram
- [ ] Webhook URL: `https://zabor-i-naves.ru/api/telegram/webhook?secret={SECRET}`
- [ ] `.env.example` обновлён с `TELEGRAM_WEBHOOK_SECRET`

---

### Testing

### TASK-TST-001: Unit-тесты analytics-notifier

**Направление**: Testing
**Приоритет**: Medium
**Оценка**: 1 час
**Зависимости**: TASK-BCK-001

**Критерии приемки:**
- [ ] Тест: `isNotifiableEvent` — возвращает true для 5 ключевых событий, false для остальных
- [ ] Тест: `shouldDedup` — первое событие пропускается, повторное в течение TTL блокируется
- [ ] Тест: `sendAnalyticsNotification` — формирует правильный HTML-формат
- [ ] Покрытие >= 80%

### TASK-TST-002: Unit-тесты bot-commands

**Направление**: Testing
**Приоритет**: Medium
**Оценка**: 1 час
**Зависимости**: TASK-BCK-003

**Критерии приемки:**
- [ ] Тест: `/stats` — формирует правильное сообщение из моковых Redis-данных
- [ ] Тест: `/events` — показывает только ключевые события
- [ ] Тест: `/help` — показывает список команд
- [ ] Тест: неизвестная команда — подсказка
- [ ] Покрытие >= 80%

### TASK-TST-003: Unit-тесты webhook endpoint

**Направление**: Testing
**Приоритет**: Medium
**Оценка**: 0.5 часа
**Зависимости**: TASK-BCK-004

**Критерии приемки:**
- [ ] Тест: валидный secret + команда — 200 OK
- [ ] Тест: невалидный secret — 403
- [ ] Тест: пустое message — 200 OK (не падает)
- [ ] Покрытие >= 80%

---

## 6. Риски и зависимости

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Telegram API недоступен | Низкая | Среднее | Fire-and-forget + логирование ошибок |
| Высокая нагрузка событий | Низкая | Низкое | Dedup + rate-limit уже есть в analytics route |
| Webhook не доходит | Средняя | Среднее | Скрипт setup + проверка getWebhookInfo |
| Нет env TELEGRAM_WEBHOOK_SECRET | Низкая | Высокое | Проверка при старте + .env.example |

---

## 7. Тестирование

### 7.1 Unit-тесты
- TASK-TST-001, TASK-TST-002, TASK-TST-003

### 7.2 Ручное тестирование
1. Открыть сайт, выполнить расчёт калькулятора — проверить уведомление в Telegram
2. Отправить `/stats` в группу — проверить ответ бота
3. Отправить `/events` в группу — проверить ответ бота
4. Отправить `/help` — проверить список команд
5. Быстро дважды нажать расчёт — проверить что второе уведомление не приходит (dedup)

---

## Маршрутизация

**Архитектор:** НЕ ТРЕБУЕТСЯ
**Обоснование:** Задача не требует новых таблиц БД, не меняет архитектуру проекта. Расширение существующего модуля Telegram на основе текущих паттернов.

**Исполнитель:** Разработчик
**Обоснование:** Новый код (сервисы, API routes), изменение бизнес-логики уведомлений.

---

## Согласование

- [x] Заказчик (требования обсуждены, ответы получены)
- [ ] Техлид
