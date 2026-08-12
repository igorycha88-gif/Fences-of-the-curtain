# ЧТЗ: Техническая SEO-оптимизация v3 (на основе лучших практик 2025-2026)

> **Дата:** 2026-07-11
> **Маршрут:** Маршрут 1 (Стандартная задача)
> **Исполнитель:** Разработчик → Тестировщик → DevOps
> **Приоритет:** HIGH
> **Контекст:** Анализ предложений другой LLM (ЧТЗ_SEO_*.md v1-v2) + аудит лучших практик Яндекс/Google 2025-2026

---

## 1. Постановка задачи

Проведён comparative анализ: (а) предложений предыдущей LLM, (б) текущего состояния кода, (в) лучших практик SEO для Яндекса и Google на 2025-2026. Выявлен ряд критических пробелов, которые блокируют попадание в ТОП-10. Данное ЧТЗ покрывает только **техническую часть** — изменения в коде.

### 1.1 Что упущено предыдущей LLM (и нужно исправить)

1. **`sameAs` пустой** — Knowledge Graph не формируется ни в Яндексе, ни в Google
2. **Хардкод отзывов** (`aggregateRating: 4.9, reviewCount: 127`) — риск пенализации за фейковые отзывы
3. **Title/Description слишком длинные** — не оптимизированы для CTR из выдачи
4. **`force-dynamic`** на services/FAQ/portfolio — каждый запрос бьёт в БД, нет ISR
5. **Нет коммерческих факторов** — Яндекс отдельно оценивает коммерческие сайты по 28 факторам
6. **Нет E-E-A-T сигналов** — главный фактор Google с 2024
7. **LocalBusiness без учёта мобильной бригады** — нужен правильный `areaServed` без точного адреса

### 1.2 Бизнес-контекст

- **Тип бизнеса:** Мобильная бригада (офиса нет)
- **География:** Москва + Московская область
- **Телефон:** +7 (499) 390-15-95
- **Email:** zabori-naves@yandex.ru
- **Яндекс.Карты ID:** 154197841574
- **Соцсети:** пока нет (будут созданы позже)

---

## 2. Критерии приёмки

### 2.1 Обязательные (MUST)

- [ ] `BUSINESS_INFO.sameAs` заполнен ссылкой на Яндекс.Карты (временная мера до создания соцсетей)
- [ ] `LocalBusiness` JSON-LD использует `areaServed` вместо точного адреса (мобильная бригада)
- [ ] Хардкод `aggregateRating` заменён на динамический из БД (или удалён если отзывов < 5)
- [ ] Title всех страниц ≤ 60 символов, с ценой/преимуществом для CTR
- [ ] Description всех страниц ≤ 160 символов, с CTA и гео
- [ ] `force-dynamic` заменён на `revalidate = 3600` (ISR) на services, FAQ, portfolio
- [ ] Коммерческий блок (цена от, сроки, гарантия, способы оплаты) на главной и services
- [ ] Страница «О компании» усилена E-E-A-T (опыт, гарантия, реквизиты-плейсхолдеры)
- [ ] JSON-LD BreadcrumbList добавлен на страницы где отсутствует
- [ ] `npm test && npm run lint && npx tsc --noEmit` — проходят

### 2.2 Желательные (SHOULD)

- [ ] Image alt-тексты проанализированы и улучшены на ключевых страницах
- [ ] WebP images (если ещё нет)
- [ ] Preload hero изображений на главной
- [ ] geo.position meta-теги

---

## 3. Декомпозиция задач

### TASK-SEO3-001: Исправить LocalBusiness JSON-LD (sameAs + areaServed)

**Файлы:** `src/lib/seo/constants.ts`, `src/lib/seo/jsonld.ts`

**Действия:**
1. Заполнить `BUSINESS_INFO.sameAs` ссылкой на Яндекс.Карты:
   ```typescript
   sameAs: [
     'https://yandex.ru/maps/org/154197841574/',
   ],
   ```
2. Изменить `LocalBusiness` — убрать `streetAddress`/`postalCode` (нет офиса), оставить только `addressLocality: Москва` и `addressRegion: Московская область`
3. Добавить расширенный `areaServed` с основными городами МО
4. Добавить `@type: ['LocalBusiness', 'HomeAndConstructionBusiness']`

### TASK-SEO3-002: Динамические отзывы вместо хардкода

**Файлы:** `src/app/page.tsx`

**Действия:**
1. Главная — серверный компонент. Получать отзывы из `prisma.review.findMany`
2. Если отзывов ≥ 5 — формировать `aggregateRating` динамически (реальный avgRating, реальный count)
3. Если отзывов < 5 — НЕ выводить `aggregateRating` (Google пенализует за фейковые)
4. Убрать `reviewsData` хардкод-массив — заменить на реальные из БД

### TASK-SEO3-003: Обновить title/description для CTR

**Файл:** `src/lib/seo/constants.ts`

**Принципы:**
- Title: ≤ 60 символов, начинается с главного ключа, содержит гео и/или цену
- Description: ≤ 160 символов, содержит CTA и гео, заканчивается «.» или «!»

**Примеры обновлений:**
| Страница | Старый title (длинный) | Новый title (для CTR) |
|----------|----------------------|----------------------|
| home | «Забор из профнастила и евроштакетника, навесы из поликарбоната в Москве» (73) | «Забор из профнастила в Москве — Цена от 1500₽/м | Калькулятор» (58) |
| services | «Установка заборов и навесов в Москве — Цена под ключ» (51) | оставить |
| calculatorFence | «Калькулятор забора — Рассчитать цену за метр онлайн» (52) | оставить |

### TASK-SEO3-004: ISR вместо force-dynamic

**Файлы:**
- `src/app/(public)/services/page.tsx` — `force-dynamic` → `export const revalidate = 3600`
- `src/app/(public)/faq/page.tsx` — `force-dynamic` → `export const revalidate = 3600`
- `src/app/(public)/portfolio/[id]/page.tsx` — `force-dynamic` → `export const revalidate = 3600`

### TASK-SEO3-005: Коммерческий блок (факторы Яндекса)

**Файлы:** `src/components/seo/CommercialFactors.tsx` (новый), `src/app/page.tsx`, `src/app/(public)/services/page.tsx`

**Блок для рендеринга:**
- «Цена от 1 500 ₽/м»
- «Монтаж от 1 дня»
- «Гарантия 3 года»
- «Выезд бесплатно по Москве и МО»
- «Оплата: наличные, карта, перевод, рассрочка»

Размещение: на главной (после hero), на `/services` (перед карточками).

### TASK-SEO3-006: E-E-A-T на странице «О компании»

**Файлы:** `src/app/(public)/about/page.tsx`

**Добавить:**
- Блок «Наш опыт»: «500+ установленных заборов», «8 лет на рынке» (если данные есть — из БД, иначе плейсхолдер)
- Блок «Гарантия»: «Официальная гарантия 3 года, договор»
- Блок «Как мы работаем»: 4-5 шагов
- Блок «Команда» (плейсхолдер для будущих фото)
- Юр. реквизиты (плейсхолдер — ИП/ООО, ИНН — заполнит владелец)

### TASK-SEO3-007: BreadcrumbList на недостающих страницах

**Файлы:**
- `src/app/page.tsx` — добавить BreadcrumbList (Главная)
- `src/app/(public)/calculator/page.tsx` — Главная > Калькулятор
- `src/app/(public)/calculator/fence/page.tsx` — Главная > Калькулятор > Забор
- `src/app/(public)/calculator/canopy/page.tsx` — Главная > Калькулятор > Навес
- `src/app/(public)/calculator/gates/page.tsx` — Главная > Калькулятор > Ворота
- `src/app/(public)/about/page.tsx` — Главная > О компании
- `src/app/(public)/contacts/page.tsx` — Главная > Контакты

### TASK-SEO3-008: Инструкции для внешнего SEO (отдельный документ)

**Файл:** `docs/seo/external-seo-checklist.md`

Пошаговые инструкции (выполняет владелец вручную):
1. Яндекс.Бизнес — создать/обновить карточку
2. Google Business Profile — создать карточку
3. 2GIS — добавить компанию
4. Avito — разместить 3-5 объявлений
5. Profi.ru — создать профиль
6. VK — создать группу
7. После создания — обновить `sameAs` в коде

---

## 4. Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/lib/seo/constants.ts` | sameAs, title/description обновление |
| `src/lib/seo/jsonld.ts` | LocalBusiness (areaServed, без streetAddress) |
| `src/app/page.tsx` | Динамические отзывы, CommercialFactors, BreadcrumbList |
| `src/app/(public)/services/page.tsx` | ISR, CommercialFactors |
| `src/app/(public)/faq/page.tsx` | ISR |
| `src/app/(public)/portfolio/[id]/page.tsx` | ISR |
| `src/app/(public)/about/page.tsx` | E-E-A-T блок |
| `src/components/seo/CommercialFactors.tsx` | Новый компонент |
| Калькуляторы, contacts, about | BreadcrumbList JSON-LD |
| `docs/seo/external-seo-checklist.md` | Новый документ-инструкция |

## 5. Что НЕ трогаем

- Архитектуру БД (schema.prisma)
- API routes
- Админ-панель
- Docker конфигурацию
- Калькуляторы (логику расчёта)
