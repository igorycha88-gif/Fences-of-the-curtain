import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

jest.mock('@/lib/tracking-metrics', () => ({
  getTrackingMetricsString: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/metrics/tracking/route';
import * as routeModule from '@/app/api/metrics/tracking/route';
import { getTrackingMetricsString } from '@/lib/tracking-metrics';

const METRICS_FIXTURE =
  '# HELP business_page_views_24h Page views in the last 24 hours\n' +
  '# TYPE business_page_views_24h gauge\n' +
  'business_page_views_24h 42\n' +
  'business_leads_24h 3\n';

const MONITORING_KEY = 'a'.repeat(64);

function makeRequest(headers: Record<string, string> = {}): any {
  return new Request('http://localhost:3000/api/metrics/tracking', {
    method: 'GET',
    headers,
  });
}

describe('GET /api/metrics/tracking (contract)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MONITORING_KEY = MONITORING_KEY;
    (getTrackingMetricsString as jest.Mock).mockResolvedValue(METRICS_FIXTURE);
  });

  afterEach(() => {
    delete process.env.MONITORING_KEY;
  });

  it('returns 200 with text/plain 0.0.4 and business metrics for valid key', async () => {
    const res = await GET(
      makeRequest({ 'x-monitoring-key': MONITORING_KEY, 'x-real-ip': '203.0.113.5' })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/plain; version=0.0.4; charset=utf-8');
    const body = await res.text();
    expect(body).toContain('business_page_views_24h');
    expect(body).toContain('business_leads_24h');
  });

  it('returns 403 without key from a public IP', async () => {
    const res = await GET(makeRequest({ 'x-real-ip': '203.0.113.5' }));
    expect(res.status).toBe(403);
    expect(getTrackingMetricsString).not.toHaveBeenCalled();
  });

  it('returns 403 with a wrong key', async () => {
    const res = await GET(makeRequest({ 'x-monitoring-key': 'b'.repeat(64), 'x-real-ip': '203.0.113.5' }));
    expect(res.status).toBe(403);
  });

  it('returns 403 with a key of wrong length', async () => {
    const res = await GET(makeRequest({ 'x-monitoring-key': 'short', 'x-real-ip': '203.0.113.5' }));
    expect(res.status).toBe(403);
  });

  it('allows loopback requests without key (internal Prometheus)', async () => {
    const res = await GET(makeRequest({ 'x-real-ip': '127.0.0.1' }));
    expect(res.status).toBe(200);
  });

  it('exposes only the GET handler (non-GET methods are not served)', () => {
    expect(typeof routeModule.GET).toBe('function');
    expect((routeModule as Record<string, unknown>).POST).toBeUndefined();
    expect((routeModule as Record<string, unknown>).PUT).toBeUndefined();
  });

  it('returns 500 and logs error when metrics generation fails', async () => {
    (getTrackingMetricsString as jest.Mock).mockRejectedValue(new Error('boom'));

    const res = await GET(makeRequest({ 'x-monitoring-key': MONITORING_KEY, 'x-real-ip': '203.0.113.5' }));

    expect(res.status).toBe(500);

    const { default: logger } = await import('@/lib/logger');
    expect(logger.error).toHaveBeenCalledWith(
      'Tracking metrics endpoint failed',
      expect.objectContaining({ module: 'api/metrics/tracking', status: 500 })
    );
  });

  it('logs denied access attempts', async () => {
    await GET(makeRequest({ 'x-real-ip': '203.0.113.5' }));

    const { default: logger } = await import('@/lib/logger');
    expect(logger.warn).toHaveBeenCalledWith(
      'Tracking metrics access denied',
      expect.objectContaining({ module: 'api/metrics/tracking', ip: '203.0.113.5' })
    );
  });

  it('logs successful requests with duration', async () => {
    await GET(makeRequest({ 'x-monitoring-key': MONITORING_KEY, 'x-real-ip': '203.0.113.5' }));

    const { default: logger } = await import('@/lib/logger');
    expect(logger.info).toHaveBeenCalledWith(
      'Tracking metrics served',
      expect.objectContaining({ module: 'api/metrics/tracking', status: 200 })
    );
  });
});
