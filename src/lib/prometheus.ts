import { Registry, Counter, Gauge } from 'prom-client';
import { formatHistogramOutput } from './http-metrics';

let metricsCache: { data: string; timestamp: number } | null = null;
const METRICS_CACHE_TTL = 5000;

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
  if (metricsCache && Date.now() - metricsCache.timestamp < METRICS_CACHE_TTL) {
    return metricsCache.data;
  }

  const registry = new Registry();
  const { redis } = await import('@/lib/redis');

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

  const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'status', 'path'],
    registers: [registry],
  });

  const appUptime = new Gauge({
    name: 'app_uptime',
    help: 'Application uptime in seconds',
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

  const uniqueUsersToday = new Gauge({
    name: 'unique_users_today',
    help: 'Number of unique users today',
    registers: [registry],
  });

  const externalSourceVisitsTotal = new Counter({
    name: 'external_source_visits_total',
    help: 'Total visits from external advertising platforms',
    labelNames: ['source'],
    registers: [registry],
  });

  const keys = await scanKeys('analytics:metrics:*');

  const eventsKeys = keys.filter(k => k.startsWith('analytics:metrics:events:'));
  const externalKeys = keys.filter(k => k.startsWith('analytics:metrics:external_source:') && !k.includes(':daily'));

  const keysToFetch = [...eventsKeys, ...externalKeys];
  const batchPipeline = redis.pipeline();
  for (const key of keysToFetch) {
    batchPipeline.hgetall(key);
  }
  const batchResults = await batchPipeline.exec();

  for (let i = 0; i < keysToFetch.length; i++) {
    const key = keysToFetch[i];
    const result = batchResults?.[i];
    if (!result || result[0]) continue;
    const data = result[1] as Record<string, string>;

    if (key.startsWith('analytics:metrics:events:')) {
      const parts = key.split(':');
      const eventName = parts[3];
      const page = parts.slice(4).join(':') || 'unknown';
      const count = parseInt(data.count || '0', 10);
      if (count > 0) {
        analyticsEventsTotal.inc({ event_name: eventName, page }, count);

        if (eventName === 'page_view') {
          pageViewsTotal.inc({ page }, count);
          httpRequestsTotal.inc({ method: 'GET', status: '200', path: page }, count);
        }

        if (eventName.startsWith('calculator_')) {
          calculatorEventsTotal.inc({ action: eventName }, count);
        }

        const funnelSteps = [
          'page_view', 'calculator_open', 'calculator_fence_type_select',
          'calculator_configure', 'calculator_calculate', 'calculator_export',
          'portfolio_view', 'portfolio_item_click', 'contacts_view',
          'contact_form_submit', 'services_view', 'phone_click', 'exit',
        ];
        if (funnelSteps.includes(eventName)) {
          conversionFunnelTotal.inc({ step: eventName }, count);
        }

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
      continue;
    }

    if (key.startsWith('analytics:metrics:external_source:')) {
      const source = key.replace('analytics:metrics:external_source:', '');
      const count = parseInt(data.count || '0', 10);
      if (count > 0) {
        externalSourceVisitsTotal.inc({ source }, count);
        httpRequestsTotal.inc({ method: 'GET', status: '302', path: '/go/:source' }, count);
      }
    }
  }

  const ratePipeline = redis.pipeline();
  ratePipeline.get('analytics:metrics:rates:forms_last_minute');
  ratePipeline.get('analytics:metrics:rates:funnel_completion');
  ratePipeline.get('analytics:metrics:avg_session_duration');
  ratePipeline.get('analytics:metrics:unique_users_today');
  const rateResults = await ratePipeline.exec();

  const contactFormRateData = rateResults?.[0]?.[1] as string | null;
  if (contactFormRateData) {
    contactFormSubmissionsRate.set(parseFloat(contactFormRateData));
  }

  const funnelRateData = rateResults?.[1]?.[1] as string | null;
  if (funnelRateData) {
    conversionFunnelCompletionRate.set({ final_step: 'contact_form_submit' }, parseFloat(funnelRateData));
  }

  const avgSessionData = rateResults?.[2]?.[1] as string | null;
  if (avgSessionData) {
    averageSessionDuration.set(parseFloat(avgSessionData));
  }

  const uniqueUsersData = rateResults?.[3]?.[1] as string | null;
  if (uniqueUsersData) {
    uniqueUsersToday.set(parseInt(uniqueUsersData, 10));
  }

  appUptime.set(process.uptime());

  let output = await registry.metrics();

  const histogramOutput = formatHistogramOutput();
  if (histogramOutput) {
    output += '\n' + histogramOutput;
  }

  metricsCache = { data: output, timestamp: Date.now() };
  return output;
}
