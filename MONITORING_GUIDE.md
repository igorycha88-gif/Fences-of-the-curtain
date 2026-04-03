# Monitoring & Analytics Setup Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ sendBeacon()│  │ useAnalytics │  │ Yandex/Google GA   │ │
│  │ → /api/     │  │ hook         │  │ (external)         │ │
│  │ analytics   │  │ (page views) │  │                    │ │
│  └──────┬──────┘  └──────┬───────┘  └────────────────────┘ │
└─────────┼────────────────┼──────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                      │
│  - SSL termination (port 443)                                │
│  - Rate limiting (10r/s)                                     │
│  - Proxy cache (100MB)                                       │
│  - Basic auth for /grafana/ (htpasswd)                       │
└──────┬───────────────────────────────────────────────────────┘
       │
       ├──► /api/analytics/events → Redis (analytics data)
       │                              ↓
       ├──► /api/metrics ────────── Prometheus format
       │                              ↓
       │                          Prometheus scrapes every 10s
       │                              ↓
       │                          Grafana dashboards
       │
       ├──► Next.js App (:3000)
       │       ├──► PostgreSQL (:5432)
       │       └──► Redis (:6379)
       │
       └──► /grafana/ → Grafana (:3000) [basic auth protected]
```

## Quick Start (Local Development)

```bash
# 1. Copy env templates
cp .env.example .env
cp .env.monitoring.example .env.monitoring

# 2. Generate secrets
openssl rand -base64 32  # for NEXTAUTH_SECRET, CRON_SECRET, etc.

# 3. Create Grafana htpasswd (local dev, password: admin)
htpasswd -bcB docker/.htpasswd admin admin

# 4. Start everything
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# 5. Access
# - Site: http://localhost:3000
# - Grafana: http://localhost/grafana/ (admin:admin)
# - Prometheus: NOT publicly accessible (internal only)
```

## Production Deployment

### 1. Generate Strong Passwords

```bash
# Main secrets
openssl rand -base64 32 > secrets/redis_password
openssl rand -base64 32  # copy to NEXTAUTH_SECRET in .env
openssl rand -base64 32  # copy to CRON_SECRET in .env
openssl rand -base64 32  # copy to GRAFANA_ADMIN_PASSWORD in .env

# Grafana htpasswd (use the SAME password as GRAFANA_ADMIN_PASSWORD)
htpasswd -bcB docker/.htpasswd admin YOUR_GRAFANA_PASSWORD
```

### 2. Configure .env on Production Server

```bash
# Copy and edit
cp .env.example .env
cp .env.monitoring.example .env.monitoring

# Edit .env and .env.monitoring with real values
# NEVER commit these files!
```

### 3. Disable PostgreSQL Public Port (Production)

In `docker-compose.yml`, comment out the `ports` section for the `db` service:

```yaml
db:
  # ports:  # Comment out in production!
  #   - "5433:5432"
```

### 4. Start Services

```bash
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d --build
```

### 5. Verify

```bash
# Check all services
docker ps

# Test Grafana access (should require auth)
curl -s -o /dev/null -w "%{http_code}" http://your-domain/grafana/
# Expected: 401

# Test with auth
curl -s -o /dev/null -w "%{http_code}" -u admin:YOUR_PASSWORD http://your-domain/grafana/
# Expected: 200

# Verify Prometheus is NOT publicly accessible
curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://your-domain:9090/
# Expected: connection refused/timeout
```

## Security Checklist

- [x] Grafana accessible only via Nginx with basic auth
- [x] Prometheus and exporters have NO public ports
- [x] `docker/.htpasswd` is in `.gitignore` (not committed)
- [x] Grafana has no default password fallback
- [x] CSP headers configured in middleware
- [x] Rate limiting on Grafana endpoint (burst=10)
- [x] Redis password via Docker secrets
- [x] SSL/TLS with strong ciphers
- [ ] PostgreSQL port closed in production (manual step)
- [ ] Strong passwords generated for all secrets

## Grafana Dashboards

| Dashboard | Description |
|-----------|-------------|
| System Overview | CPU, memory, disk, network |
| PostgreSQL Metrics | DB connections, queries, locks |
| Redis Metrics | Memory, connections, hit rate |
| User Analytics - Fences | Page views, calculator usage, conversion funnel |

## Analytics Events Tracked

| Event | When Triggered |
|-------|---------------|
| `page_view` | Every page visit (auto via middleware + hook) |
| `calculator_open` | User opens calculator |
| `calculator_fence_type_select` | User selects fence type |
| `calculator_calculate` | User calculates estimate |
| `portfolio_view` | User views portfolio page |
| `portfolio_item_click` | User clicks portfolio item |
| `contact_form_submit` | User submits contact form |
| `services_view` | User views services page |

## Troubleshooting

### Grafana shows "No Data"
1. Check Prometheus targets: `curl -s http://localhost:9090/api/v1/targets` (from server)
2. Verify `nextjs-app` target is `up`
3. Check metrics endpoint: `curl http://localhost:3000/api/metrics`

### Prometheus can't scrape metrics
1. Check rule files exist or are commented out in `prometheus.yml`
2. Verify `/api/metrics` returns data: `curl http://localhost:3000/api/metrics`
3. Check Prometheus logs: `docker logs fences-prometheus`

### Grafana 401/403 errors
1. Verify `docker/.htpasswd` exists and has correct format
2. Check password matches `GRAFANA_ADMIN_PASSWORD` in `.env`
3. Regenerate: `htpasswd -Bbn admin YOUR_PASSWORD > docker/.htpasswd`

### Analytics events not recording
1. Check Redis: `docker exec fences-redis redis-cli -a YOUR_PASSWORD keys "analytics:*"`
2. Check API logs: `docker logs fences-app | grep analytics`
3. Verify client sends events: browser DevTools → Network → `/api/analytics/events`
