# Тестирование исправлений аутентификации

## Быстрый старт

1. **Запустите приложение:**
```bash
npm run dev
```

2. **Откройте DevTools** (F12) → вкладка Console

3. **Перейдите на страницу входа:**
   - http://localhost:3000/admin/login
   - или http://localhost:3000/login

4. **Введите тестовые данные:**
   - Email: `admin@fences.ru`
   - Пароль: `admin123`

5. **Нажмите "Войти"**

6. **Следите за логами в консоли браузера**

## Ожидаемые логи

При успешном входе вы должны увидеть:

```
[LOGIN] Attempting to sign in with email: admin@fences.ru
[AUTH] Looking up user: admin@fences.ru
[AUTH] Password match: true
[AUTH] User authorized: admin@fences.ru
[AUTH JWT] Token created for user: admin@fences.ru with role: ADMIN
[AUTH SESSION] Session created for user: admin@fences.ru with role: ADMIN
[LOGIN] Sign in successful, waiting for session...
[LOGIN] Session check response status: 200
[LOGIN] Session confirmed, redirecting to dashboard
```

После редиректа:

```
[ADMIN LAYOUT] Session status: authenticated
[DASHBOARD API] Fetching session...
[DASHBOARD API] Session: Found
[DASHBOARD API] Session user: admin@fences.ru
[DASHBOARD API] Session role: ADMIN
```

## Что было исправлено

✅ **Проблема с белым экраном решена:**
- Добавлена задержка после signIn для инициализации сессии
- Добавлена проверка сессии перед редиректом

✅ **Улучшена проверка сессии:**
- Layout админки теперь использует `useSession()` вместо ручного fetch
- Это более надежный и правильный подход с NextAuth

✅ **Добавлено детальное логирование:**
- Все этапы аутентификации теперь логируются
- Легко диагностировать проблемы

✅ **Исправлена передача role:**
- Role теперь передается в JWT и session
- API endpoints правильно проверяют права доступа

## Если проблема сохраняется

1. **Проверьте логи в терминале** (где запущен `npm run dev`)

2. **Проверьте логи в консоли браузера** (F12 → Console)

3. **Очистите cookies:**
   - F12 → Application → Cookies → localhost:3000
   - Удалите все cookies
   - Перезагрузите страницу

4. **Проверьте .env файл:**
   - `NEXTAUTH_SECRET` должен быть установлен
   - `NEXTAUTH_URL` должен быть `http://localhost:3000`

5. **Проверьте базу данных:**
   - Убедитесь, что пользователь `admin@fences.ru` существует
   - Убедитесь, что поле `active` = true
   - Убедитесь, что пароль = `admin123` (для тестов)

## Важное предупреждение о безопасности

⚠️ **Пароли хранятся в открытом виде!**

Это временная конфигурация для разработки. В production ОБЯЗАТЕЛЬНО нужно:
1. Установить bcrypt: `npm install bcryptjs`
2. Захешировать все пароли в базе данных
3. Обновить логику авторизации для использования bcrypt.compare()

См. `AUTH_DEBUG.md` для подробностей.

## Следующие шаги

После успешного тестирования:

1. Реализуйте хеширование паролей с bcrypt
2. Добавьте middleware для защиты API routes
3. Добавьте rate limiting для предотвращения перебора паролей
4. Добавьте audit log для действий администраторов
5. Рассмотрите добавление 2FA для административных аккаунтов
