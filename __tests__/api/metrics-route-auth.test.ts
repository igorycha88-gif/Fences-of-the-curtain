import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

jest.mock('@/lib/prometheus', () => ({
  getMetricsString: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/metrics/route';
import { getMetricsString } from '@/lib/prometheus';

const MONITORING_KEY = 'c'.repeat(64);
const FIXTURE = 'analytics_events_total{event_name="page_view",page="/"} 5\n';

function makeRequest(headers: Record<string, string> = {}): any {
  return new Request('http://localhost:3000/api/metrics', { method: 'GET', headers });
}

describe('GET /api/metrics auth (ЧТЗ v1.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MONITORING_KEY = MONITORING_KEY;
    (getMetricsString as jest.Mock).mockResolvedValue(FIXTURE);
  });

  afterEach(() => {
    delete process.env.MONITORING_KEY;
  });

  it('returns 403 for public requests without key', async () => {
    const res = await GET(makeRequest({ 'x-real-ip': '203.0.113.9' }));
    expect(res.status).toBe(403);
    expect(getMetricsString).not.toHaveBeenCalled();
  });

  it('returns 200 with valid X-Monitoring-Key', async () => {
    const res = await GET(makeRequest({ 'x-monitoring-key': MONITORING_KEY, 'x-real-ip': '203.0.113.9' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    expect(await res.text()).toContain('analytics_events_total');
  });

  it('returns 200 for loopback requests (site Prometheus scrape)', async () => {
    const res = await GET(makeRequest({ 'x-real-ip': '127.0.0.1' }));
    expect(res.status).toBe(200);
  });

  it('fails closed when MONITORING_KEY is not configured', async () => {
    delete process.env.MONITORING_KEY;
    const res = await GET(makeRequest({ 'x-monitoring-key': 'anything', 'x-real-ip': '203.0.113.9' }));
    expect(res.status).toBe(403);
  });

  it('returns 500 and logs when metrics generation fails', async () => {
    (getMetricsString as jest.Mock).mockRejectedValue(new Error('boom'));
    const res = await GET(makeRequest({ 'x-real-ip': '127.0.0.1' }));

    expect(res.status).toBe(500);

    const { default: logger } = await import('@/lib/logger');
    expect(logger.error).toHaveBeenCalledWith(
      'Metrics error',
      expect.objectContaining({ module: 'api/metrics', status: 500 })
    );
  });
});
