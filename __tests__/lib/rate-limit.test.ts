import {
  checkRateLimit,
  resetRateLimit,
  getConfig,
  updateConfig,
  applyRateLimitByEndpoint,
  clearConfigCache,
} from '../../src/lib/rate-limit';

jest.mock('../../src/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
    multi: jest.fn(() => ({
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    })),
  },
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    rateLimitConfig: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Rate Limiting', () => {
  let mockRedis: any;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    clearConfigCache();
    mockRedis = require('../../src/lib/redis').redis;
    mockPrisma = require('../../src/lib/prisma').prisma;

    mockPrisma.rateLimitConfig.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === 'auth') {
        return { id: 'auth', maxAttempts: 5, windowMs: 900000, updatedAt: new Date() };
      }
      if (where.id === 'orders') {
        return { id: 'orders', maxAttempts: 5, windowMs: 3600000, updatedAt: new Date() };
      }
      return null;
    });
  });

  describe('getConfig', () => {
    it('should return config from database', async () => {
      const config = await getConfig();
      expect(config.maxAttempts).toBe(5);
      expect(config.windowMs).toBe(900000);
      expect(config.keyPrefix).toBe('rate_limit:auth');
    });

    it('should return defaults on database error', async () => {
      mockPrisma.rateLimitConfig.findUnique.mockRejectedValue(new Error('DB error'));
      const config = await getConfig();
      expect(config.maxAttempts).toBe(5);
      expect(config.windowMs).toBe(900000);
    });

    it('should return orders config when endpointType is orders', async () => {
      const config = await getConfig('orders');
      expect(config.maxAttempts).toBe(5);
      expect(config.windowMs).toBe(3600000);
      expect(config.keyPrefix).toBe('rate_limit:orders');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first attempt', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);
      const result = await checkRateLimit('192.168.1.100', 'admin@example.com');
      expect(result).toBe(true);
    });

    it('should block 6th attempt', async () => {
      mockRedis.get.mockResolvedValue('5');
      const result = await checkRateLimit('192.168.1.100', 'admin@example.com');
      expect(result).toBe(false);
      expect(mockRedis.incr).not.toHaveBeenCalled();
    });

    it('should fail-open on Redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Connection refused'));
      const result = await checkRateLimit('192.168.1.100', 'admin@example.com');
      expect(result).toBe(true);
    });
  });

  describe('resetRateLimit', () => {
    it('should delete rate limit key', async () => {
      mockRedis.del.mockResolvedValue(1);
      await resetRateLimit('192.168.1.100', 'admin@example.com');
      expect(mockRedis.del).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('should update config in database', async () => {
      await updateConfig(10, 1800000);
      expect(mockPrisma.rateLimitConfig.update).toHaveBeenCalledWith({
        where: { id: 'auth' },
        data: { maxAttempts: 10, windowMs: 1800000 },
      });
    });
  });

  describe('applyRateLimitByEndpoint', () => {
    it('should allow first 5 requests', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(3600);

      const result = await applyRateLimitByEndpoint('192.168.1.100', 'orders');

      expect(result.allowed).toBe(true);
      expect(result.attempts).toBe(1);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should block 6th request', async () => {
      mockRedis.incr.mockResolvedValue(6);
      mockRedis.ttl.mockResolvedValue(3500);

      const result = await applyRateLimitByEndpoint('192.168.1.100', 'orders');

      expect(result.allowed).toBe(false);
      expect(result.attempts).toBe(6);
      expect(result.remaining).toBe(0);
    });

    it('should use correct Redis key format', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(3600);

      await applyRateLimitByEndpoint('192.168.1.100', 'orders');

      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:orders:192.168.1.100');
    });

    it('should call EXPIRE only when INCR returns 1', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(3600);

      await applyRateLimitByEndpoint('192.168.1.100', 'orders');

      expect(mockRedis.expire).toHaveBeenCalledWith('rate_limit:orders:192.168.1.100', 3600);
    });

    it('should NOT call EXPIRE when INCR returns > 1', async () => {
      mockRedis.incr.mockResolvedValue(2);
      mockRedis.ttl.mockResolvedValue(3500);

      await applyRateLimitByEndpoint('192.168.1.100', 'orders');

      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it('should cache auth and orders configs separately', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(900);

      await applyRateLimitByEndpoint('192.168.1.100', 'auth');
      const authConfig = await getConfig('auth');

      mockRedis.ttl.mockResolvedValue(3600);
      await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      const ordersConfig = await getConfig('orders');

      expect(authConfig.keyPrefix).toBe('rate_limit:auth');
      expect(ordersConfig.keyPrefix).toBe('rate_limit:orders');
      expect(authConfig.windowMs).toBe(900000);
      expect(ordersConfig.windowMs).toBe(3600000);
    });

    it('should fail-open on Redis error', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Connection refused'));

      const result = await applyRateLimitByEndpoint('192.168.1.100', 'orders');

      expect(result.allowed).toBe(true);
      expect(result.attempts).toBe(0);
      expect(result.remaining).toBe(5);
    });

    it('should fail-open on DB error using DEFAULT_CONFIGS', async () => {
      mockPrisma.rateLimitConfig.findUnique.mockRejectedValue(new Error('DB error'));
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(3600);

      const result = await applyRateLimitByEndpoint('192.168.1.100', 'orders');

      expect(result.allowed).toBe(true);
      expect(mockRedis.incr).toHaveBeenCalled();
    });

    it('should decrement remaining with each request', async () => {
      for (let i = 1; i <= 5; i++) {
        mockRedis.incr.mockResolvedValue(i);
        mockRedis.ttl.mockResolvedValue(3600);

        const result = await applyRateLimitByEndpoint('192.168.1.100', 'orders');

        expect(result.remaining).toBe(5 - i);
      }
    });

    it('should use auth config with auth endpointType', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(900);

      await applyRateLimitByEndpoint('192.168.1.100', 'auth');

      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:auth:192.168.1.100');
      expect(mockRedis.expire).toHaveBeenCalledWith('rate_limit:auth:192.168.1.100', 900);
    });
  });

  describe('clearConfigCache', () => {
    it('should clear all cached configs', async () => {
      await getConfig('auth');
      await getConfig('orders');

      clearConfigCache();

      expect(mockPrisma.rateLimitConfig.findUnique).toHaveBeenCalledTimes(2);

      await getConfig('auth');
      await getConfig('orders');

      expect(mockPrisma.rateLimitConfig.findUnique).toHaveBeenCalledTimes(4);
    });
  });

  describe('Counter persistence after restart', () => {
    it('should continue counter from 3 after restart (clearConfigCache)', async () => {
      let redisCounter = 3;
      mockRedis.incr.mockImplementation(async () => ++redisCounter);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(3000);

      const result1 = await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      expect(result1.attempts).toBe(4);
      expect(result1.remaining).toBe(1);

      clearConfigCache();

      const result2 = await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      expect(result2.attempts).toBe(5);
      expect(result2.remaining).toBe(0);

      const result3 = await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      expect(result3.allowed).toBe(false);
      expect(result3.attempts).toBe(6);
    });

    it('should block 6th request after restart simulation', async () => {
      mockRedis.incr.mockResolvedValue(6);
      mockRedis.ttl.mockResolvedValue(3000);

      clearConfigCache();

      const result = await applyRateLimitByEndpoint('192.168.1.100', 'orders');

      expect(result.allowed).toBe(false);
      expect(result.attempts).toBe(6);
      expect(result.remaining).toBe(0);
    });
  });

  describe('Synchronization between instances', () => {
    it('should share counter between two instances using same Redis', async () => {
      let sharedCounter = 0;
      mockRedis.incr.mockImplementation(async () => ++sharedCounter);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(3600);

      const result1 = await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      expect(result1.attempts).toBe(1);
      expect(result1.allowed).toBe(true);

      const result2 = await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      expect(result2.attempts).toBe(2);
      expect(result2.allowed).toBe(true);

      const result3 = await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      expect(result3.attempts).toBe(3);
      expect(result3.allowed).toBe(true);

      const result4 = await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      expect(result4.attempts).toBe(4);
      expect(result4.allowed).toBe(true);

      const result5 = await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      expect(result5.attempts).toBe(5);
      expect(result5.allowed).toBe(true);

      const result6 = await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      expect(result6.attempts).toBe(6);
      expect(result6.allowed).toBe(false);
    });

    it('should not increase limit with multiple instances', async () => {
      let sharedCounter = 0;
      mockRedis.incr.mockImplementation(async () => ++sharedCounter);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(3600);

      for (let i = 0; i < 5; i++) {
        const result = await applyRateLimitByEndpoint('192.168.1.100', 'orders');
        expect(result.allowed).toBe(true);
      }

      const result = await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      expect(result.allowed).toBe(false);
      expect(result.attempts).toBe(6);
    });

    it('should use same Redis key for all instances', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(3600);

      await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      await applyRateLimitByEndpoint('192.168.1.100', 'orders');
      await applyRateLimitByEndpoint('192.168.1.100', 'orders');

      expect(mockRedis.incr).toHaveBeenCalledTimes(3);
      expect(mockRedis.incr).toHaveBeenNthCalledWith(1, 'rate_limit:orders:192.168.1.100');
      expect(mockRedis.incr).toHaveBeenNthCalledWith(2, 'rate_limit:orders:192.168.1.100');
      expect(mockRedis.incr).toHaveBeenNthCalledWith(3, 'rate_limit:orders:192.168.1.100');
    });
  });
});
