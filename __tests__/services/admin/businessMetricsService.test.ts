import { businessMetricsService } from '@/services/admin/businessMetricsService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/redis', () => {
  const pipeline = {
    hget: jest.fn(),
    hgetall: jest.fn(),
    exec: jest.fn(),
  };
  return {
    redis: {
      pipeline: jest.fn(() => pipeline),
    },
  };
});

import logger from '@/lib/logger';
import { redis } from '@/lib/redis';

const dateFrom = new Date('2026-08-01T00:00:00.000Z');
const dateTo = new Date('2026-08-31T00:00:00.000Z');

function makeOrder(overrides: Record<string, unknown>) {
  return {
    status: 'NEW',
    calculatedCost: 0,
    serviceType: 'fence',
    assignedTo: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-02T00:00:00.000Z'),
    completionDate: null,
    cancellationReason: null,
    statusHistory: [],
    ...overrides,
  };
}

const currentOrders = [
  makeOrder({
    status: 'COMPLETED',
    calculatedCost: 100000,
    serviceType: 'fence',
    assignedTo: 'u1',
    createdAt: new Date('2026-08-05T00:00:00.000Z'),
    completionDate: new Date('2026-08-20T00:00:00.000Z'),
    statusHistory: [
      { status: 'NEW', changedAt: '2026-08-05T00:00:00.000Z' },
      { status: 'ESTIMATE_APPROVAL', changedAt: '2026-08-08T00:00:00.000Z' },
      { status: 'MEASUREMENT', changedAt: '2026-08-10T00:00:00.000Z' },
      { status: 'PRODUCTION', changedAt: '2026-08-12T00:00:00.000Z' },
      { status: 'INSTALLATION', changedAt: '2026-08-18T00:00:00.000Z' },
      { status: 'COMPLETED', changedAt: '2026-08-20T00:00:00.000Z' },
    ],
  }),
  makeOrder({
    status: 'CANCELLED',
    calculatedCost: 50000,
    createdAt: new Date('2026-08-07T00:00:00.000Z'),
    cancellationReason: 'PRICE_TOO_HIGH',
    statusHistory: [
      { status: 'NEW', changedAt: '2026-08-07T00:00:00.000Z' },
      { status: 'CANCELLED', changedAt: '2026-08-09T00:00:00.000Z' },
    ],
  }),
  makeOrder({
    status: 'NEW',
    calculatedCost: 70000,
    serviceType: 'gates',
    createdAt: new Date('2026-08-15T00:00:00.000Z'),
    statusHistory: null,
  }),
  makeOrder({
    status: 'MEASUREMENT',
    calculatedCost: 200000,
    serviceType: 'canopy',
    assignedTo: 'u1',
    createdAt: new Date('2026-08-10T00:00:00.000Z'),
    statusHistory: [
      { status: 'NEW', changedAt: '2026-08-10T00:00:00.000Z' },
      { status: 'ESTIMATE_APPROVAL', changedAt: '2026-08-11T00:00:00.000Z' },
      { status: 'MEASUREMENT', changedAt: '2026-08-13T00:00:00.000Z' },
    ],
  }),
];

const previousOrders = [
  { status: 'COMPLETED', calculatedCost: 80000 },
  { status: 'CANCELLED', calculatedCost: 0 },
];

function setupPrisma(current = currentOrders, previous = previousOrders, users: { id: string; name: string }[] = [{ id: 'u1', name: 'Иван Петров' }]) {
  const { prisma } = require('@/lib/prisma');
  (prisma.order.findMany as jest.Mock).mockImplementation(({ where }: { where: { createdAt: { gte: Date } } }) => {
    return Promise.resolve(where.createdAt.gte.getTime() === dateFrom.getTime() ? current : previous);
  });
  (prisma.user.findMany as jest.Mock).mockResolvedValue(users);
  return prisma;
}

describe('BusinessMetricsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBusinessMetrics (happy path)', () => {
    it('returns full metrics structure with kpi, trends and blocks', async () => {
      setupPrisma();

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });

      expect(result.period).toBe('month');
      expect(result.kpi.totalOrders.value).toBe(4);
      expect(result.kpi.totalOrders.previousValue).toBe(2);
      expect(result.kpi.totalOrders.trend).toBe(100);
      expect(result.kpi.totalOrders.trendDirection).toBe('up');
      expect(result.kpi.inProgress.value).toBe(1);
      expect(result.kpi.completed.value).toBe(1);
      expect(result.kpi.cancelled.value).toBe(1);
      expect(result.kpi.cancelledPercentage).toBe(25);
      expect(result.kpi.conversion.value).toBe(25);
      expect(result.kpi.avgCheck.value).toBe(100000);
      expect(result.kpi.revenue.value).toBe(100000);
    });

    it('builds funnel from status history and current status', async () => {
      setupPrisma();

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });
      const funnelByStatus = Object.fromEntries(result.funnel.map((s) => [s.status, s]));

      expect(funnelByStatus.NEW.count).toBe(4);
      expect(funnelByStatus.NEW.percentage).toBe(100);
      expect(funnelByStatus.ESTIMATE_APPROVAL.count).toBe(2);
      expect(funnelByStatus.ESTIMATE_APPROVAL.stepConversion).toBe(50);
      expect(funnelByStatus.MEASUREMENT.count).toBe(2);
      expect(funnelByStatus.MEASUREMENT.stepConversion).toBe(100);
      expect(funnelByStatus.PRODUCTION.count).toBe(1);
      expect(funnelByStatus.INSTALLATION.count).toBe(1);
      expect(funnelByStatus.COMPLETED.count).toBe(1);
      expect(funnelByStatus.COMPLETED.percentage).toBe(25);
    });

    it('groups cancellation reasons with labels', async () => {
      setupPrisma();

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });

      expect(result.cancellationReasons).toHaveLength(1);
      expect(result.cancellationReasons[0]).toMatchObject({
        reason: 'PRICE_TOO_HIGH',
        label: 'Цена слишком высокая',
        count: 1,
        percentage: 100,
      });
    });

    it('groups service types with revenue of completed orders', async () => {
      setupPrisma();

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });
      const byType = Object.fromEntries(result.serviceTypes.map((t) => [t.serviceType, t]));

      expect(byType.fence).toMatchObject({ count: 2, percentage: 50, revenue: 100000 });
      expect(byType.fence.label).toBe('Заборы');
      expect(byType.gates).toMatchObject({ count: 1, percentage: 25, revenue: 0 });
      expect(byType.canopy).toMatchObject({ count: 1, percentage: 25, revenue: 0 });
    });

    it('builds manager performance sorted by revenue with user names', async () => {
      setupPrisma();

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });

      expect(result.managers).toHaveLength(2);
      expect(result.managers[0]).toMatchObject({
        id: 'u1',
        name: 'Иван Петров',
        total: 2,
        completed: 1,
        inProgress: 1,
        revenue: 100000,
        conversion: 50,
        avgCheck: 100000,
      });
      expect(result.managers[1]).toMatchObject({ id: null, name: 'Не назначен', total: 2 });
    });

    it('computes average time by status from history', async () => {
      setupPrisma();

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });
      const byStatus = Object.fromEntries(result.avgTimeByStatus.map((s) => [s.status, s]));

      expect(byStatus.NEW.avgDays).toBe(5.5);
      expect(byStatus.NEW.ordersCount).toBe(4);
      expect(byStatus.ESTIMATE_APPROVAL.avgDays).toBe(2);
      expect(byStatus.CANCELLED.avgDays).toBe(0);
    });

    it('builds timeline with daily buckets for month period', async () => {
      setupPrisma();

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });

      expect(result.timeline.granularity).toBe('day');
      expect(result.timeline.keys.length).toBe(31);
      expect(result.timeline.new.reduce((a: number, b: number) => a + b, 0)).toBe(4);
      expect(result.timeline.completed.reduce((a: number, b: number) => a + b, 0)).toBe(1);
      expect(result.timeline.cancelled.reduce((a: number, b: number) => a + b, 0)).toBe(1);
      const idx = result.timeline.keys.indexOf('2026-08-15');
      expect(result.timeline.new[idx]).toBe(1);
    });

    it('uses week granularity for quarter and month granularity for year', async () => {
      setupPrisma();

      const quarter = await businessMetricsService.getBusinessMetrics({ period: 'quarter', dateFrom, dateTo });
      const year = await businessMetricsService.getBusinessMetrics({ period: 'year', dateFrom, dateTo });

      expect(quarter.timeline.granularity).toBe('week');
      expect(year.timeline.granularity).toBe('month');
    });
  });

  describe('edge cases', () => {
    it('returns zeros and empty blocks for empty period', async () => {
      setupPrisma([], []);

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });

      expect(result.kpi.totalOrders.value).toBe(0);
      expect(result.kpi.totalOrders.trend).toBeNull();
      expect(result.kpi.totalOrders.trendDirection).toBe('neutral');
      expect(result.kpi.conversion.value).toBe(0);
      expect(result.kpi.cancelledPercentage).toBe(0);
      expect(result.funnel.every((s) => s.count === 0)).toBe(true);
      expect(result.cancellationReasons).toEqual([]);
      expect(result.serviceTypes).toEqual([]);
      expect(result.managers).toEqual([]);
    });

    it('falls back to createdAt when statusHistory is missing', async () => {
      setupPrisma([
        makeOrder({ status: 'NEW', createdAt: new Date('2026-08-15T00:00:00.000Z'), statusHistory: null }),
      ], []);

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });

      expect(result.funnel[0].count).toBe(1);
      const newStatus = result.avgTimeByStatus.find((s) => s.status === 'NEW');
      expect(newStatus?.avgDays).toBe(16);
      expect(newStatus?.ordersCount).toBe(1);
    });

    it('does not count unassigned terminal-less fallback for cancelled without history', async () => {
      setupPrisma([
        makeOrder({ status: 'CANCELLED', createdAt: new Date('2026-08-15T00:00:00.000Z'), statusHistory: null }),
      ], []);

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });
      const newStatus = result.avgTimeByStatus.find((s) => s.status === 'NEW');

      expect(newStatus?.ordersCount).toBe(0);
    });
  });

  describe('filters', () => {
    it('passes serviceType and managerId to query', async () => {
      const prisma = setupPrisma();

      await businessMetricsService.getBusinessMetrics({
        period: 'month',
        dateFrom,
        dateTo,
        serviceType: 'fence',
        managerId: 'u1',
      });

      const where = (prisma.order.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.serviceType).toBe('fence');
      expect(where.assignedTo).toBe('u1');
    });
  });

  describe('logging', () => {
    it('logs start and completion', async () => {
      setupPrisma();

      await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });

      expect(logger.info).toHaveBeenCalledWith('BusinessMetrics calculation started', expect.objectContaining({
        operation: 'getBusinessMetrics',
        period: 'month',
      }));
      expect(logger.info).toHaveBeenCalledWith('BusinessMetrics calculation completed', expect.objectContaining({
        ordersCount: 4,
      }));
    });

    it('logs error with context and rethrows on database failure', async () => {
      const { prisma } = require('@/lib/prisma');
      (prisma.order.findMany as jest.Mock).mockRejectedValue(new Error('DB down'));

      await expect(
        businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo })
      ).rejects.toThrow('DB down');

      expect(logger.error).toHaveBeenCalledWith('BusinessMetrics calculation failed', expect.objectContaining({
        operation: 'getBusinessMetrics',
        error: 'DB down',
      }));
    });
  });

  describe('redis blocks: phoneClicks and visitorGeo', () => {
    const pipeline = redis.pipeline() as unknown as {
      hget: jest.Mock;
      hgetall: jest.Mock;
      exec: jest.Mock;
    };

    function setupRedisExec(
      phoneResult: (key: string) => string | null,
      geoResult: (key: string) => Record<string, string> | null
    ) {
      pipeline.hget.mockImplementation(() => undefined);
      pipeline.hgetall.mockImplementation(() => undefined);
      pipeline.exec.mockImplementation(async () => {
        if (pipeline.hgetall.mock.calls.length > 0) {
          return (pipeline.hgetall.mock.calls as unknown[][]).map(([key]) => [null, geoResult(String(key))]);
        }
        return (pipeline.hget.mock.calls as unknown[][]).map(([key]) => [null, phoneResult(String(key))]);
      });
    }

    it('aggregates phone clicks with trend and geo top cities', async () => {
      setupPrisma();
      setupRedisExec(
        (key) => (key === 'analytics:daily:2026-08-05' ? '3' : key.includes('2026-07') ? '1' : '0'),
        (key) => (key === 'analytics:geo:daily:2026-08-05' ? { 'Москва, Московская область': '3', 'Не определён': '1' } : {})
      );

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });

      expect(result.phoneClicks.total).toBe(3);
      expect(result.phoneClicks.previousTotal).toBe(30);
      expect(result.phoneClicks.trend).toBe(-90);
      expect(result.phoneClicks.trendDirection).toBe('down');
      expect(result.phoneClicks.byDay).toHaveLength(31);
      expect(result.phoneClicks.byDay.find((d) => d.date === '2026-08-05')).toEqual({ date: '2026-08-05', count: 3 });

      expect(result.visitorGeo).toEqual([
        { city: 'Москва, Московская область', count: 3, percentage: 75 },
        { city: 'Не определён', count: 1, percentage: 25 },
      ]);
    });

    it('returns zero blocks when redis has no data', async () => {
      setupPrisma();
      setupRedisExec(() => null, () => ({}));

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });

      expect(result.phoneClicks.total).toBe(0);
      expect(result.phoneClicks.trend).toBeNull();
      expect(result.phoneClicks.trendDirection).toBe('neutral');
      expect(result.phoneClicks.byDay.every((d) => d.count === 0)).toBe(true);
      expect(result.visitorGeo).toEqual([]);
    });

    it('does not fail the whole response when redis is down', async () => {
      setupPrisma();
      pipeline.exec.mockRejectedValue(new Error('redis down'));

      const result = await businessMetricsService.getBusinessMetrics({ period: 'month', dateFrom, dateTo });

      expect(result.kpi.totalOrders.value).toBe(4);
      expect(result.phoneClicks.total).toBe(0);
      expect(result.phoneClicks.byDay).toEqual([]);
      expect(result.visitorGeo).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith('PhoneClicks collection failed', expect.objectContaining({
        operation: 'buildPhoneClicks',
        error: 'redis down',
      }));
      expect(logger.error).toHaveBeenCalledWith('VisitorGeo collection failed', expect.objectContaining({
        operation: 'buildVisitorGeo',
        error: 'redis down',
      }));
    });
  });
});
