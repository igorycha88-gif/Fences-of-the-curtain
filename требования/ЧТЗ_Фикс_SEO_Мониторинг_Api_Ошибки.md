# ЧТЗ: Фикс обработки ошибок ValueSERP API в SEO-мониторинге

**Дата:** 2026-05-18
**Статус:** Утверждён
**Маршрут:** Маршрут 1 (Стандартная задача — Аналитик → Разработчик → Тестировщик → DevOps)
**Исполнитель:** Разработчик

---

## 1. Описание проблемы

SEO-мониторинг не получает данные по большинству ключевых слов. При анализе выявлено:

- **138 ключевых слов** в БД (69 Google + 69 Яндекс)
- **101 запись позиций**, из них **100 с `found=false`** и только 1 с `found=true`
- **0 записей для Яндекса** (все 101 — Google)
- Причина: **ValueSERP API возвращает HTTP 200 с `request_info.success: false`**, когда баланс кредитов исчерпан
- Код не проверяет `request_info.success` и молча пишет `found=false`

### Root Cause

`positionCollector.ts:123-134` — проверяется только `response.ok` (HTTP-статус), но ValueSERP при ошибке (исчерпаны кредиты, невалидный ключ, и т.д.) возвращает HTTP 200 с JSON-ответом, где `request_info.success = false`. Код видит пустой `organic_results` и записывает `found=false`, `position=0` — создавая ложные данные.

## 2. Требуемые изменения

### 2.1. Добавить проверку `request_info.success` в positionCollector.ts

**Файл:** `src/services/seo/positionCollector.ts`

В методе `collectForKeyword()`, после парсинга JSON (строка 130), добавить проверку:

```typescript
const data: ValueSerpResponse = await response.json();

if (data.request_info && !data.request_info.success) {
  const message = data.request_info.message || 'Unknown ValueSERP error';
  throw new Error(`ValueSERP API error: ${message}`);
}
```

Это обеспечит:
- При исчерпании кредитов → ошибка логируется, инкрементируется `errors` в `collectAll()`
- При невалидном ключе → аналогично
- При других ошибках API → аналогично
- **НЕ создаётся ложная запись** `found=false` когда API не отработал

### 2.2. Очистить ложные данные из БД

После фикса удалить ложные записи `seo_positions`, созданные при неработающем API (все с `found=false`, которые не отражают реальную позицию):

```sql
DELETE FROM seo_positions WHERE found = false;
```

## 3. Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/services/seo/positionCollector.ts` | Добавить проверку `request_info.success` после парсинга JSON |

## 4. Критерии приёмки

1. ✅ `positionCollector.ts` проверяет `request_info.success` и выбрасывает `Error` при `false`
2. ✅ При ошибке API (кредиты, невалидный ключ) — `collectAll()` инкрементирует `errors` и НЕ создаёт запись в БД
3. ✅ Существующие тесты проходят: `npm test && npm run lint && npx tsc --noEmit`
4. ✅ Ложные данные `found=false` удалены из БД

## 5. Декомпозиция задач

| ID | Задача | Тип |
|----|--------|-----|
| TASK-FIX-SEO-001 | Добавить проверку `request_info.success` в `collectForKeyword()` | BCK |
| TASK-FIX-SEO-002 | Обновить тесты `positionCollector.test.ts` (добавить кейс с `success: false`) | TST |
| TASK-FIX-SEO-003 | Очистить ложные данные из БД | INF |

## 6. Примечание

Для возобновления сбора реальных данных необходимо **пополнить баланс кредитов ValueSERP**. Это не кодовая проблема — после фикса и пополнения баланса сбор будет работать корректно.
