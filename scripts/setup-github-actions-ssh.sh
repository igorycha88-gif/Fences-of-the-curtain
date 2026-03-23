#!/bin/bash

# Скрипт для генерации SSH ключей и настройки GitHub Actions

set -e

echo "=== Генерация SSH ключа для GitHub Actions ==="

# Генерация ключа
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy_key -N ""

echo "✅ SSH ключ сгенерирован:"
echo "   Приватный ключ: ~/.ssh/github_actions_deploy_key"
echo "   Публичный ключ:  ~/.ssh/github_actions_deploy_key.pub"
echo ""

# Вывод публичного ключа
echo "=== Публичный ключ (для добавления на VPS): ==="
echo "------------------------------------------------"
cat ~/.ssh/github_actions_deploy_key.pub
echo "------------------------------------------------"
echo ""

# Вывод инструкций для добавления на VPS
echo "=== Инструкция: ==="
echo ""
echo "1. Скопируйте публичный ключ выше"
echo ""
echo "2. Добавьте его на VPS:"
echo "   ssh root@37.143.13.196"
echo "   mkdir -p /root/.ssh"
echo "   cat >> /root/.ssh/authorized_keys << 'EOF'"
cat ~/.ssh/github_actions_deploy_key.pub
echo "EOF"
echo "   chmod 600 /root/.ssh/authorized_keys"
echo ""
echo "3. Добавьте приватный ключ в GitHub Secrets:"
echo "   a) Считайте приватный ключ:"
echo "      cat ~/.ssh/github_actions_deploy_key"
echo "   b) Зайдите в:"
echo "      https://github.com/igorycha88-gif/Fences-of-the-curtain/settings/secrets/actions"
echo "   c) Создайте секрет с именем: SSH_PRIVATE_KEY"
echo "   d) Вставьте содержимое приватного ключа (включая BEGIN/END строки)"
echo ""
echo "4. Удалите старый секрет SSH_PASSWORD из GitHub Secrets"
echo ""
echo "5. Создайте директорию для бэкапов на VPS:"
echo "   ssh root@37.143.13.196"
echo "   sudo mkdir -p /backup/fences"
echo "   sudo chown postgres:postgres /backup/fences"
echo ""
echo "✅ Настройка завершена!"
