# Changelog

## [1.10.0] - 2026-05-05

### Добавлено
- feat: редизайн виджета мессенджеров — FAB-кнопка в правом углу с анимациями (pulse ring, glow, wobble, tooltip) (bd96ee1)
- feat: иконки мессенджеров (Telegram + Макс) в хедере и плавающий виджет «Напиши нам» (74a3031)
- feat(seo): SEO-оптимизация на основе анализа Yandex Wordstat — ключевые запросы, JSON-LD, FAQ, блог (4d3ef8e)
- feat(seo): комплексная SEO-оптимизация по результатам аудита (60c9dda)
- feat: Telegram release notifications + portfolio garage category (dc33eba)
- feat: баннер «Гараж из сендвич-панелей» на главной странице с формой заявки (481425c)

### Исправлено
- fix: переместить виджет «Напиши нам» из правого угла в левый (d09b0a9)
- fix(csp): добавить wss://mc.yandex.ru в connect-src для WebSocket Яндекс Метрики (96611d4)
- fix: заменить <a> на Link для клиентской навигации в кнопке «Перейти к заявке» (2c32a6f)
- fix: обработка удалённого исходного расчёта при редактировании сметы (404 fallback) (8be3ce8)

## [1.9.0] - 2026-05-03

### Добавлено
- feat: справочник Автоматика для откатных ворот — модель, CRUD API, калькулятор, админ-страница, Dockerfile фикс (40f74b1)
- feat: добавить AUTOMATION в справочник привязок Работ по монтажу (665912b)

## [1.8.3] - 2026-04-30

### Исправлено
- fix: расчёт длины сетки-рабицы с учётом ворот и калиток (length + gate + wicket) (42490d3)
- fix: ошибка 400 при расчёте сетки-рабицы (lagRows, MeshType seed, PostType forMesh) (ad6aae2)
- fix: связанная фурнитура ворот/калиток не подтягивалась в калькулятор (e76eba0)
- fix: расчёт материала покрытия на полную длину забора включая ворота и калитку (c7973a8)

## [1.8.2] - 2026-04-27

### Исправлено
- fix: убрать отображение цены за погонный метр — ведём всех в калькулятор (76c8b7e)
- fix: починка планировщика ежедневного отчёта Telegram — триггер через healthcheck (b1a1aff)

## [1.8.1] - 2026-04-25

### Исправлено
- fix: timezone UTC+3 во всех Telegram-уведомлениях + встроенный cron статистики в 20:00 МСК (1bd3f30)
- fix: allow Prometheus to scrape metrics from localhost without bearer token (e630fea)

### Добавлено
- feat: add VLESS proxy support for Telegram bot on production (bfb95c2)

## [1.8.0] - 2026-04-24

### Добавлено
- feat: Telegram-бот аналитики — уведомления, команды, геолокация, дневной дайджест (321ae9a)
- feat: админ-калькулятор + фикс 400 в клиентском калькуляторе заборов (9f860a6)
- test: массовое покрытие тестами UI и сервисов (1843 тестов, ~78% coverage) (ada5304)

### Исправлено
- fix: учитывать приоритет при поиске столбов (priority как вторичная сортировка) (ccf4995)
- fix: отображение сметы в заявках созданных через калькулятор администратора (b47fe16)
- fix: убрать цены за п.м. и заменить бетонирование на бутировку щебнем (6d4ce29)
- fix: rename service slugs to singular form + 301 redirects for SEO (6db4b12)
- test: fix jest config and test compatibility (19e1acd)

## [1.7.0] - 2026-04-20

### Добавлено
- feat: SEO-оптимизация — canonical fix, посадочные страницы, блог, перелинковка, FAQ (034012b)

### Исправлено
- fix: add analytics.google.com to CSP connect-src for GA4 (d584293)
- fix: update smoke test expected status for POST /api/calculator/fence (405 → 400) (a7988ae)

## [1.6.2] - 2026-04-19

### Добавлено
- feat: добавить валидацию поля Высота в калькуляторе (аналог поля Длина) (e09040a)

### Исправлено
- fix: исключить столбы forMesh=true из расчётов профнастила и 3D-панелей (d26d78e)
- fix: добавить Google Tag Manager в CSP для разблокировки GA4 скрипта (dfd6998)
- fix: исправить 400 ошибку при расчёте сетки-рабицы (race condition meshOptions) (1860577)
- fix: перенести wait_for_health и switch_nginx перед вызовами в deploy-vps.sh (025ce2d)
- fix: починить падающий тест fenceEstimateService (профнастил 2200мм) и утечку async в audit.ts (d508115)

## [1.6.1] - 2026-04-17

### Добавлено
- feat: add phone link button to portfolio page (b8ff1f3)
- feat: add SiteNavigationElement JSON-LD for search engine sitelinks (5800c29)
- feat: add MESH (Сетка-рабица) to Works and Mounting Hardware reference types (c0d9d8d)
- feat: add Google Analytics gtag.js (G-N4KVS3N0B1) to root layout (e18f705)

### Исправлено
- fix: подбор откатных ворот по ближайшей высоте вместо максимальной (cafaa65)
- fix: подбор откатных ворот — fallback по высоте когда gateHeight < fenceHeight (0a37127)
- fix: add force-dynamic to /api/contact-info route to prevent Next.js response caching (c193920)
- fix: add yandex.ru to CSP frame-src for Yandex Maps widget (f466b1b)

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
