#!/bin/bash

# ==========================================
# DEPLOYMENT SCRIPT: Master2 -> Production
# ==========================================

set -e

echo "[START] Deploying master2 to production..."

APP_DIR="/root/Fences-of-the-curtain"
BACKUP_DIR="$APP_DIR/backups"
DB_NAME="fences"
DB_USER="postgres"
DB_HOST="localhost"

# 1. Backup Database
echo "[1/7] Creating database backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
PGPASSWORD='HVt6G6LE6mduMrAny91F' pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > "$BACKUP_DIR/backup_before_master2_deploy_$TIMESTAMP.sql"
echo "Backup saved to: backup_before_master2_deploy_$TIMESTAMP.sql"

# 2. Stash local changes
echo "[2/7] Stashing local changes..."
cd $APP_DIR
git stash push -m "deploy-stash-$(date +%s)"

# 3. Fetch and Checkout master2
echo "[3/7] Switching to master2..."
git fetch origin
git checkout master2
git pull origin master2

# 4. Install Dependencies
echo "[4/7] Installing dependencies..."
npm ci

# 5. Generate Prisma Client
echo "[5/7] Generating Prisma client..."
npx prisma generate

# 6. Sync Database Schema
echo "[6/7] Syncing database schema (db push)..."
# Using db push because migration history has drift (files deleted in master2)
npx prisma db push --accept-data-loss
echo "Schema synced successfully."

# 7. Build Application
echo "[7/7] Building application..."
npm run build

# 8. Restart PM2
echo "[8/8] Restarting PM2..."
pm2 restart fences-app

echo "[SUCCESS] Deployment completed successfully!"
echo "Please verify the application at http://37.143.13.196"
