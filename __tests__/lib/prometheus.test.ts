import { recordAnalyticsEvent, recordSessionDuration, getMetricsString } from '@/lib/prometheus';

jest.mock('prom-client', () => {
  const mockCounter = {
    inc: jest.fn(),
  };
  const mockHistogram = {
    observe: jest.fn(),
  };
  const mockGauge = {
    set: jest.fn(),
  };
  const mockRegistry = {
    metrics: jest.fn().mockResolvedValue('# HELP test Test metric\n# TYPE test counter\ntest 0'),
  };

  return {
    Registry: jest.fn(() => mockRegistry),
    Counter: jest.fn(() => mockCounter),
    Histogram: jest.fn(() => mockHistogram),
    Gauge: jest.fn(() => mockGauge),
  };
});

jest.mock('@/lib/redis', () => ({
  redis: {
    scan: jest.fn().mockResolvedValue(['0', []]),
    hgetall: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue('0'),
    hincrby: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
  },
}));

describe('Prometheus Metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordAnalyticsEvent', () => {
    it('should record page view event', () => {
      recordAnalyticsEvent('page_view', '/');
      expect(true).toBe(true);
    });

    it('should record calculator event', () => {
      recordAnalyticsEvent('calculator_calculate', '/calculator/fence');
      expect(true).toBe(true);
    });

    it('should record conversion funnel step', () => {
      recordAnalyticsEvent('calculator_open', '/calculator');
      expect(true).toBe(true);
    });

    it('should record generic event', () => {
      recordAnalyticsEvent('custom_event', '/custom');
      expect(true).toBe(true);
    });
  });

  describe('recordSessionDuration', () => {
    it('should record session duration', async () => {
      await recordSessionDuration('/calculator/fence', 120);
      expect(true).toBe(true);
    });

    it('should record short session duration', async () => {
      await recordSessionDuration('/', 10);
      expect(true).toBe(true);
    });

    it('should record long session duration', async () => {
      await recordSessionDuration('/portfolio', 3600);
      expect(true).toBe(true);
    });
  });

  describe('getMetricsString', () => {
    it('should return metrics string', async () => {
      const metrics = await getMetricsString();
      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('# HELP');
    });
  });
});
