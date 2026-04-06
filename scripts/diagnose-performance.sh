#!/bin/bash

echo "=========================================="
echo "DIAGNOSTICS: Fences of the Curtain"
echo "Performance Analysis"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. System Resources
echo "1. SYSTEM RESOURCES"
echo "-------------------"
echo ""

# CPU
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print "  Usage: " $2 + $4 "%"}'
echo ""

# Memory
echo "Memory Usage:"
free -h | awk 'NR==2{printf "  Used: %s / %s (%.2f%%)\n", $3, $2, $3*100/$2}'
echo ""

# Disk
echo "Disk Usage:"
df -h / | awk 'NR==2{printf "  Used: %s / %s (%s)\n", $3, $2, $5}'
echo ""

# 2. Docker Containers Status
echo "2. DOCKER CONTAINERS"
echo "--------------------"
echo ""

if command -v docker &> /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null
    echo ""
    
    echo "Container Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null
    echo ""
else
    print_warning "Docker not found - checking systemd services..."
    systemctl status fences --no-pager -l 2>/dev/null | head -20
    echo ""
fi

# 3. Database Analysis
echo "3. DATABASE (PostgreSQL)"
echo "------------------------"
echo ""

if command -v docker &> /dev/null; then
    # Check PostgreSQL connections
    echo "Active Connections:"
    docker exec fences-db psql -U postgres -d fences -c "SELECT count(*) as total_connections FROM pg_stat_activity;" 2>/dev/null
    echo ""
    
    # Check database size
    echo "Database Size:"
    docker exec fences-db psql -U postgres -d fences -c "SELECT pg_size_pretty(pg_database_size('fences')) as db_size;" 2>/dev/null
    echo ""
    
    # Check table sizes
    echo "Top 10 Largest Tables:"
    docker exec fences-db psql -U postgres -d fences -c "
    SELECT 
        schemaname,
        relname as table_name,
        pg_size_pretty(pg_total_relation_size(relid)) as total_size,
        n_live_tup as row_count
    FROM pg_stat_user_tables 
    ORDER BY pg_total_relation_size(relid) DESC 
    LIMIT 10;" 2>/dev/null
    echo ""
    
    # Check for long-running queries
    echo "Long-Running Queries (>5 seconds):"
    docker exec fences-db psql -U postgres -d fences -c "
    SELECT 
        pid,
        now() - pg_stat_activity.query_start AS duration,
        query,
        state
    FROM pg_stat_activity 
    WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
    AND state != 'idle'
    ORDER BY duration DESC;" 2>/dev/null
    echo ""
    
    # Check for locks
    echo "Database Locks:"
    docker exec fences-db psql -U postgres -d fences -c "
    SELECT 
        mode,
        count(*) as lock_count
    FROM pg_locks
    GROUP BY mode
    ORDER BY count(*) DESC;" 2>/dev/null
    echo ""
fi

# 4. Redis Analysis
echo "4. REDIS CACHE"
echo "--------------"
echo ""

if command -v docker &> /dev/null; then
    # Check Redis status
    echo "Redis Info:"
    docker exec fences-redis redis-cli -a "$(cat ./secrets/redis_password 2>/dev/null)" INFO stats 2>/dev/null | grep -E "(total_connections_received|total_commands_processed|instantaneous_ops_per_sec|keyspace_hits|keyspace_misses)"
    echo ""
    
    # Check memory usage
    echo "Redis Memory:"
    docker exec fences-redis redis-cli -a "$(cat ./secrets/redis_password 2>/dev/null)" INFO memory 2>/dev/null | grep -E "(used_memory_human|used_memory_peak_human|maxmemory_human)"
    echo ""
    
    # Check number of keys
    echo "Total Keys:"
    docker exec fences-redis redis-cli -a "$(cat ./secrets/redis_password 2>/dev/null)" DBSIZE 2>/dev/null
    echo ""
    
    # Check hit/miss ratio
    echo "Cache Hit Ratio:"
    docker exec fences-redis redis-cli -a "$(cat ./secrets/redis_password 2>/dev/null)" INFO stats 2>/dev/null | grep -E "keyspace_(hits|misses)" | awk -F: '{hits+=$2} END {if (hits+misses > 0) printf "  %.2f%%\n", (hits/(hits+misses))*100; else print "  N/A"}'
    echo ""
fi

# 5. Application Logs Analysis
echo "5. APPLICATION LOGS (Last 100 lines)"
echo "------------------------------------"
echo ""

if command -v docker &> /dev/null; then
    echo "Recent Errors:"
    docker logs fences-app --tail 100 2>&1 | grep -i "error\|warning\|fail" | tail -20
    echo ""
    
    echo "Slow Queries (if logged):"
    docker logs fences-app --tail 500 2>&1 | grep -i "slow\|timeout\|took" | tail -10
    echo ""
fi

# 6. Nginx Analysis
echo "6. NGINX STATUS"
echo "---------------"
echo ""

if command -v docker &> /dev/null; then
    echo "Nginx Status:"
    docker exec fences-nginx curl -s http://localhost/nginx_status 2>/dev/null
    echo ""
    
    echo "Nginx Cache Status:"
    docker exec fences-nginx ls -lh /var/cache/nginx/ 2>/dev/null | head -10
    echo ""
fi

# 7. Network Latency Tests
echo "7. NETWORK PERFORMANCE"
echo "----------------------"
echo ""

echo "Internal Service Latency:"
echo "  App → Database:"
docker exec fences-app sh -c "time nc -zv db 5432" 2>&1 | grep real
echo ""

echo "  App → Redis:"
docker exec fences-app sh -c "time nc -zv redis 6379" 2>&1 | grep real
echo ""

# 8. Application Health Check
echo "8. APPLICATION HEALTH"
echo "---------------------"
echo ""

echo "Health Endpoint Response:"
if command -v docker &> /dev/null; then
    curl -s -w "\n  Time: %{time_total}s\n  Status: %{http_code}\n" http://localhost:3000/api/health 2>/dev/null
else
    curl -s -w "\n  Time: %{time_total}s\n  Status: %{http_code}\n" http://localhost:3000/api/health 2>/dev/null
fi
echo ""

# 9. Response Time Analysis
echo "9. RESPONSE TIME ANALYSIS"
echo "-------------------------"
echo ""

echo "Homepage Load Time:"
curl -s -w "  DNS: %{time_namelookup}s\n  Connect: %{time_connect}s\n  TTFB: %{time_starttransfer}s\n  Total: %{time_total}s\n" -o /dev/null http://localhost:3000/ 2>/dev/null
echo ""

echo "API Response Time:"
curl -s -w "  Total: %{time_total}s\n" -o /dev/null http://localhost:3000/api/health 2>/dev/null
echo ""

# 10. Performance Issues Summary
echo "10. POTENTIAL ISSUES DETECTED"
echo "-----------------------------"
echo ""

# Check for common issues
ISSUES_FOUND=0

# Check if console.log in production
if docker logs fences-app --tail 50 2>&1 | grep -q "\[Cache\]"; then
    print_warning "Cache logging detected in production (console.log slows down app)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check memory usage
MEMORY_USAGE=$(free | awk '/Mem/{printf "%.0f", ($3/$2)*100}')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    print_warning "High memory usage: ${MEMORY_USAGE}%"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check disk usage
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    print_warning "High disk usage: ${DISK_USAGE}%"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check Docker container restarts
RESTART_COUNT=$(docker inspect fences-app --format='{{.RestartCount}}' 2>/dev/null)
if [ "$RESTART_COUNT" -gt 0 ]; then
    print_warning "App container has restarted ${RESTART_COUNT} times"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}No critical issues detected${NC}"
fi

echo ""
echo "=========================================="
echo "Diagnostics Complete"
echo "=========================================="
