# Vercel Analytics Integration Guide

## Installation

```bash
npm install @vercel/analytics
```

## Environment Variables

Add to `.env`:

```bash
# Vercel Analytics (production)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id

# Vercel Analytics (development)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=dev-analytics-id
```

## Integration in Next.js

### Option 1: Using Vercel Provider (Recommended)

In `next.config.js`:

```javascript
const { withVercel } = require('@vercel/nextjs/plugin')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = withVercel(nextConfig);
```

### Option 2: Using Custom Tracking

Create `src/lib/analytics.ts`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export const analytics = new Analytics({
  debug: process.env.NODE_ENV === 'development',
});

export function trackEvent(name: string, properties?: Record<string, any>) {
  analytics.track(name, properties);
}

export function trackPageView(path: string) {
  analytics.pageview({ path });
}
```

Usage in components:

```typescript
import { trackEvent } from '@/lib/analytics';

export default function Button({ onClick, ...props }) {
  return (
    <button
      onClick={() => {
        trackEvent('button_click', { ...props });
        onClick?.();
      }}
      {...props}
    />
  );
}
```

## Events to Track

### User Interactions
- `button_click` - Click events on buttons
- `form_submit` - Form submissions
- `link_click` - Link clicks
- `page_view` - Page views
- `search_query` - Search queries

### Business Events
- `estimate_created` - Fence estimate created
- `order_submitted` - Order submitted
- `contact_form_sent` - Contact form submitted
- `user_login` - User logged in
- `user_logout` - User logged out

### Performance Events
- `page_load_time` - Page load time
- `api_response_time` - API response time
- `error_occurred` - Application errors

## Configuration

### Production
```typescript
// src/lib/analytics.ts
import { Analytics } from '@vercel/analytics/react';

export const analytics = new Analytics({
  mode: 'production',
});
```

### Development
```typescript
// src/lib/analytics.ts
import { Analytics } from '@vercel/analytics/react';

export const analytics = new Analytics({
  mode: 'development',
  debug: true,
});
```

## Custom Properties

You can add custom properties to events:

```typescript
trackEvent('estimate_created', {
  fence_type: 'euro_shtaketnik',
  fence_height: 2.0,
  estimated_price: 15000,
  user_id: userId,
});
```

## Dashboard Setup

After integrating analytics, you can:

1. Go to Vercel Dashboard
2. Create custom dashboards for:
   - Fence estimate trends
   - Popular fence types
   - Conversion rates
   - User engagement metrics

## Data Collection

### Automatic Collection

Vercel Analytics automatically collects:
- Page views
- Session duration
- Device information
- Geographic location
- Referrers
- Browser information

### Custom Events

You need to explicitly track:
- User interactions (button clicks, form submissions)
- Business events (estimates, orders, logins)
- Performance metrics (load times, errors)

## Privacy and Compliance

Ensure you:
- Inform users about data collection in privacy policy
- Allow users to opt-out
- Comply with GDPR requirements
- Anonymize personal data before tracking

## Example Implementation

### Track Estimate Creation

```typescript
// In your calculator component
import { trackEvent } from '@/lib/analytics';

export default function FenceCalculator() {
  const handleEstimateCreated = (estimate: Estimate) => {
    trackEvent('estimate_created', {
      fence_type: estimate.fenceType,
      total_price: estimate.totalPrice,
      panel_3d_count: estimate.panel3dCount,
      user_id: estimate.userId,
    });
  };

  return (
    <FenceCalculatorForm onSubmit={handleEstimateCreated} />
  );
}
```

### Track Page View

```typescript
// In your layout or page component
import { trackPageView } from '@/lib/analytics';

export default function Layout({ children }) {
  const router = useRouter();
  
  useEffect(() => {
    trackPageView(router.pathname);
  }, [router.pathname]);

  return (
    <div>{children}</div>
  );
}
```

## Benefits

- 📊 Real-time analytics without additional infrastructure
- 🚀 Built specifically for Next.js
- 🎯 Pre-built dashboards for common metrics
- 🔄 Automatic event tracking
- 🌍 Geographic and device analytics
- 💰 Free tier available
- 🔧 Easy integration with existing components

## Migration from Custom Analytics

If you have custom analytics:

```typescript
// Replace custom tracking with Vercel Analytics
// Old code:
function oldTracking(event) {
  sendToCustomEndpoint(event);
}

// New code:
import { trackEvent } from '@/lib/analytics';
trackEvent('event_name', properties);
```

## Next Steps

1. Install SDK: `npm install @vercel/analytics`
2. Configure environment variables in `.env`
3. Create analytics utility: `src/lib/analytics.ts`
4. Integrate tracking in components
5. Test in development mode
6. Deploy and verify in production dashboard

## Documentation

- **Vercel Analytics Docs:** https://vercel.com/docs/analytics
- **Next.js Integration:** https://vercel.com/docs/analytics/quickstart/nextjs
- **React SDK:** https://vercel.com/docs/analytics/sdk/react
