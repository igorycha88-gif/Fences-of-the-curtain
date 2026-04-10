# ЧТЗ: Финальная SEO-настройка (Яндекс Метрика + техническое SEO)

## 1. Цель
Полная настройка SEO-инфраструктуры сайта zabor-i-naves.ru для максимальной индексации Яндексом, включая:
- Цели Яндекс Метрики на все ключевые действия
- Редирект www → без www
- Обновлённый sitemap с динамическими страницами
- Актуальный robots.txt
- Кастомная 404 страница
- JSON-LD разметку на всех публичных страницах
- Canonical URLs
- OG-изображения-плейсхолдеры

## 2. Область изменений

### Файлы для создания:
- `src/app/not-found.tsx` — кастомная 404 страница
- `public/og/og-main.jpg` — плейсхолдер (пользователь заменит)
- `public/og/og-services.jpg` — плейсхолдер
- `public/og/og-calculator.jpg` — плейсхолдер
- `public/og/og-portfolio.jpg` — плейсхолдер
- `public/og/og-contacts.jpg` — плейсхолдер

### Файлы для изменения:
- `src/app/robots.ts` — убрать устаревший `host`, добавить Sitemap
- `src/app/sitemap.ts` — добавить портфолио, услуги
- `next.config.js` — добавить редирект www → без www
- `src/components/seo/YandexMetrika.tsx` — добавить ecommerce/расширенные цели
- `src/app/layout.tsx` — убедиться что метрика корректно работает
- Публичные страницы — добавить JSON-LD и canonical

## 3. Декомпозиция задач

### TASK-SEO-001: Редирект www → без www (next.config.js)
- Редирект `www.zabor-i-naves.ru` → `zabor-i-naves.ru`
- 301 редирект, постоянный

### TASK-SEO-002: Обновление robots.ts
- Убрать директиву `host` (устарела для Яндекса)
- Оставить Sitemap URL
- Disallow: /admin, /api/auth, /api/admin, /api/analytics

### TASK-SEO-003: Обновление sitemap.ts
- Добавить динамические страницы портфолио
- Добавить динамические страницы услуг
- Блог уже есть

### TASK-SEO-004: Кастомная 404 страница
- `src/app/not-found.tsx`
- SEO-оптимизированная: title, description, noindex
- Ссылки на главную, калькулятор, контакты
- JSON-LD BreadcrumbList

### TASK-SEO-005: Цели Яндекс Метрики
Добавить отправку целей на все ключевые действия:
- `calculator_start` — начало расчёта
- `calculator_complete` — завершение расчёта + сумма
- `contact_form_submit` — отправка контактной формы
- `phone_click` — клик по телефону
- `email_click` — клик по email
- `portfolio_view` — просмотр портфолио
- `order_form_open` — открытие формы заявки
- `order_form_submit` — отправка заявки
- `faq_expand` — раскрытие вопроса FAQ

### TASK-SEO-006: JSON-LD на всех публичных страницах
- Home — Organization + WebSite + WebApplication
- Services — ItemList + Service
- Services/[slug] — Service
- Calculator — WebApplication
- Portfolio — ItemList
- Portfolio/[id] — Product
- Contacts — ContactPage
- FAQ — FAQPage
- Blog — Blog (ItemList)
- Blog/[slug] — Article

### TASK-SEO-007: OG-изображения плейсхолдеры
- Создать минимальные плейсхолдеры в public/og/
- Пользователь заменит на реальные

### TASK-SEO-008: Canonical URLs
- Убедиться что на каждой странице установлен canonical URL
- Проверить layout.tsx и все публичные страницы

## 4. Критерии приёмки

### AC-1: Редирект www
- При переходе на `www.zabor-i-naves.ru` происходит 301 редирект на `zabor-i-naves.ru`

### AC-2: robots.txt
- `/robots.txt` не содержит `host`
- Содержит Sitemap URL
- Disallow для /admin, /api

### AC-3: sitemap.xml
- Содержит все статические страницы
- Содержит страницы блога
- Содержит страницы портфолио
- Содержит страницы услуг

### AC-4: 404 страница
- Возвращает 404 статус
- Содержит noindex
- Есть ссылки на навигацию

### AC-5: Цели Метрики
- Все события из TASK-SEO-005 отправляют reachGoal в Яндекс Метрику
- Проверяется через консоль браузера или Яндекс Метрику

### AC-6: JSON-LD
- На каждой публичной странице есть соответствующая JSON-LD разметка
- Проверяется через валидатор Яндекса / Google

### AC-7: OG-изображения
- В public/og/ есть файлы-плейсхолдеры
- Meta-теги og:image указывают на корректные пути

### AC-8: Проверки
- `npm test && npm run lint && npx tsc --noEmit` проходят без ошибок

## 5. Что НЕ входит
- Контентная SEO оптимизация (тексты, заголовки H1-H6)
- Google Search Console
- Google Analytics
- Скорость загрузки (Core Web Vitals)
- Реальные OG-изображения (только плейсхолдеры)
