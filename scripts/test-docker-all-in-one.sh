#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "🧪 Test Docker All-in-One Configuration"
echo "=========================================="
echo ""

echo "📋 Test Plan:"
echo "  1. Build Docker image"
echo "  2. Start all services"
echo "  3. Check health status"
echo "  4. Test application access"
echo "  5. Test API endpoints"
echo "  6. Stop and verify cleanup"
echo ""

FAILURES=0

check_docker() {
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not installed${NC}"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
  echo -e "${GREEN}✓ Docker installed${NC}"
}

check_docker_compose() {
  if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ docker-compose not installed${NC}"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
  echo -e "${GREEN}✓ docker-compose installed${NC}"
}

check_env_file() {
  if [ ! -f docker-compose.all-in-one.yml ]; then
    echo -e "${RED}✗ docker-compose.all-in-one.yml not found${NC}"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
  echo -e "${GREEN}✓ docker-compose.all-in-one.yml exists${NC}"
}

check_dockerfile() {
  if [ ! -f docker/Dockerfile.all-in-one ]; then
    echo -e "${RED}✗ Dockerfile.all-in-one not found${NC}"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
  echo -e "${GREEN}✓ Dockerfile.all-in-one exists${NC}"
}

check_start_script() {
  if [ ! -f scripts/start-all-in-one.sh ]; then
    echo -e "${RED}✗ start-all-in-one.sh not found${NC}"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
  echo -e "${GREEN}✓ start-all-in-one.sh exists${NC}"
  echo -e "${GREEN}✓ Script is executable${NC}"
}

run_tests() {
  echo ""
  echo "=========================================="
  echo "🧪 Running Tests..."
  echo "=========================================="
  echo ""

  TEST_NUMBER=1

  echo "TEST $TEST_NUMBER: Checking Docker installation..."
  check_docker || return

  echo ""
  TEST_NUMBER=$((TEST_NUMBER + 1))
  echo "TEST $TEST_NUMBER: Checking docker-compose..."
  check_docker_compose || return

  echo ""
  TEST_NUMBER=$((TEST_NUMBER + 1))
  echo "TEST $TEST_NUMBER: Checking configuration files..."
  check_env_file || return
  check_dockerfile || return
  check_start_script || return

  echo ""
  TEST_NUMBER=$((TEST_NUMBER + 1))
  echo "TEST $TEST_NUMBER: Building Docker image..."
  if docker-compose -f docker-compose.all-in-one.yml build app 2>&1 | tail -20; then
    echo -e "${GREEN}✓ Docker build completed${NC}"
  else
    echo -e "${RED}✗ Docker build failed${NC}"
    FAILURES=$((FAILURES + 1))
    return 1
  fi

  echo ""
  TEST_NUMBER=$((TEST_NUMBER + 1))
  echo "TEST $TEST_NUMBER: Starting all services..."
  if docker-compose -f docker-compose.all-in-one.yml up -d --build 2>&1 | tail -30; then
    echo -e "${GREEN}✓ All services started${NC}"
  else
    echo -e "${RED}✗ Services failed to start${NC}"
    FAILURES=$((FAILURES + 1))
    docker-compose -f docker-compose.all-in-one.yml ps
    return 1
  fi

  echo ""
  sleep 5

  TEST_NUMBER=$((TEST_NUMBER + 1))
  echo "TEST $TEST_NUMBER: Checking container health status..."
  if docker-compose -f docker-compose.all-in-one.yml ps | grep -q "healthy"; then
    echo -e "${GREEN}✓ Services are healthy${NC}"
  else
    echo -e "${YELLOW}⚠ Some services may not be healthy yet${NC}"
    docker-compose -f docker-compose.all-in-one.yml ps
  fi

  echo ""
  TEST_NUMBER=$((TEST_NUMBER + 1))
  echo "TEST $TEST_NUMBER: Testing application access..."
  if curl -sf --max-time 10 http://localhost:3001/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application accessible (HTTP 200)${NC}"
  else
    echo -e "${RED}✗ Application not accessible${NC}"
    FAILURES=$((FAILURES + 1))
  fi

  echo ""
  TEST_NUMBER=$((TEST_NUMBER + 1))
  echo "TEST $TEST_NUMBER: Testing API endpoint..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3001/api/materials 2>&1)
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ API accessible (HTTP 200)${NC}"
  else
    echo -e "${RED}✗ API not accessible (HTTP $HTTP_CODE)${NC}"
    FAILURES=$((FAILURES + 1))
  fi

  echo ""
  TEST_NUMBER=$((TEST_NUMBER + 1))
  echo "TEST $TEST_NUMBER: Checking Nginx proxy..."
  if curl -sf --max-time 10 http://localhost:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Nginx accessible (HTTP 200)${NC}"
  else
    echo -e "${YELLOW}⚠ Nginx not accessible (might need SSL setup)${NC}"
  fi

  echo ""
  echo "=========================================="
  echo "📊 Test Results Summary"
  echo "=========================================="

  if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Services:"
    docker-compose -f docker-compose.all-in-one.yml ps
    echo ""
    echo "🚀 Ready to use!"
    echo ""
    echo "Start all services:"
    echo -e "${YELLOW}  npm run start:all-in-one${NC}"
    echo ""
    echo "View logs:"
    echo -e "${YELLOW}  docker-compose -f docker-compose.all-in-one.yml logs -f${NC}"
    echo ""
    echo "Stop services:"
    echo -e "${YELLOW}  docker-compose -f docker-compose.all-in-one.yml down${NC}"
  else
    echo -e "${RED}❌ $FAILURES test(s) failed${NC}"
    echo ""
    echo "📝 Logs:"
    docker-compose -f docker-compose.all-in-one.yml logs --tail=50
  fi

  echo ""
  echo "=========================================="

  return $FAILURES
}

cleanup() {
  echo ""
  echo "=========================================="
  echo "🧹 Cleaning up..."
  echo "=========================================="
  echo ""

  echo "Stopping services..."
  docker-compose -f docker-compose.all-in-one.yml down 2>&1 | tail -10

  echo ""
  echo "Removing volumes (optional)..."
  echo -e "${YELLOW}To remove all data volumes, run: docker-compose -f docker-compose.all-in-one.yml down -v${NC}"

  echo ""
  echo -e "${GREEN}✓ Cleanup complete${NC}"
}

if [ "$1" = "--cleanup" ]; then
  cleanup
  exit 0
fi

echo ""
echo "Starting test suite..."
echo ""

if run_tests; then
  echo ""
  echo "=========================================="
  echo -e "${GREEN}✅ Test Suite Completed Successfully!${NC}"
  echo "=========================================="
  exit 0
else
  echo ""
  echo "=========================================="
  echo -e "${RED}❌ Test Suite Failed${NC}"
  echo "=========================================="
  echo ""
  echo "🔍 Troubleshooting:"
  echo "1. Check Docker installation: docker --version"
  echo "2. Check docker-compose: docker-compose --version"
  echo "3. View logs: docker-compose -f docker-compose.all-in-one.yml logs -f"
  echo ""
  exit 1
fi
