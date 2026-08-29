import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/redis', () => {
  const pipeline = {
    hgetall: jest.fn(),
    zcard: jest.fn(),
    get: jest.fn(),
    pfcount: jest.fn(),
    exec: jest.fn(),
  };
  return {
    redis: {
      pipeline: jest.fn(() => pipeline),
    },
  };
});

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      count: jest.fn(),
    },
  },
}));

import {
  getMoscowBucketKey,
  bucketKeysForWindow,
  sanitizeServiceLabel,
  extractExternalHost,
  extractServiceLabel,
  buildTrackingWrites,
  computeTrackingMetrics,
  formatTrackingMetrics,
  escapeLabelValue,
  getTrackingMetricsString,
  resetTrackingMetricsCache,
  BUCKET_MINUTES,
  type TrackingRawData,
  type RedisPipelineLike,
} from '@/lib/tracking-metrics';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

const flush = () => new Promise((resolve) => setImmediate(resolve));

function makePipeline(): RedisPipelineLike & { calls: Array<{ op: string; args: unknown[] }> } {
  const calls: Array<{ op: string; args: unknown[] }> = [];
  const record = (op: string) => (...args: unknown[]) => {
    calls.push({ op, args });
    return pipeline;
  };
  const pipeline = {
    calls,
    hincrby: record('hincrby'),
    pfadd: record('pfadd'),
    zadd: record('zadd'),
    zremrangebyscore: record('zremrangebyscore'),
    expire: record('expire'),
  };
  return pipeline as ReturnType<typeof makePipeline>;
}

function callsWith(pipeline: ReturnType<typeof makePipeline>, op: string, keyField: string): unknown[][] {
  return pipeline.calls
    .filter((c) => c.op === op)
    .map((c) => c.args)
    .filter((args) => String(args[1]).startsWith(keyField));
}

describe('bucket keys', () => {
  it('truncates minutes to 10-minute buckets in Moscow time', () => {
    expect(getMoscowBucketKey(new Date('2026-08-24T15:03:00Z'))).toBe('202608241800');
    expect(getMoscowBucketKey(new Date('2026-08-24T15:57:00Z'))).toBe('202608241850');
    expect(getMoscowBucketKey(new Date('2026-08-24T21:00:59Z'))).toBe('202608250000');
  });

  it('returns 6 buckets for 1h window and 144 for 24h', () => {
    const now = new Date('2026-08-24T15:03:00Z');
    const keys1 = bucketKeysForWindow(1, now);
    const keys24 = bucketKeysForWindow(24, now);
    expect(keys1).toHaveLength(60 / BUCKET_MINUTES);
    expect(keys24).toHaveLength(144);
    expect(new Set(keys24).size).toBe(144);
    expect(keys24[0]).toBe(getMoscowBucketKey(now));
    expect(keys1[0]).toBe(getMoscowBucketKey(now));
  });
});

describe('sanitizeServiceLabel', () => {
  it('keeps alphanumerics and replaces unsafe chars', () => {
    expect(sanitizeServiceLabel('Профнастил С8')).toBe('Профнастил_С8');
    expect(sanitizeServiceLabel('3D-"панель"\n')).toBe('3D-_панель_');
    expect(sanitizeServiceLabel('   ')).toBe('');
    expect(sanitizeServiceLabel(42)).toBe('');
  });

  it('caps length at 48', () => {
    expect(sanitizeServiceLabel('a'.repeat(100)).length).toBe(48);
  });
});

describe('extractExternalHost', () => {
  it('extracts external host', () => {
    expect(extractExternalHost('https://yandex.ru/search?text=заборы')).toBe('yandex.ru');
    expect(extractExternalHost('http://VK.com/foo')).toBe('vk.com');
  });

  it('rejects own site, invalid and non-http referrers', () => {
    expect(extractExternalHost('https://zabor-i-naves.ru/')).toBe('');
    expect(extractExternalHost('https://www.zabor-i-naves.ru/')).toBe('');
    expect(extractExternalHost('android-app://ru.yandex.search')).toBe('');
    expect(extractExternalHost('not a url')).toBe('');
    expect(extractExternalHost('')).toBe('');
    expect(extractExternalHost(undefined)).toBe('');
  });
});

describe('extractServiceLabel', () => {
  it('takes fenceType from properties', () => {
    expect(extractServiceLabel('calculator_fence_type_select', '/', { fenceType: 'Профнастил' })).toBe('Профнастил');
    expect(extractServiceLabel('calculator_calculate', '/', { fence_type: 'Сетка-рабица' })).toBe('Сетка-рабица');
  });

  it('derives service from /services/ page', () => {
    expect(extractServiceLabel('services_view', '/services/navesy-iz-metallocherepicy', {})).toBe(
      'navesy-iz-metallocherepicy'
    );
  });

  it('returns empty string without service data', () => {
    expect(extractServiceLabel('page_view', '/', {})).toBe('');
  });
});

describe('buildTrackingWrites', () => {
  const ts = new Date('2026-08-24T15:03:00Z').getTime();

  it('writes page_view structures for a new session', () => {
    const pipeline = makePipeline();
    buildTrackingWrites(pipeline, {
      eventName: 'page_view',
      sessionId: 'sess-1',
      timestampMs: ts,
      sessionJustStarted: true,
      isEngagement: false,
      isFirstPageView: true,
      service: '',
      referralHost: 'yandex.ru',
    });

    const bucket = '202608241800';
    const ev = callsWith(pipeline, 'hincrby', 'ev:');
    expect(ev).toContainEqual([`analytics:tracking:b:${bucket}`, 'ev:page_view', 1]);
    expect(callsWith(pipeline, 'hincrby', 's_starts')).toHaveLength(1);
    expect(callsWith(pipeline, 'hincrby', 'pv_sessions')).toHaveLength(1);
    expect(callsWith(pipeline, 'hincrby', 's_engaged')).toHaveLength(0);
    expect(callsWith(pipeline, 'hincrby', 'ref:')).toContainEqual([
      `analytics:tracking:b:${bucket}`,
      'ref:yandex.ru',
      1,
    ]);

    const pf = pipeline.calls.filter((c) => c.op === 'pfadd');
    expect(pf.map((c) => c.args[0])).toEqual([
      `analytics:tracking:hlls:${bucket}`,
      `analytics:tracking:hllv:${bucket}`,
    ]);

    expect(pipeline.calls.some((c) => c.op === 'zadd' && c.args[0] === 'analytics:tracking:active')).toBe(true);
    expect(pipeline.calls.some((c) => c.op === 'zremrangebyscore')).toBe(true);
    expect(pipeline.calls.some((c) => c.op === 'expire')).toBe(true);
  });

  it('skips visitor HLL and page-view counters for non page_view events', () => {
    const pipeline = makePipeline();
    buildTrackingWrites(pipeline, {
      eventName: 'calculator_calculate',
      sessionId: 'sess-1',
      timestampMs: ts,
      sessionJustStarted: false,
      isEngagement: true,
      isFirstPageView: false,
      service: 'Профнастил',
      referralHost: '',
    });

    expect(pipeline.calls.some((c) => c.op === 'pfadd' && String(c.args[0]).includes('hllv'))).toBe(false);
    expect(callsWith(pipeline, 'hincrby', 'pv_sessions')).toHaveLength(0);
    expect(callsWith(pipeline, 'hincrby', 's_engaged')).toHaveLength(1);
    expect(callsWith(pipeline, 'hincrby', 'svc:')).toContainEqual([
      'analytics:tracking:b:202608241800',
      'svc:Профнастил',
      1,
    ]);
    expect(callsWith(pipeline, 'hincrby', 'ref:')).toHaveLength(0);
  });
});

function emptyRaw(): TrackingRawData {
  return {
    activeSessions: 0,
    buckets: {},
    sessions24h: 0,
    visitors24h: 0,
    avgSessionDuration: null,
    leads24h: 0,
    leads1h: 0,
    geo24h: {},
  };
}

describe('computeTrackingMetrics', () => {
  const now = new Date('2026-08-24T15:03:00Z');
  const currentBucket = getMoscowBucketKey(now);
  const prevBucket = getMoscowBucketKey(new Date(now.getTime() - 10 * 60_000));

  it('aggregates windows, rates and labelled series (happy path)', () => {
    const raw = emptyRaw();
    raw.activeSessions = 7;
    raw.sessions24h = 100;
    raw.visitors24h = 80;
    raw.avgSessionDuration = 134.5;
    raw.leads24h = 10;
    raw.leads1h = 2;
    raw.buckets[currentBucket] = {
      'ev:page_view': '30',
      'ev:calculator_open': '5',
      'ev:phone_click': '2',
      s_starts: '25',
      s_engaged: '10',
      pv_sessions: '25',
      'svc:Профнастил': '4',
      'ref:yandex.ru': '3',
    };
    raw.buckets[prevBucket] = {
      'ev:page_view': '70',
      s_engaged: '2',
      pv_sessions: '20',
      'svc:Профнастил': '6',
      'ref:vk.com': '1',
    };

    const m = computeTrackingMetrics(raw, now);

    expect(m.sessionsActive).toBe(7);
    expect(m.pageViews24h).toBe(100);
    expect(m.pageViews1h).toBe(100);
    expect(m.uniqueVisitors24h).toBe(80);
    expect(m.sessions24h).toBe(100);
    expect(m.avgSessionDuration24h).toBe(134.5);
    expect(m.leads24h).toBe(10);
    expect(m.leads1h).toBe(2);
    expect(m.conversionRate24h).toBeCloseTo(0.1, 5);
    expect(m.bounceRate24h).toBeCloseTo(1 - 12 / 45, 5);

    expect(m.events24h).toEqual([
      { label: 'page_view', count: 100 },
      { label: 'calculator_open', count: 5 },
      { label: 'phone_click', count: 2 },
    ]);
    expect(m.serviceClicks24h).toEqual([{ label: 'Профнастил', count: 10 }]);
    expect(m.referralSources24h).toEqual([
      { label: 'yandex.ru', count: 3 },
      { label: 'vk.com', count: 1 },
    ]);
  });

  it('1h window excludes buckets older than one hour', () => {
    const raw = emptyRaw();
    const oldBucket = getMoscowBucketKey(new Date(now.getTime() - 2 * 3600 * 1000));
    raw.buckets[currentBucket] = { 'ev:page_view': '5' };
    raw.buckets[oldBucket] = { 'ev:page_view': '500' };

    const m = computeTrackingMetrics(raw, now);
    expect(m.pageViews1h).toBe(5);
    expect(m.pageViews24h).toBe(505);
  });

  it('returns zeros for empty data without division errors', () => {
    const m = computeTrackingMetrics(emptyRaw(), now);
    expect(m.pageViews24h).toBe(0);
    expect(m.pageViews1h).toBe(0);
    expect(m.conversionRate24h).toBe(0);
    expect(m.bounceRate24h).toBe(0);
    expect(m.avgSessionDuration24h).toBe(0);
    expect(m.events24h).toEqual([]);
    expect(m.serviceClicks24h).toEqual([]);
    expect(m.referralSources24h).toEqual([]);
  });

  it('clamps bounce rate into 0..1 when engagement exceeds sessions', () => {
    const raw = emptyRaw();
    raw.buckets[currentBucket] = { pv_sessions: '5', s_engaged: '50' };
    const m = computeTrackingMetrics(raw, now);
    expect(m.bounceRate24h).toBe(0);
  });

  it('limits event_type cardinality to 20 + other', () => {
    const raw = emptyRaw();
    const fields: Record<string, string> = {};
    for (let i = 0; i < 25; i++) {
      fields[`ev:event_${String(i).padStart(2, '0')}`] = String(25 - i);
    }
    raw.buckets[currentBucket] = fields;

    const m = computeTrackingMetrics(raw, now);
    expect(m.events24h).toHaveLength(21);
    expect(m.events24h[0]).toEqual({ label: 'event_00', count: 25 });
    const other = m.events24h.find((e) => e.label === 'other');
    expect(other).toEqual({ label: 'other', count: 5 + 4 + 3 + 2 + 1 });
  });

  it('limits service cardinality to 20 + other and referrals to 10 + other', () => {
    const raw = emptyRaw();
    const fields: Record<string, string> = {};
    for (let i = 0; i < 25; i++) fields[`svc:service_${i}`] = '1';
    for (let i = 0; i < 15; i++) fields[`ref:src_${i}`] = '1';
    raw.buckets[currentBucket] = fields;

    const m = computeTrackingMetrics(raw, now);
    expect(m.serviceClicks24h).toHaveLength(21);
    expect(m.serviceClicks24h.find((e) => e.label === 'other')?.count).toBe(5);
    expect(m.referralSources24h).toHaveLength(11);
    expect(m.referralSources24h.find((e) => e.label === 'other')?.count).toBe(5);
  });

  it('ignores buckets outside the 24h window', () => {
    const raw = emptyRaw();
    const staleBucket = getMoscowBucketKey(new Date(now.getTime() - 3 * 24 * 3600 * 1000));
    raw.buckets[staleBucket] = { 'ev:page_view': '999', 'ref:old.ru': '5' };
    const m = computeTrackingMetrics(raw, now);
    expect(m.pageViews24h).toBe(0);
    expect(m.referralSources24h).toEqual([]);
  });

  it('aggregates visitor geo with top-10 + other', () => {
    const raw = emptyRaw();
    const geo: Record<string, string> = { 'Москва, Московская область': '10', 'Не определён': '3' };
    for (let i = 1; i <= 12; i++) geo[`city_${i}`] = '1';
    raw.geo24h = geo;

    const m = computeTrackingMetrics(raw, now);
    expect(m.visitorGeo24h[0]).toEqual({ label: 'Москва, Московская область', count: 10 });
    expect(m.visitorGeo24h).toHaveLength(11);
    const other = m.visitorGeo24h.find((e) => e.label === 'other');
    expect(other).toEqual({ label: 'other', count: 4 });
  });

  it('returns empty geo series without data', () => {
    const m = computeTrackingMetrics(emptyRaw(), now);
    expect(m.visitorGeo24h).toEqual([]);
  });
});

describe('formatTrackingMetrics', () => {
  const now = new Date('2026-08-24T15:03:00Z');

  it('renders gauges, HELP/TYPE lines and labelled series', () => {
    const raw = emptyRaw();
    raw.activeSessions = 3;
    raw.sessions24h = 50;
    raw.visitors24h = 40;
    raw.leads24h = 5;
    raw.leads1h = 1;
    raw.buckets[getMoscowBucketKey(now)] = {
      'ev:page_view': '10',
      'svc:Профнастил': '2',
      'ref:yandex.ru': '3',
    };

    const output = formatTrackingMetrics(computeTrackingMetrics(raw, now));

    expect(output).toContain('# TYPE business_page_views_24h gauge');
    expect(output).toContain('business_page_views_24h 10');
    expect(output).toContain('business_leads_24h 5');
    expect(output).toContain('business_conversion_rate_24h 0.1');
    expect(output).toContain('business_events_24h{event_type="page_view"} 10');
    expect(output).toContain('business_service_clicks_24h{service="Профнастил"} 2');
    expect(output).toContain('business_referral_sources_24h{source="yandex.ru"} 3');
    expect(output).not.toContain('business_visitor_geo_24h');
  });

  it('renders visitor geo series with escaped city labels', () => {
    const raw = emptyRaw();
    raw.geo24h = { 'Москва, Московская область': '7', 'Санкт-Петербург, "СПб"': '2' };
    const output = formatTrackingMetrics(computeTrackingMetrics(raw, now));
    expect(output).toContain('# TYPE business_visitor_geo_24h gauge');
    expect(output).toContain('business_visitor_geo_24h{city="Москва, Московская область"} 7');
    expect(output).toContain('business_visitor_geo_24h{city="Санкт-Петербург, \\"СПб\\""} 2');
  });

  it('omits labelled metrics when there is no data', () => {
    const output = formatTrackingMetrics(computeTrackingMetrics(emptyRaw(), now));
    expect(output).toContain('business_page_views_24h 0');
    expect(output).not.toContain('business_events_24h{');
    expect(output).not.toContain('business_service_clicks_24h{');
    expect(output).not.toContain('business_referral_sources_24h{');
  });

  it('escapes label values', () => {
    expect(escapeLabelValue('a"b\\c\nd')).toBe('a\\"b\\\\c\\nd');
  });
});

describe('getTrackingMetricsString', () => {
  beforeEach(() => {
    resetTrackingMetricsCache();
    jest.clearAllMocks();
  });

  function setupRedisExec() {
    const pipeline = {
      hgetall: jest.fn(),
      zcard: jest.fn(),
      get: jest.fn(),
      pfcount: jest.fn(),
      exec: jest.fn(),
    };
    pipeline.exec.mockImplementation(async () => {
      const keys = 144;
      const results: Array<[Error | null, unknown]> = [];
      for (let i = 0; i < keys; i++) results.push([null, {}]);
      results.push([null, 4]);
      results.push([null, '120.5']);
      results.push([null, 55]);
      results.push([null, 44]);
      results.push([null, { 'Москва, Московская область': '6' }]);
      results.push([null, { 'Москва, Московская область': '2' }]);
      return results;
    });
    (redis.pipeline as unknown as jest.Mock).mockImplementation(() => pipeline);
    return pipeline;
  }

  it('collects, caches for 60s and logs the operation', async () => {
    setupRedisExec();
    (prisma.order.count as jest.Mock)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);

    const first = await getTrackingMetricsString();
    expect(first).toContain('business_page_views_24h 0');
    expect(first).toContain('business_leads_24h 3');
    expect(first).toContain('business_leads_1h 1');
    expect(first).toContain('business_sessions_active 4');
    expect(first).toContain('business_avg_session_duration_seconds_24h 120.5');
    expect(first).toContain('business_visitor_geo_24h{city="Москва, Московская область"} 8');

    await getTrackingMetricsString();
    expect(redis.pipeline).toHaveBeenCalledTimes(1);

    const { default: logger } = await import('@/lib/logger');
    expect(logger.info).toHaveBeenCalledWith(
      'Tracking metrics generated',
      expect.objectContaining({ module: 'tracking-metrics', operation: 'getTrackingMetricsString' })
    );
  });

  it('logs and rethrows on collector failure', async () => {
    const pipeline = setupRedisExec();
    pipeline.exec.mockRejectedValue(new Error('redis down'));

    await expect(getTrackingMetricsString()).rejects.toThrow('redis down');

    const { default: logger } = await import('@/lib/logger');
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to generate tracking metrics',
      expect.objectContaining({ module: 'tracking-metrics', operation: 'getTrackingMetricsString' })
    );

    await flush();
  });
});
