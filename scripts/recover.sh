#!/bin/bash

# Quick Server Recovery Script
# Run this on the production server to fix all issues

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== FENCES PRODUCTION RECOVERY ===${NC}"
echo ""

APP_DIR="/root/Fences-of-the-curtain"

# Step 1: Diagnose
echo -e "${YELLOW}[1/5] Running diagnostics...${NC}"
if [ -f "$APP_DIR/scripts/diagnose.sh" ]; then
    bash "$APP_DIR/scripts/diagnose.sh"
else
    echo -e "${RED}Diagnose script not found!${NC}"
fi

echo ""
read -p "Press Enter to continue..."

# Step 2: Pull latest changes
echo -e "${YELLOW}[2/5] Pulling latest changes...${NC}"
cd "$APP_DIR"
git fetch origin
git pull origin master

# Step 3: Install dependencies
echo -e "${YELLOW}[3/5] Installing dependencies...${NC}"
npm install --legacy-peer-deps

# Step 4: Generate Prisma client
echo -e "${YELLOW}[4/5] Generating Prisma client...${NC}"
npx prisma generate

# Step 5: Restart application
echo -e "${YELLOW}[5/5] Restarting application...${NC}"
if pm2 list | grep -q "fences-app"; then
    echo "Reloading existing PM2 process..."
    pm2 reload ecosystem.config.js --env production
else
    echo "Starting new PM2 process..."
    pm2 start ecosystem.config.js --env production
fi

pm2 save

echo ""
echo -e "${GREEN}=== RECOVERY COMPLETE ===${NC}"
echo ""
echo "Check application status:"
echo "  pm2 logs fences-app --lines 50"
echo "  curl -I http://localhost:3001/"
echo ""
echo "Setup SSL (if needed):"
echo "  bash $APP_DIR/scripts/setup-ssl.sh yourdomain.com"
echo ""
echo "Setup database backups (run once):"
echo "  crontab -e"
echo "  # Add: 0 2 * * * /root/Fences-of-the-curtain/scripts/backup-db.sh"
