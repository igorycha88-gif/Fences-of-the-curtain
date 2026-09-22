# ЧТЗ: Диагностика ошибок «Страница с переадресацией» в Google Search Console

**Дата:** 07.09.2026
**Маршрутизация:** Аналитик (диагностика) → закрыто без кода. Изменений кода НЕ требуется.
**Тип:** Упрощённое ЧТЗ (диагностическая задача, 0 файлов изменено)

---

## 1. Постановка задачи

Google Search Console (GSC) показывает статус «Страница с переадресацией» для URL:
- `http://zabor-i-naves.ru/` (4 сент)
- `https://www.zabor-i-naves.ru/` (3 сент)
- `https://zabor-i-naves.ru/services/navesy-dlya-avto` (1 сент)
- `http://www.zabor-i-naves.ru/` (23 авг)
- `https://zabor-i-naves.ru/services/navesy-iz-polikarbonata` (22 авг)
- `https://www.zabor-i-naves.ru/portfolio`

Требуется определить: является ли это ошибкой индексации, и нужны ли исправления.

## 2. Результаты диагностики

### 2.1. Проверенные редиректы (curl, prod)

| URL | Код | Цель | Оценка |
|-----|-----|------|-------|
| `http://zabor-i-naves.ru/` | 301 | `https://zabor-i-naves.ru/` | ✅ норма (http→https) |
| `https://www.zabor-i-naves.ru/` | 301 | `https://zabor-i-naves.ru/` | ✅ норма (www→основной) |
| `http://www.zabor-i-naves.ru/` | 301 | `https://www.zabor-i-naves.ru/` → 301 → `https://zabor-i-naves.ru/` | ✅ работает, 2 хопа (косметика) |
| `/services/navesy-dlya-avto` | 308 | `/services/naves-pod-mashinu` | ✅ намеренный переименованный слаг |
| `/services/navesy-iz-polikarbonata` | 308 | `/services/naves-iz-polikarbonata` | ✅ намеренный переименованный слаг |
| `https://zabor-i-naves.ru/` | 200 | — | ✅ индексируется |
| `/services/naves-pod-mashinu` | 200 | — | ✅ `robots: index, follow`, canonical self |
| `/services/naves-iz-polikarbonata` | 200 | — | ✅ `robots: index, follow`, canonical self |
| `/portfolio` | 200 | — | ✅ `robots: index, follow`, canonical self |

Редиректы слагов настроены в `next.config.js:105-133` (permanent: true → 308).

### 2.2. Проверка сопутствующих факторов

- **sitemap.xml:** содержит ТОЛЬКО новые канонические URL. Старых слагов нет (совпадения по «evroshtaketnik» — подстроки в блоговых URL). ✅
- **Внутренние ссылки (`src/`):** ссылок на старые слаги не найдено. ✅
- **robots.txt:** корректный, sitemap указан. ✅
- **Canonical-теги:** на всех целевых страницах — self-canonical. ✅

## 3. Заключение

**Статус «Страница с переадресацией» НЕ является ошибкой.** Это ожидаемое поведение Google для нестандартных вариантов URL:

1. `http://` и `www`-варианты ДОЛЖНЫ быть редиректами — так работает канонизация (всё схлопывается в `https://zabor-i-naves.ru`).
2. Старые слаги услуг переименованы намеренно; 308-редирект корректно переносит сигналы на новые URL. Google может держать старые URL в отчёте месяцами — это нормальное состояние, старые URL «не индексируются» потому, что индексируются их новые версии.

**Код-фикс не требуется.** Инфраструктура редиректов настроена правильно.

## 4. Рекомендуемые действия (в GSC, вручную)

1. В отчёте «Страницы с переадресацией» нажать **«Проверить исправления»** — Google перепроверит и уберёт URL из отчёта после консолидации.
2. Проверить индексацию новых URL: `site:zabor-i-naves.ru/services/naves-pod-mashinu`, `site:zabor-i-naves.ru/services/naves-iz-polikarbonata`.
3. Если новые URL не в индексе → «Инструмент проверки URL» → «Запросить индексирование».

## 5. Опциональная оптимизация (НЕ требуется, по желанию)

Сократить цепочку `http://www` (2 хопа: nginx http→https, затем Next.js www→apex) до одного хопа — в nginx на VPS направить `http://www.zabor-i-naves.ru` сразу на `https://zabor-i-naves.ru`. SEO-эффект минимален (Google следует до 5 хопов), чисто косметика.

## 6. Критерии приёмки

- ✅ Диагностика выполнена, все 6 URL из отчёта GSC проверены.
- ✅ Подтверждено: канонические цели доступны (200), индексируемы, self-canonical.
- ✅ Sitemap и внутренние ссылки не содержат старых URL.
- ✅ Сформированы рекомендации для GSC.

## 7. Список изменённых файлов

Нет. Изменения кода не требуются.
