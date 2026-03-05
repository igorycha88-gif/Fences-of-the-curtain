# Анализ проблемы аутентификации и решения

## Описание проблемы

При нажатии на кнопку "Войти" появляется белый экран и ошибка:
```
GET http://localhost:3000/api/auth/me 401 (Unauthorized)
```

## Корневые причины

### 1. Гонка между редиректом и инициализацией сессии
- После успешного `signIn()` происходил мгновенный редирект на `/admin/dashboard`
- В этот момент cookies с сессией еще не были установлены
- Layout админки делал запрос к `/api/auth/me` и получал 401

### 2. Неправильный подход к проверке сессии
- Layout использовал ручной `fetch('/api/auth/me')` вместо `useSession()`
- Это менее надежный подход с NextAuth

### 3. Несоответствие путей
- В `auth.ts` указан `signIn: '/admin/login'`
- Но такой страницы не существовало

### 4. Отсутствие role в сессии
- Role не передавалась в JWT и session callbacks
- API endpoints требовали role для проверки прав доступа

## Внесенные изменения

### 1. src/app/(auth)/login/page.tsx
- Добавлена задержка 500мс после успешного signIn
- Добавлена проверка сессии через `/api/auth/me` перед редиректом
- Добавлено детальное логирование на всех этапах

### 2. src/app/login/page.tsx
- Аналогичные изменения как в (auth)/login

### 3. src/app/admin/login/page.tsx
- Создана новая страница для согласованности с `auth.ts`
- Использует ту же логику с задержкой и проверкой сессии

### 4. src/app/(admin)/admin/layout.tsx
- Заменен ручной `fetch('/api/auth/me')` на `useSession()` от NextAuth
- Это правильный и надежный подход
- `useSession()` автоматически управляет состоянием сессии

### 5. src/lib/auth.ts
- Добавлен `role` в возвращаемый объект user
- Добавлены callbacks для передачи role в JWT и session
- Добавлено детальное логирование авторизации

### 6. src/app/api/auth/me/route.ts
- Добавлено логирование проверки сессии

### 7. src/app/api/admin/dashboard/route.ts
- Добавлена отдельная проверка на отсутствие сессии (401)
- Добавлено детальное логирование

## Логирование

Добавлено консольное логирование на всех этапах:
- `[LOGIN]` - попытки входа, результаты авторизации
- `[AUTH]` - процессы авторизации на сервере
- `[AUTH JWT]` - создание JWT токена
- `[AUTH SESSION]` - создание сессии
- `[AUTH /me]` - проверка сессии через API
- `[ADMIN LAYOUT]` - проверка сессии в layout админки
- `[DASHBOARD API]` - запросы к dashboard API

## Логирование в браузере

Откройте DevTools Console (F12) и посмотрите на логи при попытке входа:

1. При вводе email и пароля:
   ```
   [LOGIN] Attempting to sign in with email: admin@fences.ru
   ```

2. Результат авторизации:
   ```
   [AUTH] Looking up user: admin@fences.ru
   [AUTH] Password match: true
   [AUTH] User authorized: admin@fences.ru
   [AUTH JWT] Token created for user: admin@fences.ru with role: ADMIN
   [AUTH SESSION] Session created for user: admin@fences.ru with role: ADMIN
   ```

3. Проверка сессии:
   ```
   [LOGIN] Sign in successful, waiting for session...
   [LOGIN] Session check response status: 200
   [LOGIN] Session confirmed, redirecting to dashboard
   ```

4. В layout админки:
   ```
   [ADMIN LAYOUT] Session status: authenticated
   ```

## Рекомендации по безопасности

### КРИТИЧНО: Пароли хранятся в открытом виде!

В файле `src/lib/auth.ts:28`:
```typescript
const passwordMatch = user.password === credentials.password;
```

**Решение:**
1. Используйте bcrypt для хеширования паролей:
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

2. При создании пользователя:
```typescript
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 10);
```

3. При проверке:
```typescript
const passwordMatch = await bcrypt.compare(credentials.password, user.password);
```

4. Обновите базу данных с захешированными паролями

## Дополнительные улучшения

### 1. Добавить middleware для защиты API routes
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/admin/login',
  },
});

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
```

### 2. Добавить CSRF protection
NextAuth уже включает CSRF protection, но можно усилить

### 3. Добавить rate limiting
Защита от перебора паролей

### 4. Добавить 2FA
Двухфакторная аутентификация для админов

### 5. Добавить логирование действий пользователя
Audit log для всех административных действий

## Как протестировать

1. Запустите приложение:
```bash
npm run dev
```

2. Откройте DevTools Console (F12)

3. Перейдите на `/admin/login` или `/login`

4. Введите тестовые данные:
   - Email: `admin@fences.ru`
   - Пароль: `admin123`

5. Нажмите "Войти"

6. Следите за логами в консоли

7. Если все работает, вы будете перенаправлены на дашборд

## Ожидаемые логи при успешном входе

```
[LOGIN] Attempting to sign in with email: admin@fences.ru
[AUTH] Looking up user: admin@fences.ru
[AUTH] Password match: true
[AUTH] User authorized: admin@fences.ru
[AUTH JWT] Token created for user: admin@fences.ru with role: ADMIN
[AUTH SESSION] Session created for user: admin@fences.ru with role: ADMIN
[LOGIN] Sign in result: {...}
[LOGIN] Sign in successful, waiting for session...
[LOGIN] Session check response status: 200
[LOGIN] Session confirmed, redirecting to dashboard
[AUTH /me] Checking session...
[AUTH /me] Session result: Found
[AUTH /me] User authenticated: admin@fences.ru
[ADMIN LAYOUT] Session status: authenticated
[DASHBOARD API] Fetching session...
[DASHBOARD API] Session: Found
[DASHBOARD API] Session user: admin@fences.ru
[DASHBOARD API] Session role: ADMIN
```

## Возможные ошибки и их решения

### 401 Unauthorized при проверке сессии
- Проверьте, что NEXTAUTH_SECRET установлен в .env
- Проверьте, что NEXTAUTH_URL соответствует вашему домену
- Очистите cookies и попробуйте снова

### 403 Forbidden при доступе к dashboard
- Проверьте, что у пользователя есть роль ADMIN или MANAGER
- Проверьте логи для роли пользователя
- Убедитесь, что role передается в сессию

### Белый экран после входа
- Проверьте консоль браузера на ошибки
- Проверьте логи на наличие ошибок
- Убедитесь, что редирект происходит только после успешной проверки сессии
