#!/bin/bash

# Script for diagnosing production issues
# Run this on the server: bash diagnose.sh

set -e

echo "=========================================="
echo "Production Diagnostics Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Please run as root${NC}"
   exit 1
fi

# 1. Check PM2
echo "=== PM2 Status ==="
if command -v pm2 &> /dev/null; then
    pm2 list
    pm2 logs fences-app --lines 50 --nostream || true
else
    echo -e "${RED}PM2 not installed${NC}"
fi
echo ""

# 2. Check Docker containers
echo "=== Docker Containers ==="
if command -v docker &> /dev/null; then
    docker ps -a
else
    echo -e "${RED}Docker not installed${NC}"
fi
echo ""

# 3. Check PostgreSQL
echo "=== PostgreSQL Status ==="
if command -v psql &> /dev/null; then
    sudo -u postgres psql -c "SELECT version();" || echo -e "${RED}PostgreSQL check failed${NC}"
    sudo -u postgres psql -d fences -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null || echo -e "${RED}Cannot connect to fences DB${NC}"
else
    echo -e "${RED}PostgreSQL client not installed${NC}"
fi
echo ""

# 4. Check Redis
echo "=== Redis Status ==="
if command -v redis-cli &> /dev/null; then
    redis-cli ping 2>/dev/null || echo -e "${RED}Redis not responding${NC}"
else
    echo -e "${RED}Redis client not installed${NC}"
fi
echo ""

# 5. Check Nginx
echo "=== Nginx Status ==="
if command -v nginx &> /dev/null; then
    nginx -t
    systemctl status nginx | head -20
    netstat -tlnp | grep -E ':(80|443|3001|3000)' || echo -e "${YELLOW}No processes on ports 80, 443, 3001, 3000${NC}"
else
    echo -e "${RED}Nginx not installed${NC}"
fi
echo ""

# 6. Check ports
echo "=== Port Status ==="
for port in 80 443 3000 3001 5432 6379; do
    if netstat -tlnp 2>/dev/null | grep ":$port " > /dev/null; then
        echo -e "${GREEN}Port $port: OPEN${NC}"
    else
        echo -e "${RED}Port $port: CLOSED${NC}"
    fi
done
echo ""

# 7. Check application response
echo "=== Application Health Check ==="
for attempt in {1..3}; do
    echo "Attempt $attempt/3..."
    if curl -sf --max-time 5 http://localhost:3001/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓ App responds on port 3001${NC}"
        curl -I http://localhost:3001/ | head -5
        break
    elif curl -sf --max-time 5 http://localhost:3000/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓ App responds on port 3000${NC}"
        curl -I http://localhost:3000/ | head -5
        break
    else
        echo -e "${RED}✗ App not responding (attempt $attempt)${NC}"
    fi
    sleep 2
done
echo ""

# 8. Check SSL certificates
echo "=== SSL Certificates ==="
if [ -d "/root/Fences-of-the-curtain/ssl" ]; then
    ls -la /root/Fences-of-the-curtain/ssl/
    if [ -f "/root/Fences-of-the-curtain/ssl/cert.pem" ]; then
        openssl x509 -in /root/Fences-of-the-curtain/ssl/cert.pem -noout -dates || echo -e "${RED}Invalid cert${NC}"
    fi
else
    echo -e "${RED}SSL directory not found${NC}"
fi
echo ""

# 9. Check environment variables
echo "=== Environment Variables ==="
if [ -f "/root/Fences-of-the-curtain/.env" ]; then
    echo -e "${GREEN}.env file exists${NC}"
    grep -E "^(NODE_ENV|DATABASE_URL|REDIS_URL|NEXTAUTH_URL)" /root/Fences-of-the-curtain/.env | sed 's/=.*/=***HIDDEN***/'
else
    echo -e "${RED}.env file not found${NC}"
fi
echo ""

# 10. Check logs
echo "=== Recent Logs ==="
tail -50 /var/log/fences-app/error.log 2>/dev/null || echo -e "${YELLOW}No error log${NC}"
echo ""

# 11. Disk space
echo "=== Disk Space ==="
df -h | grep -E "(/$|/var|/home)"
echo ""

# 12. Memory
echo "=== Memory Usage ==="
free -h
echo ""

echo "=========================================="
echo "Diagnostics Complete"
echo "=========================================="
