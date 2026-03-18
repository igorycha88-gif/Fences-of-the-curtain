# ЧТЗ: Настройка CRON_SECRET для защиты cron endpoints

## Версия: 1.0
## Дата: 2026-03-18
## Автор: AI-аналитик
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Защитить cron endpoints от несанкционированного вызова злоумышленниками, которые могут вызвать деактивацию записей в базе данных в произвольный момент времени.

### 1.2 Пользовательская ценность
- Гарантия, что cron задачи выполняются только авторизованными системами (Vercel Cron, внешний scheduler)
- Защита от DoS-атак через повторный вызов cron endpoints
- Соответствие требованиям безопасности (OWASP A01:2021 - Broken Access Control)

### 1.3 Метрики успеха
- CRON_SECRET задокументирован в .env.example
- CRON_SECRET добавлен в .env с криптографически стойким значением
- Endpoint `/api/cron/deactivate-expired` возвращает 401 без правильного секрета

---

## 2. Функциональные требования

### 2.1 User Stories с Acceptance Criteria

#### US-001: Документирование CRON_SECRET
**Как** разработчик  
**Я хочу**, чтобы CRON_SECRET был задокументирован в .env.example  
**Чтобы** я мог быстро настроить окружение для локальной разработки

**Acceptance Criteria:**
```
GIVEN файл .env.example существует
WHEN открываю .env.example
THEN вижу запись CRON_SECRET с описанием
AND указана команда для генерации секрета
AND пример формата секрета
```

#### US-002: Настройка CRON_SECRET в окружении
**Как** DevOps  
**Я хочу**, чтобы CRON_SECRET был добавлен в .env  
**Чтобы** cron endpoint был защищён от несанкционированного доступа

**Acceptance Criteria:**
```
GIVEN файл .env существует
WHEN проверяю содержимое .env
THEN вижу CRON_SECRET=<сгенерированный_токен>
AND токен имеет длину >= 32 символа
AND токен генерирован криптографически стойким способом
```

#### US-003: Защита cron endpoint
**Как** система безопасности  
**Я хочу**, чтобы cron endpoint возвращал ошибку при неверном секрете  
**Чтобы** злоумышленник не мог вызвать деактивацию записей

**Acceptance Criteria:**
```
GIVEN cron endpoint /api/cron/deactivate-expired
WHEN отправляю запрос без Authorization header
THEN получаю ответ 401 Unauthorized

WHEN отправляю запрос с неверным Bearer token
THEN получаю ответ 401 Unauthorized

WHEN отправляю запрос с правильным CRON_SECRET
THEN получаю ответ 200 с результатами деактивации
```

---

## 3. Нефункциональные требования

### 3.1 Безопасность

#### 3.1.1 Требования к CRON_SECRET
| Параметр | Значение | Обоснование |
|----------|----------|-------------|
| Минимальная длина | 32 символа | Защита от brute-force |
| Алфавит | Base64 (a-zA-Z0-9+/) | Криптографическая стойкость |
| Энтропия | >= 256 бит | OWASP рекомендации |
| Метод генерации | `openssl rand -base64 32` | Криптографически стойкий RNG |

#### 3.1.2 Текущая реализация защиты
Файл: `src/app/api/cron/deactivate-expired/route.ts:8`
```typescript
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Статус:** ⚠️ Реализация содержит уязвимость — требует исправления (см. TASK-BCK-001)

> **Проблема:** Если `CRON_SECRET` не задан в env, выражение вычисляется как `"Bearer undefined"`.
> Злоумышленник, отправив заголовок `Authorization: Bearer undefined`, пройдёт проверку.
>
> **Исправление:**
> ```typescript
> if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
>   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
> }
> ```

### 3.2 Конфигурация окружений

| Окружение | Источник CRON_SECRET |
|-----------|---------------------|
| Development | .env файл |
| Staging | Vercel Environment Variables |
| Production | Vercel Environment Variables |

---

## 4. Техническая архитектура

### 4.1 Изменения в файлах

#### 4.1.1 Обновление .env.example
**Файл:** `.env.example`

**Добавить после NEXTAUTH_SECRET:**
```env
# Cron Jobs Secret (REQUIRED)
# Used to authorize cron job requests to /api/cron/* endpoints
# Generate with: openssl rand -base64 32
# IMPORTANT: Use different secrets for each environment!
CRON_SECRET="REPLACE_WITH_REAL_SECRET_RUN_openssl_rand_-base64_32"
```

#### 4.1.2 Обновление .env
**Файл:** `.env`

**Добавить:**
```env
CRON_SECRET="<сгенерированный_токен>"
```

**Команда генерации:**
```bash
openssl rand -base64 32
```

### 4.2 Интерфейсы/типы данных

Типы не требуются - CRON_SECRET используется как строка через `process.env.CRON_SECRET`

### 4.3 Зависимости

| Зависимость | Статус | Описание |
|-------------|--------|----------|
| .env файл | ✅ Существует | Файл локальной конфигурации |
| .env.example | ✅ Существует | Шаблон конфигурации |
| cron endpoint | ✅ Реализован | `src/app/api/cron/deactivate-expired/route.ts` |

---

## 5. UI/UX требования

### 5.1 Отсутствие визуальных изменений
- Изменения затрагивают только конфигурационные файлы
- UI/UX не изменяется

### 5.2 Обработка ошибок авторизации

Текущая реализация возвращает:
```json
{
  "error": "Unauthorized"
}
```
HTTP Status: 401

---

## 6. Декомпозиция на задачи

### Backend

#### TASK-BCK-001: Исправление уязвимости "Bearer undefined"
**Направление:** Backend
**Приоритет:** Critical
**Оценка:** 0.25 часа
**Зависимости:** Нет

**Описание:**
Текущая проверка `authHeader !== \`Bearer ${process.env.CRON_SECRET}\`` не защищает от запросов с `Authorization: Bearer undefined`, если переменная не задана. Добавить явную проверку наличия переменной.

**Файлы:**
- `src/app/api/cron/deactivate-expired/route.ts`

**Критерии приемки:**
- [ ] Добавлена проверка `!process.env.CRON_SECRET` перед сравнением
- [ ] Запрос с `Authorization: Bearer undefined` возвращает 401
- [ ] TypeScript компиляция без ошибок

---

### Infrastructure

#### TASK-INF-001: Добавление CRON_SECRET в .env.example
**Направление:** Infrastructure  
**Приоритет:** High  
**Оценка:** 0.25 часа  
**Зависимости:** Нет

**Описание:**
Добавить документацию CRON_SECRET в .env.example с инструкцией по генерации.

**Критерии приемки:**
- [ ] .env.example содержит строку CRON_SECRET
- [ ] Добавлен комментарий с описанием назначения
- [ ] Указана команда генерации: `openssl rand -base64 32`
- [ ] Добавлено предупреждение о важности разных секретов для разных окружений
- [ ] Формат соответствует существующим переменным в файле

**Технические детали:**
- Файлы: `.env.example`
- Добавить после блока NEXTAUTH_SECRET

---

#### TASK-INF-002: Генерация и добавление CRON_SECRET в .env
**Направление:** Infrastructure  
**Приоритет:** High  
**Оценка:** 0.25 часа  
**Зависимости:** Нет

**Описание:**
Сгенерировать криптографически стойкий секрет и добавить в .env.

**Критерии приемки:**
- [ ] Секрет сгенерирован командой `openssl rand -base64 32`
- [ ] .env содержит строку `CRON_SECRET=<сгенерированный_токен>`
- [ ] Токен имеет длину >= 32 символа
- [ ] Токен не содержит placeholder значений (REPLACE_WITH_*, your-*, etc.)

**Технические детали:**
- Файлы: `.env`
- Команда: `echo "CRON_SECRET=\"$(openssl rand -base64 32)\"" >> .env` (или ручное добавление)

---

### Testing

#### TASK-TST-001: Проверка авторизации cron endpoint
**Направление:** Testing  
**Приоритет:** High  
**Оценка:** 0.5 часа  
**Зависимости:** TASK-INF-002

**Описание:**
Проверить, что cron endpoint корректно обрабатывает авторизацию.

**Критерии приемки:**
- [ ] Тест 1: Запрос без Authorization header возвращает 401
- [ ] Тест 2: Запрос с неверным Bearer token возвращает 401
- [ ] Тест 3: Запрос с правильным CRON_SECRET возвращает 200
- [ ] curl команды для ручного тестирования documented

**Технические детали:**
- Endpoint: `GET /api/cron/deactivate-expired`
- Header: `Authorization: Bearer <CRON_SECRET>`

**Тестовые команды:**
```bash
# Тест 1: Без авторизации (ожидается 401)
curl http://localhost:3000/api/cron/deactivate-expired

# Тест 2: Неверный секрет (ожидается 401)
curl -H "Authorization: Bearer wrong-secret" http://localhost:3000/api/cron/deactivate-expired

# Тест 3: Правильный секрет (ожидается 200)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/deactivate-expired
```

---

## 7. Тестирование

### 7.1 Ручное тестирование

#### Тест-кейс TC-001: Проверка .env.example
**Предусловия:**
- Файл .env.example существует

**Шаги:**
1. Открыть .env.example
2. Найти CRON_SECRET

**Ожидаемый результат:**
- Переменная CRON_SECRET присутствует
- Есть комментарий с описанием
- Есть команда генерации

#### Тест-кейс TC-002: Проверка .env
**Предусловия:**
- Файл .env существует

**Шаги:**
1. Открыть .env
2. Найти CRON_SECRET

**Ожидаемый результат:**
- Переменная CRON_SECRET присутствует
- Значение не является placeholder
- Длина >= 32 символа

#### Тест-кейс TC-003: Проверка авторизации endpoint
**Предусловия:**
- Приложение запущено локально
- CRON_SECRET задан в .env

**Шаги:**
1. `curl http://localhost:3000/api/cron/deactivate-expired`
2. `curl -H "Authorization: Bearer wrong" http://localhost:3000/api/cron/deactivate-expired`
3. `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/deactivate-expired`

**Ожидаемый результат:**
1. 401 Unauthorized
2. 401 Unauthorized
3. 200 OK с JSON ответом

### 7.2 Тестовые данные

| Сценарий | Authorization Header | Expected Status |
|----------|---------------------|-----------------|
| Без авторизации | (отсутствует) | 401 |
| Неверный формат | `wrong-format` | 401 |
| Неверный Bearer | `Bearer wrong-secret` | 401 |
| Правильный секрет | `Bearer <CRON_SECRET>` | 200 |

---

## 8. Риски и зависимости

### 8.1 Риски

#### Риск 1: CRON_SECRET не задан в production (Вероятность: Medium, Влияние: Critical)
**Описание:** Если CRON_SECRET не задан в Vercel Environment Variables, cron jobs не будут работать  
**Митигация:**
- Добавить напоминание в README.md
- Проверять наличие CRON_SECRET при деплое (опционально)

#### Риск 2: Использование одного секрета для всех окружений (Вероятность: Low, Влияние: Medium)
**Описание:** Если один секрет используется для dev/staging/prod, компрометация одного окружения ведёт к компрометации всех  
**Митигация:**
- Явное предупреждение в .env.example
- Разные секреты для каждого окружения

### 8.2 Зависимости

| Зависимость | Статус | Описание |
|-------------|--------|----------|
| .gitignore содержит .env | ✅ Подтверждено | `.env` присутствует в .gitignore |
| Vercel Cron Jobs | ✅ | Планировщик вызова cron endpoints |

---

## 9. Критерии готовности (Definition of Done)

### Файлы
- [ ] .env.example обновлён
- [ ] .env обновлён

### Тестирование
- [ ] Endpoint возвращает 401 без авторизации
- [ ] Endpoint возвращает 401 с неверным секретом
- [ ] Endpoint возвращает 200 с правильным секретом

### Безопасность
- [ ] .env в .gitignore
- [ ] Секрет генерирован криптографически стойким способом
- [ ] Длина секрета >= 32 символа

---

## 10. Согласование

- [ ] **Заказчик:** Требования согласованы
- [ ] **Техлид:** Подход одобрен
- [ ] **Security:** Требования соответствуют политике безопасности

---

## 11. Приложения

### Приложение А: Команды для генерации секрета

**Linux/macOS (OpenSSL):**
```bash
openssl rand -base64 32
```

**Linux/macOS (Node.js):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Windows (PowerShell):**
```powershell
# ⚠️ Get-Random — НЕ криптографически стойкий генератор, не использовать для production!
# Правильный способ (криптографически стойкий):
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### Приложение Б: Пример содержимого файлов

**.env.example (фрагмент):**
```env
# Cron Jobs Secret (REQUIRED)
# Used to authorize cron job requests to /api/cron/* endpoints
# Generate with: openssl rand -base64 32
# IMPORTANT: Use different secrets for each environment!
CRON_SECRET="REPLACE_WITH_REAL_SECRET_RUN_openssl_rand_-base64_32"
```

**.env (фрагмент):**
```env
CRON_SECRET="kT9xM2pL8qR5vN3wY7zA1bC6dE4fG0hJiKmOpQrStU="
```

### Приложение В: Настройка CRON_SECRET в Vercel

1. Откройте проект в Vercel Dashboard
2. Перейдите в Settings → Environment Variables
3. Добавьте переменную:
   - Name: `CRON_SECRET`
   - Value: `<сгенерированный_секрет>`
   - Environments: Production, Preview, Development (разные значения!)
4. Нажмите Save
5. Переразверните проект для применения изменений

---

**Документ подготовлен:** 2026-03-18  
**Версия:** 1.0  
**Статус:** Требует согласования с заказчиком
