import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/admin-auth', () => ({
  requireAuth: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/services/telegram/analytics-notifier', () => ({
  isNotifiableEvent: jest.fn().mockReturnValue(false),
  sendAnalyticsNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/admin/ipLookupService', () => ({
  getCityByIP: jest.fn(),
}));

jest.mock('@/lib/redis', () => {
  const pipelines: Array<Record<string, jest.Mock>> = [];
  const makePipeline = () => {
    const p: Record<string, jest.Mock> = {};
    const chain = (name: string) => {
      p[name] = jest.fn(() => p);
    };
    ['hincrby', 'hset', 'hsetnx', 'expire', 'pfadd', 'zadd', 'zremrangebyscore', 'sadd', 'scard', 'lpush', 'ltrim', 'hgetall'].forEach(chain);
    p.exec = jest.fn().mockImplementation(async () => [[null, 1], [null, 1], [null, 5]]);
    pipelines.push(p);
    return p;
  };
  return {
    redis: {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      hget: jest.fn().mockResolvedValue(null),
      hincrby: jest.fn().mockResolvedValue(1),
      hgetall: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue('OK'),
      lrange: jest.fn().mockResolvedValue([]),
      pipeline: jest.fn(() => makePipeline()),
      __pipelines: pipelines,
    },
  };
});

import { POST } from '@/app/api/analytics/events/route';
import { redis } from '@/lib/redis';
import { getMoscowBucketKey } from '@/lib/tracking-metrics';
import { getMoscowDate } from '@/lib/timezone';
import { getCityByIP } from '@/services/admin/ipLookupService';

const flush = () => new Promise((resolve) => setImmediate(resolve));

interface TrackedPipeline {
  hincrby: jest.Mock;
  pfadd: jest.Mock;
  zadd: jest.Mock;
}

function trackingPipelines(): TrackedPipeline[] {
  const pipelines = (redis as any).__pipelines as Array<Record<string, jest.Mock>>;
  return pipelines.filter((p) => p.pfadd && p.hincrby && p.zadd) as unknown as TrackedPipeline[];
}

function trackingHincrbyCalls(): Array<{ key: string; field: string; inc: number }> {
  const calls: Array<{ key: string; field: string; inc: number }> = [];
  for (const p of trackingPipelines()) {
    for (const args of p.hincrby.mock.calls as unknown[][]) {
      calls.push({ key: String(args[0]), field: String(args[1]), inc: Number(args[2]) });
    }
  }
  return calls.filter((c) => c.key.startsWith('analytics:tracking:b:'));
}

function trackingPfaddKeys(): string[] {
  const keys: string[] = [];
  for (const p of trackingPipelines()) {
    for (const args of p.pfadd.mock.calls as unknown[][]) {
      keys.push(String(args[0]));
    }
  }
  return keys;
}

function makeRequest(body: unknown): any {
  return new Request('http://localhost:3000/api/analytics/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': '203.0.113.7' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analytics/events tracking writes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (redis.incr as jest.Mock).mockResolvedValue(1);
    (redis.hget as jest.Mock).mockResolvedValue(null);
    (redis.hincrby as jest.Mock).mockResolvedValue(1);
  });

  it('writes bucket, HLL and active-session structures for a first page_view', async () => {
    const res = await POST(
      makeRequest({
        eventName: 'page_view',
        sessionId: 'sess-abc',
        page: '/',
        referrer: 'https://yandex.ru/search',
        timestamp: new Date().toISOString(),
      })
    );

    expect(res.status).toBe(200);

    const bucket = getMoscowBucketKey();
    const fields = trackingHincrbyCalls();
    expect(fields).toContainEqual({ key: `analytics:tracking:b:${bucket}`, field: 'ev:page_view', inc: 1 });
    expect(fields).toContainEqual({ key: `analytics:tracking:b:${bucket}`, field: 's_starts', inc: 1 });
    expect(fields).toContainEqual({ key: `analytics:tracking:b:${bucket}`, field: 'pv_sessions', inc: 1 });
    expect(fields).toContainEqual({ key: `analytics:tracking:b:${bucket}`, field: 'ref:yandex.ru', inc: 1 });

    const pfKeys = trackingPfaddKeys();
    expect(pfKeys).toContain(`analytics:tracking:hlls:${bucket}`);
    expect(pfKeys).toContain(`analytics:tracking:hllv:${bucket}`);

    expect(trackingPipelines()[0].zadd).toHaveBeenCalledWith(
      'analytics:tracking:active',
      expect.any(Number),
      'sess-abc'
    );

    await flush();
  });

  it('marks engagement and service on the second session event', async () => {
    (redis.hget as jest.Mock).mockResolvedValue(new Date(Date.now() - 60_000).toISOString());
    (redis.hincrby as jest.Mock).mockImplementation(async (_key: string, field: string) =>
      field === 'totalEvents' ? 2 : 1
    );

    const res = await POST(
      makeRequest({
        eventName: 'calculator_fence_type_select',
        sessionId: 'sess-abc',
        page: '/calculator/fence',
        properties: { fenceType: 'Профнастил' },
        timestamp: new Date().toISOString(),
      })
    );

    expect(res.status).toBe(200);

    const bucket = getMoscowBucketKey();
    const fields = trackingHincrbyCalls();
    expect(fields).toContainEqual({ key: `analytics:tracking:b:${bucket}`, field: 's_engaged', inc: 1 });
    expect(fields).toContainEqual({ key: `analytics:tracking:b:${bucket}`, field: 'svc:Профнастил', inc: 1 });
    expect(fields).not.toContainEqual(expect.objectContaining({ field: 'pv_sessions' }));
    expect(trackingPfaddKeys()).not.toContain(`analytics:tracking:hllv:${bucket}`);

    await flush();
  });

  it('ignores referrers from the own site', async () => {
    await POST(
      makeRequest({
        eventName: 'page_view',
        sessionId: 'sess-xyz',
        page: '/calculator/fence',
        referrer: 'https://zabor-i-naves.ru/',
        timestamp: new Date().toISOString(),
      })
    );

    expect(trackingHincrbyCalls().filter((c) => c.field.startsWith('ref:'))).toHaveLength(0);
    await flush();
  });

  it('uses server time for bucket when client timestamp is skewed', async () => {
    await POST(
      makeRequest({
        eventName: 'page_view',
        sessionId: 'sess-skew',
        page: '/',
        timestamp: new Date(Date.now() + 3600_000).toISOString(),
      })
    );

    const bucket = getMoscowBucketKey();
    expect(trackingHincrbyCalls()).toContainEqual({
      key: `analytics:tracking:b:${bucket}`,
      field: 'ev:page_view',
      inc: 1,
    });
    await flush();
  });

  it('logs the recorded event (rule 8)', async () => {
    await POST(
      makeRequest({
        eventName: 'page_view',
        sessionId: 'sess-log',
        page: '/',
      })
    );

    const { default: logger } = await import('@/lib/logger');
    expect(logger.info).toHaveBeenCalledWith(
      'Analytics event recorded',
      expect.objectContaining({ module: 'api/analytics/events', operation: 'POST', eventName: 'page_view' })
    );
    await flush();
  });

  it('still validates input and rejects bad eventName', async () => {
    const res = await POST(makeRequest({ eventName: 'bad event!', sessionId: 's' }));
    expect(res.status).toBe(400);
    await flush();
  });

  it('increments visitor geo for a new session (unique visitor)', async () => {
    (getCityByIP as jest.Mock).mockResolvedValue('Москва, Московская область');

    const res = await POST(
      makeRequest({ eventName: 'page_view', sessionId: 'sess-geo-1', page: '/' })
    );
    expect(res.status).toBe(200);
    await flush();

    expect(getCityByIP).toHaveBeenCalledWith('203.0.113.7');
    expect(redis.hincrby).toHaveBeenCalledWith(
      `analytics:geo:daily:${getMoscowDate()}`,
      'Москва, Московская область',
      1
    );
    expect(redis.expire).toHaveBeenCalledWith(`analytics:geo:daily:${getMoscowDate()}`, 86400 * 30);
  });

  it('counts unknown city as "Не определён" when lookup fails', async () => {
    (getCityByIP as jest.Mock).mockResolvedValue(null);

    const res = await POST(
      makeRequest({ eventName: 'page_view', sessionId: 'sess-geo-2', page: '/' })
    );
    expect(res.status).toBe(200);
    await flush();

    expect(redis.hincrby).toHaveBeenCalledWith(
      `analytics:geo:daily:${getMoscowDate()}`,
      'Не определён',
      1
    );
  });

  it('does not increment geo for continuing session', async () => {
    (getCityByIP as jest.Mock).mockResolvedValue('Москва, Московская область');

    (redis.hget as jest.Mock).mockResolvedValueOnce(new Date().toISOString());
    (redis.hincrby as jest.Mock).mockResolvedValue(2);

    const res = await POST(
      makeRequest({ eventName: 'calculator_open', sessionId: 'sess-geo-3', page: '/calculator/fence' })
    );
    expect(res.status).toBe(200);
    await flush();

    expect(redis.hincrby).not.toHaveBeenCalledWith(
      `analytics:geo:daily:${getMoscowDate()}`,
      expect.any(String),
      1
    );
  });

  it('logs geo lookup errors instead of failing the request', async () => {
    (getCityByIP as jest.Mock).mockRejectedValue(new Error('ip-api down'));

    const res = await POST(
      makeRequest({ eventName: 'page_view', sessionId: 'sess-geo-4', page: '/' })
    );
    expect(res.status).toBe(200);
    await flush();

    expect(redis.hincrby).not.toHaveBeenCalledWith(
      `analytics:geo:daily:${getMoscowDate()}`,
      expect.any(String),
      1
    );

    const { default: logger } = await import('@/lib/logger');
    expect(logger.error).toHaveBeenCalledWith(
      'Analytics metric error',
      expect.objectContaining({ context: 'geo_lookup' })
    );
  });
});
