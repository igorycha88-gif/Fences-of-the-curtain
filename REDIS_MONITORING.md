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

# Check application reconnection
docker logs fences-app 2>&1 | tail -20

# Verify rate limiting is working
curl -X POST http://localhost:3001/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@example.com&password=test"
```

## Best Practices

### 1. Redis Configuration

```bash
# Set Redis maxmemory-policy
docker exec fences-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Set Redis maxmemory (example: 256MB)
docker exec fences-redis redis-cli CONFIG SET maxmemory 256mb
```

### 2. Redis Persistence

For production, enable Redis persistence:

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes
  volumes:
    - redis-data:/data
```

### 3. High Availability

For critical production systems:

- Use Redis Sentinel for automatic failover
- Use Redis Cluster for horizontal scaling
- Consider managed Redis (AWS ElastiCache, Redis Cloud)

## Metrics to Track

1. **Redis Connection Status**: Connected/Disconnected
2. **Rate Limit Checks**: Total requests checked
3. **Rate Limit Blocks**: Total requests blocked
4. **Redis Latency**: Response time for Redis operations
5. **Memory Usage**: Redis memory consumption

## Grafana Dashboard Example

```yaml
# Key metrics to display
- Redis connected clients
- Redis memory usage
- Rate limit checks per minute
- Rate limit blocks per minute
- Redis operation latency
```

## Security Considerations

### Email Masking in Logs

All emails in rate limit logs are masked to prevent PII leakage:

```
Original: admin@example.com
Logged: a***@example.com
```

### Log Retention

Configure log retention policy:

```yaml
# docker-compose.yml
app:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

## Troubleshooting

### Common Issues

1. **Redis Connection Refused**
   - Check if Redis container is running: `docker ps`
   - Check network connectivity: `docker network ls`

2. **High Memory Usage**
   - Check Redis memory: `redis-cli info memory`
   - Set TTL on rate limit keys (already implemented)

3. **Slow Response Time**
   - Monitor Redis latency
   - Consider Redis clustering for scale

## Support

For Redis-related issues:
- Check logs: `docker logs fences-app`
- Check Redis: `docker logs fences-redis`
- Contact: DevOps team
