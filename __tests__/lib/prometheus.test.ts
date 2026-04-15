import { getMetricsString } from '@/lib/prometheus';

jest.mock('prom-client', () => {
  const mockCounter = {
    inc: jest.fn(),
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
    Histogram: jest.fn(),
    Gauge: jest.fn(() => mockGauge),
  };
});

jest.mock('@/lib/redis', () => {
  const mockPipeline = {
    hgetall: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return {
    redis: {
      scan: jest.fn().mockResolvedValue(['0', []]),
      hgetall: jest.fn().mockResolvedValue({}),
      get: jest.fn().mockResolvedValue('0'),
      hincrby: jest.fn().mockResolvedValue(1),
      ping: jest.fn().mockResolvedValue('PONG'),
      pipeline: jest.fn(() => mockPipeline),
    },
  };
});

jest.mock('@/lib/http-metrics', () => ({
  formatHistogramOutput: jest.fn().mockReturnValue(''),
  getTimingData: jest.fn().mockReturnValue(new Map()),
}));

describe('Prometheus Metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetricsString', () => {
    it('should return metrics string', async () => {
      const metrics = await getMetricsString();
      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('# HELP');
    });

    it('should cache metrics within TTL', async () => {
      const first = await getMetricsString();
      const second = await getMetricsString();
      expect(first).toBe(second);
    });
  });
});
