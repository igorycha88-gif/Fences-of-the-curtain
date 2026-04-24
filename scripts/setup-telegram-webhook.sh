#!/bin/bash
set -euo pipefail

BOT_TOKEN="${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN not set}"
WEBHOOK_SECRET="${TELEGRAM_WEBHOOK_SECRET:?TELEGRAM_WEBHOOK_SECRET not set}"
WEBHOOK_URL="${WEBHOOK_URL:-https://zabor-i-naves.ru/api/telegram/webhook}"

FULL_URL="${WEBHOOK_URL}?secret=${WEBHOOK_SECRET}"

echo "Setting Telegram webhook to: ${WEBHOOK_URL}?secret=***"

RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${FULL_URL}\", \"allowed_updates\": [\"message\"]}")

echo "Response: ${RESPONSE}"

if echo "${RESPONSE}" | grep -q '"ok":true'; then
  echo "Webhook set successfully!"
else
  echo "ERROR: Failed to set webhook"
  exit 1
fi
