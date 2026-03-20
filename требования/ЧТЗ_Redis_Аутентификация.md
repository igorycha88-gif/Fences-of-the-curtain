# ЧТЗ: Redis Аутентификация

## Версия: 1.0
## Дата: 2026-03-20
## Автор: AI-аналитик (ИБ)
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Устранить уязвимость информационной безопасности: Redis работает без аутентификации в docker-compose, что позволяет любому контейнеру или пользователю с доступом к порту 6379 получить полный контроль над данными в Redis.

### 1.2 Пользовательская ценность
- **Безопасность**: Защита данных сессий, кеша и rate limiting от несанкционированного доступа
- **Соответствие стандартам**: OWASP, CIS Docker Benchmark
- **Снижение рисков**: Предотвращение атак на Redis (unauthenticated access, data exfiltration)
- **Изоляция**: Redis доступен только внутри Docker сети

### 1.3 Метрики успеха
- 100% подключений к Redis требуют аутентификацию
- Порт 6379 не доступен с хост-машины (только внутри Docker сети)
- Пароль хранится в Docker secrets (не в .env файле)
- Приложение корректно подключается к Redis с паролем
- Все тесты проходят

---

## 2. Анализ текущего состояния

### 2.1 Выявленные проблемы

| Файл | Строка | Проблема | Критичность |
|------|--------|----------|-------------|
| `docker-compose.yml` | 45-52 | Redis без requirepass | Critical |
| `docker-compose.yml` | 49-50 | Порт 6379:6379 открыт на хосте | High |
| `docker-compose.yml` | 13 | REDIS_URL без пароля | Critical |
| `docker-compose.dev.yml` | 48-53 | Redis без requirepass | High |
| `docker-compose.dev.yml` | 15 | REDIS_URL без пароля | High |
| `.env.example` | - | Нет REDIS_PASSWORD | Medium |

### 2.2 Схема текущего состояния (AS-IS)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ТЕКУЩЕЕ СОСТОЯНИЕ (НЕБЕЗОПАСНО)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Хост-машина / Внешний злоумышленник]                              │
│       │                                                             │
│       │ redis-cli -h localhost -p 6379                              │
│       │ ❌ БЕЗ ПАРОЛЯ                                               │
│       ▼                                                             │
│  [Docker: Redis]                                                    │
│       │                                                             │
│       │ ❌ Нет requirepass                                          │
│       │ ❌ Порт 6379:6379 открыт                                    │
│       │                                                             │
│       ├─ Доступ ко всем данным                                      │
│       ├─ Возможность модификации данных                             │
│       ├─ Возможность DoS (FLUSHALL)                                 │
│       └─ Эксплуатация через Redis modules (если есть)               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Схема целевого состояния (TO-BE)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ЦЕЛЕВОЕ СОСТОЯНИЕ (БЕЗОПАСНО)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Хост-машина / Внешний злоумышленник]                              │
│       │                                                             │
│       │ redis-cli -h localhost -p 6379                              │
│       │ ❌ Connection refused (порт не открыт)                      │
│       ▼                                                             │
│  [Docker: Redis]                                                    │
│       │                                                             │
│       │ ✅ requirepass = ${REDIS_PASSWORD}                          │
│       │ ✅ Порт не маппится на хост                                 │
│       │ ✅ Доступ только внутри fences-network                      │
│       │                                                             │
│  [Docker: App]                                                      │
│       │                                                             │
│       │ redis://:${REDIS_PASSWORD}@redis:6379                       │
│       │ ✅ Аутентификация обязательна                               │
│       ▼                                                             │
│  [Redis] → AUTH ${REDIS_PASSWORD} → OK                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 Угрозы при текущем состоянии

| Угроза | Описание | Последствия |
|--------|----------|-------------|
| Unauthenticated Access | Любой может подключиться к Redis | Чтение/запись данных |
| Data Exfiltration | Кража данных сессий, кеша | Утечка чувствительных данных |
| DoS (FLUSHALL) | Удаление всех данных | Потеря данных, простой |
| Rate Limit Bypass | Очистка счётчиков rate limiting | Brute force атаки |
| Session Hijacking | Доступ к данным сессий | Компрометация аккаунтов |

---

## 3. Функциональные требования

### 3.1 User Stories с Acceptance Criteria

#### US-001: Аутентификация Redis
**Как** система безопасности,  
**Я хочу**, чтобы Redis требовал пароль для всех подключений,  
**Чтобы** предотвратить несанкционированный доступ к данным.

**Acceptance Criteria**:
```
Given Redis сервер запущен в Docker
When клиент подключается к Redis
Then клиент должен предоставить пароль через AUTH команду
And без пароля любые команды возвращают NOAUTH
And пароль читается из Docker secret redis_password
```

#### US-002: Изоляция Redis в Docker сети
**Как** система безопасности,  
**Я хочу**, чтобы Redis был доступен только внутри Docker сети,  
**Чтобы** предотвратить доступ с хост-машины и внешней сети.

**Acceptance Criteria**:
```
Given Redis контейнер запущен
When проверяется маппинг портов
Then порт 6379 НЕ маппится на хост
And Redis доступен только по адресу redis:6379 внутри fences-network
And redis-cli -h localhost -p 6379 возвращает "Connection refused"
```

#### US-003: Хранение пароля в Docker secrets
**Как** DevOps инженер,  
**Я хочу**, чтобы пароль Redis хранился в Docker secrets,  
**Чтобы** обеспечить безопасное управление секретами.

**Acceptance Criteria**:
```
Given docker-compose.yml конфигурация
When определяется секрет для Redis
Then секрет с именем redis_password объявлен в секции secrets
And секрет монтируется в /run/secrets/redis_password в контейнере Redis
And секрет монтируется в /run/secrets/redis_password в контейнере App
And секрет создаётся из файла ./secrets/redis_password
```

#### US-004: Подключение приложения к Redis с паролем
**Как** приложение,  
**Я хочу** подключаться к Redis с использованием пароля,  
**Чтобы** работать с данными в защищённом Redis.

**Acceptance Criteria**:
```
Given приложение запускается в Docker
When инициализируется подключение к Redis
Then REDIS_URL содержит пароль: redis://:${REDIS_PASSWORD}@redis:6379
And пароль читается из /run/secrets/redis_password
And подключение успешно устанавливается
And rate limiting, сессии, кеш работают корректно
```

#### US-005: Обратная совместимость для разработки
**Как** разработчик,  
**Я хочу**, чтобы локальная разработка работала без создания секретов,  
**Чтобы** не усложнять процесс разработки.

**Acceptance Criteria**:
```
Given docker-compose.dev.yml используется для локальной разработки
When разработчик запускает docker-compose up
Then Redis работает с паролем из переменной REDIS_PASSWORD
And .env.dev содержит REDIS_PASSWORD для разработки
And не требуется создавать файлы секретов вручную
And .env.dev добавлен в .gitignore
```

---

## 4. Нефункциональные требования

### 4.1 Безопасность

#### 4.1.1 Требования к паролю Redis
| Требование | Значение | Обоснование |
|------------|----------|-------------|
| Длина | ≥ 32 символа | OWASP рекомендация |
| Генерация | `openssl rand -base64 32` | Криптографически стойкий RNG |
| Хранение в prod | Docker secrets | Не коммитится в git |
| Хранение в dev | .env.dev файл | Удобство разработки |
| Версионирование | .gitignore для секретов | Защита от утечки |

**Запрещённые значения**:
- `password`, `redis`, `secret`, `12345`
- Пустой пароль
- Пароли < 32 символов

#### 4.1.2 Сетевая безопасность
| Требование | Значение |
|------------|----------|
| Доступ с хоста | Запрещён |
| Доступ извне | Запрещён |
| Доступ внутри Docker | Разрешён (fences-network) |
| Bind address | 0.0.0.0 (внутри контейнера) |

### 4.2 Производительность
- **Время аутентификации**: < 1ms (Redis in-memory)
- **Влияние на latency**: не более 1ms на каждое подключение
- **Переиспользование подключений**: connection pooling обязателен

### 4.3 Надёжность
- **Graceful degradation**: при недоступности Redis — fail-open (как в rate-limit)
- **Health check**: Redis ping с аутентификацией

---

## 5. Техническая архитектура

### 5.1 Изменения в docker-compose.yml (production)

```yaml
services:
  app:
    environment:
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
    secrets:
      - redis_password
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    container_name: fences-redis
    restart: unless-stopped
    command: >
      sh -c "redis-server --requirepass \"$$(cat /run/secrets/redis_password)\""
    volumes:
      - redis_data:/data
    secrets:
      - redis_password
    # УБРАТЬ ports: - "6379:6379"

secrets:
  redis_password:
    file: ./secrets/redis_password

volumes:
  redis_data:
```

### 5.2 Изменения в docker-compose.dev.yml (development)

```yaml
services:
  app:
    environment:
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    container_name: fences-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    # УБРАТЬ маппинг портов (если есть)

volumes:
  redis_data:
```

### 5.3 Структура файлов

```
project/
├── docker-compose.yml        (ИЗМЕНЯЕТСЯ)
├── docker-compose.dev.yml    (ИЗМЕНЯЕТСЯ)
├── secrets/
│   └── redis_password        (НОВЫЙ - добавить в .gitignore)
├── .env.example              (ИЗМЕНЯЕТСЯ - добавить REDIS_PASSWORD)
├── .env.dev                  (НОВЫЙ - для разработки)
├── .gitignore                (ИЗМЕНЯЕТСЯ - добавить secrets/, .env.dev)
└── scripts/
    └── setup-redis-secret.sh (НОВЫЙ - скрипт генерации секрета)
```

### 5.4 Переменные окружения

```bash
# .env.example (добавить)

# Redis Password (REQUIRED for production)
# Generate with: openssl rand -base64 32
# IMPORTANT: Use Docker secrets in production, never commit to git!
REDIS_PASSWORD=REPLACE_WITH_REAL_PASSWORD

# .env.dev (создать новый файл)

# Development Redis Password
# This file is for local development only
REDIS_PASSWORD=dev_redis_password_change_in_production
```

### 5.5 Обновление .gitignore

```gitignore
# Secrets (добавить)
secrets/
.env.dev
```

---

## 6. Декомпозиция на задачи

### Infrastructure

#### TASK-INF-001: Создать директорию secrets и скрипт генерации
**Направление**: Infrastructure  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: Нет

**Описание**:
Создать директорию `secrets/` и скрипт `scripts/setup-redis-secret.sh` для генерации пароля Redis.

**Критерии приемки**:
- [ ] Директория `secrets/` создана
- [ ] Файл `scripts/setup-redis-secret.sh` создан
- [ ] Скрипт генерирует пароль командой `openssl rand -base64 32`
- [ ] Скрипт сохраняет пароль в `secrets/redis_password`
- [ ] Скрипт проверяет, что файл уже не существует (не перезаписывает)
- [ ] Скрипт выводит инструкции для пользователя
- [ ] Права на файл: 600 (только владелец может читать)

**Технические детали**:
```bash
#!/bin/bash
# scripts/setup-redis-secret.sh

SECRETS_DIR="./secrets"
SECRET_FILE="$SECRETS_DIR/redis_password"

if [ -f "$SECRET_FILE" ]; then
  echo "Secret already exists at $SECRET_FILE"
  echo "To regenerate, delete the file first: rm $SECRET_FILE"
  exit 1
fi

mkdir -p "$SECRETS_DIR"
openssl rand -base64 32 > "$SECRET_FILE"
chmod 600 "$SECRET_FILE"

echo "Redis password generated and saved to $SECRET_FILE"
echo "IMPORTANT: This file is in .gitignore and should never be committed"
```

---

#### TASK-INF-002: Обновить docker-compose.yml
**Направление**: Infrastructure  
**Приоритет**: High  
**Оценка**: 1 час  
**Зависимости**: TASK-INF-001

**Описание**:
Обновить `docker-compose.yml` для добавления аутентификации Redis и изоляции в Docker сети.

**Критерии приемки**:
- [ ] Redis сервис использует `--requirepass` с паролем из Docker secret
- [ ] Секция `secrets` добавлена в docker-compose.yml
- [ ] Секрет `redis_password` монтируется в Redis контейнер
- [ ] Секрет `redis_password` монтируется в App контейнер
- [ ] Маппинг портов `6379:6379` УДАЛЁН
- [ ] Переменная `REDIS_URL` обновлена с паролем
- [ ] Переменная `REDIS_PASSWORD` добавлена через секрет

**Технические детали**:
- Файлы: `docker-compose.yml`
- Изменения:
```yaml
services:
  app:
    environment:
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
    secrets:
      - redis_password

  redis:
    command: >
      sh -c "redis-server --requirepass \"$$(cat /run/secrets/redis_password)\""
    secrets:
      - redis_password
    # ports: - "6379:6379" <- УДАЛИТЬ

secrets:
  redis_password:
    file: ./secrets/redis_password
```

---

#### TASK-INF-003: Обновить docker-compose.dev.yml
**Направление**: Infrastructure  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: Нет

**Описание**:
Обновить `docker-compose.dev.yml` для добавления аутентификации Redis через переменную окружения.

**Критерии приемки**:
- [ ] Redis сервис использует `--requirepass` с паролем из `${REDIS_PASSWORD}`
- [ ] Переменная `REDIS_URL` обновлена с паролем
- [ ] Маппинг портов удалён (если был)

**Технические детали**:
- Файлы: `docker-compose.dev.yml`
- Изменения:
```yaml
services:
  app:
    environment:
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

  redis:
    command: redis-server --requirepass ${REDIS_PASSWORD}
```

---

#### TASK-INF-004: Создать .env.dev и обновить .env.example
**Направление**: Infrastructure  
**Приоритет**: High  
**Оценка**: 0.25 часа  
**Зависимости**: Нет

**Описание**:
Создать файл `.env.dev` для локальной разработки и добавить `REDIS_PASSWORD` в `.env.example`.

**Критерии приемки**:
- [ ] Файл `.env.dev` создан с `REDIS_PASSWORD=dev_redis_password_change_in_production`
- [ ] `.env.example` обновлён с `REDIS_PASSWORD` и комментарием
- [ ] `.gitignore` обновлён: добавлены `secrets/` и `.env.dev`

**Технические детали**:
```bash
# .env.dev
REDIS_PASSWORD=dev_redis_password_change_in_production

# .env.example (добавить)
REDIS_PASSWORD=REPLACE_WITH_REAL_PASSWORD

# .gitignore (добавить)
secrets/
.env.dev
```

---

### Backend

#### TASK-BCK-001: Обновить инициализацию Redis клиента
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 1 час  
**Зависимости**: TASK-INF-002, TASK-INF-003

**Описание**:
Убедиться, что Redis клиент в приложении корректно обрабатывает пароль из `REDIS_URL`.

**Критерии приемки**:
- [ ] Redis клиент использует `REDIS_URL` с паролем
- [ ] Подключение успешно устанавливается
- [ ] При ошибке аутентификации логируется понятное сообщение
- [ ] Connection pooling работает корректно
- [ ] Graceful degradation при недоступности Redis (fail-open)

**Технические детали**:
- Файлы: `src/lib/redis.ts` или аналогичный (проверить существование)
- Если Redis клиент не существует, проверить где используется `REDIS_URL`:
  - `src/lib/rate-limit.ts`
  - `src/lib/auth.ts` (сессии)
  - Другие места использования Redis

---

### Testing

#### TASK-TST-001: Ручное тестирование Redis аутентификации
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-INF-002, TASK-BCK-001

**Описание**:
Выполнить ручное тестирование Redis аутентификации в production конфигурации.

**Критерии приемки**:
- [ ] Запущен `docker-compose up` с обновлённой конфигурацией
- [ ] Выполнено подключение к Redis БЕЗ пароля — отказано (NOAUTH)
- [ ] Выполнено подключение к Redis С паролем — успешно
- [ ] Проверено, что порт 6379 НЕ доступен на localhost
- [ ] Приложение успешно подключается к Redis
- [ ] Rate limiting работает
- [ ] Сессии работают

**Технические детали**:
```bash
# Тест 1: Подключение без пароля (должно быть отказано)
docker exec -it fences-redis redis-cli PING
# Ожидается: (error) NOAUTH Authentication required

# Тест 2: Подключение с паролем (должно быть успешно)
docker exec -it fences-redis redis-cli -a $(cat secrets/redis_password) PING
# Ожидается: PONG

# Тест 3: Порт не доступен с хоста
redis-cli -h localhost -p 6379 PING
# Ожидается: Could not connect to Redis at localhost:6379: Connection refused

# Тест 4: Приложение работает
curl http://localhost:3001/api/health
# Ожидается: 200 OK
```

---

#### TASK-TST-002: Ручное тестирование development конфигурации
**Направление**: Testing  
**Приоритет**: Medium  
**Оценка**: 0.25 часа  
**Зависимости**: TASK-INF-003

**Описание**:
Выполнить ручное тестирование Redis аутентификации в development конфигурации.

**Критерии приемки**:
- [ ] Запущен `docker-compose -f docker-compose.dev.yml up`
- [ ] .env.dev файл существует и содержит REDIS_PASSWORD
- [ ] Redis требует пароль
- [ ] Приложение успешно подключается
- [ ] Hot reload работает

---

### Documentation

#### TASK-DOC-001: Обновить README.md
**Направление**: Documentation  
**Приоритет**: Medium  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-INF-001, TASK-INF-002

**Описание**:
Обновить README.md с инструкциями по настройке Redis аутентификации.

**Критерии приемки**:
- [ ] Добавлен раздел "Настройка Redis аутентификации"
- [ ] Инструкция по запуску `scripts/setup-redis-secret.sh`
- [ ] Инструкция для development (создание .env.dev)
- [ ] Предупреждение о безопасности (не коммитить секреты)
- [ ] Инструкция по проверке подключения

---

## 7. Тестирование

### 7.1 Ручное тестирование

#### Тест-кейс TC-001: Аутентификация Redis в production
**Предусловия**:
- Docker установлен
- secrets/redis_password создан

**Шаги**:
1. Запустить `./scripts/setup-redis-secret.sh`
2. Запустить `docker-compose up -d`
3. Выполнить: `docker exec fences-redis redis-cli PING`
4. Выполнить: `docker exec fences-redis redis-cli -a $(cat secrets/redis_password) PING`
5. Выполнить: `redis-cli -h localhost -p 6379 PING`
6. Проверить логи приложения

**Ожидаемый результат**:
- Шаг 3: `(error) NOAUTH Authentication required`
- Шаг 4: `PONG`
- Шаг 5: `Could not connect... Connection refused`
- Шаг 6: Нет ошибок подключения к Redis

#### Тест-кейс TC-002: Аутентификация Redis в development
**Предусловия**:
- .env.dev создан

**Шаги**:
1. Запустить `docker-compose -f docker-compose.dev.yml up -d`
2. Выполнить: `docker exec fences-redis redis-cli PING`
3. Проверить работу приложения

**Ожидаемый результат**:
- Шаг 2: `(error) NOAUTH Authentication required`
- Шаг 3: Приложение работает корректно

---

## 8. Риски и зависимости

### 8.1 Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Забытый пароль Redis | Medium | High | Документация, скрипт генерации |
| Секрет в git | Low | Critical | .gitignore, pre-commit hooks |
| Приложение не может подключиться | Medium | High | Тестирование, откат |
| Port forwarding нужен для отладки | Low | Low | docker exec для доступа к Redis |

### 8.2 Зависимости

| Зависимость | Тип | Статус | Комментарий |
|-------------|-----|--------|-------------|
| Docker Compose | Infrastructure | ✅ Установлен | Версия 2.x+ |
| OpenSSL | Tool | ✅ Установлен | Для генерации пароля |
| ioredis | NPM пакет | ✅ Установлен | Поддерживает аутентификацию |
| Redis 7 | Image | ✅ Используется | Поддерживает requirepass |

### 8.3 Предположения

- Redis используется только внутри Docker сети
- Для отладки используется `docker exec` вместо прямого подключения
- Секреты не коммитятся в git (.gitignore настроен)

---

## 9. Согласование

- [ ] Заказчик
- [ ] DevOps
- [ ] Security

---

## 10. Контрольный список перед разработкой

### Definition of Ready

- [ ] Понятны всем членам команды
- [ ] Можно протестировать
- [ ] Технически выполним
- [ ] Приносит ценность бизнесу (безопасность)
- [ ] Размер позволяет реализовать за 1 день
- [ ] Зависимости идентифицированы (Docker secrets, ioredis)
- [ ] Acceptance Criteria определены
- [ ] Утверждены стейкхолдерами

---

## 11. Порядок выполнения задач

```
TASK-INF-001 (secrets директория)
     ↓
TASK-INF-002 (docker-compose.yml) ──┐
     ↓                               │
TASK-BCK-001 (Redis клиент) ←────────┘
     ↓
TASK-TST-001 (production тесты)

TASK-INF-003 (docker-compose.dev.yml)
     ↓
TASK-INF-004 (.env.dev)
     ↓
TASK-TST-002 (dev тесты)

TASK-DOC-001 (README.md) — можно выполнять параллельно
```

---

## 12. Откат (Rollback Plan)

При проблемах с аутентификацией:

1. Остановить контейнеры: `docker-compose down`
2. Временно убрать `--requirepass` из docker-compose.yml
3. Запустить контейнеры: `docker-compose up -d`
4. Исследовать проблему
5. После исправления — вернуть аутентификацию

---

*ЧТЗ создан для устранения уязвимости Redis без аутентификации.*
