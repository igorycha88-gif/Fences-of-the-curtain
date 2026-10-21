# ЧТЗ: SEO-посадочная «Смета на забор» (/smeta-na-zabor)

## 1. Цель задачи

Создать посадочную страницу под популярный кластер запросов «смета на забор»: «сделать смету на забор», «рассчитать смету на забор», «смета на забор под ключ». Сейчас ключевой запрос встречается только «попутно» в контенте других страниц — целевой посадочной нет.

**Бизнес-результат:** охват кластера «смета на забор», конверсия в калькулятор `/calculator/fence` и заявки на бесплатный замер (LeadForm).

## 2. Маршрутизация

- Маршрут: 1 (стандартная задача — новая статическая страница по существующему паттерну, без БД/API/архитектуры)
- Исполнитель после ЧТЗ: 💻 Разработчик
- Ветка: `master2`

## 3. Архитектурное решение (кратко, по прецеденту ЧТЗ_SEO_расширение_Wordstat)

- Статическая `page.tsx` по паттерну `src/app/(public)/skolko-stoit-zabor-sravnenie/page.tsx`
- Данные страницы — в `src/lib/zabor/smeta.ts` (Next.js запрещает нестандартные экспорты из Page)
- Цены — только из существующих прайсов кода: `RATE_PROFNASTIL`, `RATE_EVROSHTAKETNIK`, `RATE_RABICA`, `SOTKI_EXAMPLES` (`src/lib/zabor/sravnenie.ts`)
- SEO: `generatePageMetadata` + `PAGE_METADATA.smetaNaZabor`, JSON-LD (Service + FAQPage + BreadcrumbList), sitemap — обновить
- Компоненты: готовые `Header`, `Footer`, `Breadcrumbs`, `JsonLdScript`, `TrackedPhoneLink`, `FaqAccordion`, `LeadForm`, `MontageInDayBanner`
- Без миграций БД, без новых API → серверное логирование не требуется (SSG); LeadForm логирует отправку заявки

## 4. Декомпозиция задач

### TASK-FRT-001: Данные страницы — `src/lib/zabor/smeta.ts`

Экспорты:
- `SMETA_STRUCTURE` — структура сметы «под ключ» (пункт / что входит / доля цены): полотно, столбы с бетонированием, лаги, крепёж, доставка, монтаж, замер (бесплатно), уборка
- `SMETA_EXAMPLES` — примеры итоговой сметы по 3 материалам × периметры 100/130/160 м (суммы = периметр × RATE_*, формат расчёта в коде, не хардкод сумм)
- `SMETA_STEPS` — «Как рассчитать смету самостоятельно»: 5–6 шагов (периметр → материал → ворота/калитка → рельеф/демонтаж → сверка чек-листом)
- `SMETA_CHECKLIST` — чек-лист «Что должно быть в смете подрядчика» (7–8 пунктов)
- `SMETA_FAQ` — 6 вопросов: сколько стоит смета (бесплатно), можно ли по кадрам/фото, точность калькулятора vs замерщика, почему смета после замера отличается от онлайн-расчёта, фиксируется ли цена, входит ли демонтаж старого забора

### TASK-FRT-002: Метаданные — `src/lib/seo/constants.ts`

Добавить `PAGE_METADATA.smetaNaZabor`:
- title: «Смета на забор — как рассчитать стоимость под ключ | Заборы и Навесы» (≤70 симв.)
- path: `/smeta-na-zabor`
- description: с ключом + гео МО + CTA (≤160)
- keywords: «сделать смету на забор», «рассчитать смету на забор», «смета на забор под ключ», «смета на забор из профнастила», «смета забора онлайн», «сколько стоит смета на забор» и др.
- ogImage: `/og/og-calculator.jpg`

### TASK-FRT-003: Страница — `src/app/(public)/smeta-na-zabor/page.tsx`

- `revalidate = 86400`, metadata через `generatePageMetadata` + `title: { absolute }`
- H1: «Смета на забор: как рассчитать стоимость под ключ»
- Hero: описание + CTA «Рассчитать в калькуляторе» (/calculator/fence) + телефон (TrackedPhoneLink +74993901595)
- Секция 1: «Из чего состоит смета под ключ» — таблица SMETA_STRUCTURE
- Секция 2: «Примеры готовых смет» — таблица SMETA_EXAMPLES (материал × периметр = сумма), сноска про цены 09.2026 и «ворота/калитка отдельно»
- Секция 3: «Как рассчитать смету самостоятельно» — шаги SMETA_STEPS
- Секция 4: «Что должно быть в смете подрядчика» — чек-лист SMETA_CHECKLIST
- Секция 5: LeadForm (заголовок «Сделать смету с выездом замерщика — бесплатно»)
- MontageInDayBanner mode="fence"
- FAQ (FaqAccordion + JSON-LD FAQPage)
- Финальный CTA-блок: калькулятор + телефон
- Перелинковка исходящая: /calculator/fence, /skolko-pogonnyh-metrov-v-sotkah, /skolko-stoit-zabor-sravnenie, /zabory-pod-klyuch
- JSON-LD: BreadcrumbList + Service + FAQPage

### TASK-INF-001: Sitemap + перелинковка входящая

- `src/app/sitemap.ts`: добавить `/smeta-na-zabor` (priority 0.8, monthly)
- `src/app/(public)/skolko-pogonnyh-metrov-v-sotkah/page.tsx`: одна ссылка на `/smeta-na-zabor` («Как составляется смета и примеры» — рядом с существующим блоком сметы)

### TASK-TST-001: Автотесты — `__tests__/app/smeta-na-zabor.test.tsx`

- metadata: title/description/keywords/canonical
- JSON-LD: BreadcrumbList, Service, FAQPage
- Рендер: H1, таблица структуры, таблица примеров (суммы за 130 м: 338 000 / 403 000 / 71 500 ₽), шаги, чек-лист, FAQ, LeadForm, ссылка на /calculator/fence
- Sitemap-тест: URL присутствует (по паттерну `__tests__/app/sitemap-wordstat.test.ts` — добавить в новый или существующий)

## 5. Требования к SEO-метаданным

- Title ≤70 симв., description ≤160 симв. с ключом + «Московская область» + CTA
- H1 = главный запрос кластера; H2 = подкластеры («как рассчитать», «из чего состоит», «примеры»)
- Canonical, OG, robots: index,follow — через `generatePageMetadata`

## 6. Требования по качеству (Правила 3, 8)

- `npm test && npm run lint && npx tsc --noEmit` — все зелёные
- Логирование: страница статическая (SSG), новых API нет — серверное логирование не требуется; LeadForm уже логирует
- Автотесты покрывают новую страницу и sitemap (≥60% нового кода)

## 7. Критерии приёмки

1. ✅ `/smeta-na-zabor` доступна, отдаёт 200, H1 по кластеру, таблицы структуры и примеров, шаги, чек-лист, FAQ ≥6, LeadForm
2. ✅ Metadata + JSON-LD (Service, FAQPage, BreadcrumbList) на странице
3. ✅ URL в sitemap.xml; входящая ссылка со страницы «сотки → метры»
4. ✅ Цены в примерах согласованы с `RATE_*` из `sravnenie.ts` (без выдуманных прайсов)
5. ✅ `npm test && npm run lint && npx tsc --noEmit` — зелёные

## 8. Что НЕ входит в задачу

- PDF/Word-выгрузка сметы со страницы (есть в админке)
- Новые прайсы beyond существующих констант кода
- Дизайн-макеты — используем существующие компоненты и стили

## 9. Источники данных

- Wordstat-кластер «смета на забор» (со слов владельца: «сделать смету на забор», «рассчитать смету на забор» — популярные запросы)
- Прайсы: `src/lib/zabor/sravnenie.ts` (RATE_PROFNASTIL 2600, RATE_EVROSHTAKETNIK 3100, RATE_RABICA 550 ₽/м)
