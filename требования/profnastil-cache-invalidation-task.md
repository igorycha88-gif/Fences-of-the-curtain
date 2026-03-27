# Задача: Добавить инвалидацию кэша в ProfnastilTypeService

## Описание проблемы
После добавления/изменения/удаления профнастила в админке калькулятор не видит новые данные в течение 5 минут (время жизни кэша). Пользователь получает ошибку "Не найден профнастил с указанным покрытием и высотой".

## Причина
В сервисе `src/services/admin/profnastilTypeService.ts` отсутствует инвалидация кэша `PROFNASTIL_ACTIVE` после операций CRUD.

## Решение

### 1. Импортировать функцию инвалидации
```typescript
import { invalidateProfnastilTypesCache } from '@/lib/cache-invalidation';
```

### 2. Добавить вызов `invalidateProfnastilTypesCache()` в методы:

#### Метод `create()` — после создания записи (строка ~176)
```typescript
await invalidateProfnastilTypesCache();
console.log('[PROFNASTIL SERVICE] Cache invalidated');

return profnastil;
```

#### Метод `update()` — после обновления (строка ~227)
```typescript
await invalidateProfnastilTypesCache();
console.log('[PROFNASTIL SERVICE] Cache invalidated');

return profnastil;
```

#### Метод `delete()` — после пересчета приоритетов (строка ~260)
```typescript
await priorityService.recalculateAfterDelete('profnastilType', userId);
await invalidateProfnastilTypesCache();
console.log('[PROFNASTIL SERVICE] Cache invalidated');
```

#### Метод `toggleActive()` — после переключения активности (строка ~278)
```typescript
await invalidateProfnastilTypesCache();
console.log('[PROFNASTIL SERVICE] Cache invalidated');

return profnastil;
```

## Эталонная реализация
См. `src/services/admin/panel3dService.ts` — метод `clearCache()` вызывается после всех операций CRUD.

## Приоритет
Высокий — влияет на бизнес-процесс

## Критерии приемки
- [ ] После добавления профнастила он сразу доступен в калькуляторе
- [ ] После изменения/деактивации профнастила калькулятор использует актуальные данные
- [ ] Логи содержат запись об инвалидации кэша
- [ ] Тесты проходят успешно

## Связанные файлы
- `src/services/admin/profnastilTypeService.ts` — требуется изменение
- `src/lib/cache-invalidation.ts` — содержит функцию инвалидации
- `src/services/calculator/profnastilCalculator.ts` — использует кэш
- `src/lib/cache-keys.ts` — ключ кэша `PROFNASTIL_ACTIVE`
