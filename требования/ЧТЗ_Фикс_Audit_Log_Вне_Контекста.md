# ЧТЗ: Фикс Audit Log — ошибка вне контекста запроса

> **Приоритет:** MODERATE
> **Маршрут:** АНАЛИТИК → РАЗРАБОТЧИК
> **Исполнитель:** Разработчик
> **Дата:** 2026-04-15
> **Источники:** Полное функциональное тестирование master2

---

## 1. Описание проблемы

При прогоне unit-тестов (753 теста) в консоли появляется предупреждение:

```
Cannot log after tests are done. Did you forget to wait for something async in your test?
Attempted to log "[AUDIT_ERROR] Failed to create audit log: Error: `headers` was called
outside a request scope."
```

**Файл:** `src/lib/audit.ts:88-89`

```typescript
export function createAuditLogAsync(params: AuditLogParams) {
  setImmediate(() => createAuditLog(params));
}
```

`setImmediate` откладывает вызов `createAuditLog`, который внутри вызывает `await headers()`
(`src/lib/audit.ts:40`). После завершения запроса Next.js контекст уже недоступен,
и `headers()` выбрасывает ошибку.

**Последствие:** записи аудита теряются без уведомления.

---

## 2. Затронутые файлы

| Файл | Действие |
|------|----------|
| `src/lib/audit.ts` | Исправить `createAuditLogAsync` — передавать IP/userAgent явно, без вызова `headers()` |

---

## 3. Критерии приёмки

- [ ] `createAuditLogAsync` не вызывает `headers()` — получает IP из параметров
- [ ] Все вызовы `createAuditLogAsync` передают IP/userAgent явно
- [ ] Unit-тесты проходят без предупреждения "Cannot log after tests are done"
- [ ] Audit log записи корректно сохраняются в БД

---

## 4. Декомпозиция задач

| ID | Описание |
|----|----------|
| TASK-AUDIT-001 | Рефакторинг `createAuditLogAsync` — принимать IP/userAgent параметрами |
| TASK-AUDIT-002 | Обновить все вызовы `createAuditLogAsync` — передавать IP явно |
| TASK-AUDIT-003 | Проверить unit-тесты — нет предупреждений |

---

## 5. Порядок реализации

TASK-AUDIT-001 → TASK-AUDIT-002 → TASK-AUDIT-003
