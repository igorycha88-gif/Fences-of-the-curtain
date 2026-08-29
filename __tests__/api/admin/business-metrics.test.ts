import { NextRequest } from 'next/server';

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn(),
}));

jest.mock('@/services/admin/businessMetricsService', () => ({
  businessMetricsService: {
    getBusinessMetrics: jest.fn(),
  },
}));

jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({ sheets: [] })),
    json_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn(() => Buffer.from('mock-xlsx-content')),
}));

import { GET } from '@/app/api/admin/business-metrics/route';
import { GET as exportGET } from '@/app/api/admin/business-metrics/export/route';
import { requireAdmin } from '@/lib/admin-auth';
import { businessMetricsService } from '@/services/admin/businessMetricsService';
import logger from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockMetrics = {
  period: 'month',
  range: { from: '2026-08-01T00:00:00.000Z', to: '2026-08-31T00:00:00.000Z' },
  kpi: {
    totalOrders: { value: 4, previousValue: 2, trend: 100, trendDirection: 'up' },
    inProgress: { value: 1, previousValue: 0, trend: 100, trendDirection: 'up' },
    completed: { value: 1, previousValue: 1, trend: 0, trendDirection: 'neutral' },
    cancelled: { value: 1, previousValue: 1, trend: 0, trendDirection: 'neutral' },
    cancelledPercentage: 25,
    conversion: { value: 25, previousValue: 50, trend: -50, trendDirection: 'down' },
    avgCheck: { value: 100000, previousValue: 80000, trend: 25, trendDirection: 'up' },
    revenue: { value: 100000, previousValue: 80000, trend: 25, trendDirection: 'up' },
  },
  funnel: [{ status: 'NEW', label: 'Новая', count: 4, percentage: 100, stepConversion: null }],
  timeline: { granularity: 'day' as const, keys: ['2026-08-01'], new: [1], completed: [0], cancelled: [0] },
  cancellationReasons: [{ reason: 'PRICE_TOO_HIGH', label: 'Цена слишком высокая', count: 1, percentage: 100 }],
  serviceTypes: [{ serviceType: 'fence', label: 'Заборы', count: 1, percentage: 100, revenue: 100000 }],
  managers: [{ id: null, name: 'Не назначен', total: 1, inProgress: 0, completed: 1, cancelled: 0, conversion: 100, avgCheck: 100000, revenue: 100000 }],
  avgTimeByStatus: [{ status: 'NEW', label: 'Новая', avgDays: 2, ordersCount: 1 }],
};

function makeRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/admin/business-metrics${query}`);
}

describe('GET /api/admin/business-metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({
      session: { userId: 'user-1', email: 'admin@test.local', role: 'ADMIN' },
    });
  });

  it('returns metrics with 200 for valid query', async () => {
    (businessMetricsService.getBusinessMetrics as jest.Mock).mockResolvedValue(mockMetrics);

    const response = await GET(makeRequest('?period=month'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.kpi.totalOrders.value).toBe(4);
    expect(businessMetricsService.getBusinessMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ period: 'month' })
    );
  });

  it('passes filters to service', async () => {
    (businessMetricsService.getBusinessMetrics as jest.Mock).mockResolvedValue(mockMetrics);

    await GET(makeRequest('?period=week&serviceType=fence&managerId=u1'));

    expect(businessMetricsService.getBusinessMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ period: 'week', serviceType: 'fence', managerId: 'u1' })
    );
  });

  it('returns 400 for invalid period', async () => {
    const response = await GET(makeRequest('?period=decade'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('period');
    expect(businessMetricsService.getBusinessMetrics).not.toHaveBeenCalled();
  });

  it('returns 403 when requireAdmin returns response', async () => {
    const forbidden = new NextRequest('http://localhost:3000');
    (requireAdmin as jest.Mock).mockResolvedValue(
      new (require('next/server').NextResponse)(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    );

    const response = await GET(forbidden);

    expect(response.status).toBe(403);
  });

  it('returns 500 and logs error when service fails', async () => {
    (businessMetricsService.getBusinessMetrics as jest.Mock).mockRejectedValue(new Error('DB down'));

    const response = await GET(makeRequest('?period=month'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(logger.error).toHaveBeenCalledWith('BusinessMetrics API error', expect.objectContaining({
      status: 500,
      error: 'DB down',
    }));
  });

  it('logs request and response', async () => {
    (businessMetricsService.getBusinessMetrics as jest.Mock).mockResolvedValue(mockMetrics);

    await GET(makeRequest('?period=month'));

    expect(logger.info).toHaveBeenCalledWith('BusinessMetrics API request', expect.objectContaining({
      method: 'GET',
      userId: 'user-1',
    }));
    expect(logger.info).toHaveBeenCalledWith('BusinessMetrics API response', expect.objectContaining({
      status: 200,
    }));
  });
});

describe('GET /api/admin/business-metrics/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({
      session: { userId: 'user-1', email: 'admin@test.local', role: 'ADMIN' },
    });
  });

  it('returns xlsx file with correct headers', async () => {
    (businessMetricsService.getBusinessMetrics as jest.Mock).mockResolvedValue(mockMetrics);

    const response = await exportGET(new NextRequest('http://localhost:3000/api/admin/business-metrics/export?period=month'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(response.headers.get('Content-Disposition')).toContain('business-metrics-month');
    const body = await response.text();
    expect(body).toContain('mock-xlsx-content');
  });

  it('returns 400 for invalid query', async () => {
    const response = await exportGET(new NextRequest('http://localhost:3000/api/admin/business-metrics/export?period=bogus'));

    expect(response.status).toBe(400);
    expect(businessMetricsService.getBusinessMetrics).not.toHaveBeenCalled();
  });

  it('returns 500 and logs error when service fails', async () => {
    (businessMetricsService.getBusinessMetrics as jest.Mock).mockRejectedValue(new Error('export failed'));

    const response = await exportGET(new NextRequest('http://localhost:3000/api/admin/business-metrics/export?period=month'));

    expect(response.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith('BusinessMetrics export error', expect.objectContaining({
      error: 'export failed',
    }));
  });

  it('logs request and response with size', async () => {
    (businessMetricsService.getBusinessMetrics as jest.Mock).mockResolvedValue(mockMetrics);

    await exportGET(new NextRequest('http://localhost:3000/api/admin/business-metrics/export?period=month'));

    expect(logger.info).toHaveBeenCalledWith('BusinessMetrics export request', expect.objectContaining({
      userId: 'user-1',
    }));
    expect(logger.info).toHaveBeenCalledWith('BusinessMetrics export response', expect.objectContaining({
      status: 200,
      sizeBytes: expect.any(Number),
    }));
  });
});
