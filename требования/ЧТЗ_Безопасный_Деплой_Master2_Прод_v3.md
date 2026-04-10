# ЧТЗ: Безопасный деплой master2 → прод с откатом и Grafana-дашбордами (v3)

**Дата:** 2026-04-10  
**Инициатор:** Пользователь  
**Приоритет:** Критический  
**Статус:** На утверждении  

---

## 1. Бизнес-контекст

Необходимо обеспечить безопасный деплой из ветки `master2` на продакшн-сервер (VPS 37.143.13.196) с гарантией:
1. Все 6 Grafana-дашбордов создаются и показывают данные
2. Мгновенный откат при любой проблеме
3. Минимальный простой (zero-downtime цель)

---

## 2. Проблемы текущего CI/CD (найдены при анализе)

### P0 — Критические
| # | Проблема | Файл | Риск |
|---|----------|------|------|
| BUG-001 | **Секреты в `.env.production` в Git** — пароли БД, Redis, Telegram, SMTP, NextAuth | `.env.production` | Утечка credential через репозиторий |
| BUG-002 | **Хардкод пароля VPS** в `verify-deployment.sh` | `scripts/verify-deployment.sh:48` | Утечка через репозиторий |

### P1 — Высокие
| # | Проблема | Файл | Риск |
|---|----------|------|------|
| BUG-003 | **Datasource UID не задан** в `prometheus.yml` — Grafana генерирует случайный UID | `grafana/provisioning/datasources/prometheus.yml` | 5 из 6 дашбордов теряют данные при пересоздании |
| BUG-004 | **Несогласованные datasource references** — `business-metrics` использует `{uid: "prometheus"}`, остальные 5 используют строку `"Prometheus"` | 5 JSON файлов в `grafana/provisioning/dashboards/imported/` | Дашборды не показывают данные |
| BUG-005 | **Rollback workflow не проверяет Grafana dashboards на данные** | `.github/workflows/rollback-production.yml` | После отката мониторинг неработоспособен |

### P2 — Средние
| # | Проблема | Файл | Риск |
|---|----------|------|------|
| BUG-006 | **`deploy-production.sh` собирает только `app`**, а не все сервисы | `scripts/deploy-production.sh:59` | Нарушение Правила 6 — частичная сборка |
| BUG-007 | **Нет blue-green деплоя** — при деплое/откате есть простой ~30-60 сек | deploy workflow | Простой для пользователей |
| BUG-008 | **`verify-deployment.sh` проверяет PM2** — устаревший скрипт | `scripts/verify-deployment.sh` | Неверная диагностика |

---

## 3. Решение

### 3.1. Фикс Grafana datasource UID (BUG-003, BUG-004)

- Задать фиксированный `uid: "prometheus"` в `grafana/provisioning/datasources/prometheus.yml`
- Унифицировать все 5 дашбордов — заменить строку `"Prometheus"` на `{ "type": "prometheus", "uid": "prometheus" }`
- `business-metrics-production.json` уже использует правильный формат — не трогать

### 3.2. Деплой с blue-green подходом (BUG-007)

Реализовать двухконтейнерный подход:
- Текущий контейнер работает на порту 3001
- Новый контейнер запускается на порту 3003 (healthcheck)
- При успехе — переключение nginx upstream
- При провале — новый контейнер убивается, текущий продолжает

### 3.3. Верификация Grafana-дашбордов (BUG-005)

В deploy workflow добавить:
1. Проверка datasource подключения через Grafana API
2. Запрос к каждому дашборду — проверка что панели возвращают данные
3. При отсутствии данных — WARN + retry через 30 сек

### 3.4. Фикс скриптов (BUG-006, BUG-008)

- `deploy-production.sh`: заменить `build --no-cache app` на `build --no-cache` (все сервисы)
- `verify-deployment.sh`: переписать под Docker (убрать PM2 проверки)

### 3.5. Безопасность секретов (BUG-001, BUG-002)

- `.env.production`: заменить реальные секреты на placeholder-ы, добавить в `.gitignore`
- `verify-deployment.sh`: убрать хардкод пароля, использовать env vars

---

## 4. Файлы для изменения

| Файл | Действие |
|------|----------|
| `grafana/provisioning/datasources/prometheus.yml` | Добавить `uid` |
| `grafana/provisioning/dashboards/imported/system-overview.json` | Унифицировать datasource |
| `grafana/provisioning/dashboards/imported/postgres-metrics.json` | Унифицировать datasource |
| `grafana/provisioning/dashboards/imported/redis-metrics.json` | Унифицировать datasource |
| `grafana/provisioning/dashboards/imported/service-health.json` | Унифицировать datasource |
| `grafana/provisioning/dashboards/imported/user-analytics.json` | Унифицировать datasource |
| `.github/workflows/deploy-production.yml` | Blue-green + Grafana verification |
| `.github/workflows/rollback-production.yml` | Проверка Grafana dashboards |
| `scripts/deploy-production.sh` | Полная пересборка |
| `scripts/verify-deployment.sh` | Docker-based проверки |
| `.env.production` | Заменить секреты на placeholders |
| `.gitignore` | Добавить `.env.production` (если не добавлен) |

---

## 5. Критерии приёмки

| AC | Критерий | Проверка |
|----|----------|----------|
| AC-1 | Все 6 Grafana дашбордов показывают данные после деплоя | API-запрос к каждой панели → данные есть |
| AC-2 | Datasource UID фиксированный `prometheus` | `curl Grafana API /datasources` → uid matches |
| AC-3 | Автоматический откат при падении healthcheck | Deploy с заведомо битым кодом → auto-rollback |
| AC-4 | Ручной откат через GitHub Actions workflow | `workflow_dispatch` с `rollback_ref` |
| AC-5 | Простой при деплое минимизирован | Blue-green: старый контейнер работает до проверки нового |
| AC-6 | Секреты не в Git | `grep -r "Gorunova" .` → 0 результатов в отслеживаемых файлах |
| AC-7 | Полная пересборка всех сервисов | `deploy-production.sh` не содержит `build --no-cache app` |
| AC-8 | CI проверки проходят | `npm test && npm run lint && npx tsc --noEmit` → exit 0 |

---

## 6. Декомпозиция задач

| ID | Описание | Приоритет |
|----|----------|-----------|
| TASK-DEPLOY-001 | Фикс Grafana datasource UID в provisioning | P0 |
| TASK-DEPLOY-002 | Унификация datasource references в 5 дашбордах | P0 |
| TASK-DEPLOY-003 | Blue-green деплой в deploy-production.yml | P1 |
| TASK-DEPLOY-004 | Верификация Grafana dashboards в CI/CD | P1 |
| TASK-DEPLOY-005 | Фикс rollback-production.yml — проверка Grafana | P1 |
| TASK-DEPLOY-006 | Фикс deploy-production.sh — полная пересборка | P1 |
| TASK-DEPLOY-007 | Обновление verify-deployment.sh под Docker | P2 |
| TASK-DEPLOY-008 | Безопасность секретов (.env.production + .gitignore) | P0 |

---

## 7. Риски

| Риск | Митигация |
|------|-----------|
| Blue-green требует дополнительной памяти на VPS (4GB) | При нехватке — fallback на текущий подход с минимальным простоем |
| Grafana provisioning может перезатереть кастомные изменения | `allowUiUpdates: true` уже включён |
| Переключение nginx может сломать SSL | Тестирование на staging перед продом |
