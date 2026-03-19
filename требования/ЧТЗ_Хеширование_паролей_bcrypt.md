# ЧТЗ: Хеширование паролей — bcrypt

## Версия: 1.0
## Дата: 2026-03-18
## Автор: AI-аналитик
## Приоритет: Critical
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Устранить критическую уязвимость информационной безопасности — хранение паролей в открытом виде (plaintext). Пароли должны быть хешированы с использованием алгоритма bcrypt.

### 1.2 Пользовательская ценность
- **Безопасность**: Защита учётных данных пользователей при утечке БД
- **Соответствие стандартам**: OWASP, PCI DSS, ГОСТ Р 57580-2017
- **Снижение рисков**: Минимизация ущерба при компрометации БД

### 1.3 Метрики успеха
- 100% паролей в БД хешированы bcrypt
- Время проверки пароля: < 200ms (cost=10)
- 0 пользователей с plaintext паролями после миграции

---

## 2. Анализ текущего состояния

### 2.1 Выявленные проблемы

| Файл | Строка | Проблема | Критичность |
|------|--------|----------|-------------|
| `src/lib/auth.ts` | 32 | Plaintext сравнение `user.password === credentials.password` | Critical |
| `prisma/seeds/seed.ts` | 15, 27 | Plaintext пароли `'admin123'`, `'manager123'` | Critical |
| `src/services/admin/usersService.ts` | 76-79 | `createUser()` не хеширует пароль | Critical |
| `src/services/admin/usersService.ts` | 95-100 | `updateUserPassword()` не хеширует пароль | Critical |
| `src/app/api/admin/users/route.ts` | 46 | API создаёт пользователей с plaintext | Critical |
| `__tests__/auth.test.ts` | 168 | Тесты используют plaintext сравнение | Medium |

### 2.2 Схема потока данных (AS-IS)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ТЕКУЩЕЕ СОСТОЯНИЕ (НЕБЕЗОПАСНО)              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Login Page]                                                       │
│       │                                                             │
│       ▼                                                             │
│  POST /api/auth/callback/credentials                                │
│       │                                                             │
│       ▼                                                             │
│  auth.ts:authorize()                                                │
│       │                                                             │
│       │ user.password === credentials.password  ← PLAINTEXT         │
│       ▼                                                             │
│  [БД: password = "admin123"]  ← PLAINTEXT                           │
│                                                                     │
│  [Admin: Create User]                                               │
│       │                                                             │
│       ▼                                                             │
│  POST /api/admin/users { password: "plain" }  ← PLAINTEXT           │
│       │                                                             │
│       ▼                                                             │
│  usersService.createUser({ password: "plain" })  ← PLAINTEXT        │
│       │                                                             │
│       ▼                                                             │
│  [БД: password = "plain"]  ← PLAINTEXT                              │
│                                                                     │
│  [Seed]                                                             │
│       │                                                             │
│       ▼                                                             │
│  prisma.user.create({ password: "admin123" })  ← PLAINTEXT          │
│       │                                                             │
│       ▼                                                             │
│  [БД: password = "admin123"]  ← PLAINTEXT                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Схема потока данных (TO-BE)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ЦЕЛЕВОЕ СОСТОЯНИЕ (БЕЗОПАСНО)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Login Page]                                                       │
│       │                                                             │
│       ▼                                                             │
│  POST /api/auth/callback/credentials                                │
│       │                                                             │
│       ▼                                                             │
│  auth.ts:authorize()                                                │
│       │                                                             │
│       │ await compare(password, user.password)  ← BCRYPT            │
│       ▼                                                             │
│  [БД: password = "$2b$10$..."]  ← BCRYPT HASH                       │
│                                                                     │
│  [Admin: Create User]                                               │
│       │                                                             │
│       ▼                                                             │
│  POST /api/admin/users { password: "plain" }                        │
│       │                                                             │
│       ▼                                                             │
│  usersService.createUser({ password: await hash("plain") })         │
│       │                                                             │
│       ▼                                                             │
│  [БД: password = "$2b$10$..."]  ← BCRYPT HASH                       │
│                                                                     │
│  [Seed]                                                             │
│       │                                                             │
│       ▼                                                             │
│  prisma.user.create({ password: await hash("admin123") })           │
│       │                                                             │
│       ▼                                                             │
│  [БД: password = "$2b$10$..."]  ← BCRYPT HASH                       │
│                                                                     │
│  [Migration Script]                                                 │
│       │                                                             │
│       ▼                                                             │
│  Для каждого user: password = await hash(password)                  │
│       │                                                             │
│       ▼                                                             │
│  [БД: ВСЕ пароли хешированы]                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Функциональные требования

### 3.1 User Stories с Acceptance Criteria

#### US-1: Безопасное хеширование паролей
**Как** система безопасности,  
**Я хочу** хешировать все пароли алгоритмом bcrypt с cost=10,  
**Чтобы** защитить учётные данные при утечке БД.

**Acceptance Criteria**:
```
Given пароль пользователя "admin123"
When выполняется хеширование
Then результат соответствует формату bcrypt: "$2b$10$[22 символа salt][31 символ hash]"
And длина хеша = 60 символов
And время выполнения < 200ms
And одинаковые пароли дают разные хеши (благодаря salt)
```

#### US-2: Безопасная проверка паролей
**Как** система аутентификации,  
**Я хочу** безопасно проверять пароли с помощью bcrypt.compare(),  
**Чтобы** аутентифицировать пользователей.

**Acceptance Criteria**:
```
Given пользователь вводит пароль
And в БД хранится bcrypt-хеш
When вызывается compare(plaintext, hash)
Then возвращается true если пароль совпадает
And возвращается false если пароль не совпадает
And время выполнения постоянно (защита от timing attack)
```

#### US-3: Миграция существующих пользователей
**Как** администратор системы,  
**Я хочу** мигрировать все существующие plaintext пароли в bcrypt-хеши,  
**Чтобы** закрыть уязвимость для всех пользователей.

**Acceptance Criteria**:
```
Given в БД есть пользователи с plaintext паролями
When запускается скрипт миграции
Then все plaintext пароли хешируются bcrypt
And скрипт пропускает уже хешированные пароли (isHashed check)
And скрипт логирует количество обработанных пользователей
And скрипт создаёт бэкап таблицы User перед изменениями
And скрипт поддерживает rollback
```

#### US-4: Создание пользователя с хешированным паролем
**Как** администратор,  
**Я хочу** создавать пользователей через API с автоматическим хешированием пароля,  
**Чтобы** новые пользователи были защищены.

**Acceptance Criteria**:
```
Given POST /api/admin/users { email, password, ... }
When запрос обрабатывается
Then пароль хешируется перед сохранением
And в БД сохраняется bcrypt-хеш
And ответ НЕ содержит пароль (ни plaintext, ни hash)
```

#### US-5: Обновление пароля пользователя
**Как** администратор,  
**Я хочу** обновлять пароли пользователей с автоматическим хешированием,  
**Чтобы** новые пароли были защищены.

**Acceptance Criteria**:
```
Given updateUserPassword(userId, newPassword)
When метод вызывается
Then пароль хешируется перед сохранением
And в БД сохраняется bcrypt-хеш
```

#### US-6: Seed с хешированными паролями
**Как** разработчик,  
**Я хочу** чтобы seed создавал пользователей с хешированными паролями,  
**Чтобы** dev/staging окружения были безопасными.

**Acceptance Criteria**:
```
Given npm run db:seed
When seed выполняется
Then пользователи создаются с bcrypt-хешированными паролями
And можно войти с указанными паролями (admin123, manager123)
```

---

## 4. Нефункциональные требования

### 4.1 Безопасность

| Требование | Значение | Обоснование |
|------------|----------|-------------|
| Алгоритм хеширования | bcrypt | OWASP рекомендация |
| Cost factor (salt rounds) | 10 | Баланс безопасности/производительности |
| Длина salt | 128 бит (встроено в bcrypt) | Автоматически генерируется |
| Длина хеша | 184 бита (встроено в bcrypt) | 60 символов в формате $2b$ |

### 4.2 Производительность

| Операция | Целевое время |
|----------|---------------|
| Хеширование (hash) | < 200ms |
| Проверка (compare) | < 200ms |
| Миграция 1000 пользователей | < 5 минут |

### 4.3 Совместимость

- bcryptjs — чистая JS реализация (без нативных зависимостей)
- Совместимость с Next.js 14, Node.js 18+
- Формат хеша: `$2b$10$[22 символа][31 символ]`

---

## 5. Техническая архитектура

### 5.1 Новые зависимости

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6"
  }
}
```

### 5.2 Интерфейсы/типы данных

```typescript
// src/lib/password.ts

export interface PasswordOptions {
  cost?: number;
}

export const DEFAULT_COST = 10;

export async function hash(password: string, options?: PasswordOptions): Promise<string>;

export async function compare(password: string, hash: string): Promise<boolean>;

export function isHashed(value: string): boolean;
```

### 5.3 Структура файлов

```
src/
├── lib/
│   └── password.ts                    # НОВЫЙ: утилиты хеширования
├── lib/
│   └── auth.ts                        # ИЗМЕНИТЬ: bcrypt.compare()
├── services/admin/
│   └── usersService.ts                # ИЗМЕНИТЬ: hash() в createUser, updateUserPassword
├── app/api/admin/users/
│   └── route.ts                       # ИЗМЕНИТЬ: hash() перед createUser
prisma/
├── seeds/
│   └── seed.ts                        # ИЗМЕНИТЬ: hash() паролей
├── migrations/
│   └── hash-existing-passwords.ts     # НОВЫЙ: скрипт миграции
__tests__/
├── auth.test.ts                       # ИЗМЕНИТЬ: bcrypt тесты
├── lib/
│   └── password.test.ts               # НОВЫЙ: тесты password.ts
```

### 5.4 API изменений

#### src/lib/password.ts (НОВЫЙ)

```typescript
import bcrypt from 'bcryptjs';

export const DEFAULT_COST = 10;

export async function hash(password: string, cost: number = DEFAULT_COST): Promise<string> {
  return bcrypt.hash(password, cost);
}

export async function compare(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function isHashed(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}
```

#### src/lib/auth.ts (ИЗМЕНЕНИЕ)

```typescript
// ДО:
const passwordMatch = user.password === credentials.password;

// ПОСЛЕ:
import { compare } from '@/lib/password';
const passwordMatch = await compare(credentials.password, user.password);
```

#### src/services/admin/usersService.ts (ИЗМЕНЕНИЕ)

```typescript
// ДО:
async createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data });
}

async updateUserPassword(id: string, newPassword: string) {
  return prisma.user.update({
    where: { id },
    data: { password: newPassword },
  });
}

// ПОСЛЕ:
import { hash } from '@/lib/password';

async createUser(data: Prisma.UserCreateInput) {
  const hashedPassword = data.password ? await hash(data.password) : undefined;
  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });
}

async updateUserPassword(id: string, newPassword: string) {
  const hashedPassword = await hash(newPassword);
  return prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
}
```

#### prisma/seeds/seed.ts (ИЗМЕНЕНИЕ)

```typescript
// ДО:
await prisma.user.upsert({
  where: { email: 'admin@fences.ru' },
  update: {},
  create: {
    email: 'admin@fences.ru',
    password: 'admin123',
    ...
  },
});

// ПОСЛЕ:
import { hash } from '../../src/lib/password';

const adminPasswordHash = await hash('admin123');
await prisma.user.upsert({
  where: { email: 'admin@fences.ru' },
  update: {},
  create: {
    email: 'admin@fences.ru',
    password: adminPasswordHash,
    ...
  },
});
```

#### prisma/migrations/hash-existing-passwords.ts (НОВЫЙ)

```typescript
import { PrismaClient } from '@prisma/client';
import { hash, isHashed } from '../../src/lib/password';

const prisma = PrismaClient();

async function main() {
  console.log('Starting password migration...');
  
  const users = await prisma.user.findMany({
    select: { id: true, email: true, password: true },
  });
  
  let migrated = 0;
  let skipped = 0;
  
  for (const user of users) {
    if (isHashed(user.password)) {
      console.log(`[SKIP] ${user.email} - already hashed`);
      skipped++;
      continue;
    }
    
    const hashedPassword = await hash(user.password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    
    console.log(`[MIGRATED] ${user.email}`);
    migrated++;
  }
  
  console.log(`\nMigration complete:`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total: ${users.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 6. Декомпозиция на задачи

### Backend

### TASK-BCK-001: Установка bcryptjs
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 0.5ч

**Описание**: Установить bcryptjs и типы.

**Критерии приемки**:
- [ ] `npm install bcryptjs`
- [ ] `npm install -D @types/bcryptjs`
- [ ] Пакеты добавлены в package.json

**Технические детали**:
- Команды:
  ```bash
  npm install bcryptjs
  npm install -D @types/bcryptjs
  ```

---

### TASK-BCK-002: Создание модуля password.ts
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 1ч  
**Зависимости**: TASK-BCK-001

**Описание**: Создать утилитарный модуль для хеширования паролей.

**Критерии приемки**:
- [ ] Файл создан: `src/lib/password.ts`
- [ ] Функция `hash(password, cost?)` возвращает bcrypt-хеш
- [ ] Функция `compare(password, hash)` проверяет пароль
- [ ] Функция `isHashed(value)` определяет формат bcrypt
- [ ] DEFAULT_COST = 10
- [ ] Unit-тесты для всех функций

**Технические детали**:
- Файл: `src/lib/password.ts`
- Регулярное выражение для isHashed: `/^\$2[aby]\$\d{2}\$.{53}$/`

---

### TASK-BCK-003: Обновление auth.ts
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 0.5ч  
**Зависимости**: TASK-BCK-002

**Описание**: Заменить plaintext сравнение на bcrypt.compare().

**Критерии приемки**:
- [ ] Импорт `compare` из `@/lib/password`
- [ ] Строка 32: `const passwordMatch = await compare(credentials.password, user.password)`
- [ ] Логирование сохранено
- [ ] Логин работает с хешированными паролями

**Технические детали**:
- Файл: `src/lib/auth.ts`
- Строка: 32

---

### TASK-BCK-004: Обновление usersService.ts
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 1ч  
**Зависимости**: TASK-BCK-002

**Описание**: Добавить хеширование в createUser() и updateUserPassword().

**Критерии приемки**:
- [ ] `createUser()` хеширует пароль перед сохранением
- [ ] `updateUserPassword()` хеширует пароль перед сохранением
- [ ] Импорт `hash` из `@/lib/password`
- [ ] Обработка случая когда password не передан

**Технические детали**:
- Файл: `src/services/admin/usersService.ts`
- Методы: createUser (строки 76-79), updateUserPassword (строки 95-100)

---

### TASK-BCK-005: Обновление seed.ts
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 1ч  
**Зависимости**: TASK-BCK-002

**Описание**: Добавить хеширование паролей в seed-скрипт.

**Критерии приемки**:
- [ ] Импорт `hash` из `../../src/lib/password`
- [ ] Пароль admin@fences.ru хешируется
- [ ] Пароль manager@fences.ru хешируется
- [ ] `npm run db:seed` создаёт пользователей с хешированными паролями
- [ ] Можно войти с паролями admin123, manager123

**Технические детали**:
- Файл: `prisma/seeds/seed.ts`
- Строки: 15, 27

---

### TASK-BCK-006: Скрипт миграции паролей
**Направление**: Backend  
**Приоритет**: Critical  
**Оценка**: 2ч  
**Зависимости**: TASK-BCK-002

**Описание**: Создать скрипт для миграции существующих plaintext паролей.

**Критерии приемки**:
- [ ] Файл создан: `prisma/migrations/hash-existing-passwords.ts`
- [ ] Скрипт читает всех пользователей
- [ ] Пропускает уже хешированные пароли (isHashed check)
- [ ] Хеширует plaintext пароли
- [ ] Логирует прогресс (email, статус)
- [ ] Выводит итоговую статистику
- [ ] Запуск через `npx tsx prisma/migrations/hash-existing-passwords.ts`

**Технические детали**:
- Файл: `prisma/migrations/hash-existing-passwords.ts`
- Добавить скрипт в package.json: `"db:migrate-passwords": "tsx prisma/migrations/hash-existing-passwords.ts"`

---

### Testing

### TASK-TST-001: Unit-тесты password.ts
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 1.5ч  
**Зависимости**: TASK-BCK-002

**Критерии приемки**:
- [ ] Тест `hash()` возвращает валидный bcrypt-хеш
- [ ] Тест `hash()` использует правильный cost factor
- [ ] Тест `hash()` генерирует разные хеши для одинаковых паролей
- [ ] Тест `compare()` возвращает true для правильного пароля
- [ ] Тест `compare()` возвращает false для неправильного пароля
- [ ] Тест `isHashed()` возвращает true для bcrypt-хеша
- [ ] Тест `isHashed()` возвращает false для plaintext
- [ ] Покрытие ≥ 90%

**Технические детали**:
- Файл: `__tests__/lib/password.test.ts`
- Фреймворк: Jest

---

### TASK-TST-002: Обновление auth.test.ts
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 1ч  
**Зависимости**: TASK-BCK-002, TASK-BCK-003

**Критерии приемки**:
- [ ] Тесты используют bcrypt-хеши в mock-данных
- [ ] Функция authorize() использует bcrypt.compare()
- [ ] Тест успешной аутентификации проходит
- [ ] Тест неуспешной аутентификации проходит
- [ ] Все существующие тесты проходят

**Технические детали**:
- Файл: `__tests__/auth.test.ts`
- Обновить mock-пользователей: использовать `await hash('password123')` вместо plaintext

---

### TASK-TST-003: Integration-тесты API пользователей
**Направление**: Testing  
**Приоритет**: Medium  
**Оценка**: 1.5ч  
**Зависимости**: TASK-BCK-004

**Критерии приемки**:
- [ ] Тест POST /api/admin/users создаёт пользователя с хешированным паролем
- [ ] Тест входа с новым пользователем проходит
- [ ] Проверка что пароль в БД = bcrypt-хеш (isHashed = true)

**Технические детали**:
- Файл: `__tests__/api/users.test.ts`
- Использовать тестовую БД или mock

---

### Documentation

### TASK-DOC-001: Обновление README
**Направление**: Documentation  
**Приоритет**: Low  
**Оценка**: 0.5ч

**Критерии приемки**:
- [ ] Добавлена информация о bcrypt
- [ ] Указан cost factor = 10
- [ ] Описан скрипт миграции

---

## 7. Тестирование

### 7.1 Unit-тесты

**Файл**: `__tests__/lib/password.test.ts`

```typescript
import { hash, compare, isHashed, DEFAULT_COST } from '@/lib/password';

describe('password utilities', () => {
  describe('hash()', () => {
    it('should return bcrypt hash with correct format', async () => {
      const result = await hash('password123');
      expect(result).toMatch(/^\$2b\$10\$.{53}$/);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hash('password123');
      const hash2 = await hash('password123');
      expect(hash1).not.toBe(hash2);
    });

    it('should use custom cost factor', async () => {
      const result = await hash('password123', 12);
      expect(result).toMatch(/^\$2b\$12\$.{53}$/);
    });
  });

  describe('compare()', () => {
    it('should return true for correct password', async () => {
      const hashed = await hash('password123');
      const result = await compare('password123', hashed);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const hashed = await hash('password123');
      const result = await compare('wrongpassword', hashed);
      expect(result).toBe(false);
    });
  });

  describe('isHashed()', () => {
    it('should return true for valid bcrypt hash', () => {
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEF';
      expect(isHashed(hash)).toBe(true);
    });

    it('should return false for plaintext', () => {
      expect(isHashed('admin123')).toBe(false);
      expect(isHashed('password')).toBe(false);
    });
  });
});
```

### 7.2 Integration-тесты

**Сценарий**: Создание пользователя → Проверка хеша → Вход

```typescript
describe('User password hashing', () => {
  it('should hash password on user creation', async () => {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
        name: 'Test User',
        role: 'MANAGER',
      }),
    });

    const user = await response.json();
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(isHashed(dbUser.password)).toBe(true);
  });

  it('should authenticate with hashed password', async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'testpassword',
    });

    expect(result.ok).toBe(true);
  });
});
```

### 7.3 Тестовые данные

```typescript
const testUsers = [
  { email: 'admin@test.ru', password: 'admin123', role: 'ADMIN' },
  { email: 'manager@test.ru', password: 'manager123', role: 'MANAGER' },
];
```

---

## 8. План миграции (Rollout)

### 8.1 Этапы

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ПЛАН МИГРАЦИИ                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ЭТАП 1: Подготовка (без downtime)                                  │
│  ────────────────────────────────────────────────                   │
│  [ ] TASK-BCK-001: Установить bcryptjs                              │
│  [ ] TASK-BCK-002: Создать password.ts                              │
│  [ ] TASK-TST-001: Unit-тесты password.ts                           │
│                                                                     │
│  ЭТАП 2: Обновление кода (без downtime)                             │
│  ────────────────────────────────────────────────                   │
│  [ ] TASK-BCK-003: Обновить auth.ts                                 │
│  [ ] TASK-BCK-004: Обновить usersService.ts                         │
│  [ ] TASK-TST-002: Обновить auth.test.ts                            │
│  [ ] TASK-TST-003: Integration-тесты                                │
│                                                                     │
│  ЭТАП 3: Seed (dev/staging)                                         │
│  ────────────────────────────────────────────────                   │
│  [ ] TASK-BCK-005: Обновить seed.ts                                 │
│  [ ] Пересоздать БД: npx prisma migrate reset --force               │
│  [ ] Проверить вход с admin123, manager123                          │
│                                                                     │
│  ЭТАП 4: Миграция production (⚠️ возможен короткий downtime)         │
│  ────────────────────────────────────────────────                   │
│  [ ] Создать бэкап БД                                               │
│  [ ] TASK-BCK-006: Запустить скрипт миграции                        │
│  [ ] Проверить логи миграции                                        │
│  [ ] Smoke-тест: войти как admin, manager                           │
│  [ ] Уведомить пользователей о смене паролей (опционально)          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Rollback план

Если что-то пошло не так:

1. **Откат кода**: `git revert` на коммит с изменениями
2. **Откат БД**: Восстановить из бэкапа
3. **Временное решение**: В auth.ts добавить fallback:
   ```typescript
   // Временный fallback для отката
   const passwordMatch = isHashed(user.password) 
     ? await compare(credentials.password, user.password)
     : user.password === credentials.password;
   ```

---

## 9. Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Скрипт миграции не завершится | Низкая | Высокое | Бэкап БД, тест на staging, транзакции |
| Пользователи не смогут войти | Низкая | Критическое | Smoke-тесты, fallback, мониторинг |
| Производительность снизится | Низкая | Среднее | Cost=10 оптимален, мониторинг |
| Нехешированные пароли останутся | Средняя | Высокое | isHashed() check в скрипте, валидация при логине |

---

## 10. Зависимости

### От других ЧТЗ
- Нет зависимостей

### От внешних систем
- Нет зависимостей

---

## 11. Контрольный список (Checklist)

### Before Development
- [ ] ЧТЗ согласовано с заказчиком
- [ ] Выбран cost factor = 10
- [ ] Определён план миграции production

### After Development
- [ ] Все unit-тесты проходят
- [ ] Все integration-тесты проходят
- [ ] `npm run lint` без ошибок
- [ ] `npm run build` успешно
- [ ] Seed работает с хешированными паролями
- [ ] Вход с admin123, manager123 работает

### Before Production
- [ ] Бэкап БД создан
- [ ] Скрипт миграции протестирован на staging
- [ ] Smoke-тесты пройдены
- [ ] Мониторинг настроен (логи ошибок аутентификации)

---

## 12. Согласование

**Согласовано с**:
- [ ] Заказчик: _______________
- [ ] Техлид: AI-аналитик
- [ ] Security: _______________

**Дата согласования**: _______________
**Версия для реализации**: _______________

---

## 13. Примечания

### Почему bcryptjs, а не bcrypt?
- `bcryptjs` — чистая JS реализация, не требует компиляции нативного кода
- Работает на всех платформах (Windows, Linux, macOS, Docker)
- Совместим с Next.js serverless functions (Vercel)
- Активно поддерживается

### Почему cost=10?
- OWASP рекомендует минимально 10
- Время хеширования ~100ms — оптимальный баланс
- Защита от brute-force: ~10 попыток/сек на CPU

### Регулярное выражение для isHashed()
```
/^\$2[aby]\$\d{2}\$.{53}$/

$2[aby] — версия алгоритма (2a, 2b, 2y)
\d{2} — cost factor (две цифры)
.      — разделитель $
.{53}  — 22 символа salt + 31 символ hash
```

### Пример валидного хеша
```
$2b$10$N9qo8uLOickgx2ZMRZoMy.MwrjmL8m5Or0BxP5G5FkK5FkK5FkK5F
```
