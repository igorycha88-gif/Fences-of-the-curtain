# ЧТЗ: Фикс безопасности — авторизация Admin API

> **Приоритет:** CRITICAL
> **Маршрут:** АНАЛИТИК → РАЗРАБОТЧИК
> **Исполнитель:** Разработчик
> **Дата:** 2026-04-15
> **Источники:** Полное функциональное тестирование master2

---

## 1. Описание проблемы

При тестировании обнаружено, что несколько Admin API endpoints **не имеют авторизации**.
Middleware (`src/middleware.ts:81`) исключает `/api` из обработки, поэтому защита middleware не применяется.
Эндпоинты не вызывают `requireAdmin` или `requireAuth`, в отличие от остальных admin-маршрутов.

Любой неавторизованный пользователь может:
- Создавать, редактировать, удалять блог-посты
- Создавать, редактировать, удалять сервисные страницы
- Проверять существование файлов на сервере (path traversal)

---

## 2. Затронутые файлы (6 файлов)

### BUG-001: Admin Blog — нет авторизации

| Файл | Методы | Проблема |
|------|--------|----------|
| `src/app/api/admin/blog/route.ts` | GET, POST | Нет `requireAdmin` |
| `src/app/api/admin/blog/[id]/route.ts` | GET, PUT, DELETE | Нет `requireAdmin` |

**Для сравнения (правильная реализация):** `src/app/api/admin/faq/route.ts:9` — `await requireAdmin(request, 'content')`

### BUG-002: Admin Service Pages — нет авторизации

| Файл | Методы | Проблема |
|------|--------|----------|
| `src/app/api/admin/service-pages/route.ts` | GET, POST | Нет `requireAdmin` |
| `src/app/api/admin/service-pages/[slug]/route.ts` | GET, PUT, DELETE | Нет `requireAdmin` |

### BUG-003: Portfolio Check-Image — нет авторизации + path traversal

| Файл | Проблемы |
|------|----------|
| `src/app/api/admin/portfolio/check-image/route.ts` | Нет авторизации, нет валидации URL, утечка абсолютного пути |

---

## 3. Критерии приёмки

### BUG-001: Blog

- [ ] `GET /api/admin/blog` — требует `requireAdmin(request, 'content')`
- [ ] `POST /api/admin/blog` — требует `requireAdmin(request, 'content')`
- [ ] `GET /api/admin/blog/[id]` — требует `requireAdmin(request, 'content')`
- [ ] `PUT /api/admin/blog/[id]` — требует `requireAdmin(request, 'content')`
- [ ] `DELETE /api/admin/blog/[id]` — требует `requireAdmin(request, 'content')`
- [ ] Без авторизации все методы возвращают 401/403
- [ ] С авторизацией ADMIN/MANAGER — работает как раньше

### BUG-002: Service Pages

- [ ] `GET /api/admin/service-pages` — требует `requireAdmin(request, 'content')`
- [ ] `POST /api/admin/service-pages` — требует `requireAdmin(request, 'content')`
- [ ] `GET /api/admin/service-pages/[slug]` — требует `requireAdmin(request, 'content')`
- [ ] `PUT /api/admin/service-pages/[slug]` — требует `requireAdmin(request, 'content')`
- [ ] `DELETE /api/admin/service-pages/[slug]` — требует `requireAdmin(request, 'content')`
- [ ] Без авторизации все методы возвращают 401/403

### BUG-003: Portfolio Check-Image

- [ ] Добавить `requireAdmin(request, 'content')`
- [ ] Валидация `imageUrl`: только относительный путь, начинающийся с `/`, без `..`
- [ ] Убрать `filePath` и `thumbnailPath` из ответа (утечка путей сервера)
- [ ] Вернуть только `{ imageUrl, fileExists, thumbnailExists }`

---

## 4. Декомпозиция задач

| ID | Описание | Файлы |
|----|----------|-------|
| TASK-SEC-001 | Добавить `requireAdmin` в admin/blog routes | 2 файла |
| TASK-SEC-002 | Добавить `requireAdmin` в admin/service-pages routes | 2 файла |
| TASK-SEC-003 | Добавить `requireAdmin` + path validation в portfolio/check-image | 1 файл |
| TASK-SEC-004 | Написать/обновить тесты на авторизацию | тестовые файлы |

---

## 5. Порядок реализации

TASK-SEC-001 → TASK-SEC-002 → TASK-SEC-003 → TASK-SEC-004

---

## 6. Регрессия

- После фикса проверить: публичный блог (`/api/blog`) по-прежнему отдаёт только опубликованные посты
- Публичные сервисные страницы (`/api/service-pages`) работают без авторизации
- Публичное портфолио (`/api/portfolio`) работает без авторизации
- Admin-панель фронтенд: блог, сервисные страницы, портфолио — работают с авторизацией
