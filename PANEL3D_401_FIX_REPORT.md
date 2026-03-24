# Fix для проблемы 401 Unauthorized при создании 3D-панели

## Проблема

При попытке добавить 3D-панель в справочник через админку возникала ошибка:
```
POST http://localhost:3001/api/admin/panel3d 401 (Unauthorized)
```

## Корневая причина

1. **API routes использовали `getServerSession()` без параметров**
   - Это означало, что NextAuth конфигурация (callbacks, session strategy) не применялась корректно
   - Сессия пользователя не валидировалась должным образом

2. **Фронтенд не передавал credentials в fetch запросах**
   - Браузер не отправляет cookies с сессией по умолчанию
   - `fetch()` API требует явного указания `credentials: 'include'`

## Решение

### 1. Обновлены API routes для использования authOptions

**Изменения в `/src/app/api/admin/panel3d/route.ts`**:
```typescript
// Было:
import { getServerSession } from 'next-auth';
const session = await getServerSession();

// Стало:
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
const session = await getServerSession(authOptions);
```

**Изменения в `/src/app/api/admin/panel3d/[id]/route.ts`**:
- GET, PUT, DELETE, PATCH методы обновлены

**Изменения в `/src/app/api/admin/panel3d/[id]/works/route.ts`**:
- POST, DELETE методы обновлены

**Изменения в `/src/app/api/admin/panel3d/[id]/mounting-hardware/route.ts`**:
- POST, DELETE методы обновлены

### 2. Обновлен фронтенд для передачи credentials

**Изменения в `/src/app/(admin)/admin/references/panel3d/page.tsx`**:
```typescript
// Было:
const res = await fetch(`/api/admin/panel3d?${params.toString()}`);

// Стало:
const res = await fetch(`/api/admin/panel3d?${params.toString()}`, {
  credentials: 'include',
});

// Аналогично для POST, PUT, DELETE, PATCH
```

## Соответствие лучшим практикам

✅ **Безопасность**:
- Проверка сессии через `getServerSession(authOptions)`
- Ролевая проверка (ADMIN, MANAGER имеют доступ, CONTENT_MANAGER - нет)

✅ **NextAuth лучшие практики**:
- Использование `authOptions` для корректной работы callbacks
- JWT стратегия сессий

✅ **Fetch API лучшие практики**:
- `credentials: 'include' для авторизованных запросов
- Это гарантирует отправку cookies с сессией

✅ **Код-стайл**:
- Консистентное использование `getServerSession(authOptions)` во всех routes
- Правильные HTTP статусы (401 для неавторизованных, 403 для запрещенных)

## Измененные файлы

1. `src/app/api/admin/panel3d/route.ts` - 2 метода (GET, POST)
2. `src/app/api/admin/panel3d/[id]/route.ts` - 4 метода (GET, PUT, DELETE, PATCH)
3. `src/app/api/admin/panel3d/[id]/works/route.ts` - 2 метода (POST, DELETE)
4. `src/app/api/admin/panel3d/[id]/mounting-hardware/route.ts` - 2 метода (POST, DELETE)
5. `src/app/(admin)/admin/references/panel3d/page.tsx` - 4 fetch запроса

## Тестирование

✅ Docker контейнеры пересобраны и запущены
✅ Приложение доступно на http://localhost:3001
✅ API endpoint возвращает 401 без авторизации (корректно)
⏳ Требуется ручное тестирование через браузер:
1. Открыть http://localhost:3001/admin/login
2. Залогиниться под ADMIN или MANAGER
3. Перейти в Справочники → 3D-панели
4. Нажать "Добавить" и создать новую панель

## Статус

✅ Реализация завершена
✅ Docker контейнеры перезапущены
⏳ Требуется ручное тестирование через браузер
