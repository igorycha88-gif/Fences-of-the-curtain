# ЧТЗ: Расширение Telegram-бота — геолокация, новые события, дневной итог

## Версия: 1.0
## Дата: 2026-04-24
## Статус: Согласовано

---

## 1. Цели

1. Добавить геолокацию по IP в уведомления бота
2. Добавить события: просмотр портфолио, просмотр контактов
3. Добавить ежедневный дайджест в 20:00 МСК со статистикой посещений

---

## 2. Функциональные требования

### 2.1 Геолокация в уведомлениях
- IP уже получается в `/api/analytics/events` через `getClientIp()`
- Существующий сервис `src/services/admin/ipLookupService.ts` → `getCityByIP(ip)` с Redis-кэшем (24ч)
- Добавить `📍 Локация: Москва, Московская обл.` в каждое уведомление

### 2.2 Новые события
| Событие | Emoji | Описание |
|---------|-------|----------|
| `portfolio_view` | 🏗️ | Просмотр портфолио |
| `contacts_view` | 📋 | Просмотр контактов |

### 2.3 Дневной дайджест (cron)
- Endpoint: `POST /api/cron/daily-summary`
- Защита: `Authorization: Bearer {CRON_SECRET}`
- Время: 20:00 МСК (crontab на VPS)
- Формат сообщения:
```
📊 <b>Итог дня — 24.04.2026</b>

👥 Уникальные посетители: 42
👁 Всего просмотров: 156

📈 <b>Ключевые события:</b>
🧮 Расчёты калькулятора: 18
📤 Экспорты: 5
📨 Заявки с форм: 3
📞 Клики по телефону: 7
🎯 Лиды: 2
🏗️ Просмотры портфолио: 25
📋 Просмотры контактов: 12

⏱ Средняя сессия: 3м 24с
📈 Конверсия (формы/просмотры): 1.9%
```

---

## 3. Техническая архитектура

### Модифицируемые файлы:
```
src/services/telegram/analytics-notifier.ts  — +2 события, +IP/геолокация
src/services/telegram/bot-commands.ts        — +2 события в KEY_EVENTS
src/app/api/analytics/events/route.ts        — передача IP в уведомление
```

### Новые файлы:
```
src/app/api/cron/daily-summary/route.ts      — cron endpoint дневного дайджеста
```

### Маршрутизация
**Архитектор:** НЕ ТРЕБУЕТСЯ
**Исполнитель:** Разработчик

---

## 4. Декомпозиция

### TASK-BCK-001: Добавить геолокацию и новые события в analytics-notifier
- Добавить `portfolio_view`, `contacts_view` в NOTIFIABLE_EVENTS и EVENT_LABELS
- Добавить `ip` в параметры `sendAnalyticsNotification()`
- Вызвать `getCityByIP(ip)` и включить локацию в сообщение
- Обновить тип `AnalyticsNotification`

### TASK-BCK-002: Передать IP из analytics events route
- Передать `ip` в вызов `sendAnalyticsNotification()` в events/route.ts

### TASK-BCK-003: Обновить KEY_EVENTS в bot-commands
- Добавить `portfolio_view` и `contacts_view` в KEY_EVENTS

### TASK-BCK-004: Cron endpoint дневного дайджеста
- Создать `POST /api/cron/daily-summary`
- Читать Redis данные за сегодня
- Форматировать и отправлять в Telegram

### TASK-TST-001: Обновить тесты

---

## 5. Согласование
- [x] Заказчик
