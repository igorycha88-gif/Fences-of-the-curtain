#!/bin/bash

SECRETS_DIR="./secrets"
SECRET_FILE="$SECRETS_DIR/redis_password"

if [ -f "$SECRET_FILE" ]; then
  echo "Secret already exists at $SECRET_FILE"
  echo "To regenerate, delete the file first: rm $SECRET_FILE"
  exit 1
fi

mkdir -p "$SECRETS_DIR"
openssl rand -base64 32 > "$SECRET_FILE"
chmod 600 "$SECRET_FILE"

echo "Redis password generated and saved to $SECRET_FILE"
echo "IMPORTANT: This file is in .gitignore and should never be committed"
