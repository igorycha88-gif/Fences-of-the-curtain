# 🌐 Настройка DNS для zabor-i-naves.ru

## 📍 Текущий статус

- **Домен**: zabor-i-naves.ru
- **IP сервера**: 37.143.13.196
- **NS сервера**: ns1.ihc.ru, ns2.ihc.ru
- **TTL**: 300 сек (5 минут)

## ⚠️ Проблемы для исправления

### 1. Отсутствует CNAME для www

**Текущее состояние:**
- ✅ zabor-i-naves.ru → 37.143.13.196 (A запись)
- ❌ www.zabor-i-naves.ru → не настроен

**Решение:** Добавить CNAME запись

## 🔧 Обязательные настройки DNS

### 1. CNAME для www

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| CNAME | www | zabor-i-naves.ru | 300 |

### 2. TXT запись для Яндекс Вебмастера

В Яндекс Вебмастере перейдите в:
```
Настройки → Подтверждение прав → DNS-запись
```

Скопируйте код подтверждения и добавьте TXT запись:

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| TXT | @ | `yandex-verification: XXXXXXXX` | 300 |

*(Замените XXXXXXXX на код из Яндекс Вебмастера)*

### 3. Рекомендуемые записи

#### SPF (защита от спама)
| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| TXT | @ | `v=spf1 include:_spf.google.com ~all` | 300 |

#### DKIM (если используете Gmail)
1. Сгенерируйте ключи в Google Admin Console
2. Добавьте TXT запись для селектора

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| TXT | google._domainkey | `v=DKIM1; k=rsa; p=ВАШ_КЛЮЧ` | 300 |

## 📋 Как добавить DNS записи (ihc.ru)

1. Войдите в панель управления: https://panel.ihc.ru/
2. Перейдите в раздел "Домены"
3. Выберите домен zabor-i-naves.ru
4. Нажмите "Управление DNS"
5. Добавьте записи из таблиц выше

## 🔄 Проверка DNS после изменений

```bash
# Проверка A записи
dig zabor-i-naves.ru A +short

# Проверка CNAME для www
dig www.zabor-i-naves.ru CNAME +short

# Проверка TXT записей
dig zabor-i-naves.ru TXT +short

# Проверка с разных DNS серверов
dig @8.8.8.8 zabor-i-naves.ru A
dig @1.1.1.1 zabor-i-naves.ru A
```

## ⏱️ Время распространения изменений

- **TTL 300 сек**: изменения распространяются до 5 минут
- **Глобальное propagation**: 24-48 часов
- **Рекомендация**: подождать 24-48 часа после добавления записей

## ✅ Чеклист после настройки

- [ ] Добавлен CNAME для www.zabor-i-naves.ru
- [ ] Добавлена TXT запись для Яндекс Вебмастера
- [ ] Подтверждены права на сайт в Яндекс Вебмастере
- [ ] Проверено, что сайт доступен по https://www.zabor-i-naves.ru
- [ ] Прошло 24-48 часа после внесения изменений
- [ ] Яндекс Вебмастер перестал выдавать ошибку DNS

## 🔍 Мониторинг DNS

### Скрипт для проверки DNS

Создайте файл `check-dns.sh`:

```bash
#!/bin/bash

DOMAIN="zabor-i-naves.ru"

echo "=== Проверка DNS для $DOMAIN ==="
echo ""

echo "1. A запись:"
dig $DOMAIN A +short

echo ""
echo "2. CNAME для www:"
dig www.$DOMAIN CNAME +short

echo ""
echo "3. NS сервера:"
dig $DOMAIN NS +short

echo ""
echo "4. MX записи:"
dig $DOMAIN MX +short

echo ""
echo "5. TXT записи:"
dig $DOMAIN TXT +short

echo ""
echo "6. Проверка с Google DNS:"
dig @8.8.8.8 $DOMAIN A +short

echo ""
echo "7. Проверка с Cloudflare DNS:"
dig @1.1.1.1 $DOMAIN A +short
```

Запуск:
```bash
chmod +x check-dns.sh
./check-dns.sh
```

## 📞 Если ошибка persists

Если после всех настроек Яндекс Вебмастер все еще выдает ошибку:

1. **Проверьте robots.txt**
   - Убедитесь, что он доступен: https://zabor-i-naves.ru/robots.txt
   - Нет ошибок в синтаксисе

2. **Проверьте sitemap.xml**
   - Убедитесь, что он доступен: https://zabor-i-naves.ru/sitemap.xml
   - Все URL валидны

3. **Используйте инструменты Яндекс**
   - https://webmaster.yandex.ru/tools/dns/
   - https://webmaster.yandex.ru/tools/server-response/

4. **Свяжитесь с поддержкой Яндекса**
   - Напишите с подробным описанием проблемы
   - Приложите результаты проверки DNS

## 🚀 Дополнительные рекомендации

### 1. Оптимизация TTL

Для стабильного production:
- **Development**: TTL 300 сек (5 мин)
- **Staging**: TTL 1800 сек (30 мин)
- **Production**: TTL 3600 сек (1 час)

### 2. Добавление AAAA (IPv6)

Если ваш сервер поддерживает IPv6:

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| AAAA | @ | ::1 | 300 |

### 3. SRV записи (опционально)

Для услуг, использующих нестандартные порты:

| Тип | Имя | Значение | Приоритет | Вес | Порт | Цель |
|-----|-----|----------|-----------|------|------|------|
| SRV | _xmpp-server._tcp | | 5 | 0 | 5269 | zabor-i-naves.ru |

## 📚 Полезные ссылки

- Яндекс Вебмастер: https://webmaster.yandex.ru/
- DNS Checker: https://dnschecker.org/
- MXToolbox: https://mxtoolbox.com/
- ihc.ru Panel: https://panel.ihc.ru/
