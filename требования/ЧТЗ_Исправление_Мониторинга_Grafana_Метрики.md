# ЧТЗ: Исправление мониторинга — метрики Grafana

**Дата:** 2026-04-15  
**Приоритет:** Высокий  
**Маршрут:** АНАЛИТИК → РАЗРАБОТЧИК  
**Статус:** Утверждено

---

## 1. Описание проблемы

По результатам аудита всех 7 дашбордов Grafana обнаружено **19 проблем**, из которых **10 критических** (метрики НЕ собираются, панели пустые). Значительная часть бизнес-метрик определена в коде, но нигде не инкрементируется.

### Дашборды с критическими проблемами:
- **Business Metrics - Production** — 4 из 5 панелей пустые
- **Состояние сервисов** — 2 панели показывают неверные данные
- **User Analytics** — rates/retention всегда 0

---

## 2. Цель

Обеспечить корректный сбор и отображение ВСЕХ метрик во всех 7 дашбордах Grafana.

---

## 3. Декомпозиция задач

### TASK-MON-001: HTTP-метрики (middleware)

**Проблема:** `http_requests_total` и `http_request_duration_seconds` определены в `prometheus.ts`, но нигде не инкрементируются. Business Metrics dashboard пустой.

**Решение:** Создать Next.js middleware, которое записывает каждый HTTP-запрос в Redis.

**Файлы:**
- Создать: `src/lib/http-metrics.ts` — функции для записи HTTP-метрик в Redis
- Изменить: `src/middleware.ts` — добавить вызов записи метрик (если middleware существует, расширить; если нет — создать)
- Изменить: `src/lib/prometheus.ts` — читать HTTP-метрики из Redis в `getMetricsString()`

**Логика `src/lib/http-metrics.ts`:**
```
function recordHttpRequest(method: string, status: number, path: string, durationSeconds: number):
  Redis keys:
    - analytics:metrics:http:{method}:{status}:{path_normalised} → hincrby count, hset total_duration
    - analytics:metrics:http_duration:{path_normalised} → lpush duration (для histogram buckets)
```

**Логика чтения в `getMetricsString()`:**
```
- SCAN analytics:metrics:http:*
  → для каждого ключа: hgetall → httpRequestsTotal.inc({method, status, path}, count)
  → вычислить durations → httpRequestDuration.observe({path}, durations)
```

**Нормализация path:**
- `/api/analytics/events` → `/api/analytics/events`
- `/api/leads/123` → `/api/leads/:id`
- `/_next/static/...` → `/_next/static`
- Ограничить количество уникальных path (top 50, остальные → `:other`)

**Критерии приёмки:**
- [ ] `http_requests_total{method, status, path}` инкрементируется при каждом запросе
- [ ] `http_request_duration_seconds{path}` записывается для каждого запроса
- [ ] Business Metrics панели 1-4 отображают данные
- [ ] Нет деградации производительности (middleware < 5ms)

---

### TASK-MON-002: Redis keys для rates и duration

**Проблема:** Ключи `analytics:metrics:rates:forms_last_minute`, `analytics:metrics:rates:funnel_completion`, `analytics:metrics:avg_session_duration`, `analytics:metrics:unique_users_today` читаются в `getMetricsString()`, но НИКОГДА не записываются.

**Решение:** Добавить запись этих ключей в соответствующие обработчики.

**Файлы:**
- Изменить: `src/app/api/analytics/events/route.ts` — обновлять rates при записи событий
- Изменить: `src/lib/prometheus.ts` — исправить `unique_users_today` на Gauge

**Логика:**

В `events/route.ts` после записи события:
```
1. forms_last_minute: INCR analytics:metrics:rates:forms_last_minute, EXPIRE 60s
   (при событии contact_form_submit)
   
2. funnel_completion: 
   - При каждом событии funnel step — пересчитать rate = contact_form_submit / page_view за последний час
   - SET analytics:metrics:rates:funnel_completion <rate>, EXPIRE 3600s
   
3. avg_session_duration:
   - При событии session_end — вычислить duration, обновить скользящее среднее
   - SET analytics:metrics:avg_session_duration <avg>, EXPIRE 86400s

4. unique_users_today:
   - SADD analytics:metrics:unique_users_set:<date> <sessionId>
   - SCARD → SET analytics:metrics:unique_users_today <count>
```

**Изменение `unique_users_today` в `prometheus.ts`:**
- Заменить `Counter` на `Gauge` (Counter не может уменьшаться при смене дня)

**Критерии приёмки:**
- [ ] `contact_form_submissions_rate` показывает реальную частоту заявок
- [ ] `conversion_funnel_completion_rate` показывает реальную конверсию
- [ ] `average_session_duration_seconds` показывает реальную длительность
- [ ] `unique_users_today` корректно обновляется и не ломает `rate()`

---

### TASK-MON-003: Исправление дашборда Service Health

**Проблема:** Панели «Prometheus» и «Grafana» показывают некорректные данные.

**Файлы:**
- Изменить: `grafana/provisioning/dashboards/imported/service-health.json`

**Исправления:**

Панель «Prometheus» (id=7):
```
БЫЛО: up{instance="host.docker.internal:9090"}
СТАЛО: up{job=~"prometheus"}  (Prometheus мониторит сам себя, но нужен правильный label)
```
Решение: использовать переменную или универсальный запрос. Prometheus не скрейпит сам себя в текущей конфигурации. Нужно либо:
- Добавить self-scrape job в `prometheus.yml` с `job_name: 'prometheus'`, targets: `127.0.0.1:9090`
- Либо убрать эту панель

Панель «Grafana» (id=8):
```
БЫЛО: up{job="nextjs-app"} — копипаст, показывает nextjs-app вместо Grafana
СТАЛО: up{job="grafana"} — но Grafana не скрейпится
```
Решение: убрать панель Grafana (нет экспортера) или заменить на проверку доступности через `http_requests_total{path="/api/health"}`.

**Критерии приёмки:**
- [ ] Панель «Prometheus» показывает корректный статус в проде
- [ ] Панель «Grafana» либо удалена, либо показывает корректные данные
- [ ] Остальные 6 панелей работают корректно

---

### TASK-MON-004: TTL для Redis ключей analytics:metrics:events

**Проблема:** Ключи `analytics:metrics:events:*` создаются без TTL и растут бесконечно.

**Файлы:**
- Изменить: `src/app/api/analytics/events/route.ts` — добавить `pipeline.expire()` для events-ключей

**Решение:**
```
pipeline.hincrby(`${ANALYTICS_KEY_PREFIX}metrics:events:${eventName}:${metricsPage}`, 'count', 1);
pipeline.expire(`${ANALYTICS_KEY_PREFIX}metrics:events:${eventName}:${metricsPage}`, 86400 * 30); // 30 дней
```

**Критерии приёмки:**
- [ ] Все новые ключи `analytics:metrics:events:*` получают TTL 30 дней
- [ ] Существующие ключи без TTL — не трогать (могут быть в проде)

---

### TASK-MON-005: Оптимизация getMetricsString()

**Проблема:** Каждый скрейп (10 сек) делает SCAN по всем `analytics:metrics:*` ключам и HGETALL для каждого.

**Файлы:**
- Изменить: `src/lib/prometheus.ts`

**Решение:** Кэширование результата в памяти на 5 секунд.
```
let metricsCache: { data: string; timestamp: number } | null = null;
const METRICS_CACHE_TTL = 5000; // 5 сек

export async function getMetricsString(): Promise<string> {
  if (metricsCache && Date.now() - metricsCache.timestamp < METRICS_CACHE_TTL) {
    return metricsCache.data;
  }
  // ... existing logic ...
  metricsCache = { data, timestamp: Date.now() };
  return data;
}
```

**Критерии приёмки:**
- [ ] При частых запросах к `/api/metrics` Redis опрашивается не чаще 1 раза в 5 сек
- [ ] Метрики остаются актуальными (max задержка 5 сек)

---

### TASK-MON-006: Удаление мёртвого кода и неиспользуемых метрик

**Проблема:** Стаб-функции, метрики без источников данных.

**Файлы:**
- Изменить: `src/lib/prometheus.ts`
- Изменить: `__tests__/lib/prometheus.test.ts`

**Действия:**
1. Удалить пустые стабы: `recordAnalyticsEvent()`, `recordSessionDuration()`
2. Удалить метрики, для которых нет источников данных и которые не используются в дашбордах:
   - `lead_submissions_total` — нет записи, нет в дашбордах → удалить
   - `phone_calls_total` — нет записи, нет в дашбордах → удалить
   - `lead_response_time_seconds` — нет записи, нет в дашбордах → удалить
   - `phone_call_duration_seconds` — нет записи, нет в дашбордах → удалить
   - `user_retention_rate` — нет записи, нет в дашбордах → удалить
3. Обновить тесты

**Критерии приёмки:**
- [ ] Мёртвый код удалён
- [ ] Тесты проходят
- [ ] Оставшиеся метрики имеют источник данных

---

### TASK-MON-007: Исправление funnel step naming

**Проблема:** В коде funnel step называется `exit`, в дашборде — `session_end`.

**Файлы:**
- Изменить: `grafana/provisioning/dashboards/imported/user-analytics.json` — заменить mapping `session_end` → `exit`

**Критерии приёмки:**
- [ ] Маппинг в дашборде соответствует ключам в метриках

---

### TASK-MON-008: Nginx exporter в dev-конфиге

**Проблема:** `prometheus.dev.yml` не имеет job для nginx, хотя `prometheus.yml` (прод) имеет.

**Файлы:**
- Изменить: `prometheus.dev.yml` — добавить nginx job (опционально, закомментированный)

**Критерии приёмки:**
- [ ] Dev-конфиг согласован с prod-конфигом

---

## 4. Порядок реализации

```
TASK-MON-001 (HTTP-метрики)       → КРИТИЧЕСКИЙ, Business Metrics
TASK-MON-002 (Redis rates)        → КРИТИЧЕСКИЙ, rates/duration
TASK-MON-003 (Service Health)     → СРЕДНИЙ, дашборд
TASK-MON-004 (TTL events)         → СРЕДНИЙ, утечка памяти
TASK-MON-005 (Кэш метрик)         → СРЕДНИЙ, производительность
TASK-MON-006 (Мёртвый код)        → НИЗКИЙ, чистота кода
TASK-MON-007 (Funnel naming)      → НИЗКИЙ, консистентность
TASK-MON-008 (Nginx dev config)   → НИЗКИЙ, консистентность
```

---

## 5. Критерии приёмки (общие)

- [ ] Все 7 дашбордов Grafana отображают реальные данные
- [ ] Business Metrics — все 5 панелей работают
- [ ] Service Health — все панели показывают корректный статус
- [ ] User Analytics — rates показывают реальные значения
- [ ] `npm test && npm run lint && npx tsc --noEmit` проходят
- [ ] Нет утечки памяти Redis (TTL на events-ключах)
- [ ] Нет деградации производительности при скрейпе метрик

---

## 6. Файлы для изменения

| Файл | Задачи | Действие |
|------|--------|----------|
| `src/lib/http-metrics.ts` | MON-001 | Создать |
| `src/lib/prometheus.ts` | MON-001, MON-002, MON-005, MON-006 | Изменить |
| `src/middleware.ts` | MON-001 | Изменить/создать |
| `src/app/api/analytics/events/route.ts` | MON-002, MON-004 | Изменить |
| `grafana/.../service-health.json` | MON-003 | Изменить |
| `grafana/.../user-analytics.json` | MON-007 | Изменить |
| `prometheus.dev.yml` | MON-008 | Изменить |
| `__tests__/lib/prometheus.test.ts` | MON-006 | Изменить |
