import { Registry, Counter, Histogram } from 'prom-client';

export function recordAnalyticsEvent(eventName: string, page: string): void {
  // Metrics are stored in Redis, see /api/analytics/events route
  // This function is a no-op here, actual recording happens in the API route
}

export function recordSessionDuration(exitPage: string, durationSeconds: number): void {
  // Session duration tracking would be implemented client-side
}

export async function getMetricsString(): Promise<string> {
  const registry = new Registry();

  const analyticsEventsTotal = new Counter({
    name: 'analytics_events_total',
    help: 'Total number of analytics events',
    labelNames: ['event_name', 'page'],
    registers: [registry],
  });

  const pageViewsTotal = new Counter({
    name: 'page_views_total',
    help: 'Total number of page views by page',
    labelNames: ['page'],
    registers: [registry],
  });

  const calculatorEventsTotal = new Counter({
    name: 'calculator_events_total',
    help: 'Total number of calculator interactions',
    labelNames: ['action'],
    registers: [registry],
  });

  const conversionFunnelTotal = new Counter({
    name: 'conversion_funnel_total',
    help: 'Users entering conversion funnel steps',
    labelNames: ['step'],
    registers: [registry],
  });

  const { redis } = await import('@/lib/redis');

  const keys = await redis.keys('analytics:metrics:*');

  for (const key of keys) {
    const data = await redis.hgetall(key);

    if (key.startsWith('analytics:metrics:events:')) {
      const parts = key.split(':');
      const eventName = parts[3];
      const page = parts.slice(4).join(':') || 'unknown';
      const count = parseInt(data.count || '0', 10);
      if (count > 0) {
        analyticsEventsTotal.inc({ event_name: eventName, page }, count);
      }
    } else if (key.startsWith('analytics:metrics:pageviews:')) {
      const page = key.replace('analytics:metrics:pageviews:', '');
      const count = parseInt(data.count || '0', 10);
      if (count > 0) {
        pageViewsTotal.inc({ page }, count);
      }
    } else if (key.startsWith('analytics:metrics:calculator:')) {
      const action = key.replace('analytics:metrics:calculator:', '');
      const count = parseInt(data.count || '0', 10);
      if (count > 0) {
        calculatorEventsTotal.inc({ action }, count);
      }
    } else if (key.startsWith('analytics:metrics:funnel:')) {
      const step = key.replace('analytics:metrics:funnel:', '');
      const count = parseInt(data.count || '0', 10);
      if (count > 0) {
        conversionFunnelTotal.inc({ step }, count);
      }
    }
  }

  return registry.metrics();
}

export { Registry };
