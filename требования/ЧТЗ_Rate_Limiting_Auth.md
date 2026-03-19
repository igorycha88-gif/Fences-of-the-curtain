# ЧТЗ: Rate Limiting на Auth Endpoints

## Версия: 1.0
## Дата: 2026-03-18
## Автор: AI-аналитик (ИБ)
## Приоритет: High
## Статус: Согласовано

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Защитить систему аутентификации от атак типа:
- **Brute Force** — перебор паролей
- **Credential Stuffing** — массовая подстановка утекших credentials
- **DoS** — исчерпание ресурсов БД через множественные запросы авторизации

Путём внедрения rate limiting с использованием sliding window алгоритма на базе Redis.

### 1.2 Пользовательская ценность
- **Безопасность**: Защита учётных записей от взлома
- **Доступность**: Предотвращение DoS атак на auth endpoint
- **Соответствие стандартам**: OWASP ASVS V2.2.1 (Rate Limiting)
- **Снижение рисков**: Минимизация успешных атак перебора паролей

### 1.3 Метрики успеха
- 100% запросов авторизации проходят через rate limiter
- Блокировка после 5 неудачных попыток за 15 минут
- Время проверки rate limit: < 10ms (Redis)
- 0 ложных срабатываний для легитимных пользователей
- Логирование всех заблокированных попыток

---

## 2. Анализ текущего состояния

### 2.1 Выявленные проблемы

| Файл | Строка | Проблема | Критичность |
|------|--------|----------|-------------|
| `src/lib/auth.ts` | 16-50 | Нет rate limiting в `authorize()` | High |
| `src/lib/auth.ts` | - | Нет защиты от brute force | High |
| `src/lib/auth.ts` | - | Нет валидации NEXTAUTH_SECRET при старте | Critical |
| `.env.example` | 4 | NEXTAUTH_SECRET содержит placeholder "your-super-secret-key-change-in-production" | High |
| `src/lib/` | - | Отсутствует модуль rate-limit.ts | High |
| `.env.example` | 2 | REDIS_URL определён, но не используется для rate limiting | Medium |

### 2.2 Схема потока данных (AS-IS)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ТЕКУЩЕЕ СОСТОЯНИЕ (НЕБЕЗОПАСНО)              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Злоумышленник]                                                    │
│       │                                                             │
│       │ for i in 1..10000:                                         │
│       │   POST /api/auth/callback/credentials                       │
│       │   { email: "admin@example.com", password: passwords[i] }   │
│       ▼                                                             │
│  [NextAuth: authorize()]                                            │
│       │                                                             │
│       │ ❌ НЕТ ПРОВЕРКИ RATE LIMIT                                  │
│       ▼                                                             │
│  [PostgreSQL: SELECT * FROM users WHERE email = ...]                │
│       │                                                             │
│       │ ⚠️ 10,000 запросов к БД                                     │
│       │ ⚠️ 10,000 bcrypt сравнений                                  │
│       │ ⚠️ Возможность перебора пароля                              │
│       ▼                                                             │
│  [БД перегружена / Пароль подобран]                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Схема потока данных (TO-BE)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ЦЕЛЕВОЕ СОСТОЯНИЕ (БЕЗОПАСНО)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Злоумышленник]                                                    │
│       │                                                             │
│       │ for i in 1..10000:                                         │
│       │   POST /api/auth/callback/credentials                       │
│       │   { email: "admin@example.com", password: passwords[i] }   │
│       ▼                                                             │
│  [NextAuth: authorize()]                                            │
│       │                                                             │
│       │ await checkRateLimit(ip, email)  ← ✅ RATE LIMIT CHECK      │
│       │                                                             │
│       ├─ Попытки 1-5: ALLOW (проверка пароля)                       │
│       │                                                             │
│       └─ Попытки 6+: BLOCK (возврат null без проверки пароля)       │
│                                                                     │
│  [Redis: Sliding Window]                                            │
│       │                                                             │
│       │ Ключ: "rate_limit:auth:{ip}:{email}"                        │
│       │ TTL: 900s (15 минут)                                        │
│       │ Счётчик попыток за скользящее окно                          │
│       ▼                                                             │
│  [Результат]                                                        │
│       │                                                             │
│       │ ✅ 5 попыток за 15 минут — максимум                         │
│       │ ✅ БД защищена от перегрузки                                │
│       │ ✅ Brute force неэффективен                                 │
│       │ ✅ Логирование заблокированных попыток                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 Сравнительная таблица атак

| Тип атаки | AS-IS (без защиты) | TO-BE (с rate limiting) |
|-----------|-------------------|------------------------|
| Brute Force (10,000 паролей) | 10,000 попыток | 5 попыток |
| Credential Stuffing (1000 credentials) | 1000 попыток | 5 попыток |
| DoS на auth endpoint | Безлимитно | 5 req/15min/IP+email |
| Время на взлом 8-символьного пароля | ~2.5 часа | ~3 года |

---

## 3. Функциональные требования

### 3.1 User Stories с Acceptance Criteria

#### US-001: Rate Limiting на попытки авторизации
**Как** система безопасности,  
**Я хочу** ограничить количество попыток авторизации до 5 за 15 минут,  
**Чтобы** предотвратить атаки перебора паролей.

**Acceptance Criteria**:
```
Given пользователь с IP "192.168.1.100" и email "admin@example.com"
When выполняется 6-я попытка авторизации за 15 минут
Then запрос отклоняется без проверки пароля
And возвращается null (ошибка авторизации)
And в логах фиксируется событие "Rate limit exceeded"
And счётчик попыток хранится в Redis с ключом "rate_limit:auth:192.168.1.100:admin@example.com"
And TTL ключа = 900 секунд (15 минут)
```

#### US-002: Sliding Window алгоритм
**Как** система безопасности,  
**Я хочу** использовать sliding window для подсчёта попыток,  
**Чтобы** обеспечить точный учёт попыток за последние 15 минут.

**Acceptance Criteria**:
```
Given пользователь совершил попытки авторизации:
  - Попытка 1: T-14min (14 минут назад)
  - Попытка 2: T-10min
  - Попытка 3: T-5min
  - Попытка 4: T-3min
  - Попытка 5: T-1min
When пользователь совершает попытку 6 в момент T
Then sliding window считает только попытки за последние 15 минут
And если T-14min уже > 15 минут назад, то попытка 1 не учитывается
And счётчик = 5 (попытки 2-6)
And запрос отклоняется
```

#### US-003: Комбинированный ключ (IP + Email)
**Как** система безопасности,  
**Я хочу** использовать комбинацию IP + email для rate limiting,  
**Чтобы** предотвратить обход через смену IP или email.

**Acceptance Criteria**:
```
Given два пользователя с одного IP:
  - User A: IP "192.168.1.100", email "admin@example.com"
  - User B: IP "192.168.1.100", email "manager@example.com"
When каждый совершает по 5 попыток авторизации
Then каждый имеет отдельный счётчик
And User A заблокирован для "admin@example.com"
And User B может продолжать попытки для "manager@example.com"
And ключи в Redis:
  - "rate_limit:auth:192.168.1.100:admin@example.com"
  - "rate_limit:auth:192.168.1.100:manager@example.com"
```

#### US-004: Автоматическая разблокировка
**Как** легитимный пользователь,  
**Я хочу**, чтобы блокировка автоматически снималась через 15 минут,  
**Чтобы** я мог повторить попытку авторизации после ожидания.

**Acceptance Criteria**:
```
Given пользователь заблокирован после 5 неудачных попыток
When прошло 15 минут с первой попытки
Then счётчик автоматически сбрасывается (TTL ключа истекает)
And пользователь может совершить новые 5 попыток
```

#### US-005: Логирование заблокированных попыток
**Как** администратор безопасности,  
**Я хочу** видеть логи заблокированных попыток авторизации,  
**Чтобы** выявлять атаки и анализировать инциденты.

**Acceptance Criteria**:
```
Given rate limit превышен для IP "192.168.1.100" и email "admin@example.com"
When выполняется заблокированная попытка авторизации
Then в консоль выводится лог:
  "[RATE LIMIT] Blocked: IP=192.168.1.100, Email=admin@example.com, Attempts=6"
And лог не содержит чувствительных данных (пароль)
And логируется только факт блокировки, не детали попытки
```

#### US-006: Graceful degradation при недоступности Redis
**Как** система,  
**Я хочу**, чтобы при недоступности Redis авторизация продолжала работать,  
**Чтобы** избежать полной остановки системы.

**Acceptance Criteria**:
```
Given Redis недоступен (connection refused)
When выполняется попытка авторизации
Then rate limiting пропускается (fail-open)
And в логах фиксируется warning: "[RATE LIMIT] Redis unavailable, skipping rate limit"
And авторизация продолжает работу без rate limiting
And пользователи могут авторизоваться
```

#### US-007: Валидация NEXTAUTH_SECRET при старте
**Как** система безопасности,  
**Я хочу**, чтобы приложение не запускалось без NEXTAUTH_SECRET,  
**Чтобы** предотвратить эксплуатацию с небезопасным секретом.

**Acceptance Criteria**:
```
Given NEXTAUTH_SECRET не задан или содержит placeholder
When приложение запускается
Then выбрасывается ошибка: "NEXTAUTH_SECRET is not defined or contains placeholder"
And приложение не запускается
And В логах фиксируется критическая ошибка
And Процесс завершается с кодом 1
```

**Дополнительные требования**:
- NEXTAUTH_SECRET должен быть сгенерирован командой: `openssl rand -base64 32`
- Длина секрета: минимум 32 символа
- В production секрет хранится в переменных окружения сервера (Vercel/Docker secrets), НЕ в файле .env
- .env файл добавлен в .gitignore

---

## 4. Нефункциональные требования

### 4.1 Производительность
- **Время проверки rate limit**: < 10ms (Redis in-memory)
- **Влияние на время авторизации**: увеличение не более 10ms
- **Нагрузка на Redis**: 1-2 команды на попытку авторизации
- **Память Redis**: ~100 bytes на активный ключ rate limit

### 4.2 Безопасность

#### 4.2.1 Защита от обхода rate limiting
| Вектор атаки | Защита |
|--------------|--------|
| Смена IP (TOR, proxies) | Комбинация IP + email |
| Смена email | Комбинация IP + email |
| Распределённая атака (ботнет) | Лимит на IP + email, мониторинг аномалий |
| Timing attack | Постоянное время ответа (не зависит от результата) |

#### 4.2.2 NEXTAUTH_SECRET требования
| Требование | Значение | Обоснование |
|------------|----------|-------------|
| Длина | ≥ 32 символа | OWASP рекомендация для JWT secret |
| Генерация | `openssl rand -base64 32` | Криптографически стойкий RNG |
| Хранение в dev | .env файл (в .gitignore) | Удобство разработки |
| Хранение в prod | Переменные окружения сервера | Безопасность (не коммитится в git) |
| Валидация | При старте приложения | Fail-fast при ошибке конфигурации |

**Запрещённые значения** (placeholders):
- `your-super-secret-key-change-in-production`
- `change-in-production`
- `secret`, `test`, `dev`

**Production deployment**:
- **Vercel**: Environment Variables → NEXTAUTH_SECRET
- **Docker**: `docker run -e NEXTAUTH_SECRET=...` или secrets
- **Kubernetes**: Secrets → монтируются как env vars
- **Никогда**: не хранить секрет в .env файле в production

#### 4.2.3 Конфиденциальность
- **Не логировать пароли** в логах rate limiting
- **Не логировать хеши** паролей
- **Логировать только**: IP, email, количество попыток, timestamp

### 4.3 Масштабируемость
- **Горизонтальное масштабирование**: Redis поддерживает cluster mode
- **Количество ключей**: O(количество активных IP+email комбинаций)
- **TTL автоматическая очистка**: ключи удаляются через 15 минут

### 4.4 Надёжность
- **Доступность**: 99.9% (зависит от Redis)
- **Graceful degradation**: fail-open при недоступности Redis
- **Отсутствие блокировок**: не блокирует авторизацию при ошибках Redis

---

## 5. Техническая архитектура

### 5.1 Структура файлов

```
src/lib/
├── rate-limit.ts (НОВЫЙ ФАЙЛ)
│   ├── Redis client initialization
│   ├── checkRateLimit(ip, email): Promise<boolean>
│   └── resetRateLimit(ip, email): Promise<void>
│
├── auth.ts (ИЗМЕНЯЕМЫЙ ФАЙЛ)
│   └── authorize()
│       ├── const ip = extractIP(request)
│       ├── const allowed = await checkRateLimit(ip, credentials.email)
│       ├── if (!allowed) return null
│       └── ... существующая логика ...
│
└── prisma.ts (БЕЗ ИЗМЕНЕНИЙ)
```

### 5.2 API спецификация

#### 5.2.1 getConfig()

```typescript
/**
 * Получает конфигурацию rate limiting из БД с кешированием
 * 
 * @returns конфигурация с maxAttempts и windowMs
 * 
 * @example
 * const config = await getConfig();
 * console.log(config.maxAttempts); // 5
 * console.log(config.windowMs);    // 900000 (15 минут)
 */
export async function getConfig(): Promise<RateLimitConfig>
```

**Логика кеширования:**
- Кеш в памяти с TTL 60 секунд
- При отсутствии записи в БД — использовать default значения
- При ошибке БД — вернуть default значения

#### 5.2.2 checkRateLimit()

```typescript
/**
 * Проверяет, разрешена ли попытка авторизации
 * 
 * @param ip - IP адрес клиента
 * @param email - Email пользователя
 * @returns true - разрешено, false - превышен лимит
 * 
 * @example
 * const allowed = await checkRateLimit('192.168.1.100', 'admin@example.com');
 * if (!allowed) {
 *   console.log('Rate limit exceeded');
 *   return null;
 * }
 */
export async function checkRateLimit(ip: string, email: string): Promise<boolean>
```

**Redis команды (sliding window):**
```redis
# 1. Получить конфигурацию из БД (кешируется 60s)
# config.maxAttempts = 5, config.windowMs = 900000

# 2. Получить текущее количество попыток
GET rate_limit:auth:{ip}:{email}

# 3. Если счётчик существует и >= config.maxAttempts:
# Возвратить false (заблокировано)

# 4. Иначе:
MULTI
INCR rate_limit:auth:{ip}:{email}
EXPIRE rate_limit:auth:{ip}:{email} (config.windowMs / 1000)
EXEC

# Возвратить true (разрешено)
```

#### 5.2.3 resetRateLimit()

```typescript
/**
 * Сбрасывает счётчик попыток (для тестирования)
 * 
 * @param ip - IP адрес клиента
 * @param email - Email пользователя
 */
export async function resetRateLimit(ip: string, email: string): Promise<void>
```

#### 5.2.4 updateConfig()

```typescript
/**
 * Обновляет конфигурацию rate limiting (для администратора)
 * 
 * @param maxAttempts - максимальное количество попыток
 * @param windowMs - окно времени в миллисекундах
 */
export async function updateConfig(maxAttempts: number, windowMs: number): Promise<void>
```

### 5.3 Интерфейсы/типы данных

```typescript
// src/lib/rate-limit.ts

interface RateLimitConfig {
  maxAttempts: number;      // 5
  windowMs: number;         // 900000 (15 минут в ms)
  keyPrefix: string;        // "rate_limit:auth"
}

interface RateLimitResult {
  allowed: boolean;
  attempts: number;
  resetAt: Date;
}

// Конфигурация по умолчанию
const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 минут
  keyPrefix: 'rate_limit:auth',
};
```

### 5.4 Извлечение IP адреса

```typescript
// src/lib/rate-limit.ts

/**
 * Извлекает реальный IP клиента с учётом прокси
 * 
 * Приоритет:
 * 1. X-Forwarded-For (первый IP в списке)
 * 2. X-Real-IP
 * 3. socket.remoteAddress
 */
function extractIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback (обычно undefined в Next.js middleware)
  return 'unknown';
}
```

### 5.5 Зависимости

| Пакет | Версия | Назначение | Статус |
|-------|--------|-----------|--------|
| `ioredis` | ^5.10.0 | Redis client | ✅ Уже установлен |
| `next` | 14.2.35 | NextRequest типы | ✅ Уже установлен |

### 5.6 Переменные окружения

```bash
# .env
REDIS_URL="redis://localhost:6379"

# .env.example (УЖЕ ЕСТЬ, не требует изменений)
REDIS_URL="redis://localhost:6379"
```

---

## 6. Декомпозиция на задачи

### Backend

#### TASK-BCK-000: Создать таблицу конфигурации RateLimitConfig
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 1 час  
**Зависимости**: Нет

**Описание**:
Создать Prisma схему для хранения конфигурации rate limiting с возможностью динамического изменения параметров без перезапуска приложения.

**Критерии приемки**:
- [ ] В `prisma/schema.prisma` добавлена модель `RateLimitConfig`
- [ ] Поля модели:
  - `id` (String, primary key, default "auth")
  - `maxAttempts` (Int, default 5)
  - `windowMs` (Int, default 900000 = 15 минут)
  - `updatedAt` (DateTime, auto-update)
- [ ] Создана миграция: `npx prisma migrate dev --name add_rate_limit_config`
- [ ] В seed добавлена запись с default значениями
- [ ] Миграция применена к БД

**Технические детали**:
- Файлы: `prisma/schema.prisma`, `prisma/seeds/seed.ts`
- SQL схема:
```sql
CREATE TABLE "RateLimitConfig" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'auth',
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "windowMs" INTEGER NOT NULL DEFAULT 900000,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "RateLimitConfig" ("id", "maxAttempts", "windowMs")
VALUES ('auth', 5, 900000);
```

---

#### TASK-BCK-001: Создать модуль rate-limit.ts
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 2.5 часа  
**Зависимости**: TASK-BCK-000

**Описание**:
Создать новый файл `src/lib/rate-limit.ts` с реализацией rate limiting на базе Redis с использованием sliding window алгоритма. Конфигурация (maxAttempts, windowMs) читается из БД.

**Критерии приемки**:
- [ ] Файл `src/lib/rate-limit.ts` создан
- [ ] Функция `checkRateLimit(ip, email)` реализована
- [ ] Функция `resetRateLimit(ip, email)` реализована
- [ ] Функция `getConfig()` читает конфигурацию из БД с кешированием (TTL 60s)
- [ ] Используется ioredis для подключения к Redis
- [ ] Sliding window алгоритм: параметры из БД (default: 5 попыток / 15 минут)
- [ ] Ключ в Redis: `rate_limit:auth:{ip}:{email}`
- [ ] TTL ключа: из конфигурации (windowMs / 1000)
- [ ] Graceful degradation при недоступности Redis (fail-open)
- [ ] Логирование блокировок в консоль
- [ ] Не логируются пароли и чувствительные данные

**Технические детали**:
- Файлы: `src/lib/rate-limit.ts`
- Зависимости: `ioredis@^5.10.0`, `@prisma/client`
- Переменная окружения: `REDIS_URL`
- Типы:
```typescript
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export async function getConfig(): Promise<RateLimitConfig>
export async function checkRateLimit(ip: string, email: string): Promise<boolean>
export async function resetRateLimit(ip: string, email: string): Promise<void>
```

---

#### TASK-BCK-002: Интегрировать rate limiting в authorize()
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 1.5 часа  
**Зависимости**: TASK-BCK-001

**Описание**:
Добавить проверку rate limiting в функцию `authorize()` в `src/lib/auth.ts` перед проверкой пароля.

**Критерии приемки**:
- [ ] В `authorize()` импортирована `checkRateLimit`
- [ ] Извлекается IP адрес из request (X-Forwarded-For / X-Real-IP)
- [ ] Вызывается `checkRateLimit(ip, credentials.email)` перед lookup пользователя
- [ ] Если rate limit превышен, возвращается `null` без проверки пароля
- [ ] Логируется факт блокировки: `[RATE LIMIT] Blocked: IP=..., Email=..., Attempts=...`
- [ ] Существующая логика авторизации не изменена (только добавлена проверка)
- [ ] При ошибке Redis — пропускать проверку (fail-open)

**Технические детали**:
- Файлы: `src/lib/auth.ts` (строки 16-50, функция `authorize`)
- Изменения:
```typescript
// Добавить в начало authorize()
import { checkRateLimit } from './rate-limit';

async authorize(credentials, req) {
  // 1. Проверка rate limit (НОВОЕ)
  const ip = extractIP(req);
  const allowed = await checkRateLimit(ip, credentials?.email);
  if (!allowed) {
    console.log('[RATE LIMIT] Blocked:', ip, credentials?.email);
    return null;
  }
  
  // 2. Существующая логика (БЕЗ ИЗМЕНЕНИЙ)
  if (!credentials?.email || !credentials?.password) { ... }
  ...
}
```

---

#### TASK-BCK-003: API для управления конфигурацией rate limiting
**Направление**: Backend  
**Приоритет**: Medium  
**Оценка**: 1 час  
**Зависимости**: TASK-BCK-000, TASK-BCK-001

**Описание**:
Создать административный API endpoint для просмотра и обновления конфигурации rate limiting.

**Критерии приемки**:
- [ ] Endpoint `GET /api/admin/rate-limit/config` возвращает текущую конфигурацию
- [ ] Endpoint `PUT /api/admin/rate-limit/config` обновляет конфигурацию
- [ ] Доступ только для роли `admin`
- [ ] Валидация параметров: maxAttempts (1-100), windowMs (60000-3600000)
- [ ] После обновления конфигурации кеш очищается
- [ ] Логируется изменение конфигурации

**Технические детали**:
- Файлы: `src/app/api/admin/rate-limit/config/route.ts`
- Типы:
```typescript
// GET /api/admin/rate-limit/config
// Response: { maxAttempts: number, windowMs: number, updatedAt: string }

// PUT /api/admin/rate-limit/config
// Request: { maxAttempts: number, windowMs: number }
// Response: { success: boolean }
```

---

#### TASK-BCK-004: Валидация NEXTAUTH_SECRET при старте
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 0.5 часа  
**Зависимости**: Нет

**Описание**:
Добавить валидацию NEXTAUTH_SECRET в `src/lib/auth.ts` при инициализации модуля. Приложение не должно запускаться без валидного секрета.

**Критерии приемки**:
- [ ] В начале `src/lib/auth.ts` добавлена валидация NEXTAUTH_SECRET
- [ ] Проверка: секрет существует и не пустой
- [ ] Проверка: секрет не содержит placeholder ("your-super-secret", "change-in-production")
- [ ] Проверка: длина секрета >= 32 символа
- [ ] При невалидном секрете выбрасывается Error с понятным сообщением
- [ ] Приложение не запускается без валидного секрета (fail-fast)
- [ ] .env файл содержит комментарий с инструкцией генерации секрета

**Технические детали**:
- Файлы: `src/lib/auth.ts` (начало файла, до authOptions)
- Код валидации:
```typescript
// src/lib/auth.ts - В НАЧАЛЕ ФАЙЛА

const PLACEHOLDER_VALUES = [
  'your-super-secret-key-change-in-production',
  'change-in-production',
  'your-super-secret',
  'secret',
  'test',
];

function validateNextAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET is not defined. Generate one with: openssl rand -base64 32'
    );
  }
  
  if (secret.length < 32) {
    throw new Error(
      'NEXTAUTH_SECRET must be at least 32 characters long. ' +
      `Current length: ${secret.length}. Generate with: openssl rand -base64 32`
    );
  }
  
  for (const placeholder of PLACEHOLDER_VALUES) {
    if (secret.toLowerCase().includes(placeholder.toLowerCase())) {
      throw new Error(
        `NEXTAUTH_SECRET contains placeholder "${placeholder}". ` +
        'Generate a real secret with: openssl rand -base64 32'
      );
    }
  }
}

// Валидация при загрузке модуля
validateNextAuthSecret();

export const authOptions: NextAuthOptions = {
  // ... existing code
};
```

**Обновление .env.example**:
```bash
# .env.example

# NextAuth.js Secret (REQUIRED)
# Generate with: openssl rand -base64 32
# IMPORTANT: Use a real secret in production, never commit secrets to git!
NEXTAUTH_SECRET="REPLACE_WITH_REAL_SECRET_RUN_openssl_rand_-base64_32"

# В production используйте переменные окружения сервера:
# - Vercel: Environment Variables в настройках проекта
# - Docker: docker-compose secrets или -e flag
# - Kubernetes: Secrets
```

---

### Testing

#### TASK-TST-001: Unit-тесты для rate-limit.ts
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 2 часа  
**Зависимости**: TASK-BCK-001

**Описание**:
Написать unit-тесты для модуля `src/lib/rate-limit.ts` с использованием jest и mock Redis.

**Критерии приемки**:
- [ ] Файл `__tests__/rate-limit.test.ts` создан
- [ ] Покрытие кода ≥ 80%
- [ ] Тестовые сценарии:
  - [ ] `getConfig()` возвращает конфигурацию из БД
  - [ ] `getConfig()` кеширует результат на 60 секунд
  - [ ] `getConfig()` возвращает default при ошибке БД
  - [ ] `checkRateLimit()` разрешает первые N попыток (N из конфигурации)
  - [ ] `checkRateLimit()` блокирует (N+1)-ю попытку
  - [ ] `checkRateLimit()` использует sliding window (windowMs из конфигурации)
  - [ ] `checkRateLimit()` формирует правильный ключ Redis
  - [ ] `checkRateLimit()` устанавливает TTL из конфигурации
  - [ ] `checkRateLimit()` graceful degradation при ошибке Redis
  - [ ] `resetRateLimit()` сбрасывает счётчик
  - [ ] `updateConfig()` обновляет конфигурацию в БД
  - [ ] Разные IP+email комбинации имеют независимые счётчики

**Технические детали**:
- Файлы: `__tests__/rate-limit.test.ts`
- Зависимости: `jest`, `@jest/globals`
- Mock: `ioredis` (использовать jest.mock)

---

#### TASK-TST-002: Integration-тесты для authorize() с rate limiting
**Направление**: Testing  
**Приоритет**: Medium  
**Оценка**: 1.5 часа  
**Зависимости**: TASK-BCK-002, TASK-TST-001

**Описание**:
Написать integration-тесты для проверки rate limiting в функции `authorize()`.

**Критерии приемки**:
- [ ] Файл `__tests__/auth-rate-limit.test.ts` создан
- [ ] Тестовые сценарии:
  - [ ] 5 успешных попыток авторизации разрешены
  - [ ] 6-я попытка отклоняется без проверки пароля
  - [ ] После ожидания 15 минут счётчик сбрасывается
  - [ ] Разные пользователи с одного IP имеют независимые лимиты
  - [ ] При недоступности Redis авторизация продолжает работать
  - [ ] Логируются заблокированные попытки

**Технические детали**:
- Файлы: `__tests__/auth-rate-limit.test.ts`
- Зависимости: `jest`, `@jest/globals`
- Mock: `ioredis`, `prisma`

---

#### TASK-TST-003: Ручное тестирование rate limiting
**Направление**: Testing  
**Приоритет**: Medium  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-BCK-001, TASK-BCK-002

**Описание**:
Выполнить ручное тестирование rate limiting на локальном окружении.

**Критерии приемки**:
- [ ] Redis запущен (docker или локально)
- [ ] Выполнено 5 попыток авторизации с одним IP+email
- [ ] 6-я попытка отклонена
- [ ] В логах видно сообщение о блокировке
- [ ] Проверены ключи в Redis (`redis-cli KEYS "rate_limit:auth:*"`)
- [ ] После 15 минут счётчик сбросился
- [ ] Тестовый сценарий задокументирован

**Технические детали**:
- Команда проверки Redis: `redis-cli GET rate_limit:auth:192.168.1.100:admin@example.com`
- Команда просмотра TTL: `redis-cli TTL rate_limit:auth:192.168.1.100:admin@example.com`

---

### Documentation

#### TASK-DOC-001: Обновить ARCHITECTURE.md
**Направление**: Documentation  
**Приоритет**: Low  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-BCK-001, TASK-BCK-002

**Описание**:
Добавить описание модуля rate limiting в архитектурную документацию.

**Критерии приемки**:
- [ ] В `ARCHITECTURE.md` добавлен раздел "Rate Limiting"
- [ ] Описан алгоритм sliding window
- [ ] Указаны параметры: 5 попыток, 15 минут
- [ ] Добавлена диаграмма потока данных (Mermaid)
- [ ] Указана зависимость от Redis

---

#### TASK-DOC-002: Обновить README.md
**Направление**: Documentation  
**Приоритет**: Low  
**Оценка**: 0.25 часа  
**Зависимости**: TASK-BCK-001

**Описание**:
Добавить информацию о rate limiting в README.md в раздел "Безопасность".

**Критерии приемки**:
- [ ] В `README.md` в разделе "Безопасность" добавлена информация о rate limiting
- [ ] Указано: 5 попыток за 15 минут
- [ ] Указана зависимость от Redis
- [ ] Описано поведение при недоступности Redis (fail-open)

---

## 7. Тестирование

### 7.1 Unit-тесты

**Файл**: `__tests__/rate-limit.test.ts`

```typescript
import { checkRateLimit, resetRateLimit, getConfig, updateConfig } from '@/lib/rate-limit';
import Redis from 'ioredis';
import { prisma } from '@/lib/prisma';

// Mock Redis
jest.mock('ioredis');
jest.mock('@/lib/prisma');

describe('Rate Limiting', () => {
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      del: jest.fn(),
      multi: jest.fn(() => ({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      })),
    } as any;
    
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedis);
    
    // Mock Prisma для конфигурации
    (prisma.rateLimitConfig.findUnique as jest.Mock).mockResolvedValue({
      id: 'auth',
      maxAttempts: 5,
      windowMs: 900000,
      updatedAt: new Date(),
    });
  });

  describe('getConfig', () => {
    it('should return config from database', async () => {
      const config = await getConfig();
      
      expect(config.maxAttempts).toBe(5);
      expect(config.windowMs).toBe(900000);
    });

    it('should cache config for 60 seconds', async () => {
      await getConfig();
      await getConfig();
      
      expect(prisma.rateLimitConfig.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return defaults on database error', async () => {
      (prisma.rateLimitConfig.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
      
      const config = await getConfig();
      
      expect(config.maxAttempts).toBe(5);
      expect(config.windowMs).toBe(900000);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first attempt', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);
      
      const result = await checkRateLimit('192.168.1.100', 'admin@example.com');
      
      expect(result).toBe(true);
      expect(mockRedis.incr).toHaveBeenCalledWith(
        'rate_limit:auth:192.168.1.100:admin@example.com'
      );
    });

    it('should block 6th attempt (default config)', async () => {
      mockRedis.get.mockResolvedValue('5');
      
      const result = await checkRateLimit('192.168.1.100', 'admin@example.com');
      
      expect(result).toBe(false);
      expect(mockRedis.incr).not.toHaveBeenCalled();
    });

    it('should use custom maxAttempts from config', async () => {
      (prisma.rateLimitConfig.findUnique as jest.Mock).mockResolvedValue({
        id: 'auth',
        maxAttempts: 3,
        windowMs: 600000, // 10 минут
        updatedAt: new Date(),
      });
      
      mockRedis.get.mockResolvedValue('3');
      
      const result = await checkRateLimit('192.168.1.100', 'admin@example.com');
      
      expect(result).toBe(false);
    });

    it('should set TTL from config', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);
      
      await checkRateLimit('192.168.1.100', 'admin@example.com');
      
      expect(mockRedis.expire).toHaveBeenCalledWith(
        'rate_limit:auth:192.168.1.100:admin@example.com',
        900 // windowMs / 1000
      );
    });

    it('should use different keys for different IPs', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      await checkRateLimit('192.168.1.100', 'admin@example.com');
      await checkRateLimit('192.168.1.101', 'admin@example.com');
      
      expect(mockRedis.incr).toHaveBeenCalledTimes(2);
      expect(mockRedis.incr).toHaveBeenNthCalledWith(
        1,
        'rate_limit:auth:192.168.1.100:admin@example.com'
      );
      expect(mockRedis.incr).toHaveBeenNthCalledWith(
        2,
        'rate_limit:auth:192.168.1.101:admin@example.com'
      );
    });

    it('should fail-open on Redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Connection refused'));
      
      const result = await checkRateLimit('192.168.1.100', 'admin@example.com');
      
      expect(result).toBe(true); // Fail-open
    });
  });

  describe('resetRateLimit', () => {
    it('should delete rate limit key', async () => {
      await resetRateLimit('192.168.1.100', 'admin@example.com');
      
      expect(mockRedis.del).toHaveBeenCalledWith(
        'rate_limit:auth:192.168.1.100:admin@example.com'
      );
    });
  });

  describe('updateConfig', () => {
    it('should update config in database', async () => {
      (prisma.rateLimitConfig.update as jest.Mock).mockResolvedValue({
        id: 'auth',
        maxAttempts: 10,
        windowMs: 1800000,
        updatedAt: new Date(),
      });
      
      await updateConfig(10, 1800000);
      
      expect(prisma.rateLimitConfig.update).toHaveBeenCalledWith({
        where: { id: 'auth' },
        data: { maxAttempts: 10, windowMs: 1800000 },
      });
    });

    it('should clear config cache after update', async () => {
      await getConfig(); // Fill cache
      await updateConfig(10, 1800000);
      await getConfig(); // Should fetch from DB again
      
      expect(prisma.rateLimitConfig.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
```

### 7.2 Integration-тесты

**Файл**: `__tests__/auth-rate-limit.test.ts`

```typescript
import { authorize } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/rate-limit');
jest.mock('@/lib/prisma');
jest.mock('@/lib/password', () => ({
  compare: jest.fn(() => Promise.resolve(true)),
}));

describe('Auth with Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow 5 attempts', async () => {
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      password: 'hashed',
      active: true,
    });

    for (let i = 0; i < 5; i++) {
      const result = await authorize(
        { email: 'admin@example.com', password: 'password' },
        {} as any
      );
      expect(result).not.toBeNull();
    }

    expect(checkRateLimit).toHaveBeenCalledTimes(5);
  });

  it('should block 6th attempt', async () => {
    (checkRateLimit as jest.Mock).mockResolvedValue(false);

    const result = await authorize(
      { email: 'admin@example.com', password: 'password' },
      {} as any
    );

    expect(result).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should work when Redis is unavailable', async () => {
    (checkRateLimit as jest.Mock).mockRejectedValue(new Error('Redis error'));
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      password: 'hashed',
      active: true,
    });

    const result = await authorize(
      { email: 'admin@example.com', password: 'password' },
      {} as any
    );

    expect(result).not.toBeNull();
  });
});
```

### 7.3 Тестовые данные

**Redis команды для тестирования:**

```bash
# Просмотр всех ключей rate limit
redis-cli KEYS "rate_limit:auth:*"

# Получить значение счётчика
redis-cli GET "rate_limit:auth:192.168.1.100:admin@example.com"

# Проверить TTL ключа
redis-cli TTL "rate_limit:auth:192.168.1.100:admin@example.com"

# Сбросить счётчик вручную
redis-cli DEL "rate_limit:auth:192.168.1.100:admin@example.com"

# Сбросить все счётчики (ОСТОРОЖНО!)
redis-cli KEYS "rate_limit:auth:*" | xargs redis-cli DEL
```

---

## 8. Риски и зависимости

### 8.1 Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Redis недоступен | Medium | Medium | Fail-open: пропускать rate limit при ошибке |
| Ложные срабатывания | Low | Medium | Мониторинг, возможность ручного сброса |
| Распределённые атаки (ботнет) | Low | High | Дополнительный мониторинг аномалий |
| Увеличение latency | Low | Low | Redis in-memory < 10ms |
| Исчерпание памяти Redis | Low | Medium | TTL auto-cleanup, мониторинг памяти |

### 8.2 Зависимости

| Зависимость | Тип | Статус | Комментарий |
|-------------|-----|--------|-------------|
| ioredis | NPM пакет | ✅ Установлен | Версия ^5.10.0 |
| Redis сервер | Infrastructure | ✅ Развёрнут | Docker (согласовано с заказчиком) |
| REDIS_URL | Env variable | ✅ Определена | В .env.example |
| NextRequest | Next.js type | ✅ Доступен | Для извлечения IP |

### 8.3 Предположения

- Redis развёрнут в Docker (подтверждено заказчиком)
- X-Forwarded-For заголовок корректно устанавливается load balancer'ом
- Легитимные пользователи не совершают более 5 неудачных попыток за 15 минут

---

## 9. Согласование

- [x] Заказчик: Требования согласованы
- [x] Техлид: Архитектура согласована
- [x] DevOps: Redis инфраструктура подготовлена (Docker)
- [x] Security: Подход к rate limiting одобрен

---

## 10. Открытые вопросы

### ✅ Вопрос 1: Динамическая настройка лимитов
**Решение**: Конфигурация в БД (таблица RateLimitConfig)

**Реализация**:
- Таблица `RateLimitConfig` с полями: `id`, `maxAttempts`, `windowMs`, `updatedAt`
- Кеширование конфигурации в памяти (TTL 60s) для избежания лишних запросов к БД
- Возможность изменения параметров через административный интерфейс (future)

### ✅ Вопрос 2: Whitelist для IP
**Решение**: Нет whitelist

**Обоснование**: Единые правила для всех IP-адресов обеспечивает:
- Простоту поддержки
- Отсутствие лазеек для злоумышленников
- Предсказуемое поведение системы

### Вопрос 3: Разные лимиты для разных endpoint'ов
**Вопрос**: Нужны ли разные лимиты для разных auth endpoint'ов (login, password reset, etc.)?

**Текущий scope**: Только `authorize()` в `src/lib/auth.ts`

**Рекомендация**: Реализовать для login, расширить на другие endpoint'ы при необходимости

---

## 11. Контрольный список перед разработкой

### Definition of Ready

- [x] Понятны всем членам команды
- [x] Можно протестировать
- [x] Технически выполним
- [x] Приносит ценность бизнесу (безопасность)
- [x] Размер позволяет реализовать за 1-2 дня
- [x] Зависимости идентифицированы (ioredis, Redis)
- [x] Acceptance Criteria определены
- [x] Утверждены стейкхолдерами

### Красные флаги (ЧТЗ НЕ готово)

- [x] ~~"Реализовать красиво" без конкретики~~ — Конкретные требования
- [x] ~~Отсутствие Acceptance Criteria~~ — 6 User Stories с AC
- [x] ~~Задача "Реализовать всё" без декомпозиции~~ — 8 атомарных задач
- [x] ~~Нет указания на конкретные файлы~~ — Файлы указаны
- [x] ~~Нет тестовых сценариев~~ — 3 задачи на тестирование
- [x] ~~Нет согласования с заказчиком~~ — Согласовано

---

## 12. Метрики после внедрения

### KPI для оценки эффективности

| Метрика | Целевое значение | Способ измерения |
|---------|------------------|------------------|
| % запросов с rate limiting | 100% | Логи |
| Заблокированные попытки/день | < 10 (норма) | Логи |
| Ложные срабатывания | 0 | Обращения пользователей |
| Latency авторизации | < 200ms | APM |
| Доступность Redis | 99.9% | Monitoring |

---

**Документ готов к согласованию и передаче в разработку.**
