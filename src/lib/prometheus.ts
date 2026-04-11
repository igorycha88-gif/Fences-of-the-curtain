export function recordAnalyticsEvent(eventName: string, page: string): void {}

export async function recordSessionDuration(exitPage: string, durationSeconds: number): Promise<void> {}

async function scanKeys(pattern: string): Promise<string[]> {
  const { redis } = await import('@/lib/redis');
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== '0');
  return keys;
}

export async function getMetricsString(): Promise<string> {
  const { Registry, Counter, Histogram, Gauge } = await import('prom-client');
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

  const phoneClicksTotal = new Counter({
    name: 'phone_clicks_total',
    help: 'Total number of phone clicks by page',
    labelNames: ['page'],
    registers: [registry],
  });

  const formSubmissionsTotal = new Counter({
    name: 'form_submissions_total',
    help: 'Total number of form submissions',
    labelNames: ['form_type', 'status'],
    registers: [registry],
  });

  const calculatorCompletionsTotal = new Counter({
    name: 'calculator_completions_total',
    help: 'Total number of completed calculator calculations',
    labelNames: ['fence_type'],
    registers: [registry],
  });

  const topFenceTypesTotal = new Counter({
    name: 'top_fence_types_total',
    help: 'Popular fence types count',
    labelNames: ['fence_type'],
    registers: [registry],
  });

  // Production metrics
  const appUptime = new Gauge({
    name: 'app_uptime',
    help: 'Application uptime in seconds',
    registers: [registry],
  });

  const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'status', 'path'],
    registers: [registry],
  });

  const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['path'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [registry],
  });

  const contactFormSubmissionsRate = new Gauge({
    name: 'contact_form_submissions_rate',
    help: 'Contact form submissions rate per minute',
    labelNames: ['form_type'],
    registers: [registry],
  });

  const conversionFunnelCompletionRate = new Gauge({
    name: 'conversion_funnel_completion_rate',
    help: 'Conversion funnel completion rate',
    labelNames: ['final_step'],
    registers: [registry],
  });

  const averageSessionDuration = new Gauge({
    name: 'average_session_duration_seconds',
    help: 'Average session duration in seconds',
    registers: [registry],
  });

  const uniqueUsersToday = new Counter({
    name: 'unique_users_today',
    help: 'Number of unique users today',
    registers: [registry],
  });

  const userRetentionRate = new Gauge({
    name: 'user_retention_rate',
    help: 'User retention rate',
    labelNames: ['day_interval'],
    registers: [registry],
  });

  const leadSubmissionsTotal = new Counter({
    name: 'lead_submissions_total',
    help: 'Total number of lead submissions',
    labelNames: ['lead_source'],
    registers: [registry],
  });

  const phoneCallsTotal = new Counter({
    name: 'phone_calls_total',
    help: 'Total number of phone calls',
    registers: [registry],
  });

  const leadResponseTime = new Histogram({
    name: 'lead_response_time_seconds',
    help: 'Lead response time in seconds',
    labelNames: ['contact_method'],
    buckets: [0.5, 1, 5, 10, 30, 60],
    registers: [registry],
  });

  const phoneCallDuration = new Histogram({
    name: 'phone_call_duration_seconds',
    help: 'Phone call duration in seconds',
    labelNames: ['masked'],
    buckets: [5, 15, 30, 60, 180, 300],
    registers: [registry],
  });

  const externalSourceVisitsTotal = new Counter({
    name: 'external_source_visits_total',
    help: 'Total visits from external advertising platforms',
    labelNames: ['source'],
    registers: [registry],
  });

  const { redis } = await import('@/lib/redis');
  const keys = await scanKeys('analytics:metrics:*');

  const metricsPromises = keys.map(async (key) => {
    const data = await redis.hgetall(key);

    if (key.startsWith('analytics:metrics:events:')) {
      const parts = key.split(':');
      const eventName = parts[3];
      const page = parts.slice(4).join(':') || 'unknown';
      const count = parseInt(data.count || '0', 10);
      if (count > 0) {
        analyticsEventsTotal.inc({ event_name: eventName, page }, count);

        if (eventName === 'phone_click') {
          phoneClicksTotal.inc({ page }, count);
        }

        if (eventName === 'contact_form_submit') {
          formSubmissionsTotal.inc({ form_type: 'contact', status: 'success' }, count);
        }

        if (eventName === 'calculator_calculate') {
          calculatorCompletionsTotal.inc({ fence_type: 'unknown' }, count);
          topFenceTypesTotal.inc({ fence_type: 'unknown' }, count);
        }
      }
      return;
    }

    if (key.startsWith('analytics:metrics:pageviews:')) {
      const page = key.replace('analytics:metrics:pageviews:', '');
      const count = parseInt(data.count || '0', 10);
      if (count > 0) {
        pageViewsTotal.inc({ page }, count);
      }
      return;
    }

    if (key.startsWith('analytics:metrics:calculator:')) {
      const action = key.replace('analytics:metrics:calculator:', '');
      const count = parseInt(data.count || '0', 10);
      if (count > 0) {
        calculatorEventsTotal.inc({ action }, count);
      }
      return;
    }

    if (key.startsWith('analytics:metrics:funnel:')) {
      const step = key.replace('analytics:metrics:funnel:', '');
      const count = parseInt(data.count || '0', 10);
      if (count > 0) {
        conversionFunnelTotal.inc({ step }, count);
      }
      return;
    }

    if (key.startsWith('analytics:metrics:external_source:')) {
      const source = key.replace('analytics:metrics:external_source:', '');
      if (!source.startsWith('daily')) {
        const count = parseInt(data.count || '0', 10);
        if (count > 0) {
          externalSourceVisitsTotal.inc({ source }, count);
        }
      }
      return;
    }
  });

  await Promise.all(metricsPromises);

  const contactFormSubmissionsRateKey = 'analytics:metrics:rates:forms_last_minute';
  const contactFormRateData = await redis.get(contactFormSubmissionsRateKey);
  contactFormSubmissionsRate.set(parseFloat(contactFormRateData || '0'));

  const conversionFunnelCompletionRateKey = 'analytics:metrics:rates:funnel_completion';
  const funnelRateData = await redis.get(conversionFunnelCompletionRateKey);
  conversionFunnelCompletionRate.set(parseFloat(funnelRateData || '0'));

  const averageSessionDurationKey = 'analytics:metrics:avg_session_duration';
  const avgData = await redis.get(averageSessionDurationKey);
  averageSessionDuration.set(parseFloat(avgData || '0'));

  const uniqueUsersTodayIncrement = await redis.get('analytics:metrics:unique_users_today') || '0';
  uniqueUsersToday.inc(parseInt(uniqueUsersTodayIncrement, 10) + 1);

  appUptime.set(process.uptime());

  return registry.metrics();
}