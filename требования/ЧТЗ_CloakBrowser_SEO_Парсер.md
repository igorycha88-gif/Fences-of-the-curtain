# ЧТЗ: Собственный SEO-парсер на CloakBrowser (замена ValueSERP API)

**Дата:** 2026-05-18
**Статус:** Утверждён
**Маршрут:** Маршрут 1 (Стандартная задача — Аналитик → Разработчик → Тестировщик → DevOps)
**Исполнитель:** Разработчик (fullstack)

---

## 1. Описание задачи

Заменить платный ValueSERP API на собственный парсер поисковой выдачи Google и Яндекс с использованием **CloakBrowser** — stealth-версии Chromium с патчами на уровне C++ исходного кода.

CloakBrowser позволяет обойти:
- Cloudflare Turnstile
- reCAPTCHA v3 (score 0.9)
- FingerprintJS, BrowserScan и 30+ систем обнаружения ботов
- Блокировки по IP (при использовании прокси)

### Зачем замена

| Аспект | ValueSERP API | CloakBrowser |
|--------|---------------|--------------|
| Стоимость | Платный (2000 запросов/мес бесплатно, далее $) | Бесплатный (open source, MIT) |
| Зависимость | Внешний API, может быть недоступен | Локальный браузер, полный контроль |
| Гибкость | Ограничен API-параметрами | Полный доступ к DOM страницы |
| Точность | Через посредника, возможны задержки | Прямой парсинг выдачи |
| Лимиты | Лимит запросов в месяц | Без лимитов (кроме IP-ограничений ПС) |

---

## 2. Что остаётся без изменений

Следующие компоненты НЕ меняются:

- **Модели БД**: `SeoKeyword`, `SeoPosition` (prisma/schema.prisma)
- **API endpoints**: `/api/admin/seo-monitoring/*` (все 6 роутов)
- **Cron endpoint**: `/api/cron/seo-positions`
- **Cron scheduler**: `src/services/cron.ts` (логика вызова)
- **Сервис CRUD**: `src/services/admin/seoMonitoringService.ts`
- **Admin UI**: `src/app/(admin)/admin/seo-monitoring/page.tsx`
- **Sidebar**: ссылки в навигации

---

## 3. Что меняется

### 3.1. `src/services/seo/positionCollector.ts` — ПОЛНАЯ ЗАМЕНА

**Было:** Вызов `https://api.valueserp.com/search` с API-ключом.

**Станет:** Запуск CloakBrowser (stealth Chromium), открытие Google/Yandex, ввод запроса, парсинг SERP.

#### Логика работы нового positionCollector:

```
1. Запустить CloakBrowser (launch) с параметрами:
   - headless: true
   - humanize: true (человекообразное поведение)
   - fingerprint seed (фиксированный для стабильности)
   - proxy: опционально (из env)
   - locale: "ru-RU"
   - timezone: "Europe/Moscow"

2. Для каждого активного ключевого слова:
   a. Создать новую страницу (new_page)
   b. Открыть Google (google.ru/search?q=...) или Yandex (yandex.ru/search/?text=...)
   c. Дождаться загрузки результатов
   d. Спарсить organic results из DOM:
      - Google: селекторы результатов поиска (#rso > div или [data-sokoban-container])
      - Yandex: селекторы результатов (.serp-item или [data-fast-wzrd])
   e. Найти zabor-i-naves.ru в списке результатов
   f. Сохранить позицию, URL, title, snippet
   g. Закрыть страницу
   
3. После обработки всех слов — закрыть браузер

4. Сохранить результаты в SeoPosition (как раньше)
```

#### Парсинг SERP — селекторы:

**Google (google.ru):**
```
URL страницы: https://www.google.ru/search?q=<keyword>&hl=ru&gl=ru&num=100
Органические результаты: div#rso > div > div (или div.g)
Заголовок: h3 (внутри результата)
URL: a[href] (первый внутри результата)
Сниппет: div[data-sncf], span.aCOpRe или div.VwiC3b
Позиция: порядковый номер результата
```

**Yandex (yandex.ru):**
```
URL страницы: https://yandex.ru/search/?text=<keyword>&lr=213&num=100
Органические результаты: li.serp-item, div.VanishedReactSerp-item или [class*="serp-item"]
Заголовок: a.Link (или h2 a)
URL: a.Link[href] (или div.OrganicTitle-Link)
Сниппет: div.TextContainer, span.OrganicText
Позиция: порядковый номер результата
```

#### Обнаружение и обработка капчи:

**Google:**
- Признак: presence of `#captcha-form` или URL содержит `captcha` или `sorry/`
- Действие: пропустить ключевое слово, записать found=false, залогировать

**Yandex:**
- Признак: presence of `.captcha` или redirect на `passport.yandex.ru/passport`
- Действие: пропустить ключевое слово, записать found=false, залогировать

#### Обработка ошибок:

| Ошибка | Действие |
|--------|----------|
| Таймаут загрузки страницы (>30 сек) | Пропустить слово, found=false |
| Капча | Пропустить слово, found=false, залогировать warning |
| Браузер упал | Перезапустить браузер, продолжить со следующего слова |
| Элемент не найден | Пропустить слово, found=false |
| Домен не найден в TOP-100 | position=0, found=false |

### 3.2. Новые зависимости (package.json)

```json
{
  "cloakbrowser": "^0.3.28",
  "playwright-core": "^1.52.0"
}
```

> CloakBrowser использует playwright-core как peer dependency.
> Бинарник Chromium (~200MB) скачивается автоматически при первом запуске.

### 3.3. Dockerfile — обновление для Chromium

Необходимо добавить системные зависимости для headless Chromium в Dockerfile:

```dockerfile
# System dependencies for CloakBrowser (Chromium)
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libwayland-client0 \
    # Шрифты для корректного рендеринга (рекомендация CloakBrowser)
    fonts-noto-color-emoji \
    fonts-freefont-ttf \
    fonts-unifont \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-tlwg-loma-otf \
    && rm -rf /var/lib/apt/lists/*
```

### 3.4. Переменные окружения (.env)

**Удаляется:**
```
VALUESERP_API_KEY=          # Больше не нужен
```

**Добавляется:**
```
SEO_PROXY=                  # Опционально. HTTP/SOCKS5 прокси для CloakBrowser
                            # Формат: http://user:pass@host:port или socks5://user:pass@host:port
SEO_PARSER_MAX_RESULTS=100  # Количество результатов для парсинга (default: 100)
SEO_PARSER_TIMEOUT=30000    # Таймаут загрузки страницы в мс (default: 30000)
SEO_PARSER_DELAY=3000       # Задержка между запросами в мс (default: 3000)
SEO_PARSER_HEADLESS=true    # Режим headless (default: true)
```

---

## 4. Интерфейс PositionCollector (обратная совместимость)

Внешний интерфейс класса **НЕ МЕНЯЕТСЯ**. Все вызовы `collectAll()` и `collectForKeyword()` работают как раньше:

```typescript
export class PositionCollector {
  async collectAll(): Promise<{ checked: number; errors: number; skipped: number; }>
  async collectForKeyword(keyword: string, searchEngine: string): Promise<{
    position: number;
    url?: string;
    title?: string;
    snippet?: string;
    found: boolean;
  }>
}

export const positionCollector = new PositionCollector();
```

Это гарантирует, что:
- `/api/cron/seo-positions` работает без изменений
- `/api/admin/seo-monitoring/collect` работает без изменений
- `src/services/cron.ts` работает без изменений

---

## 5. Стратегия парсинга

### 5.1. Google

```
1. Открыть: https://www.google.ru/search?q={keyword}&hl=ru&gl=ru&num={maxResults}
2. Ждать: селектор div#rso или div.g (таймаут 15 сек)
3. Спарсить все результаты:
   - Итерировать div.g внутри div#rso
   - Извлечь: position (index+1), h3 (title), a[href] (url), snippet text
4. Найти zabor-i-naves.ru в списке URL
5. Вернуть результат
```

### 5.2. Yandex

```
1. Открыть: https://yandex.ru/search/?text={keyword}&lr=213
2. Ждать: селектор li.serp-item или [class*="serp-item"] (таймаут 15 сек)
3. Спарсить все результаты:
   - Итерировать li.serp-item
   - Извлечь: position (index+1), заголовок из a, URL из href, сниппет
4. Найти zabor-i-naves.ru в списке URL
5. Вернуть результат
```

### 5.3. Антидетект-меры

CloakBrowser автоматически:
- Подменяет отпечатки на уровне C++ (canvas, WebGL, audio, fonts, GPU, screen)
- Устанавливает `navigator.webdriver = false`
- Подменяет TLS-отпечаток (ja3/ja4)
- Удаляет сигналы автоматизации (CDP detection)

Дополнительные меры (через API):
- `humanize: true` — человекообразные движения мыши, клавиатура, скролл
- Фиксированный fingerprint seed — стабильная «личность» между запусками
- `locale: "ru-RU"`, `timezone: "Europe/Moscow"` — российская локализация
- Задержка 3 сек между запросами — имитация реального пользователя

### 5.4. Fallback стратегия

Если CloakBrowser не может запуститься (нет бинарника, не хватает памяти):

```typescript
if (!cloakingAvailable) {
  console.warn('[PositionCollector] CloakBrowser unavailable, skipping collection');
  return { checked: 0, errors: 0, skipped: keywords.length };
}
```

---

## 6. Жизненный цикл браузера

**Важно:** Не запускать/закрывать браузер на каждое слово. Один экземпляр на весь цикл сбора:

```
launch() → for each keyword → new_page() → parse → close_page() → close_browser()
```

Это даёт:
- Экономию ресурсов (запуск браузера ~2-3 сек)
- Единый fingerprint на всю сессию
- Меньше подозрений (один «пользователь» делает несколько запросов)

---

## 7. Файлы для создания/изменения

### Изменяемые файлы:

| Файл | Изменение |
|------|-----------|
| `src/services/seo/positionCollector.ts` | **Полная замена** — CloakBrowser вместо ValueSERP |
| `package.json` | Добавить `cloakbrowser`, `playwright-core` |
| `docker/Dockerfile.dev` | Добавить системные зависимости для Chromium + шрифты |
| `docker/Dockerfile` (prod) | Добавить системные зависимости для Chromium + шрифты |
| `.env.example` | Удалить VALUESERP_API_KEY, добавить SEO_PROXY и др. |

### Новые файлы:

| Файл | Назначение |
|------|------------|
| `src/services/seo/serpParser.ts` | Парсеры SERP (Google, Yandex) — селекторы и логика извлечения данных |
| `__tests__/services/seo/positionCollector.test.ts` | Обновить тесты (мок CloakBrowser вместо fetch) |

---

## 8. Критерии приёмки

1. ✅ `npm install cloakbrowser playwright-core` — зависимости установлены
2. ✅ `positionCollector.collectAll()` работает через CloakBrowser (не через ValueSERP)
3. ✅ Google парсинг: корректно извлекаются position, url, title, snippet
4. ✅ Yandex парсинг: корректно извлекаются position, url, title, snippet
5. ✅ Домен `zabor-i-naves.ru` корректно ищется в результатах (TOP-100)
6. ✅ Капча обрабатывается gracefully (found=false, без падения)
7. ✅ Таймауты обрабатываются gracefully
8. ✅ Один экземпляр браузера на весь цикл сбора
9. ✅ `humanize: true` включён для антидетекта
10. ✅ Все существующие API endpoints работают без изменений
11. ✅ Все существующие тесты проходят
12. ✅ `npm test && npm run lint && npx tsc --noEmit` — без ошибок
13. ✅ Docker-образ собирается с зависимостями для Chromium
14. ✅ Переменная `VALUESERP_API_KEY` больше не требуется
15. ✅ Опциональный прокси `SEO_PROXY` работает (HTTP и SOCKS5)

---

## 9. Декомпозиция задач

| ID | Задача | Тип |
|----|--------|-----|
| TASK-CB-001 | Установить зависимости: `npm install cloakbrowser playwright-core` | INF |
| TASK-CB-002 | Создать `src/services/seo/serpParser.ts` — парсеры SERP для Google и Yandex | BCK |
| TASK-CB-003 | Переписать `src/services/seo/positionCollector.ts` — CloakBrowser вместо ValueSERP | BCK |
| TASK-CB-004 | Обновить Dockerfile'ы — системные зависимости для Chromium + шрифты | INF |
| TASK-CB-005 | Обновить `.env.example` — удалить VALUESERP, добавить SEO_PROXY и параметры | INF |
| TASK-CB-006 | Обновить тесты `__tests__/services/seo/positionCollector.test.ts` | TST |
| TASK-CB-007 | Проверить: `npm test && npm run lint && npx tsc --noEmit` | TST |

---

## 10. Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Google/Yandex меняют HTML-структуру | Средняя | Гибкие селекторы (несколько вариантов), fallback на URL-regex |
| Капча при частых запросах | Низкая | humanize=True, задержка 3 сек, опциональный прокси |
| Бинарник Chromium не скачается в Docker | Низкая | `ensureBinary()` при сборке образа |
| Потребление памяти (~300MB на браузер) | Средняя | Закрывать браузер после сбора, не держать постоянно |
| Google показывает персонализированные результаты | Средняя | Не логиниться, очищать cookies, fresh context |
