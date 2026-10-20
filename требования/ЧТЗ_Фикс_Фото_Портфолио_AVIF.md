# ЧТЗ: Фикс отображения фото портфолио на проде (timeout AVIF-конвертации)

**Дата:** 2026-10-20
**Маршрут:** Аналитик → Разработчик → Тестировщик → DevOps (прод)
**Тип:** Баг-фикс (постдеплойный рестарт, Правило 7)

## Проблема

После деплоя v1.22.0 на проде фото портфолио не отображаются: на листинге /portfolio заглушки «Нет фото», в галерее объекта «Фото не загружено».

## Корневые причины

1. **AVIF-кодирование медленное:** `next.config.js → images.formats: ['image/avif', 'image/webp']`. Оригиналы фото до 5.2 МБ (PNG 1564×1200 RGBA). Холодная AVIF-конвертация: PNG 5.2МБ w=1200 — 9.8s, w=1920/3840 — таймауты >45s. WebP тот же файл: 0.67s.
2. **Нет `sizes` у изображений листинга:** `ImageWithFallback` не принимает/не передаёт `sizes` → Next.js использует `100vw` → браузер запрашивает w=1920/3840 вместо ~400px для карточки → лишняя тяжёлая работа.
3. **Кеш оптимизатора эфемерный** (ФС контейнера) — после каждого деплоя первые посетители платят за холодные конвертации. С AVIF это критично, с WebP — незаметно (<1s).

## Решение

### TASK-BCK-1: Отключить AVIF в image-оптимизаторе
- Файл: `next.config.js`
- Изменение: `formats: ['image/avif', 'image/webp']` → `formats: ['image/webp']`
- Обоснование: WebP поддерживается всеми современными браузерами, кодирование в ~15 раз быстрее на тяжёлых файлах. AVIF на VPS 4 ГБ неприемлемо медленный для больших оригиналов.

### TASK-FRT-1: Передавать sizes в изображениях листинга портфолио
- Файлы: `src/components/ui/ImageWithFallback.tsx`, `src/components/portfolio/PortfolioClient.tsx`
- Изменения:
  - `ImageWithFallback`: добавить опциональный проп `sizes?: string`, проксировать в `<Image>`
  - `PortfolioClient`: карточка листинга — передать `sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"` (сетка 3 колонки на десктопе)

## Критерии приёмки

1. `next.config.js`: `images.formats` содержит только `image/webp`
2. `ImageWithFallback` принимает и проксирует `sizes` в `next/image`
3. Листинг /portfolio передаёт корректный `sizes` для 3-колоночной сетки
4. Автотесты: конфиг (formats без avif), рендер ImageWithFallback с sizes, рендер PortfolioClient с sizes
5. Quality Gate: `npm test && npm run lint && npx tsc --noEmit` — зелёные
6. На проде после деплоя: все фото портфолио 200, худшая конвертация < 2s

## Файлы для изменения

- `next.config.js`
- `src/components/ui/ImageWithFallback.tsx`
- `src/components/portfolio/PortfolioClient.tsx`
- тесты к ним

## Out of scope (follow-up)

- Генерация web-версии (~1200px) при загрузке в админке
- Персистентный volume для кеша оптимизатора
