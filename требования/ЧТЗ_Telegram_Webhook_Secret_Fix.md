# ЧТЗ (малая задача): Фикс Telegram webhook secret на проде

**Дата:** 2026-06-17
**Маршрут:** Аналитик → Разработчик → Тестировщик → DevOps (прод)
**Тип:** Инфраструктурный баг-фикс (1 файл кода + env прода)

## Постановка

«На проде и локально перестал работать бот-чат».

## Диагноз (подтверждён напрямую через Telegram API)

1. **Webhook был сброшен** (`getWebhookInfo.url == ""`) → Telegram не доставлял команды `/stats`, `/help` → бот молчал. _Уже зарегистрирован заново._
2. **`TELEGRAM_WEBHOOK_SECRET` никогда не пробрасывался в прод-контейнер.**
   В `docker-compose.yml` (`environment:`) есть `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_PROXY_URL`, но **нет** `TELEGRAM_WEBHOOK_SECRET` (проверено по git-истории всех коммитов).
   Код `src/app/api/telegram/webhook/route.ts:26-30` делает `if (!webhookSecret || secret !== webhookSecret) → 403`.
   При `webhookSecret === undefined` условие `!webhookSecret` всегда истинно → **прод отдаёт 403 на КАЖДУЮ доставку Telegram** → бот не получает команды.
   Подтверждено: `POST /api/telegram/webhook` и без secret, и с правильным secret → `403`.
3. **Локально:** `api.telegram.org` резолвится в заблокированный IP `149.154.166.110` (port 443 timeout); рабочий `149.154.167.220`. Бот-токен валиден (`@ZaborAnalyticsBot`), чат «Бот_чат» существует.

## Критерии приёмки

- [ ] `TELEGRAM_WEBHOOK_SECRET` пробрасывается в контейнер прода (`docker-compose.yml`).
- [ ] На проде `POST /api/telegram/webhook?secret=<правильный>` → `200` (а не 403).
- [ ] Добавлен автотест: env `TELEGRAM_WEBHOOK_SECRET` не задан → `403` (документирует требование обязательности env).
- [ ] `npm test && npm run lint && npx tsc --noEmit` — зелёные.
- [ ] Webhook зарегистрирован на прод-URL с тем же secret, что и в env прода.
- [ ] End-to-end: команда `/help` в чате «Бот_чат» доходит и бот отвечает.
- [ ] Локальный обход блокировки IP задокументирован/применён.

## Файлы

- `docker-compose.yml` — добавить строку `- TELEGRAM_WEBHOOK_SECRET=${TELEGRAM_WEBHOOK_SECRET:-}`
- `__tests__/api/telegram/webhook/route.test.ts` — добавить кейс «env не задан → 403»
- VPS `.env` — добавить `TELEGRAM_WEBHOOK_SECRET=<значение>` (DevOps-шаг, вне репо)

## Декомпозиция

- **TASK-INF-1:** правка `docker-compose.yml` + автотест
- **TASK-INF-2:** прод-деплой (проброс env + пересоздание контейнера) + регистрация webhook
- **TASK-INF-3:** верификация end-to-end + локальный обход IP

## Решения

- Secret на проде = значение из локального `.env` (`TELEGRAM_WEBHOOK_SECRET`), чтобы совпадало с зарегистрированным webhook URL.
- Контейнер пересоздаётся без пересборки образа (env применяется из compose при создании контейнера). Если потребуется — полная пересборка по Правилу 6.
