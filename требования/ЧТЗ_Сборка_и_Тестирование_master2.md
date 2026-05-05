# ЧТЗ: Сборка и полное тестирование (ветка master2)

## Описание задачи
Собрать приложение с ветки `master2` и провести полное тестирование: lint, typecheck, unit-тесты, production build, Docker-сборка, деплой в dev-среду, проверка healthcheck.

## Маршрут: Аналитик → Разработчик (build/test) → Тестировщик → DevOps (деплой)

## Критерии приёмки
1. `npm run lint` — без ошибок
2. `npx tsc --noEmit` — без ошибок типов
3. `npm test` — все тесты пройдены
4. `npm run build` — production-сборка успешна
5. Docker: полная пересборка всех сервисов (--no-cache)
6. Все контейнеры healthy
7. `curl http://localhost:3001/api/health` → 200

## Задачи
- TASK-BLD-001: Установка зависимостей + prisma generate
- TASK-BLD-002: Lint + TypeCheck + Unit-тесты
- TASK-BLD-003: Production build
- TASK-BLD-004: Docker полная пересборка + деплой
- TASK-BLD-005: Проверка healthcheck всех сервисов
