#!/bin/bash

# Скрипт для обновления SSL сертификата с поддержкой wildcard (*.zabor-i-naves.ru)

set -e

DOMAIN="zabor-i-naves.ru"
EMAIL="admin@${DOMAIN}"

echo "======================================"
echo "SSL Certificate Update Tool"
echo "======================================"
echo ""
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Проверка наличия certbot
if ! command -v certbot &> /dev/null; then
    echo "❌ certbot не установлен"
    echo ""
    echo "Установка certbot:"
    echo "Ubuntu/Debian: sudo apt-get install certbot"
    echo "CentOS/RHEL: sudo yum install certbot"
    echo "macOS: brew install certbot"
    exit 1
fi

echo "✅ certbot найден"
echo ""

# Проверка текущего сертификата
echo "1. Текущий SSL сертификат:"
echo ""
echo | openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} 2>/dev/null | openssl x509 -noout -dates -subject
echo ""

# Проверка SAN (Subject Alternative Name)
echo "2. SAN (Subject Alternative Name) в сертификате:"
SAN=$(echo | openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} 2>/dev/null | openssl x509 -noout -text | grep "DNS:" | sed 's/ *DNS://g')
if [ -n "$SAN" ]; then
    echo "$SAN" | tr ',' '\n' | sed 's/^/   - /'
else
    echo "   ❌ SAN не найден"
fi
echo ""

# Проверка, поддерживается ли wildcard
if [[ "$SAN" == "*.${DOMAIN}" ]]; then
    echo "✅ Wildcard сертификат уже установлен"
    echo ""
    echo "Текущий сертификат поддерживает все поддомены."
    echo "Если проблема с DNS сохраняется, выполните действия из docs/DNS_FIX_INSTRUCTIONS.md"
    exit 0
fi

echo "⚠️ Wildcard не найден в сертификате"
echo ""

# Предлагаем варианты обновления
echo "Варианты обновления сертификата:"
echo ""
echo "1. Wildcard сертификат (*.zabor-i-naves.ru)"
echo "   - Поддерживает все поддомены (www, mail, api и т.д.)"
echo "   - Требует DNS validation"
echo "   - Рекомендуется"
echo ""
echo "2. SAN сертификат с конкретными доменами"
echo "   - zabor-i-naves.ru, www.zabor-i-naves.ru, mail.zabor-i-naves.ru"
echo "   - Требует HTTP validation"
echo ""
echo "3. Оставить текущий сертификат"
echo "   - Обновить только DNS записи"
echo ""

read -p "Выберите вариант (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "Установка wildcard сертификата..."
        echo ""

        # Инструкция для DNS validation
        echo "Для wildcard сертификата требуется DNS validation."
        echo "После запуска certbot будет предложено добавить TXT запись."
        echo ""

        # Проверка DNS доступа
        if ! dig ${DOMAIN} > /dev/null 2>&1; then
            echo "❌ Не удалось проверить DNS записи"
            exit 1
        fi

        echo "Запуск certbot с DNS challenge..."
        echo ""
        echo "⚠️ Вам нужно будет добавить TXT запись в DNS на вашем хостинге"
        echo ""

        sudo certbot certonly --manual --preferred-challenges dns \
            --email ${EMAIL} --agree-tos \
            -d ${DOMAIN} -d *.${DOMAIN}

        echo ""
        echo "✅ Сертификат установлен"
        echo ""
        echo "Файлы сертификата:"
        echo "   - /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
        echo "   - /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
        echo ""
        echo "Далее:"
        echo "1. Скопируйте сертификаты в docker/ssl/"
        echo "2. Перезапустите nginx: docker-compose restart nginx"
        echo "3. Обновите DNS записи (см. docs/DNS_FIX_INSTRUCTIONS.md)"
        ;;
    2)
        echo ""
        echo "Установка SAN сертификата..."
        echo ""

        # Проверка webroot
        if [ ! -d "/var/www/html" ]; then
            echo "❌ Директория /var/www/html не найдена"
            echo "   Для SAN сертификата требуется webroot директория"
            exit 1
        fi

        sudo certbot certonly --webroot -w /var/www/html \
            --email ${EMAIL} --agree-tos \
            -d ${DOMAIN} -d www.${DOMAIN} -d mail.${DOMAIN}

        echo ""
        echo "✅ Сертификат установлен"
        echo ""
        echo "Файлы сертификата:"
        echo "   - /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
        echo "   - /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
        echo ""
        echo "Далее:"
        echo "1. Скопируйте сертификаты в docker/ssl/"
        echo "2. Перезапустите nginx: docker-compose restart nginx"
        ;;
    3)
        echo ""
        echo "Вы решили оставить текущий сертификат."
        echo ""
        echo "Для решения проблемы DNS выполните:"
        echo "1. Удалите или обновите MX запись (см. docs/DNS_FIX_INSTRUCTIONS.md)"
        echo "2. Обновите robots.txt (уже выполнено)"
        echo "3. Подождите 1-2 дня и проверьте снова в Яндекс Вебмастере"
        ;;
    *)
        echo "❌ Неверный выбор"
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "Проверка после обновления:"
echo "======================================"
echo ""
echo "Через 5 минут проверьте сертификат:"
echo "   bash ssl-check.sh"
echo ""
echo "Или:"
echo "   echo | openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} | openssl x509 -noout -text | grep DNS"
echo ""
