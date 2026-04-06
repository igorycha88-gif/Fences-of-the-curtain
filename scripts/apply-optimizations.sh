#!/bin/bash

set -e

echo "=========================================="
echo "APPLYING PERFORMANCE OPTIMIZATIONS"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
git pull origin master2
echo ""

echo -e "${YELLOW}Step 2: Stopping containers...${NC}"
docker-compose down
echo ""

echo -e "${YELLOW}Step 3: Rebuilding Docker images with optimizations...${NC}"
docker-compose build --no-cache app
echo ""

echo -e "${YELLOW}Step 4: Updating Nginx configuration...${NC}"
if [ -f docker/nginx.optimized.conf ]; then
    cp docker/nginx.optimized.conf docker/nginx.conf
    echo -e "${GREEN}✓ Nginx configuration updated${NC}"
else
    echo -e "${YELLOW}⚠ Optimized nginx.conf not found, using existing${NC}"
fi
echo ""

echo -e "${YELLOW}Step 5: Starting services...${NC}"
docker-compose up -d
echo ""

echo -e "${YELLOW}Step 6: Waiting for services to be healthy...${NC}"
sleep 10

# Check if containers are running
if docker ps | grep -q fences-app; then
    echo -e "${GREEN}✓ App container is running${NC}"
else
    echo -e "${RED}✗ App container failed to start${NC}"
    docker-compose logs app
    exit 1
fi

if docker ps | grep -q fences-db; then
    echo -e "${GREEN}✓ Database container is running${NC}"
else
    echo -e "${RED}✗ Database container failed to start${NC}"
    exit 1
fi

if docker ps | grep -q fences-redis; then
    echo -e "${GREEN}✓ Redis container is running${NC}"
else
    echo -e "${RED}✗ Redis container failed to start${NC}"
    exit 1
fi

if docker ps | grep -q fences-nginx; then
    echo -e "${GREEN}✓ Nginx container is running${NC}"
else
    echo -e "${RED}✗ Nginx container failed to start${NC}"
    exit 1
fi

echo ""

echo -e "${YELLOW}Step 7: Running database migrations...${NC}"
docker-compose exec -T app npx prisma migrate deploy
echo ""

echo -e "${YELLOW}Step 8: Health check...${NC}"
sleep 5

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Application is healthy (HTTP $RESPONSE)${NC}"
else
    echo -e "${RED}✗ Health check failed (HTTP $RESPONSE)${NC}"
    echo "Checking logs..."
    docker-compose logs --tail=50 app
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 9: Performance test...${NC}"
echo "Testing homepage response time..."
TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3000/)
echo -e "  Homepage load time: ${TIME}s"

echo "Testing API response time..."
TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3000/api/health)
echo -e "  API response time: ${TIME}s"

echo ""
echo "=========================================="
echo -e "${GREEN}OPTIMIZATIONS APPLIED SUCCESSFULLY!${NC}"
echo "=========================================="
echo ""
echo "Summary of changes:"
echo "  ✓ Removed console.log from production cache"
echo "  ✓ Optimized Redis connection (removed lazyConnect)"
echo "  ✓ Added Prisma connection pooling"
echo "  ✓ Updated Nginx with gzip compression"
echo "  ✓ Increased cache TTL (10m → 30m)"
echo "  ✓ Optimized Next.js configuration"
echo "  ✓ Added image optimization"
echo ""
echo "Monitor performance improvements:"
echo "  ./scripts/diagnose-performance.sh"
echo ""
