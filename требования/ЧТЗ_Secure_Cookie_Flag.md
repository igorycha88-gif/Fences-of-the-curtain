# ЧТЗ: Добавление Secure Cookie Flag для Session Cookies

## Версия: 1.0
## Дата: 2026-03-18
## Автор: AI-аналитик
## Приоритет: High
## Статус: Draft

---

## 1. Цели и задачи

### 1.1 Бизнес-цель
Устранить уязвимость информационной безопасности, связанную с отсутствием флага `secure` в session cookies, что позволяет передавать их по незащищённому HTTP соединению и делает приложение уязвимым к атакам Man-in-the-Middle (MITM).

### 1.2 Пользовательская ценность
- Защита идентификатора сессии от перехвата злоумышленником
- Предотвращение несанкционированного доступа к расчётам пользователя
- Повышение общего уровня безопасности приложения
- Соответствие стандартам безопасности OWASP

### 1.3 Метрики успеха
- **Покрытие**: 100% session cookies имеют флаг `secure` в production
- **Регрессия**: приложение работает корректно в development (без HTTPS)
- **Тесты**: все unit и integration тесты проходят успешно
- **Проверка**: ручная проверка в браузере показывает `secure: true` в production

---

## 2. Функциональные требования

### 2.1 User Stories с Acceptance Criteria

#### US-001: Защита session cookie в production
**Как** пользователь системы  
**Я хочу**, чтобы мой идентификатор сессии передавался только по HTTPS  
**Чтобы** злоумышленник не мог перехватить его через MITM атаку

**Acceptance Criteria:**
```
GIVEN приложение развёрнуто в production (NODE_ENV=production)
WHEN устанавливается session cookie
THEN cookie имеет флаг secure: true
AND cookie передаётся только по HTTPS соединению
AND при попытке передать по HTTP cookie не отправляется
```

#### US-002: Работа в development без HTTPS
**Как** разработчик  
**Я хочу**, чтобы приложение работало локально без HTTPS  
**Чтобы** могла вестись разработка без настройки SSL сертификатов

**Acceptance Criteria:**
```
GIVEN приложение запущено локально (NODE_ENV=development)
WHEN устанавливается session cookie
THEN cookie имеет флаг secure: false
AND cookie работает корректно по HTTP
AND функционал калькулятора не нарушается
```

#### US-003: Сохранение функционала сессий
**Как** пользователь системы  
**Я хочу**, чтобы мои расчёты сохранялись в сессии как раньше  
**Чтобы** не потерять данные при переходе между страницами

**Acceptance Criteria:**
```
GIVEN пользователь создал расчёт в калькуляторе
WHEN происходит навигация между страницами
THEN идентификатор сессии сохраняется
AND расчёт доступен при возврате
AND время жизни сессии остаётся прежним (1 час)
```

---

## 3. Нефункциональные требования

### 3.1 Безопасность

#### 3.1.1 OWASP Cookie Security
- **Secure Flag**: Cookie с флагом `secure` передаются только по HTTPS
- **HttpOnly Flag**: Уже установлен (защита от XSS)
- **SameSite Flag**: Уже установлен `strict` (защита от CSRF)
- **Path**: Установлен `/` (ограничение области действия)

#### 3.1.2 Соответствие стандартам
- OWASP Session Management Cheat Sheet
- OWASP Top 10: A01:2021 - Broken Access Control
- CWE-614: Sensitive Cookie in HTTPS Session Without 'Secure' Attribute

#### 3.1.3 Уровень риска
- **До исправления**: Medium (MITM атака в networks under attacker control)
- **После исправления**: Low (только при компрометации HTTPS)

### 3.2 Производительность
- Изменение не влияет на производительность
- Cookie устанавливается синхронно с текущим потоком выполнения

### 3.3 Совместимость
- Next.js 15.x (текущая версия)
- Все современные браузеры (Chrome, Firefox, Safari, Edge)
- Node.js 18.x+

---

## 4. Техническая архитектура

### 4.1 Изменения в коде

#### 4.1.1 Файл: `src/lib/session.ts`

**Изменяемые функции:**
1. `getSessionId()` - строки 20-25
2. `setSessionCookie()` - строки 37-43

**Текущий код (строки 20-25):**
```typescript
cookieStore.set(SESSION_COOKIE_NAME, newSessionId, {
  httpOnly: true,
  sameSite: 'strict',
  maxAge: SESSION_MAX_AGE,
  path: '/',
});
```

**Целевой код:**
```typescript
cookieStore.set(SESSION_COOKIE_NAME, newSessionId, {
  httpOnly: true,
  sameSite: 'strict',
  maxAge: SESSION_MAX_AGE,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
});
```

**Текущий код (строки 37-43):**
```typescript
cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
  httpOnly: true,
  sameSite: 'strict',
  maxAge: SESSION_MAX_AGE,
  path: '/',
});
```

**Целевой код:**
```typescript
cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
  httpOnly: true,
  sameSite: 'strict',
  maxAge: SESSION_MAX_AGE,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
});
```

### 4.2 Интерфейсы данных

#### Cookie Options Interface (Next.js)
```typescript
interface CookieOptions {
  name: string;
  value: string;
  options?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
    domain?: string;
    expires?: Date;
  };
}
```

### 4.3 Переменные окружения

| Переменная | Значение в dev | Значение в prod | Влияние на secure |
|------------|----------------|-----------------|-------------------|
| `NODE_ENV` | `development` | `production` | `false` / `true` |

---

## 5. UI/UX требования

### 5.1 Отсутствие изменений
- Изменения не затрагивают пользовательский интерфейс
- Пользователь не замечает изменений в работе приложения

### 5.2 Обработка ошибок
- При ошибке установки cookie - текущее поведение сохраняется
- Логирование ошибок не требуется (Next.js обрабатывает автоматически)

---

## 6. Декомпозиция на задачи

### Backend

#### TASK-BCK-001: Добавление secure flag в getSessionId()
**Направление**: Backend  
**Приоритет**: High  
**Оценка**: 0.5 часа  
**Зависимости**: нет

**Описание**:
Добавить параметр `secure: process.env.NODE_ENV === 'production'` в вызов `cookieStore.set()` в функции `getSessionId()` (строки 20-25).

**Критерии приемки**:
- [ ] Файл `src/lib/session.ts` обновлён
- [ ] Добавлен параметр `secure` в объект options
- [ ] Значение `secure` динамически определяется через `process.env.NODE_ENV`
- [ ] Код компилируется без ошибок TypeScript
- [ ] ESLint не выдаёт предупреждений

**Технические детали**:
- Файл: `src/lib/session.ts:20-25`
- Функция: `getSessionId()`
- Изменение: добавление 1 строки в объект options

---

#### TASK-BCK-002: Добавление secure flag в setSessionCookie()
**Направление**: Backend
**Приоритет**: High
**Оценка**: 0.5 часа
**Зависимости**: нет (независима от TASK-BCK-001, можно выполнить одним коммитом)

**Описание**:
Добавить параметр `secure: process.env.NODE_ENV === 'production'` в вызов `cookieStore.set()` в функции `setSessionCookie()` (строки 37-43).

**Критерии приемки**:
- [ ] Файл `src/lib/session.ts` обновлён
- [ ] Добавлен параметр `secure` в объект options
- [ ] Значение `secure` динамически определяется через `process.env.NODE_ENV`
- [ ] Код компилируется без ошибок TypeScript
- [ ] ESLint не выдаёт предупреждений

**Технические детали**:
- Файл: `src/lib/session.ts:37-43`
- Функция: `setSessionCookie()`
- Изменение: добавление 1 строки в объект options

---

### Testing

#### TASK-TST-001: Unit-тесты для session.ts
**Направление**: Testing  
**Приоритет**: High  
**Оценка**: 1 час  
**Зависимости**: TASK-BCK-001, TASK-BCK-002

**Описание**:
Создать/обновить unit-тесты для проверки корректности установки secure flag в зависимости от NODE_ENV.

**Критерии приемки**:
- [ ] Тест проверяет установку `secure: true` при `NODE_ENV=production`
- [ ] Тест проверяет установку `secure: false` при `NODE_ENV=development`
- [ ] Тест проверяет, что все остальные параметры cookie сохраняются
- [ ] Все тесты проходят успешно
- [ ] Покрытие кода ≥ 80%

**Технические детали**:
- Файл: `__tests__/lib/session.test.ts` (создать или обновить)
- Фреймворк: Jest
- Моки: `next/headers.cookies()`

**Пример тест-кейса:**
```typescript
describe('Session Cookie Security', () => {
  it('should set secure flag in production', () => {
    process.env.NODE_ENV = 'production';
    // ... test logic
    expect(cookieOptions.secure).toBe(true);
  });

  it('should not set secure flag in development', () => {
    process.env.NODE_ENV = 'development';
    // ... test logic
    expect(cookieOptions.secure).toBe(false);
  });
});
```

---

#### TASK-TST-002: Integration-тест в браузере
**Направление**: Testing  
**Приоритет**: Medium  
**Оценка**: 0.5 часа  
**Зависимости**: TASK-BCK-001, TASK-BCK-002

**Описание**:
Провести ручное тестирование в браузере для проверки корректности установки secure flag.

**Критерии приемки**:
- [ ] В development режиме (localhost:3000) cookie работает без HTTPS
- [ ] В production режиме cookie имеет флаг `Secure` в DevTools
- [ ] Сессия сохраняется между запросами
- [ ] Расчёты в калькуляторе сохраняются корректно

**Тестовые сценарии:**
1. Запустить `npm run dev` → проверить cookie в DevTools
2. Собрать production build → проверить cookie в DevTools
3. Создать расчёт → перезагрузить страницу → проверить сохранение

---

### Documentation

#### TASK-DOC-001: Обновление документации безопасности
**Направление**: Documentation  
**Приоритет**: Low  
**Оценка**: 0.25 часа  
**Зависимости**: TASK-BCK-001, TASK-BCK-002

**Описание**:
Создать файл `SECURITY.md` в корне проекта (файлы ARCHITECTURE.md и SECURITY.md отсутствуют) с информацией о secure cookies и настройках безопасности сессий.

**Критерии приемки**:
- [ ] Добавлена информация о secure cookie flag
- [ ] Указано условие включения (production)
- [ ] Упомянута защита от MITM атак

---

## 7. Тестирование

### 7.1 Unit-тесты

#### Тест-кейс TC-001: Проверка secure flag в production
```markdown
ID: TC-001
Название: Secure flag установлен в production
Приоритет: High
Тип: Unit Test

Предусловия:
- NODE_ENV=production

Шаги:
1. Вызвать getSessionId()
2. Проверить параметры cookie

Ожидаемый результат:
- cookieOptions.secure === true
```

#### Тест-кейс TC-002: Проверка отсутствия secure flag в development
```markdown
ID: TC-002
Название: Secure flag не установлен в development
Приоритет: High
Тип: Unit Test

Предусловия:
- NODE_ENV=development

Шаги:
1. Вызвать getSessionId()
2. Проверить параметры cookie

Ожидаемый результат:
- cookieOptions.secure === false
```

#### Тест-кейс TC-003: Проверка сохранения других параметров cookie при вызове setSessionCookie()
```markdown
ID: TC-003-B
Название: Secure flag установлен в production (setSessionCookie)
Приоритет: High
Тип: Unit Test

Предусловия:
- NODE_ENV=production

Шаги:
1. Вызвать setSessionCookie('test-id')
2. Проверить параметры cookie

Ожидаемый результат:
- cookieOptions.secure === true
```

#### Тест-кейс TC-004: Проверка secure flag при NODE_ENV=test
```markdown
ID: TC-004
Название: Secure flag не установлен при NODE_ENV=test (Jest среда)
Приоритет: Medium
Тип: Unit Test

Предусловия:
- NODE_ENV=test (Jest устанавливает автоматически)

Шаги:
1. Вызвать getSessionId()
2. Проверить параметры cookie

Ожидаемый результат:
- cookieOptions.secure === false (NODE_ENV !== 'production')
```

#### Тест-кейс TC-003: Проверка сохранения других параметров
```markdown
ID: TC-003
Название: Другие параметры cookie не изменены
Приоритет: Medium
Тип: Unit Test

Предусловия:
- Функция вызвана в любом режиме

Шаги:
1. Вызвать getSessionId()
2. Проверить все параметры cookie

Ожидаемый результат:
- httpOnly === true
- sameSite === 'strict'
- maxAge === 3600
- path === '/'
```

### 7.2 Integration-тесты

#### Ручное тестирование в браузере

**Сценарий 1: Development режим**
1. Запустить: `npm run dev`
2. Открыть: `http://localhost:3000`
3. Открыть DevTools → Application → Cookies
4. Проверить session_id cookie
5. Ожидается: Secure = false

**Сценарий 2: Production режим**
1. Собрать: `npm run build`
2. Запустить: `npm start` (требуется HTTPS или настройка)
3. Открыть DevTools → Application → Cookies
4. Проверить session_id cookie
5. Ожидается: Secure = true (при HTTPS)

**Сценарий 3: Функциональность калькулятора**
1. Создать расчёт забора
2. Перейти на другую страницу
3. Вернуться к калькулятору
4. Ожидается: расчёт сохранён

### 7.3 Тестовые данные

| Режим | NODE_ENV | HTTPS | Secure Flag | Cookie работает |
|-------|----------|-------|-------------|-----------------|
| Dev | development | No | false | Yes |
| Dev | development | Yes | false | Yes |
| Prod | production | No | true | No (ожидаемо) |
| Prod | production | Yes | true | Yes |

---

## 8. Риски и зависимости

### 8.1 Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Cookie не работает в production без HTTPS | Medium | High | Если production развёрнут без HTTPS — сессии полностью сломаются; убедиться, что инфраструктура использует HTTPS до деплоя |
| Тесты не покрывают все сценарии | Low | Medium | Добавить исчерпывающие unit-тесты |
| Регрессия в существующем функционале | Low | High | Провести полное регрессионное тестирование |

### 8.2 Зависимости

- Next.js API `cookies()` из `next/headers`
- Переменная окружения `NODE_ENV` корректно установлена
- Production deployment использует HTTPS

### 8.3 Предположения

- Production окружение всегда использует HTTPS
- Development окружение использует HTTP (localhost)
- `process.env.NODE_ENV` доступен в runtime

---

## 9. Согласование

- [ ] Заказчик: _______________
- [ ] Техлид: _______________
- [ ] Security Officer: _______________

---

## 10. Дополнительная информация

### 10.1 Ссылки на стандарты

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [CWE-614: Sensitive Cookie in HTTPS Session Without 'Secure' Attribute](https://cwe.mitre.org/data/definitions/614.html)
- [MDN: Set-Cookie Secure](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#secure)
- [Next.js Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)

### 10.2 История изменений

| Версия | Дата | Автор | Изменения |
|--------|------|-------|-----------|
| 1.0 | 2026-03-18 | AI-аналитик | Начальная версия |

---

*ЧТЗ подготовлено в соответствии с методологией SKILL_ANALYST.md*
