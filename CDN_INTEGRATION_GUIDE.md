# CDN Integration Guide

## Overview

Content Delivery Network (CDN) improves:
- Page load times by serving content from edge locations
- Reduce server load and bandwidth costs
- Better user experience worldwide
- Improved SEO through faster content delivery

## CDN Options

### Cloudflare CDN (Recommended)

**Pros:**
- Free plan available
- Automatic HTTPS
- Built-in DDoS protection
- Smart caching rules
- Easy DNS management
- Global edge network

**Setup Steps:**

1. Add domain to Cloudflare
2. Update DNS nameservers to Cloudflare
3. Configure cache rules
4. Enable image optimization

**Configuration:**

```bash
# Add to .env or docker-compose.yml
CDN_ENABLED=true
CDN_PROVIDER=cloudflare
CDN_DOMAIN=zabor-i-naves.ru
CDN_API_TOKEN=your-cloudflare-api-token
```

### AWS CloudFront (Alternative)

**Pros:**
- Highly scalable
- Integration with AWS ecosystem
- Advanced caching options
- Multiple edge locations

**Setup Steps:**

1. Create S3 bucket for static assets
2. Configure CloudFront distribution
3. Update DNS to point to CloudFront
4. Set up cache behaviors

### Vercel Edge Network

**Pros:**
- Automatic with Vercel deployment
- No additional configuration needed
- Built-in image optimization
- Global edge network

**Setup:**

Just deploy to Vercel - CDN is automatic

## Configuration

### Nginx Configuration

Update `docker/nginx.conf` for CDN integration:

```nginx
# Cloudflare CDN configuration
# Add CDN domain to proxy_pass
# Cache rules for CDN

upstream cdn {
    server zabor-i-naves.ru.cdn.cloudflare.net;
    keepalive 32;
}

server {
    # ... existing configuration
    
    # Proxy through CDN
    location /portfolio/ {
        proxy_pass http://cdn;
        proxy_cache off; # CDN handles caching
        
        # Cache headers for CDN
        add_header X-CDN-Cache-Status "HIT";
    }
    
    location /uploads/ {
        proxy_pass http://cdn;
        proxy_cache off;
        
        # Cache headers for CDN
        add_header X-CDN-Cache-Status "HIT";
    }
}
```

### Environment Variables

```bash
# .env.production
CDN_ENABLED=true
CDN_DOMAIN=zabor-i-naves.ru
CDN_PROVIDER=cloudflare

# For Next.js
NEXT_PUBLIC_CDN_URL=https://zabor-i-naves.ru
```

## Image Optimization with CDN

### Automatic Image Optimization

Configure Next.js to work with CDN:

```javascript
// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zabor-i-naves.ru',
        pathname: '/portfolio/**',
      },
      {
        protocol: 'https',
        hostname: 'zabor-i-naves.ru.cdn.cloudflare.net', // CDN
        pathname: '/uploads/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
};
```

### Manual Image Optimization

Optimize images before upload:

```bash
# Install tools
npm install squoosh @squoosh/cli

# Optimize existing images
squoosh compress --format webp,avif --quality 80 ./public/uploads/portfolio/*
```

## Caching Strategy

### Browser Caching

Set appropriate cache headers:

```nginx
# In docker/nginx.conf
location ~* \.(jpg|jpeg|png|webp|avif|gif|svg)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
}
```

### CDN Caching

Configure cache rules in CDN dashboard:

```bash
# Cloudflare
- Cache Level: Standard
- Browser Cache TTL: 1 hour
- Edge Cache TTL: 1 day
- Purge on demand

# AWS CloudFront
- Default TTL: 86400 seconds (24 hours)
- Min TTL: 0 seconds
- Forwarded query strings: Disabled
```

## Monitoring

Track CDN performance:

```typescript
import { trackEvent } from '@/lib/analytics';

export function trackCDNHit(url: string, edgeLocation: string, loadTime: number) {
  trackEvent('cdn_cache_hit', {
    url: url,
    edge_location: edgeLocation,
    load_time_ms: loadTime,
    cached: true,
  });
}

export function trackCDNMiss(url: string, edgeLocation: string, loadTime: number) {
  hitEvent('cdn_cache_miss', {
    url: url,
    edge_location: edgeLocation,
    load_time_ms: loadTime,
    cached: false,
  });
}

export function trackCDNPurge(filePattern: string) {
  trackEvent('cdn_cache_purge', {
    file_pattern: filePattern,
    timestamp: new Date().toISOString(),
  });
}
```

## CDN Purging

### Cloudflare

Manual purge:

```bash
# Using Cloudflare API
curl -X POST "https://api.cloudflare.com/client/v4/zones/zone_id/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"files":["*","/*"],"tags":["environment=production"]}'
```

### AWS CloudFront

Automatic invalidation:

```javascript
// In your admin panel or API route
import AWS from 'aws-sdk';

const cloudfront = new AWS.CloudFront({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

await cloudfront.createInvalidation({
  DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
  InvalidationBatch: {
    CallerReference: `invalidate-${Date.now()}`,
    Paths: {
      Quantity: 1,
      Items: ['/portfolio/*', '/uploads/*'],
    },
  },
}).promise();
```

## Performance Testing

### Lighthouse

Test CDN performance:

```bash
# Run Lighthouse audit
npm install -g lighthouse
lighthouse https://zabor-i-naves.ru --view --chrome-flags="--disable-storage-reset-throttling"
```

### WebPageTest

```bash
# Test from multiple locations
npm install -g @lhci/cli-webpagetest
lighthouse https://zabor-i-naves.ru --preset=desktop
```

## Cost Optimization

### Bandwidth Estimation

Calculate potential savings:

```bash
# Without CDN
# 1000 pageviews × 500KB/image = 500MB/month

# With CDN + 70% optimization
# 1000 pageviews × 150KB/image = 150MB/month
# Savings: 350MB/month (70% reduction)
```

### Configuration Tips

1. Enable image optimization in CDN dashboard
2. Set appropriate cache TTLs
3. Use cache purge for content updates
4. Monitor CDN metrics regularly

## Implementation Steps

1. Choose CDN provider (Cloudflare recommended)
2. Update DNS nameservers
3. Configure nginx proxy for CDN
4. Update Next.js config for CDN URLs
5. Set up caching strategy
6. Implement CDN purging
7. Monitor performance
8. Optimize images before upload
9. Test and validate

## Troubleshooting

### Cache Not Updating

If CDN cache is not updating:

```bash
# Check cache rules
curl -I https://zabor-i-naves.ru/portfolio/image.jpg

# Manually purge cache
make cdn-purge
```

### Mixed Content

If some content is served from CDN and some from origin:

```nginx
# Ensure consistent proxy configuration
# Check for redirect loops
# Verify CDN origin configuration
```

### HTTPS Issues

```bash
# Check SSL configuration
curl -Iv https://zabor-i-naves.ru

# Verify SSL certificate
openssl s_client -connect zabor-i-naves.ru:443 -servername zabor-i-naves.ru
```

## Documentation

- **Cloudflare Docs:** https://developers.cloudflare.com/cache/
- **Next.js CDN:** https://nextjs.org/docs/app/building-your-application/configuring/images/cdn
- **AWS CloudFront:** https://docs.aws.amazon.com/cloudfront/

## Resources

- **Cloudflare:** https://dash.cloudflare.com/
- **AWS:** https://console.aws.amazon.com/cloudfront/
- **CDN Performance Testing:** https://www.webpagetest.org/
