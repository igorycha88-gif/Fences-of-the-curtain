# ЧТЗ: SEO-фиксы для Яндекса (Crawl-delay + www-зеркало)

**Дата:** 2026-08-21
**Статус:** Утверждено пользователем
**Маршрут:** Аналитик → Разработчик → Тестировщик → DevOps (+ инфра-задача на VPS)

## Проблема

Сайт zabor-i-naves.ru получает максимум 4 показа/день в Яндексе. Страницы в индексе есть (10+), т.е. проблема в ранжировании и скорости обхода, а не в индексации. Диагностика выявила 2 технические проблемы, тормозящие обход роботом Яндекса.

## Задача 1: Убрать Crawl-delay из robots.txt (TASK-SEO-001)

**Файл:** `src/app/robots.ts:12`

**Сейчас:** `crawlDelay: 1` для User-Agent: Yandex — робот Яндекса обязан ждать 1 сек между запросами. Для сайта с низким crawl-бюджетом это кратно замедляет обход.

**Нужно:** удалить строку `crawlDelay: 1`. Правило для Yandex остаётся (allow/disallow без изменений).

**Критерии приёмки:**
- `curl -s https://zabor-i-naves.ru/robots.txt` (после деплоя на прод) НЕ содержит `Crawl-delay`
- Автотест: генерация robots не содержит crawlDelay, содержит sitemap и Disallow-правила
- `npm test && npm run lint && npx tsc --noEmit` — зелёные

## Задача 2: Починить www-зеркало (TASK-SEO-002, DevOps на VPS)

**Сейчас:** `www.zabor-i-naves.ru` резолвится в тот же IP (37.143.13.196), но:
- SSL-сертификат Let's Encrypt выдан только на `zabor-i-naves.ru` (без SAN www) → TLS-ошибка для любого захода на https://www
- В nginx (`/etc/nginx/sites-enabled/fences`) нет server-блока для www и нет 301-редиректа

**Нужно (на VPS по SSH):**
1. Бэкап текущего конфига: `cp /etc/nginx/sites-enabled/fences → backups/nginx-fences-<ts>.conf`
2. Расширить сертификат certbot: включить `www.zabor-i-naves.ru` (HTTP-01, DNS уже указывает на тот же IP)
3. Добавить server-блок: `listen 443 ssl; server_name www.zabor-i-naves.ru;` → `return 301 https://zabor-i-naves.ru$request_uri;`
4. Добавить www в server_name блока :80
5. `nginx -t && systemctl reload nginx`

**Критерии приёмки:**
- `curl -I https://www.zabor-i-naves.ru/` → HTTP 301 → `https://zabor-i-naves.ru/`
- Сертификат покрывает оба имени (SAN: zabor-i-naves.ru + www.zabor-i-naves.ru)
- `https://zabor-i-naves.ru` работает как раньше (200, TLS OK)

## Ограничения и риски

- Изменение robots.ts влияет только после деплоя на ПРОД (blue-green из master2, PIPELINE_PROD)
- Перед изменением конфига nginx на VPS — обязательный бэкап
- Ожидания: фиксы убирают техническое торможение обхода; рост показов также зависит от возраста домена (<6 мес, «песочница» Яндекса), контента и внешних ссылок

## Файлы для изменения

- `src/app/robots.ts` (код)
- `src/__tests__/.../robots.test.ts` (новый автотест)
- `/etc/nginx/sites-enabled/fences` (VPS, через SSH, с бэкапом)
- Let's Encrypt сертификат (certbot --expand на VPS)
