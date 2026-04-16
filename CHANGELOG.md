# Changelog

## [1.6.0] - 2026-04-16

### Добавлено
- feat: Google Analytics 4, Search Console verification, SearchAction JSON-LD, calculator metadata (b740306)
- feat: подбор высоты ворот и калитки по высоте забора в калькуляторе (3bbab0f)
- feat: reviews from database instead of dead Yandex Business API (f8f01a7)

### Исправлено
- fix: добавить trackEvent() для метрик Grafana — калькулятор, заявки, телефон, страницы (46444ff)
- fix: вернуть pricePerMeter в Zod-валидатор — фикс 500 при создании столба (da161d3)
- fix: подбор 3D-панели по высоте — приоритет высоты над priority при fallback (8c3ca60)
- fix: контактная информация не отображалась на публичном сайте (66c66a2)
- fix: prod 500 errors — prisma db push + contact info cache invalidation (41911ee)
- fix: replace Link with <a> in CookieConsentBanner to prevent 404 prefetch (6f807f2)
- fix: phone badge visibility, Docker gosu permissions, security ЧТЗ docs (9f4c8a5)
- fix: entrypoint.sh — use heredoc for SQL, make non-fatal on DB check failure (6b4f91a)
- fix: entrypoint.sh — replace bash here-string with POSIX-compatible pipe (bef704c)
- fix: add 2200mm profnastil to test data — fix CI test failure (6215cfc)

## [1.4.1] - 2026-04-15

### Исправлено
- fix: prod 500 errors — prisma db push + contact info cache invalidation (41911ee)
- fix: replace Link with <a> in CookieConsentBanner to prevent 404 prefetch on /privacy-policy (6f807f2)
- fix: phone badge visibility, Docker gosu permissions, security ЧТЗ docs (9f4c8a5)

## [1.4.0] - 2026-04-15

### Добавлено
- feat: калькулятор ферм — модуль расчёта, справочники, API, UI (d00bb3a)
- feat: углы запила стоек на чертеже, анти-наезд текста SVG, детальная смета фермы с Word (6b56555)
- feat: чертёж фермы — цвета текста, антиперекрытие, легенда, фикс масштаба (be9a6c3)
- feat: конвейер прод деплоя — Blue-Green, версионирование, E2E тестирование (81ad17f)
- feat: версионирование + полное E2E тестирование на проде; фикс /api/health (4139200)
- feat: сетка-рабица калькулятор, позиция карандша, фикс пост-типов (df550f8)
- feat: надёжный CI/CD — GHCR, blue-green, мгновенный откат, Telegram (22ae730)
- feat: страница «О нас» — публичная, админ-панель, API, навигация (25b7b7e)
- feat: Cookie Consent Banner с сохранением в БД (51fef00)
- feat: полная SEO-настройка — Яндекс Метрика, JSON-LD, sitemap, 404 (86984c6)
- feat: Grafana метрики, Prometheus endpoint, русификация дашбордов (731dad8)
- feat: оптимизация производительности страницы Столбы — Redis-кэш (4d04ba3)
- feat: обновить ссылки площадок — Юла, убрать 2ГИС/Профи.ру (d720b7c)

### Исправлено
- fix: admin API auth guard, path traversal защита, audit log fix, CI prisma validate (cb272bf)
- fix: подбор профнастила по высоте — сортировка по length ASC (620b74f)
- fix: мониторинг Grafana — метрики корректно собираются (f235455)
- fix: сортировка правых узлов верхнего пояса фермы — ВП-1=ВП-2 (6073c9b)
- fix: убрать поле 'Покрытие' для сетки-рабицы (a5a7ade)
- fix: скрыть тему в мобильном хедере (a5f5ca8)

### Оптимизация
- perf: оптимизация загрузки страниц — Redis-кэш, серверные компоненты (8fe725b)
