#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "🚀 Quick Start - All-in-One Docker"
echo "=========================================="
echo ""

check_env_file() {
  if [ ! -f .env ] && [ ! -f .env.dev ]; then
    echo -e "${YELLOW}⚠️  Warning: No .env file found${NC}"
    echo -e "${YELLOW}   Creating .env.example as fallback...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}   Please edit .env with your secrets!${NC}"
    echo ""
  else
    if [ -f .env ]; then
      echo -e "${GREEN}✓ Using .env file${NC}"
      ENV_FILE=".env"
    else
      echo -e "${GREEN}✓ Using .env.dev file${NC}"
      ENV_FILE=".env.dev"
    fi
  fi
}

check_postgres_password() {
  if grep -q "REPLACE_WITH_REAL_SECRET" $ENV_FILE 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: POSTGRES_PASSWORD not set${NC}"
  else
    echo -e "${GREEN}✓ POSTGRES_PASSWORD configured${NC}"
  fi
}

check_redis_password() {
  if grep -q "REPLACE_WITH_REAL_SECRET" $ENV_FILE 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: REDIS_PASSWORD not set${NC}"
  else
    echo -e "${GREEN}✓ REDIS_PASSWORD configured${NC}"
  fi
}

check_nextauth_secret() {
  if grep -q "NEXTAUTH_SECRET=" $ENV_FILE 2>/dev/null; then
    SECRET=$(grep "NEXTAUTH_SECRET=" $ENV_FILE | cut -d'"' -f2 | cut -d'"' -f1)
    if [ ${#SECRET} -ge 32 ]; then
      echo -e "${GREEN}✓ NEXTAUTH_SECRET valid (≥32 chars)${NC}"
    else
      echo -e "${YELLOW}⚠️  Warning: NEXTAUTH_SECRET too short (<32 chars)${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  Warning: NEXTAUTH_SECRET not set${NC}"
  fi
}

echo "🔍 Checking environment..."
check_env_file
check_postgres_password
check_redis_password
check_nextauth_secret
echo ""

echo "=========================================="
echo "🐳 Starting all services (App + DB + Redis)"
echo "=========================================="
echo ""

echo -e "${YELLOW}Services:${NC}"
echo "  • Application (port 3001)"
echo "  • PostgreSQL (port 5432)"
echo "  • Redis (port 6379)"
echo "  • Nginx (ports 80, 443, 3001)"
echo ""

echo -e "${GREEN}Building and starting...${NC}"
docker-compose -f docker-compose.all-in-one.yml up -d --build

echo ""
echo "=========================================="
echo -e "${GREEN}✅ All services started!${NC}"
echo "=========================================="
echo ""

echo -e "📊 Status check:"
docker-compose -f docker-compose.all-in-one.yml ps

echo ""
echo "🌐 Access URLs:"
echo -e "  • Application: ${GREEN}http://localhost:3001${NC}"
echo -e "  • Nginx (HTTP): ${GREEN}http://localhost:80${NC}"
echo -e "  • Nginx (HTTPS): ${GREEN}https://localhost:443${NC}"
echo ""

echo -e "📝 Logs:"
echo -e "  View all logs: ${YELLOW}docker-compose -f docker-compose.all-in-one.yml logs -f${NC}"
echo -e "  View app logs:  ${YELLOW}docker-compose -f docker-compose.all-in-one.yml logs -f app${NC}"
echo -e "  View DB logs:    ${YELLOW}docker-compose -f docker-compose.all-in-one.yml logs -f db${NC}"
echo ""

echo -e "🛑 Stop services:"
echo -e "  ${YELLOW}docker-compose -f docker-compose.all-in-one.yml down${NC}"
echo ""
