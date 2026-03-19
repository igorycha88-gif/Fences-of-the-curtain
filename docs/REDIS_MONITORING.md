# Redis Monitoring & Alerting

## Overview

Rate limiting depends on Redis availability. This document describes monitoring and alerting strategies for production deployments.

## Fail-Open Policy

When Redis is unavailable, the rate limiting system uses a **fail-open policy**:

- ✅ **Benefit**: Authentication continues to work, users can still log in
- ⚠️ **Risk**: Rate limiting is temporarily disabled during Redis outage
- 📊 **Monitoring**: All Redis failures are logged with detailed information

## Monitoring Redis Health

### 1. Application Logs

Monitor application logs for Redis connection errors:

```bash
# Check for Redis errors in logs
docker logs fences-app 2>&1 | grep "Redis unavailable"
docker logs fences-app 2>&1 | grep "RATE LIMIT"
```

### 2. Redis Health Check

```bash
# Check Redis connectivity
docker exec fences-redis redis-cli ping
# Expected: PONG

# Check Redis info
docker exec fences-redis redis-cli info stats
```

### 3. Application Health Endpoint

The application logs Redis errors with detailed information:

```
[RATE LIMIT] Redis unavailable, skipping rate limit (fail-open policy). 
This allows authentication to continue but should be monitored. 
IP=192.168.1.100, Error: Connection refused
```

## Alerting Strategy

### Production Alerts

When `NODE_ENV=production`, Redis failures trigger additional warnings:

```
[RATE LIMIT] ALERT: Redis connection failed in production. 
Rate limiting is temporarily disabled. Monitor Redis health!
```

### Recommended Alerting Setup

#### Option 1: Log-based Alerts

Set up alerts on log patterns:

- **Alert**: Redis unavailable
- **Pattern**: `[RATE LIMIT] Redis unavailable`
- **Severity**: High
- **Action**: Notify DevOps team immediately

#### Option 2: Metrics-based Alerts

Export metrics to your monitoring system (Prometheus, Datadog, etc.):

```typescript
// Example: Add to rate-limit.ts
if (process.env.NODE_ENV === 'production') {
  metrics.increment('rate_limit.redis_failure');
}
```

#### Option 3: Health Check Endpoint

Create a health check endpoint that includes Redis status:

```typescript
// GET /api/health
{
  "status": "ok",
  "services": {
    "database": "connected",
    "redis": "connected",
    "rate_limit": "active"
  }
}
```

## Redis Connection Monitoring

### Docker Health Checks

Add health check to docker-compose.yml:

```yaml
services:
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Kubernetes Probes

```yaml
livenessProbe:
  exec:
    command:
      - redis-cli
      - ping
  initialDelaySeconds: 30
  periodSeconds: 10
```

## Incident Response

### Redis Outage Procedure

1. **Detection**: Application logs show Redis failures
2. **Impact Assessment**: Rate limiting is disabled, but auth still works
3. **Resolution**: Restart Redis or fix connection
4. **Verification**: Check logs for Redis reconnection

### Recovery Commands

```bash
# Restart Redis container
docker-compose restart redis

# Check application logs
docker logs fences-app --tail 50 | grep "RATE LIMIT"

# Verify Redis is working
docker exec fences-redis redis-cli ping
```

## Best Practices

1. **Monitor Redis Memory**: Set up alerts for Redis memory usage
2. **Connection Pooling**: Configure Redis connection pool appropriately
3. **Persistence**: Consider Redis persistence for rate limit data
4. **Backup**: Regular Redis backups if using persistence
5. **High Availability**: Consider Redis Sentinel or Cluster for production

## Security Considerations

### Email Masking in Logs

Email addresses in rate limit logs are automatically masked for privacy:

```
✅ Good: [RATE LIMIT] Blocked: IP=192.168.1.100, Email=a***@example.com, Attempts=6
❌ Bad:   [RATE LIMIT] Blocked: IP=192.168.1.100, Email=admin@example.com, Attempts=6
```

This prevents PII (Personal Identifiable Information) leakage in logs.

### Log Retention

- Follow your organization's log retention policy
- Ensure logs with masked emails comply with GDPR/privacy regulations
- Consider log aggregation services (ELK, Splunk, etc.)

## Testing Redis Failover

### Simulate Redis Failure

```bash
# Stop Redis
docker-compose stop redis

# Try to login - should still work (fail-open)
curl -X POST http://localhost:3001/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@fences.ru&password=admin123"

# Check logs for fail-open message
docker logs fences-app 2>&1 | grep "fail-open"

# Restart Redis
docker-compose start redis
```

## Metrics to Track

1. **Redis Connection Failures**: Count of Redis connection errors
2. **Rate Limit Blocks**: Number of blocked authentication attempts
3. **Rate Limit Bypass**: Count of fail-open events
4. **Redis Latency**: Response time for Redis operations
5. **Active Rate Limit Keys**: Number of active rate limit keys in Redis

## Monitoring Dashboard

Recommended Grafana dashboard panels:

1. **Redis Status**: Up/Down indicator
2. **Rate Limit Events**: Graph of blocked vs allowed attempts
3. **Fail-Open Events**: Counter of Redis unavailability
4. **Top Blocked IPs**: Table of most frequently blocked IPs
5. **Redis Memory Usage**: Memory consumption over time

---

**Related Documentation:**
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
