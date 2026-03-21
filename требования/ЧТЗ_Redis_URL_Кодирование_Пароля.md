# ЧТЗ: Redis URL — Кодирование пароля

## Версия: 1.0
## Дата: 2026-03-21
## Автор: AI-аналитик (ИБ)
## Приоритет: Critical
## Статус: Согласовано

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Устранить критический сбой сборки (build failure): Redis URL с паролем, содержащим спецсимволы (в т.ч. `/`), некорректно парсится библиотекой ioredis, что приводит к падению подключения к Redis.

### 1.2 Пользовательская ценность
- **Стабильность**: Build и деплой проходят успешно
- **Безопасность**: Поддержка криптографически стойких паролей с любыми символами
- **Надёжность**: Корректное подключение к Redis при любых паролях

### 1.3 Метрики успеха
- Build проходит успешно (exit code 0)
- Redis подключение устанавливается корректно
- Пароли с символами `/`, `@`, `:`, `#`, `%` работают

---

## 2. Анализ проблемы

### 2.1 Корневая причина

**Формат Redis URL:**
```
redis://[:password@]host[:port][/db-number]
```

**Проблема:**
```bash
# Текущий REDIS_URL с паролем, содержащим /
REDIS_URL="redis://:dFut2dGIiV8frd95lqEbHGgrcbQp/c1NIr5dr7ROtc4=@localhost:6379"
```

Символ `/` в URL — зарезервированный (разделитель пути). ioredis использует стандартный URL парсер, который интерпретирует `/` в пароле как начало пути или номер БД.

### 2.2 Схема проблемы

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ПРОБЛЕМА                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  REDIS_URL="redis://:abc/def@redis:6379"                           │
│                        ↑                                            │
│                        │                                            │
│               / интерпретируется как:                               │
│               - начало пути                                         │
│               - разделитель db-number                               │
│                                                                     │
│  URL Parser:                                                        │
│    password = "abc"        (обрезано до /)                         │
│    pathname = "/def@redis:6379"  (остаток как путь)                │
│                                                                     │
│  Результат: NOAUTH или Connection failed                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Зарезервированные символы в URL (RFC 3986)

| Символ | Назначение в URL | Требует кодирования в пароле |
|--------|------------------|------------------------------|
| `/` | Разделитель пути | **Да** |
| `@` | Разделитель credentials | **Да** |
| `:` | Разделитель port | **Да** (если не в конце) |
| `#` | Fragment identifier | **Да** |
| `?` | Query string start | **Да** |
| `%` | Кодирование символов | **Да** |
| `&` | Query separator | Да (рекомендуется) |
| `=` | Query assignment | Да (рекомендуется) |

### 2.4 Выявленные проблемы

| Файл | Строка | Проблема | Критичность |
|------|--------|----------|-------------|
| `docker-compose.yml` | 13 | REDIS_URL с незаэкранированным паролём | Critical |
| `docker-compose.dev.yml` | 15 | REDIS_URL с незаэкранированным паролём | Critical |
| `src/lib/redis.ts` | 9 | Нет обработки спецсимволов в пароле | High |
| `scripts/setup-redis-secret.sh` | - | Нет URL-кодирования пароля | High |

---

## 3. Функциональные требования

### 3.1 User Stories с Acceptance Criteria

#### US-001: Поддержка паролей со спецсимволами
**Как** DevOps инженер,  
**Я хочу**, чтобы Redis URL корректно работал с паролями, содержащими любые символы,  
**Чтобы** использовать криптографически стойкие пароли без ограничений.

**Acceptance Criteria**:
```
Given пароль Redis содержит символы / @ : # ? %
When формируется REDIS_URL
Then пароль URL-кодируется
And подключение к Redis успешно
And build проходит без ошибок
```

#### US-002: Обратная совместимость
**Как** разработчик,  
**Я хочу**, чтобы существующие конфигурации без спецсимволов продолжали работать,  
**Чтобы** не ломать работающие системы.

**Acceptance Criteria**:
```
Given REDIS_URL не содержит спецсимволов в пароле
When приложение подключается к Redis
Then подключение работает как раньше
And никаких изменений в поведении
```

---

## 4. Нефункциональные требования

### 4.1 Безопасность

| Требование | Значение | Обоснование |
|------------|----------|-------------|
| URL-кодирование | encodeURIComponent / printf %s | RFC 3986 |
| Длина пароля | Без ограничений | OWASP: ≥32 символа |
| Поддержка символов | Все ASCII + Unicode | Максимальная энтропия |

### 4.2 Надёжность
- **Graceful degradation**: при ошибке парсинга URL — понятное сообщение
- **Логирование**: информация о формате URL (без самого пароля)

---

## 5. Техническая архитектура

### 5.1 Решение: Раздельные переменные окружения

**Проблема с URL-кодированием в docker-compose:**
- Shell не имеет встроенной функции encodeURIComponent
- Сложно гарантировать корректное кодирование в YAML

**Рекомендуемое решение:**
Использовать раздельные переменные и формировать подключение программно:

```typescript
// src/lib/redis.ts
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  // ... остальные опции
});
```

### 5.2 Изменения в docker-compose.yml

```yaml
services:
  app:
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=/run/secrets/redis_password
    secrets:
      - redis_password
```

### 5.3 Альтернативное решение: URL-кодирование в скрипте

Если необходимо сохранить формат REDIS_URL:

```bash
# scripts/setup-redis-secret.sh
RAW_PASSWORD=$(openssl rand -base64 32)
# URL-кодирование для совместимости с redis:// URL
ENCODED_PASSWORD=$(printf '%s' "$RAW_PASSWORD" | jq -sRr @uri)
echo "$ENCODED_PASSWORD" > ./secrets/redis_password
```

### 5.4 Структура файлов

```
project/
├── docker-compose.yml        (ИЗМЕНЯЕТСЯ)
├── docker-compose.dev.yml    (ИЗМЕНЯЕТСЯ)
├── src/lib/redis.ts          (ИЗМЕНЯЕТСЯ)
├── .env.example              (ИЗМЕНЯЕТСЯ)
├── .env.dev                  (ИЗМЕНЯЕТСЯ)
└── scripts/
    └── setup-redis-secret.sh (ИЗМЕНЯЕТСЯ)
```

### 5.5 Переменные окружения

```bash
# .env.example (ИЗМЕНЯЕТСЯ)

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# DEPRECATED: Use separate REDIS_* variables instead
# REDIS_URL="redis://localhost:6379"
```

### 5.6 Интерфейсы/типы данных

```typescript
// src/types/redis.ts
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: number;
  enableOfflineQueue: boolean;
  keepAlive: number;
  connectTimeout: number;
  lazyConnect: boolean;
  retryStrategy: (times: number) => number | null;
}

interface RedisEnvConfig {
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;
  REDIS_URL?: string; // deprecated, for backward compatibility
}
```

---

## 6. Декомпозиция на задачи

### Backend

#### TASK-BCK-001: Рефакторинг Redis клиента
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 1 час  
**Зависимости**: Нет

**Описание**:
Изменить инициализацию Redis клиента для использования раздельных переменных окружения вместо REDIS_URL.

**Критерии приемки**:
- [ ] Redis клиент читает REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- [ ] Обратная совместимость: если REDIS_URL задан, используется он (с предупреждением)
- [ ] Пароль корректно передаётся без URL-кодирования
- [ ] Подключение с паролем, содержащим `/`, работает
- [ ] Логирование при ошибке подключения (без пароля)

**Технические детали**:
```typescript
// src/lib/redis.ts
import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  
  if (process.env.REDIS_URL) {
    console.warn(
      '[DEPRECATED] REDIS_URL is deprecated. Use REDIS_HOST, REDIS_PORT, REDIS_PASSWORD instead.'
    );
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      keepAlive: 10000,
      connectTimeout: 5000,
      lazyConnect: false,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 100, 2000);
      },
    });
  }

  return new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    keepAlive: 10000,
    connectTimeout: 5000,
    lazyConnect: false,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 100, 2000);
    },
  });
}

export const redis = globalForRedis.redis ?? createRedisClient();
globalForRedis.redis = redis;
```

---

### Infrastructure

#### TASK-INF-001: Обновить docker-compose.yml
**Направление**: Infrastructure  
**Приоритет**: Critical  
**Оценка**: 0.5 часа  
**Зависимости**: Нет

**Описание**:
Заменить REDIS_URL на раздельные переменные REDIS_HOST, REDIS_PORT, REDIS_PASSWORD.

**Критерии приемки**:
- [ ] REDIS_URL заменён на REDIS_HOST, REDIS_PORT
- [ ] REDIS_PASSWORD читается из секрета
- [ ] Приложение запускается корректно

**Технические детали**:
```yaml
# docker-compose.yml
services:
  app:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/fences
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    secrets:
      - redis_password
```

---

#### TASK-INF-002: Обновить docker-compose.dev.yml
**Направление**: Infrastructure  
**Приоритет**: Critical  
**Оценка**: 0.25 часа  
**Зависимости**: Нет

**Описание**:
Заменить REDIS_URL на раздельные переменные для development.

**Критерии приемки**:
- [ ] REDIS_URL заменён на REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- [ ] Redis работает с паролем из переменной

**Технические детали**:
```yaml
# docker-compose.dev.yml
services:
  app:
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}

  redis:
    command: redis-server --requirepass ${REDIS_PASSWORD}
```

---

#### TASK-INF-003: Обновить .env.example и .env.dev
**Направление**: Infrastructure  
**Приоритет**: High  
**Оценка**: 0.25 часа  
**Зависимости**: Нет

**Описание**:
Добавить новые переменные окружения в примеры конфигурации.

**Критерии приемки**:
- [ ] .env.example содержит REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- [ ] .env.dev обновлён
- [ ] Комментарии о deprecated REDIS_URL добавлены

**Технические детали**:
```bash
# .env.example

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# REDIS_URL is DEPRECATED - use separate variables above
# REDIS_URL="redis://localhost:6379"

# .env.dev
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=dev_redis_password_change_in_production
```

---

#### TASK-INF-004: Обновить скрипт генерации секрета
**Направление**: Infrastructure  
**Приоритет**: Medium  
**Оценка**: 0.25 часа  
**Зависимости**: Нет

**Описание**:
Убрать требование URL-кодирования из скрипта (больше не нужно при раздельных переменных).

**Критерии приемки**:
- [ ] Скрипт генерирует пароль как есть (без кодирования)
- [ ] Комментарии обновлены

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
# Генерация без URL-кодирования - пароль используется напрямую
openssl rand -base64 32 > "$SECRET_FILE"
chmod 600 "$SECRET_FILE"

echo "Redis password generated and saved to $SECRET_FILE"
echo "The password will be used directly (no URL encoding needed with REDIS_PASSWORD variable)"
echo "IMPORTANT: This file is in .gitignore and should never be committed"
```

---

### Testing

#### TASK-TST-001: Unit-тесты Redis клиента
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 1 час  
**Зависимости**: TASK-BCK-001

**Описание**:
Написать unit-тесты для проверки корректной обработки паролей со спецсимволами.

**Критерии приемки**:
- [ ] Тест: пароль с `/` работает
- [ ] Тест: пароль с `@` работает
- [ ] Тест: пароль с `:` работает
- [ ] Тест: пароль с `#` работает
- [ ] Тест: обратная совместимость с REDIS_URL
- [ ] Покрытие ≥80%

**Технические детали**:
```typescript
// src/lib/__tests__/redis.test.ts
describe('Redis Client', () => {
  describe('password handling', () => {
    it('should handle password with forward slash', () => {
      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_PORT = '6379';
      process.env.REDIS_PASSWORD = 'abc/def@ghi:jkl';
      // ... test
    });

    it('should fallback to REDIS_URL for backward compatibility', () => {
      delete process.env.REDIS_PASSWORD;
      process.env.REDIS_URL = 'redis://:password@localhost:6379';
      // ... test
    });
  });
});
```

---

#### TASK-TST-002: Integration-тесты с Redis
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-INF-001, TASK-BCK-001

**Описание**:
Проверить реальное подключение к Redis с паролем, содержащим спецсимволы.

**Критерии приемки**:
- [ ] Docker Compose запускается
- [ ] Redis требует аутентификацию
- [ ] Приложение подключается успешно
- [ ] PING возвращает PONG

**Технические детали**:
```bash
# Тест 1: Запуск с паролем, содержащим спецсимволы
export REDIS_PASSWORD="test/pass@word:123#456"
docker-compose -f docker-compose.dev.yml up -d

# Тест 2: Проверка подключения
docker exec fences-redis redis-cli -a "$REDIS_PASSWORD" PING
# Ожидается: PONG

# Тест 3: Проверка приложения
curl http://localhost:3000/api/health
# Ожидается: 200 OK
```

---

### Documentation

#### TASK-DOC-001: Обновить README.md
**Направление**: Documentation  
**Приоритет**: Medium  
**Оценка**: 0.25 часа  
**Зависимости**: TASK-INF-001, TASK-INF-002

**Описание**:
Обновить документацию с новыми переменными окружения для Redis.

**Критерии приемки**:
- [ ] Добавлены REDIS_HOST, REDIS_PORT, REDIS_PASSWORD в пример
- [ ] Указано, что REDIS_URL deprecated
- [ ] Пример пароля со спецсимволами

---

## 7. Тестирование

### 7.1 Unit-тесты

| ID | Описание | Входные данные | Ожидаемый результат |
|----|----------|----------------|---------------------|
| UT-001 | Пароль с `/` | `abc/def` | Подключение успешно |
| UT-002 | Пароль с `@` | `abc@def` | Подключение успешно |
| UT-003 | Пароль с `:` | `abc:def` | Подключение успешно |
| UT-004 | Пароль с `#` | `abc#def` | Подключение успешно |
| UT-005 | Пароль с `%` | `abc%def` | Подключение успешно |
| UT-006 | Пароль с `?` | `abc?def` | Подключение успешно |
| UT-007 | Комбинация | `a/b@c:d#e%f?g` | Подключение успешно |
| UT-008 | Обратная совместимость | REDIS_URL без спецсимволов | Подключение успешно |

### 7.2 Integration-тесты

| ID | Описание | Шаги | Ожидаемый результат |
|----|----------|------|---------------------|
| IT-001 | Docker Compose prod | 1. export REDIS_PASSWORD="test/pass"<br>2. docker-compose up -d<br>3. curl localhost:3001/api/health | 200 OK |
| IT-002 | Docker Compose dev | 1. export REDIS_PASSWORD="dev/pass"<br>2. docker-compose -f docker-compose.dev.yml up -d | Контейнеры запущены |
| IT-003 | Redis PING | docker exec fences-redis redis-cli -a "test/pass" PING | PONG |

### 7.3 Тестовые данные

```bash
# Пароли для тестирования (все должны работать)
TEST_PASSWORD_1="abc/def"              # Forward slash
TEST_PASSWORD_2="abc@def"              # At sign
TEST_PASSWORD_3="abc:def"              # Colon
TEST_PASSWORD_4="abc#def"              # Hash
TEST_PASSWORD_5="abc%def"              # Percent
TEST_PASSWORD_6="abc?def"              # Question mark
TEST_PASSWORD_7="abc&def=ghi"          # Ampersand and equals
TEST_PASSWORD_8="a/b@c:d#e%f?g&h=i"    # All combined
TEST_PASSWORD_9="dFut2dGIiV8frd95lqEbHGgrcbQp/c1NIr5dr7ROtc4="  # Реальный пример
```

---

## 8. Риски и зависимости

### 8.1 Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Обратная совместимость сломана | Low | High | Deprecation warning + fallback |
| Секреты в логах | Low | Critical | Не логировать пароль |
| Переменные не читаются | Low | High | Дефолтные значения |

### 8.2 Зависимости

| Зависимость | Тип | Статус | Комментарий |
|-------------|-----|--------|-------------|
| ioredis | NPM пакет | ✅ Установлен | Поддерживает объект конфигурации |
| Docker Compose | Infrastructure | ✅ Установлен | Поддерживает secrets |
| Node.js | Runtime | ✅ Установлен | process.env доступен |

---

## 9. Согласование

- [x] Заказчик
- [ ] DevOps
- [ ] Security

**Решение:** Раздельные переменные (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD) с обратной совместимостью REDIS_URL + warning.

---

## 10. Контрольный список перед разработкой

### Definition of Ready

- [ ] Понятны всем членам команды
- [ ] Можно протестировать
- [ ] Технически выполним
- [ ] Приносит ценность бизнесу (стабильность)
- [ ] Размер позволяет реализовать за 0.5 дня
- [ ] Зависимости идентифицированы
- [ ] Acceptance Criteria определены
- [ ] Утверждены стейкхолдерами

---

## 11. Порядок выполнения задач

```
TASK-BCK-001 (Redis клиент)
      ↓
TASK-INF-001 (docker-compose.yml) ──┐
TASK-INF-002 (docker-compose.dev.yml)│
TASK-INF-003 (.env файлы)            │
TASK-INF-004 (скрипт секрета)        │
      ↓                              │
TASK-TST-001 (Unit тесты) ←──────────┘
      ↓
TASK-TST-002 (Integration тесты)
      ↓
TASK-DOC-001 (README.md)
```

**Параллелизация:**
- TASK-INF-001, INF-002, INF-003, INF-004 — можно выполнять параллельно
- TASK-TST-001 — после BCK-001
- TASK-TST-002 — после INF-* и BCK-001

---

## 12. Временное решение (Workaround)

**Для немедленного разблокирования production:**

Сгенерировать новый пароль Redis БЕЗ спецсимволов `/`, `@`, `:`:

```bash
# Генерация пароля без спецсимволов (только alnum + _)
openssl rand -hex 32 | tr -d '/@:#?%&=' > ./secrets/redis_password
```

Или вручную отредактировать `secrets/redis_password`:
```bash
# Пример безопасного пароля без спецсимволов
echo "aB3dE7fG9hJ2kL5mN8pQ1rS4tU6vW0xY" > ./secrets/redis_password
chmod 600 ./secrets/redis_password
```

После применения — перезапустить:
```bash
docker-compose down && docker-compose up -d
```

> ⚠️ **Важно:** Это временное решение. После реализации ЧТЗ можно будет использовать любые пароли.

---

## 13. Откат (Rollback Plan)

При проблемах:

1. Откатить `src/lib/redis.ts` к использованию REDIS_URL
2. Временно использовать пароль без спецсимволов
3. Исследовать проблему
4. После исправления — вернуть раздельные переменные

```bash
# Временный обход (не для production!)
REDIS_PASSWORD="simplepasswordwithoutspecialchars"
```

---

## 14. Принятые решения

| Вопрос | Решение |
|--------|---------|
| Подход | Раздельные переменные (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD) |
| Обратная совместимость | Да, с deprecation warning |
| Критичность | Блокирует production |

---

*ЧТЗ создано для устранения критического сбоя сборки из-за некорректного формата Redis URL.*
