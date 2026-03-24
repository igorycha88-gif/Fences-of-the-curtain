#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "🔍 Local Development Health Check"
echo "=========================================="
echo ""

FAILURES=0

check_port_free() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}✗ Port $1 is already in use${NC}"
    FAILURES=$((FAILURES + 1))
    lsof -i :$1 | head -1
  else
    echo -e "${GREEN}✓ Port $1 is free${NC}"
  fi
}

check_postgres() {
  if nc -z localhost 5432 2>/dev/null || docker exec fences-db pg_isready -U postgres 2>/dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo "  Start with: docker-compose -f docker-compose.dev.yml up -d db"
    FAILURES=$((FAILURES + 1))
  fi
}

check_redis() {
  if redis-cli ping 2>/dev/null | grep -q PONG || docker exec fences-redis redis-cli -a ${REDIS_PASSWORD:-dev_redis_password_change_in_production} ping 2>/dev/null | grep -q PONG; then
    echo -e "${GREEN}✓ Redis is running${NC}"
  else
    echo -e "${YELLOW}⚠ Redis is not running (optional - some features may be limited)${NC}"
    echo "  Start with: docker-compose -f docker-compose.dev.yml up -d redis"
  fi
}

check_node_modules() {
  if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ node_modules exists${NC}"
  else
    echo -e "${RED}✗ node_modules not found${NC}"
    echo "  Run: npm install"
    FAILURES=$((FAILURES + 1))
  fi
}

check_env_file() {
  if [ -f ".env" ] || [ -f ".env.dev" ]; then
    echo -e "${GREEN}✓ Environment file exists${NC}"

    if [ -f ".env.dev" ]; then
      ENV_FILE=".env.dev"
    else
      ENV_FILE=".env"
    fi

    if grep -q "REPLACE_WITH_REAL_SECRET" "$ENV_FILE" 2>/dev/null; then
      echo -e "${YELLOW}⚠ Warning: .env file contains placeholder secrets${NC}"
    fi

    if grep -q "NEXTAUTH_SECRET=" "$ENV_FILE" 2>/dev/null; then
      SECRET=$(grep "NEXTAUTH_SECRET=" "$ENV_FILE" | cut -d'"' -f2 | cut -d'"' -f1)
      if [ ${#SECRET} -ge 32 ]; then
        echo -e "${GREEN}✓ NEXTAUTH_SECRET is valid (≥32 chars)${NC}"
      else
        echo -e "${RED}✗ NEXTAUTH_SECRET is too short (<32 chars)${NC}"
        FAILURES=$((FAILURES + 1))
      fi
    fi
  else
    echo -e "${RED}✗ Environment file not found${NC}"
    echo "  Run: cp .env.example .env.dev"
    FAILURES=$((FAILURES + 1))
  fi
}

check_port_free 3001
echo ""

check_postgres
check_redis
echo ""

check_node_modules
check_env_file
echo ""

if [ $FAILURES -eq 0 ]; then
  echo "=========================================="
  echo -e "${GREEN}✅ All checks passed! Ready to start.${NC}"
  echo "=========================================="
  echo ""
  echo "Start development:"
  echo "  npm run dev              # Local development"
  echo "  docker-compose -f docker-compose.dev.yml up -d  # Docker development"
  exit 0
else
  echo "=========================================="
  echo -e "${RED}❌ $FAILURES check(s) failed${NC}"
  echo "=========================================="
  exit 1
fi
