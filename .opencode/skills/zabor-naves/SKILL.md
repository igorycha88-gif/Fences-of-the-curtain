---
name: zabor-naves
description: Проектный контекст и железные правила проекта «Заборы и Навесы» (zabor-i-naves.ru). Use for ANY task in this repository — код, фича, баг-фикс, Prisma/БД, API, фронтенд, Docker, деплой, CI/CD, инфраструктура. Загружается всегда при старте сессии; агент обязан придерживаться этих правил до конца сессии.
---

# 🚧 Скилл проекта «Заборы и Навесы» (zabor-i-naves.ru)

> **Этот файл — обязательный контекст для КАЖДОЙ задачи в репозитории.**
> Логика конвейера (Аналитик → Разработчик → Тестировщик → DevOps) описана в `AGENTS.md`
> и активна всегда. Здесь — конкретные факты проекта и guardrails.

---

## 1. Идентификация проекта

| Параметр | Значение |
|----------|----------|
| Название | Заборы и Навесы (Fences of the curtain) |
| Домен (prod) | **https://zabor-i-naves.ru** |
| Прод-сервер (VPS) | **37.143.13.196** |
| Репозиторий | `git@github.com:igorycha88-gif/Fences-of-the-curtain.git` |
| Реестр образов | `ghcr.io/igor/fences-of-the-curtain/app` |
| Текущая версия | `package.json → version` (semver, теги `v1.x.x`) |

---

## 2. Стратегия веток

| Ветка | Назначение |
|-------|------------|
| **`master2`** | ✅ ОСНОВНАЯ рабочая И продакшн-ветка. Весь код и деплой идут отсюда. |
| `dev` (`origin/dev`, он же `origin/HEAD`) | Историческая development-ветка |
| `main`, `master` | Исторические/устаревшие — НЕ использовать для новой работы |

**Правила:**
- Новую работу ведём в `master2` (или в коротких feature-ветках, сливаются в `master2`).
- Продакшн-деплой всегда из `master2`. См. `PIPELINE_PROD.js`.
- Никогда не деплоить из `main`/`master`/`dev`.

---

## 3. Технологический стек

- **Frontend:** Next.js 14.2.35 (App Router), React 18, TypeScript 5.3, Tailwind CSS 3.4
- **Backend:** Next.js API Routes (App Router), Prisma 5.22, NextAuth 4
- **БД:** PostgreSQL 16
- **Кеш / Rate-limit:** Redis 7 (`ioredis`)
- **Тесты:** Jest 29 + ts-jest 29, Testing Library
- **Рантайм:** Node.js 20
- **Контейнеризация:** Docker + Docker Compose

---

## 4. Окружения и порты

### Dev (локально)
- Файл: **`docker-compose.dev.yml`**
- `app`: контейнер `fences-app-dev`, порт **`3001→3000`**, healthcheck `/api/health`
- `db` (postgres:16-alpine): **`5433→5432`**, база `fences`
- `redis` (redis:7-alpine): порт 6379, пароль из `REDIS_PASSWORD`
- `tor`: `captaingeech/tor-proxy` (SEO)
- Локальный `npm run dev` → порт **3000**

### Prod (VPS 37.143.13.196)
- Файл: **`docker-compose.yml`** (`network_mode: host`, образ из GHCR)
- `app`: **PORT 3001** (blue / текущий прод)
- Green-инстанс при Blue-Green деплое: **PORT 3003**
- PostgreSQL/Redis на хосте (127.0.0.1)
- `NEXTAUTH_URL=https://zabor-i-naves.ru`

---

## 5. Качество (Quality Gate) — ОБЯЗАТЕЛЬНО перед передачей работы

Точная последовательность из трёх команд. Пока ВСЕ три не зелёные — работа не передаётся:

```bash
npm test                 # Jest
npm run lint             # next lint (ESLint)
npx tsc --noEmit         # проверка типов (он же npm run type-check)
```

Дополнительно при необходимости:
```bash
npm run build            # production-сборка (output: 'standalone')
npx prisma validate      # он же npm run validate-prisma
```

---

## 6. Установка зависимостей

```bash
npm ci --legacy-peer-deps
```

Флаг `--legacy-peer-deps` **обязателен** (так делает CI). Без него install падает.

---

## 7. Prisma

- Схема: `prisma/schema.prisma`
- Генерация клиента: `npm run db:generate` (`npx prisma generate`)
- Миграции (dev): `npm run db:migrate` (`prisma migrate dev`)
- Применение схемы (быстро): `npm run db:push` (`prisma db push`)
- Сид: `npm run db:seed` (`tsx prisma/seeds/seed.ts`)

**При изменении `prisma/schema.prisma`** → DevOps обязан применить схему к БД (`npx prisma db push` на проде / в dev-контейнере).

---

## 8. Деплой

### Локальная пересборка (после успешного тестирования)
Полная пересборка ВСЕХ сервисов (Правило 6 из `AGENTS.md` — частичная пересборка ЗАПРЕЩЕНА):

```bash
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d --force-recreate
docker compose -f docker-compose.dev.yml ps          # ждём healthy
curl -f http://localhost:3000/api/health
```

### Продакшн-деплой (триггер: «деплой на прод» / «задеплой» и т.п.)
- Ветка: **только `master2`**
- Стратегия: **Blue-Green**, образ собирается CI и пушится в GHCR
- Спецификация: `PIPELINE_PROD.js`, скилл: `SKILL_DEVOPS_PROD.md`
- При провале критического шага → **автоматический откат**

### Откат на проде (триггер: «откат» / «rollback»)
Показать доступные образы → откатиться → верифицировать. См. `rollback-production.yml`.

---

## 9. Железные правила (краткая выжимка — полное обоснование в `AGENTS.md`)

1. **Любая задача — через конвейер** (Аналитик → [Архитектор] → Разработчик → Тестировщик → DevOps). Исключение — только явное «без ЧТЗ / пропусти конвейер».
2. **Без ЧТЗ код не пишется.** Малая задача (<3 файлов, без БД/API/архитектуры) → упрощённое ЧТЗ.
3. **Quality Gate из §5 обязателен** перед передачей работы дальше.
4. **Логирование во ВСЕ новые файлы** (API routes, services, catch-блоки) через `src/lib/logger.ts`. Никаких «голых» `console.log`.
5. **Автотесты на КАЖДЫЙ функционал** (happy + error + edge cases + тесты на логирование), покрытие ≥ 60%.
6. **DevOps = ПОЛНАЯ пересборка** всех сервисов (`--no-cache` + `--force-recreate`). Частичная — запрет.
7. **Никаких секретов в коде/коммитах.** Только переменные окружения (`.env*`, не в git). CI имеет шаг `Security check (hardcoded secrets)`.
8. **Постдеплойный баг в той же сессии → РЕСТАРТ конвейера с Аналитика** (не фиксить «на месте»).

---

## 10. Где искать детали

| Что | Файл |
|-----|------|
| Конвейер (роли, этапы, правила) | `AGENTS.md` |
| Формальная спецификация конвейера | `PIPELINE.js` |
| Формальная спецификация прод-деплоя | `PIPELINE_PROD.js` |
| Архитектура | `ARCHITECTURE.md` |
| Скиллы ролей | `SKILL_ARCHITECT.md`, `SKILL_ANALYST.md`, `.skill-developer.md`, `SKILL_TESTER.md`, `SKILL_DEVOPS.md`, `SKILL_DEVOPS_PROD.md` |
| ЧТЗ (требования) | `требования/ЧТЗ_*.md` |
| CI/CD | `.github/workflows/ci.yml`, `ci-pr.yml`, `deploy-production.yml`, `rollback-production.yml` |

---

## 11. Self-check перед каждым действием

- [ ] Понимаю ли я, что задача идёт через конвейер (`AGENTS.md`)?
- [ ] Работаю в `master2` (а не в `main`/`master`/`dev`)?
- [ ] Запустил quality gate (`npm test && npm run lint && npx tsc --noEmit`)?
- [ ] Для нового функционала: есть логирование и автотесты?
- [ ] Деплой: полная пересборка? На прод — только из `master2`?
- [ ] Никаких секретов в коде?
