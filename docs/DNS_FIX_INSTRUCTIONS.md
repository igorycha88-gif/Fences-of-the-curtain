# Настройка DNS для zabor-i-naves.ru

## Текущее состояние

### ✅ Правильные записи:
- **A запись**: `zabor-i-naves.ru` → `37.143.13.196`
- **CNAME**: `www.zabor-i-naves.ru` → `zabor-i-naves.ru`
- **NS записи**: `ns1.ihc.ru`, `ns2.ihc.ru`
- **SSL сертификат**: действителен до 20 июня 2026

### ❌ Проблемы, которые вызывают ошибку DNS в Яндекс Вебмастере:

1. **MX запись**: указывает на `mail.zabor-i-naves.ru`, но SSL сертификат не поддерживает этот поддомен
   - При попытке подключиться к `mail.zabor-i-naves.ru` возникает ошибка SSL
   - Это вызывает ошибку DNS у поисковых роботов

2. **robots.txt**: содержит директиву `Host:`, которая официально не поддерживается Яндексом

## Рекомендуемые DNS записи

### Вариант 1: Без собственного почтового сервера (Рекомендуется)

Если вы не используете почту на этом домене, удалите MX запись:

```
# Удалить:
MX 10 mail.zabor-i-naves.ru.

# Оставить:
A    zabor-i-naves.ru → 37.143.13.196
CNAME www.zabor-i-naves.ru → zabor-i-naves.ru
```

### Вариант 2: С использованием внешнего почтового сервиса

Если вы используете Gmail, Yandex 360 или другой сервис:

```
# Настроить MX на внешний сервис (пример для Gmail):
MX 1  aspmx.l.google.com.
MX 5  alt1.aspmx.l.google.com.
MX 5  alt2.aspmx.l.google.com.
MX 10 alt3.aspmx.l.google.com.
MX 10 alt4.aspmx.l.google.com.

TXT @ "v=spf1 include:_spf.google.com ~all"
```

### Вариант 3: С собственным почтовым сервером

Если вы используете почту на этом сервере:

1. **Расширьте SSL сертификат** (см. ниже)
2. **Добавьте TXT запись для SPF**:
   ```
   TXT @ "v=spf1 mx -all"
   ```
3. **Настройте DKIM** (если требуется)
4. **Настройте DMARC** (рекомендуется):
   ```
   TXT _dmarc "v=DMARC1; p=none; rua=mailto:dmarc@zabor-i-naves.ru"
   ```

## Обновление robots.txt

Директива `Host:` официально не поддерживается Яндексом. Она была удалена из файла.

Текущий robots.txt:
```
User-agent: *
Allow: /

Disallow: /admin
Disallow: /api/auth
Disallow: /api/admin

Allow: /api/contact-info
Allow: /api/portfolio
Allow: /api/calculator
Allow: /api/calculator/fence
Allow: /api/calculator/canopy
Allow: /api/calculator/fence-types
Allow: /api/calculator/profnastil-types
Allow: /api/calculator/picket-types
Allow: /api/calculator/post-types
Allow: /api/calculator/lag-types
Allow: /api/calculator/gate-types
Allow: /api/calculator/wicket-types
Allow: /api/calculator/mounting-hardware

Sitemap: https://zabor-i-naves.ru/sitemap.xml
```

## Расширение SSL сертификата

### Опция 1: Wildcard сертификат (Рекомендуется)

Используйте wildcard сертификат `*.zabor-i-naves.ru` для поддержки всех поддоменов:

```bash
# С помощью certbot и DNS challenge
sudo certbot certonly --manual --preferred-challenges dns \
  -d zabor-i-naves.ru -d *.zabor-i-naves.ru
```

### Опция 2: SAN сертификат с конкретными доменами

```bash
sudo certbot certonly --webroot -w /var/www/html \
  -d zabor-i-naves.ru -d www.zabor-i-naves.ru -d mail.zabor-i-naves.ru
```

### Обновление nginx конфигурации

После получения нового сертификата, обновите путь в `docker/nginx.conf`:

```nginx
ssl_certificate /etc/nginx/ssl/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/privkey.pem;
```

Перезапустите nginx:
```bash
docker-compose restart nginx
```

## Проверка после изменений

1. **Проверьте DNS записи**:
   ```bash
   ./check-dns.sh
   ```

2. **Проверьте SSL сертификат**:
   ```bash
   echo | openssl s_client -connect zabor-i-naves.ru:443 -servername zabor-i-naves.ru 2>/dev/null | openssl x509 -noout -text | grep DNS
   ```

3. **Проверьте robots.txt**:
   ```bash
   curl -I https://zabor-i-naves.ru/robots.txt
   ```

4. **Отправьте на повторную проверку** в Яндекс Вебмастере через 1-2 дня

## TTL (Time To Live) настройки

Текущий TTL: 300 секунд (5 минут)

Рекомендации:
- Для стабильности: увеличьте до 3600 сек (1 час)
- Для быстрых изменений: оставьте 300-600 сек

После изменения TTL подождите 2-3 дня для обновления кеширования DNS.

## Дополнительные рекомендации

1. **CDN**: Рассмотрите использование Cloudflare для ускорения и защиты
2. **DNSSEC**: Включите DNSSEC для дополнительной безопасности (опционально)
3. **Мониторинг**: Настройте мониторинг доступности сайта (UptimeRobot, Pingdom и т.д.)

## Контакт с поддержкой Яндекс

Если после всех изменений ошибка продолжается, заполните форму в Яндекс Вебмастере:
Диагностика сайта → Ошибки → Не удалось подключиться к серверу из-за ошибки DNS → "Написать в службу поддержки"

Приложите результаты:
- Скриншоты DNS записей из панели хостинга
- Результаты работы `check-dns.sh`
- Скриншот проверки robots.txt и sitemap.xml
