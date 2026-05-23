# ЧТЗ: SEO-мониторинг — Антибан Яндекс (Tor-ротация) + еженедельный обход + отчёт в Telegram

**Дата:** 2026-05-23
**Маршрут:** Маршрут 1 (Стандартная задача — код)
**Исполнитель:** Разработчик → Тестировщик → DevOps

---

## 1. Проблема

Яндекс возвращает CAPTCHA (`/showcaptcha`) при серийном парсинге поисковой выдачи. Текущий `PositionCollector` при 3 последовательных блокировках останавливает батч, оставшиеся ключевые слова пропускаются. Бюджет на платные решения отсутствует.

## 2. Цель

Обеспечить бесперебойный обход ВСЕХ ключевых слов SEO-мониторинга (Google + Яндекс) без блокировок, используя бесплатные инструменты (Tor для ротации IP).

## 3. Требования

### 3.1. Tor-прокси для обхода CAPTCHA Яндекса

**TASK-SEOTOR-001: Интеграция Tor-прокси**

- Добавить поддержку Tor Socks5-прокси в `PositionCollector`
- При старте: использовать прямое подключение (без Tor)
- При первой CAPTCHA → подключиться через Tor (`socks5://127.0.0.1:9050`)
- При повторной CAPTCHA → ротация Tor-цепочки (отправка `SIGNAL NEWNYM` через Tor Control Port 9051)
- После ротации → повторить запрос с новым IP
- Лимит ротаций Tor: 5 за один батч. Если исчерпан → пауза 30 мин + retry
- Tor не обязателен: если `SEO_TOR_ENABLED != true` — работать как раньше (без Tor)
- Google запросы НЕ используют Tor (Google реже банит, Tor может ухудшить ситуацию)

**Env-переменные:**
```
SEO_TOR_ENABLED=true                    # Включить Tor-прокси (default: false)
SEO_TOR_SOCKS_HOST=127.0.0.1            # Tor Socks5 хост (default: 127.0.0.1)
SEO_TOR_SOCKS_PORT=9050                 # Tor Socks5 порт (default: 9050)
SEO_TOR_CONTROL_PORT=9051               # Tor Control порт для ротации (default: 9051)
SEO_TOR_CONTROL_PASSWORD=               # Пароль Tor Control (если установлен)
SEO_TOR_MAX_ROTATIONS=5                 # Макс ротаций IP за батч (default: 5)
SEO_TOR_COOLDOWN_MS=1800000             # Пауза при исчерпании ротаций (default: 30 мин)
```

**Docker:**
- Добавить сервис `tor` в `docker-compose.dev.yml`
- Образ: `dperson/tor` или `luigi331/tor`
- Socks5 на порту 9050, Control на 9051
- Env в app: `SEO_TOR_ENABLED=true`, `SEO_TOR_SOCKS_HOST=tor`

### 3.2. Улучшение антидетекции

**TASK-SEOTOR-002: Рандомизация задержек**

- Заменить фиксированную задержку `SEO_PARSER_DELAY` (20 сек) на случайную в диапазоне
- Диапазон: `SEO_DELAY_MIN_MS` (default: 30000 = 30 сек) — `SEO_DELAY_MAX_MS` (default: 75000 = 75 сек)
- Для Яндекс: задержка x1.5 (Яндекс строже)
- При CAPTCHA: увеличить задержку на 50% для следующих 5 запросов
- После успешных 5 запросов: вернуть нормальную задержку

### 3.3. Еженедельный запуск (вместо ежедневного)

**TASK-SEOTOR-003: Изменение расписания cron**

- Изменить запуск SEO-сбора: **раз в неделю, понедельник 00:00 МСК** (вместо каждого дня 00:00)
- В `cron.ts`: проверять день недели (`getDay() === 1` — понедельник)
- Сохранить возможность ручного запуска из админки («Собрать сейчас») без ограничений

### 3.4. Отчёт в Telegram после завершения обхода ВСЕХ ключевых слов

**TASK-SEOTOR-004: Гарантированная отправка отчёта**

- Отчёт отправляется **ТОЛЬКО после завершения обхода ВСЕХ ключевых слов** (все батчи пройдены)
- Если обход занял несколько дней (из-за CAPTCHA-пауз) — отчёт отправляется после последнего батча
- В отчёте добавить: количество ротаций Tor, количество CAPTCHA-блокировок, общее время обхода
- Если часть ключевых слов не проверена (blocked/skipped) — указать это в отчёте с пометкой «Требуется ручная проверка»
- Существующий формат отчёта `seoChangeNotifier` сохраняется, дополняется блоком статистики обхода

### 3.5. Обновление админки — отображение прогресса в реальном времени

**TASK-SEOTOR-005: Админка — статус Tor и прогресс**

- В `getSessionStatus()` добавить поля: `torEnabled`, `torRotations`, `captchaHits`, `currentIp`
- В админке `/admin/seo-monitoring`:
  - Показывать статус Tor (вкл/выкл) в прогресс-баре сбора
  - Показывать количество CAPTCHA-блокировок
  - Показывать количество ротаций IP
  - Данные обновляются при поллинге (каждые 5 сек, уже есть)

---

## 4. Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/services/seo/positionCollector.ts` | Tor-интеграция, ротация IP, случайные задержки |
| `src/services/seo/serpParser.ts` | Без изменений (уже детектит CAPTCHA) |
| `src/services/seo/seoChangeNotifier.ts` | Добавить блок статистики Tor/CAPTCHA в отчёт |
| `src/services/cron.ts` | Еженедельный запуск (понедельник) |
| `src/services/seo/torManager.ts` | **Новый файл** — управление Tor-подключением и ротацией |
| `docker-compose.dev.yml` | Добавить сервис `tor` |
| `src/app/(admin)/admin/seo-monitoring/page.tsx` | Показывать Tor-статус в прогресс-баре |
| `src/app/api/admin/seo-monitoring/collect/session/route.ts` | Добавить Tor-данные в ответ |

## 5. Критерии приёмки

1. При `SEO_TOR_ENABLED=true` и запущенном Tor: при CAPTCHA происходит автоматическая ротация IP и повторный запрос
2. Без Tor (`SEO_TOR_ENABLED=false`): поведение как раньше
3. Cron запускает сбор только в понедельник 00:00 МСК
4. Ручной запуск из админки работает без ограничений
5. Telegram-отчёт отправляется после завершения ВСЕХ батчей
6. В отчёте есть блок: ротации Tor, CAPTCHA-блокировки, время обхода
7. Админка показывает Tor-статус при активном сборе
8. Задержки между запросами рандомизированы (30-75 сек)
9. `npm test && npm run lint && npx tsc --noEmit` проходят

## 6. Декомпозиция задач

| ID | Задача | Тип | Файлы |
|----|--------|-----|-------|
| TASK-SEOTOR-001 | Tor-менеджер (torManager.ts) | BCK | `src/services/seo/torManager.ts` (новый) |
| TASK-SEOTOR-002 | Интеграция Tor в PositionCollector | BCK | `src/services/seo/positionCollector.ts` |
| TASK-SEOTOR-003 | Рандомизация задержек | BCK | `src/services/seo/positionCollector.ts` |
| TASK-SEOTOR-004 | Еженедельный cron | BCK | `src/services/cron.ts` |
| TASK-SEOTOR-005 | Обновление Telegram отчёта | BCK | `src/services/seo/seoChangeNotifier.ts` |
| TASK-SEOTOR-006 | Tor-данные в API сессии | BCK | `src/app/api/admin/seo-monitoring/collect/session/route.ts` |
| TASK-SEOTOR-007 | Обновление админки (Tor-статус) | FRT | `src/app/(admin)/admin/seo-monitoring/page.tsx` |
| TASK-SEOTOR-008 | Docker: сервис Tor | INF | `docker-compose.dev.yml` |
