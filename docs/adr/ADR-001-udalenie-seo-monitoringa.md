# ADR-001: Полное удаление подсистемы SEO-мониторинга позиций

**Дата:** 2026-09-07
**Статус:** Accepted
**Контекст:** В приложении работает подсистема мониторинга поисковых позиций (парсер SERP через CloakBrowser, tor-прокси для ротации IP, модели `SeoKeyword`/`SeoPosition`, админ-страница `/admin/seo-monitoring`, крон `/api/cron/seo-positions`, Telegram-отчёты). Бизнес-решение: полностью вывести подсистему из эксплуатации.

## Решение

Полностью удалить подсистему SEO-мониторинга позиций, **не затрагивая** контентный SEO сайта:

- **Удаляется:** `src/services/seo/` (positionCollector, serpParser, torManager, seoChangeNotifier), `src/services/admin/seoMonitoringService.ts`, все API routes `api/admin/seo-monitoring/**`, `api/cron/seo-positions`, страница `admin/seo-monitoring`, модели `SeoKeyword`/`SeoPosition` (+ дроп таблиц `seo_keywords`, `seo_positions`), сервис `tor` в docker-compose.dev.yml, env `SEO_TOR_*`/`SEO_PARSER_*`, зависимости `cloakbrowser` и `playwright-core`, записи `serverComponentsExternalPackages`.
- **Сохраняется:** `src/lib/seo/` (метаданные, sitemap-конфиг, JSON-LD), `src/components/seo/`, поля `seoTitle/seoDescription/seoKeywords` у ServicePage/BlogPost, Метрика/GA, Prometheus/Grafana-мониторинг (не относится к SEO).
- **Общие утилиты не трогаем:** `sendTelegramMessage`, `getMoscowDateTime`, `CRON_SECRET` — используются другими подсистемами.
- Redis-ключ `seo:collection:session` (TTL 12ч) самоочистится — действий не требуется.

## Альтернативы

### Вариант А: Полное удаление (ВЫБРАН)
- **Плюсы:** нет мёртвого кода; минус 2 тяжёлые зависимости (`cloakbrowser`, `playwright-core`) → меньше образ и surface атаки; минус контейнер tor; проще схема БД.
- **Минусы:** необратимое удаление истории позиций (митигируется бэкапом `pg_dump` перед дропом).
- **Оценка:** 9/10

### Вариант Б: Отключение через флаг без удаления кода
- **Плюсы:** обратимо.
- **Минусы:** мёртвый код и зависимости остаются; таблицы и tor-сервис продолжают занимать ресурсы; двойная поддержка.
- **Оценка:** 4/10

## Влияние на архитектуру

### База данных
```sql
DROP TABLE IF EXISTS "seo_positions";
DROP TABLE IF EXISTS "seo_keywords";
```
(перед дропом — бэкап `pg_dump`; применяется через `prisma db push` после правки `schema.prisma`)

### API (удаляемые endpoints)
```
GET|POST   /api/admin/seo-monitoring/keywords
PUT|DELETE /api/admin/seo-monitoring/keywords/[id]
POST       /api/admin/seo-monitoring/keywords/seed
POST       /api/admin/seo-monitoring/collect
GET        /api/admin/seo-monitoring/collect/session
GET        /api/admin/seo-monitoring/positions
GET        /api/admin/seo-monitoring/summary
POST       /api/cron/seo-positions
```

### Файловая структура (удаляемое)
```
src/services/seo/            (4 файла)
src/services/admin/seoMonitoringService.ts
src/app/api/admin/seo-monitoring/   (7 routes)
src/app/api/cron/seo-positions/
src/app/(admin)/admin/seo-monitoring/
__tests__/services/seo/      (2 теста)
__tests__/services/admin/seoMonitoringService.test.ts
```

## Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Поломка сборки из-за остаточных импортов | Med | High | Порядок удаления: меню → роуты/страница → сервисы → Prisma; затем grep-проверка + `tsc --noEmit` |
| Потеря данных истории позиций | High | Low (данные больше не нужны) | `pg_dump` перед дропом таблиц |
| Внешний crontab на VPS бьётся в 404 | High | Low | Убрать запись `POST /api/cron/seo-positions` из crontab VPS 37.143.13.196 (ручной шаг, вне репо) |
| Случайное удаление контентного SEO | Low | High | Явный список «не трогать»; grep-контроль после удаления |
| Секреты Google service account остаются в `.env` | High | Med | Удалить мёртвый блок из `.env`, рекомендовать ротацию ключа |

## Критерии успеха

- [ ] `npm test && npm run lint && npx tsc --noEmit` — зелёные
- [ ] `grep -ri "seo-monitoring\|seoKeyword\|seoPosition\|torManager\|positionCollector" src/` — пусто
- [ ] Контентный SEO (`src/lib/seo`, `src/components/seo`) не изменён
- [ ] Полная пересборка docker-compose.dev.yml — все сервисы healthy
