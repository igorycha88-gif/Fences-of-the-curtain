import logger from '@/lib/logger';

export const BUCKET_MINUTES = 10;
export const BUCKET_TTL_SEC = 26 * 3600;
const CACHE_TTL_MS = 60_000;
export const ACTIVE_WINDOW_SEC = 30 * 60;

export const MAX_EVENT_TYPES = 20;
export const MAX_SERVICES = 20;
export const MAX_REFERRALS = 10;

const MOSCOW_TZ = 'Europe/Moscow';
const BUCKET_PREFIX = 'analytics:tracking:b:';
const HLL_SESSIONS_PREFIX = 'analytics:tracking:hlls:';
const HLL_VISITORS_PREFIX = 'analytics:tracking:hllv:';
const ACTIVE_KEY = 'analytics:tracking:active';
const AVG_SESSION_KEY = 'analytics:metrics:avg_session_duration';

const SITE_HOSTS = new Set(['zabor-i-naves.ru', 'www.zabor-i-naves.ru', 'localhost']);

export interface RedisPipelineLike {
  hincrby(key: string, field: string, increment: number): unknown;
  pfadd(key: string, element: string): unknown;
  zadd(key: string, score: number, member: string): unknown;
  zremrangebyscore(key: string, min: number, max: number): unknown;
  expire(key: string, seconds: number): unknown;
}

export interface TrackingEventInput {
  eventName: string;
  sessionId: string;
  timestampMs: number;
  sessionJustStarted: boolean;
  isEngagement: boolean;
  isFirstPageView: boolean;
  service: string;
  referralHost: string;
}

export interface TrackingRawData {
  activeSessions: number;
  buckets: Record<string, Record<string, string>>;
  sessions24h: number;
  visitors24h: number;
  avgSessionDuration: number | null;
  leads24h: number;
  leads1h: number;
}

export interface LabelledSeries {
  label: string;
  count: number;
}

export interface TrackingMetrics {
  sessionsActive: number;
  pageViews24h: number;
  pageViews1h: number;
  uniqueVisitors24h: number;
  sessions24h: number;
  avgSessionDuration24h: number;
  bounceRate24h: number;
  leads24h: number;
  leads1h: number;
  conversionRate24h: number;
  events24h: LabelledSeries[];
  serviceClicks24h: LabelledSeries[];
  referralSources24h: LabelledSeries[];
}

export function getMoscowBucketKey(date: Date = new Date()): string {
  const parts = date.toLocaleString('sv-SE', { timeZone: MOSCOW_TZ });
  const digits = parts.replace(/\D/g, '');
  const minute = parseInt(digits.slice(10, 12), 10) || 0;
  const bucketMinute = minute - (minute % BUCKET_MINUTES);
  return `${digits.slice(0, 10)}${String(bucketMinute).padStart(2, '0')}`;
}

export function bucketKeysForWindow(hours: number, date: Date = new Date()): string[] {
  const buckets = Math.ceil((hours * 60) / BUCKET_MINUTES);
  const keys: string[] = [];
  for (let i = 0; i < buckets; i++) {
    keys.push(getMoscowBucketKey(new Date(date.getTime() - i * BUCKET_MINUTES * 60_000)));
  }
  return keys;
}

export function sanitizeServiceLabel(value: unknown): string {
  if (typeof value !== 'string') return '';
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ ._-]/g, '_')
    .replace(/\s+/g, '_');
  return cleaned.slice(0, 48);
}

export function extractExternalHost(referrer: unknown): string {
  if (typeof referrer !== 'string' || referrer.length === 0 || referrer.length > 512) return '';
  try {
    const url = new URL(referrer);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    const host = url.hostname.toLowerCase();
    if (!host || SITE_HOSTS.has(host)) return '';
    if (!/^[a-z0-9.-]+$/.test(host)) return '';
    return host.slice(0, 100);
  } catch {
    return '';
  }
}

export function extractServiceLabel(eventName: string, page: string, properties: Record<string, unknown>): string {
  const raw =
    (typeof properties.fenceType === 'string' && properties.fenceType) ||
    (typeof properties.fence_type === 'string' && properties.fence_type) ||
    (typeof properties.service === 'string' && properties.service) ||
    '';
  if (raw) return sanitizeServiceLabel(raw);
  if (typeof page === 'string') {
    const match = page.match(/^\/services\/([^/?#]+)/);
    if (match) return sanitizeServiceLabel(decodeURIComponent(match[1]));
  }
  if (eventName === 'calculator_canopy_open' || eventName === 'canopy_open') {
    return 'naves';
  }
  return '';
}

export function buildTrackingWrites(pipeline: RedisPipelineLike, input: TrackingEventInput): void {
  const bucketKey = getMoscowBucketKey(new Date(input.timestampMs));
  const hashKey = BUCKET_PREFIX + bucketKey;

  pipeline.hincrby(hashKey, `ev:${input.eventName}`, 1);
  pipeline.expire(hashKey, BUCKET_TTL_SEC);

  if (input.sessionJustStarted) {
    pipeline.hincrby(hashKey, 's_starts', 1);
  }
  if (input.isEngagement) {
    pipeline.hincrby(hashKey, 's_engaged', 1);
  }
  if (input.isFirstPageView) {
    pipeline.hincrby(hashKey, 'pv_sessions', 1);
  }
  if (input.service) {
    pipeline.hincrby(hashKey, `svc:${input.service}`, 1);
  }
  if (input.referralHost) {
    pipeline.hincrby(hashKey, `ref:${input.referralHost}`, 1);
  }

  const sessionsHll = HLL_SESSIONS_PREFIX + bucketKey;
  pipeline.pfadd(sessionsHll, input.sessionId);
  pipeline.expire(sessionsHll, BUCKET_TTL_SEC);

  if (input.eventName === 'page_view') {
    const visitorsHll = HLL_VISITORS_PREFIX + bucketKey;
    pipeline.pfadd(visitorsHll, input.sessionId);
    pipeline.expire(visitorsHll, BUCKET_TTL_SEC);
  }

  const nowMs = input.timestampMs;
  pipeline.zadd(ACTIVE_KEY, nowMs, input.sessionId);
  pipeline.zremrangebyscore(ACTIVE_KEY, -Infinity, nowMs - ACTIVE_WINDOW_SEC * 1000);
  pipeline.expire(ACTIVE_KEY, ACTIVE_WINDOW_SEC * 2);
}

function sumField(buckets: Record<string, Record<string, string>>, keys: string[], field: string): number {
  let total = 0;
  for (const key of keys) {
    const fields = buckets[key];
    if (!fields) continue;
    const value = parseInt(fields[field] || '0', 10);
    if (Number.isFinite(value) && value > 0) total += value;
  }
  return total;
}

function aggregateLabelled(
  buckets: Record<string, Record<string, string>>,
  keys: string[],
  prefix: string,
  maxLabels: number
): LabelledSeries[] {
  const totals = new Map<string, number>();
  for (const key of keys) {
    const fields = buckets[key];
    if (!fields) continue;
    for (const [field, rawValue] of Object.entries(fields)) {
      if (!field.startsWith(prefix)) continue;
      const value = parseInt(rawValue, 10);
      if (!Number.isFinite(value) || value <= 0) continue;
      const label = field.slice(prefix.length);
      if (!label) continue;
      totals.set(label, (totals.get(label) || 0) + value);
    }
  }
  if (totals.size === 0) return [];

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = sorted.slice(0, maxLabels);
  const rest = sorted.slice(maxLabels).reduce((sum, [, count]) => sum + count, 0);
  if (rest > 0) {
    top.push(['other', rest]);
  }
  return top.map(([label, count]) => ({ label, count }));
}

export function computeTrackingMetrics(raw: TrackingRawData, now: Date = new Date()): TrackingMetrics {
  const keys24 = bucketKeysForWindow(24, now);
  const keys1 = bucketKeysForWindow(1, now);

  const pageViews24h = sumField(raw.buckets, keys24, 'ev:page_view');
  const pageViews1h = sumField(raw.buckets, keys1, 'ev:page_view');
  const pvSessions24h = sumField(raw.buckets, keys24, 'pv_sessions');
  const engaged24h = sumField(raw.buckets, keys24, 's_engaged');

  const bounceRate24h =
    pvSessions24h > 0
      ? Math.min(1, Math.max(0, 1 - Math.min(engaged24h, pvSessions24h) / pvSessions24h))
      : 0;

  const conversionRate24h = raw.sessions24h > 0 ? raw.leads24h / raw.sessions24h : 0;

  return {
    sessionsActive: raw.activeSessions,
    pageViews24h,
    pageViews1h,
    uniqueVisitors24h: raw.visitors24h,
    sessions24h: raw.sessions24h,
    avgSessionDuration24h: raw.avgSessionDuration ?? 0,
    bounceRate24h,
    leads24h: raw.leads24h,
    leads1h: raw.leads1h,
    conversionRate24h,
    events24h: aggregateLabelled(raw.buckets, keys24, 'ev:', MAX_EVENT_TYPES),
    serviceClicks24h: aggregateLabelled(raw.buckets, keys24, 'svc:', MAX_SERVICES),
    referralSources24h: aggregateLabelled(raw.buckets, keys24, 'ref:', MAX_REFERRALS),
  };
}

export function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return String(Math.round(value * 10000) / 10000);
}

export function formatTrackingMetrics(metrics: TrackingMetrics): string {
  const lines: string[] = [];

  const gauges: [string, string, number][] = [
    ['business_sessions_active', 'Sessions active in the last 30 minutes', metrics.sessionsActive],
    ['business_page_views_24h', 'Page views in the last 24 hours', metrics.pageViews24h],
    ['business_page_views_1h', 'Page views in the last hour', metrics.pageViews1h],
    ['business_unique_visitors_24h', 'Unique visitors in the last 24 hours', metrics.uniqueVisitors24h],
    ['business_sessions_24h', 'Sessions in the last 24 hours', metrics.sessions24h],
    [
      'business_avg_session_duration_seconds_24h',
      'Average session duration in seconds over the last 24 hours',
      metrics.avgSessionDuration24h,
    ],
    ['business_bounce_rate_24h', 'Bounce rate over the last 24 hours (0..1)', metrics.bounceRate24h],
    ['business_leads_24h', 'Orders created in the last 24 hours', metrics.leads24h],
    ['business_leads_1h', 'Orders created in the last hour', metrics.leads1h],
    ['business_conversion_rate_24h', 'Leads to sessions conversion over the last 24 hours', metrics.conversionRate24h],
  ];

  for (const [name, help, value] of gauges) {
    lines.push(`# HELP ${name} ${help}`);
    lines.push(`# TYPE ${name} gauge`);
    lines.push(`${name} ${formatValue(value)}`);
  }

  if (metrics.events24h.length > 0) {
    lines.push('# HELP business_events_24h Analytics events by type over the last 24 hours');
    lines.push('# TYPE business_events_24h gauge');
    for (const entry of metrics.events24h) {
      lines.push(`business_events_24h{event_type="${escapeLabelValue(entry.label)}"} ${formatValue(entry.count)}`);
    }
  }

  if (metrics.serviceClicks24h.length > 0) {
    lines.push('# HELP business_service_clicks_24h Service and fence type clicks over the last 24 hours');
    lines.push('# TYPE business_service_clicks_24h gauge');
    for (const entry of metrics.serviceClicks24h) {
      lines.push(`business_service_clicks_24h{service="${escapeLabelValue(entry.label)}"} ${formatValue(entry.count)}`);
    }
  }

  if (metrics.referralSources24h.length > 0) {
    lines.push('# HELP business_referral_sources_24h Referral sources over the last 24 hours');
    lines.push('# TYPE business_referral_sources_24h gauge');
    for (const entry of metrics.referralSources24h) {
      lines.push(`business_referral_sources_24h{source="${escapeLabelValue(entry.label)}"} ${formatValue(entry.count)}`);
    }
  }

  return lines.join('\n') + '\n';
}

export async function collectTrackingRawData(now: Date = new Date()): Promise<TrackingRawData> {
  const { redis } = await import('@/lib/redis');
  const keys24 = bucketKeysForWindow(24, now);

  const pipeline = redis.pipeline();
  for (const key of keys24) {
    pipeline.hgetall(BUCKET_PREFIX + key);
  }
  pipeline.zcard(ACTIVE_KEY);
  pipeline.get(AVG_SESSION_KEY);
  pipeline.pfcount(...keys24.map((key) => HLL_SESSIONS_PREFIX + key));
  pipeline.pfcount(...keys24.map((key) => HLL_VISITORS_PREFIX + key));

  const results = await pipeline.exec();

  const buckets: Record<string, Record<string, string>> = {};
  let activeSessions = 0;
  let avgSessionDuration: number | null = null;
  let sessions24h = 0;
  let visitors24h = 0;

  if (results) {
    keys24.forEach((key, index) => {
      const result = results[index];
      const data = result && !result[0] ? (result[1] as Record<string, string> | null) : null;
      if (data && Object.keys(data).length > 0) {
        buckets[key] = data;
      }
    });
    const activeResult = results[keys24.length];
    if (activeResult && !activeResult[0] && typeof activeResult[1] === 'number') {
      activeSessions = activeResult[1];
    }
    const avgResult = results[keys24.length + 1];
    if (avgResult && !avgResult[0] && typeof avgResult[1] === 'string') {
      const parsed = parseFloat(avgResult[1]);
      if (Number.isFinite(parsed)) avgSessionDuration = parsed;
    }
    const sessionsResult = results[keys24.length + 2];
    if (sessionsResult && !sessionsResult[0] && typeof sessionsResult[1] === 'number') {
      sessions24h = sessionsResult[1];
    }
    const visitorsResult = results[keys24.length + 3];
    if (visitorsResult && !visitorsResult[0] && typeof visitorsResult[1] === 'number') {
      visitors24h = visitorsResult[1];
    }
  }

  const since24h = new Date(now.getTime() - 24 * 3600 * 1000);
  const since1h = new Date(now.getTime() - 3600 * 1000);
  const { prisma } = await import('@/lib/prisma');
  const [leads24h, leads1h] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: since24h } } }),
    prisma.order.count({ where: { createdAt: { gte: since1h } } }),
  ]);

  return {
    activeSessions,
    buckets,
    sessions24h,
    visitors24h,
    avgSessionDuration,
    leads24h,
    leads1h,
  };
}

let trackingCache: { data: string; timestamp: number } | null = null;

export function resetTrackingMetricsCache(): void {
  trackingCache = null;
}

export async function getTrackingMetricsString(): Promise<string> {
  if (trackingCache && Date.now() - trackingCache.timestamp < CACHE_TTL_MS) {
    return trackingCache.data;
  }

  const startedAt = Date.now();
  try {
    const raw = await collectTrackingRawData();
    const metrics = computeTrackingMetrics(raw);
    const output = formatTrackingMetrics(metrics);
    trackingCache = { data: output, timestamp: Date.now() };
    logger.info('Tracking metrics generated', {
      module: 'tracking-metrics',
      operation: 'getTrackingMetricsString',
      durationMs: Date.now() - startedAt,
      pageViews24h: metrics.pageViews24h,
      leads24h: metrics.leads24h,
    });
    return output;
  } catch (error) {
    logger.error('Failed to generate tracking metrics', {
      module: 'tracking-metrics',
      operation: 'getTrackingMetricsString',
      durationMs: Date.now() - startedAt,
      error,
    });
    throw error;
  }
}
