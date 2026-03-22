#!/bin/bash
# SSH-туннель к PostgreSQL
# Использование: ./scripts/db-tunnel.sh [user@server]

SERVER="${1:-user@server}"

echo "Установка SSH-туннеля к PostgreSQL..."
echo "Подключение: psql -h localhost -p 5433 -U postgres -d fences"
echo ""
echo "Для GUI клиентов (DBeaver, pgAdmin):"
echo "  Host: localhost"
echo "  Port: 5433"
echo "  Database: fences"
echo "  User: postgres"
echo ""
echo "Нажмите Ctrl+C для закрытия туннеля"
echo "---"

ssh -L 5433:fences-db:5432 -N "$SERVER"
