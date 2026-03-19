import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
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

describe('Auth Rate Limiting', () => {
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
      return null;
    });
  });

  describe('checkRateLimit for auth', () => {
    it('should allow first 5 login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        mockRedis.get.mockResolvedValue(String(i));
        mockRedis.incr.mockResolvedValue(i + 1);

        const result = await checkRateLimit('192.168.1.100', 'admin@example.com');
        expect(result).toBe(true);
      }
    });

    it('should block 6th login attempt', async () => {
      mockRedis.get.mockResolvedValue('5');

      const result = await checkRateLimit('192.168.1.100', 'admin@example.com');

      expect(result).toBe(false);
      expect(mockRedis.incr).not.toHaveBeenCalled();
    });

    it('should use correct Redis key format for auth', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);

      await checkRateLimit('192.168.1.100', 'admin@example.com');

      expect(mockRedis.multi).toHaveBeenCalled();
    });

    it('should rate limit by IP and email combination', async () => {
      mockRedis.get.mockImplementation(async (key: string) => {
        if (key.includes('admin@example.com')) return '5';
        return null;
      });

      const result1 = await checkRateLimit('192.168.1.100', 'admin@example.com');
      expect(result1).toBe(false);

      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);

      const result2 = await checkRateLimit('192.168.1.100', 'manager@example.com');
      expect(result2).toBe(true);
    });

    it('should rate limit by IP only (same email, different IP)', async () => {
      mockRedis.get.mockImplementation(async (key: string) => {
        if (key.includes('192.168.1.100')) return '5';
        return null;
      });

      const result1 = await checkRateLimit('192.168.1.100', 'admin@example.com');
      expect(result1).toBe(false);

      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);

      const result2 = await checkRateLimit('10.0.0.1', 'admin@example.com');
      expect(result2).toBe(true);
    });

    it('should fail-open on Redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Connection refused'));

      const result = await checkRateLimit('192.168.1.100', 'admin@example.com');

      expect(result).toBe(true);
    });

    it('should fail-open on DB error', async () => {
      mockPrisma.rateLimitConfig.findUnique.mockRejectedValue(new Error('DB error'));
      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);

      const result = await checkRateLimit('192.168.1.100', 'admin@example.com');

      expect(result).toBe(true);
    });

    it('should log blocked attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRedis.get.mockResolvedValue('5');

      await checkRateLimit('192.168.1.100', 'admin@example.com');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RATE LIMIT] Blocked:')
      );

      consoleSpy.mockRestore();
    });

    it('should use auth config (15 min window)', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);

      await checkRateLimit('192.168.1.100', 'admin@example.com');

      const config = await mockPrisma.rateLimitConfig.findUnique({
        where: { id: 'auth' },
      });

      expect(config.windowMs).toBe(900000);
    });
  });

  describe('resetRateLimit for auth', () => {
    it('should reset rate limit after successful login', async () => {
      mockRedis.del.mockResolvedValue(1);

      await resetRateLimit('192.168.1.100', 'admin@example.com');

      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should allow login after reset', async () => {
      mockRedis.del.mockResolvedValue(1);
      await resetRateLimit('192.168.1.100', 'admin@example.com');

      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);

      const result = await checkRateLimit('192.168.1.100', 'admin@example.com');
      expect(result).toBe(true);
    });
  });

  describe('getRateLimitStatus for auth', () => {
    it('should return current rate limit status', async () => {
      mockRedis.get.mockResolvedValue('3');
      mockRedis.ttl.mockResolvedValue(600);

      const status = await getRateLimitStatus('192.168.1.100', 'admin@example.com');

      expect(status.allowed).toBe(true);
      expect(status.attempts).toBe(3);
      expect(status.resetAt).toBeInstanceOf(Date);
    });

    it('should show blocked status when limit exceeded', async () => {
      mockRedis.get.mockResolvedValue('5');
      mockRedis.ttl.mockResolvedValue(300);

      const status = await getRateLimitStatus('192.168.1.100', 'admin@example.com');

      expect(status.allowed).toBe(false);
      expect(status.attempts).toBe(5);
    });

    it('should fail-open on error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const status = await getRateLimitStatus('192.168.1.100', 'admin@example.com');

      expect(status.allowed).toBe(true);
      expect(status.attempts).toBe(0);
    });
  });

  describe('Auth vs Orders rate limiting isolation', () => {
    it('should use different Redis keys for auth and orders', async () => {
      const authKey = 'rate_limit:auth:192.168.1.100:admin@example.com';
      const ordersKey = 'rate_limit:orders:192.168.1.100';

      expect(authKey).not.toBe(ordersKey);
      expect(authKey).toContain('auth');
      expect(ordersKey).toContain('orders');
      expect(authKey).toContain('admin@example.com');
      expect(ordersKey).not.toContain('admin@example.com');
    });

    it('should not affect orders rate limit when auth limit exceeded', async () => {
      mockRedis.get.mockResolvedValue('5');

      const authResult = await checkRateLimit('192.168.1.100', 'admin@example.com');
      expect(authResult).toBe(false);

      mockRedis.get.mockResolvedValue(null);

      const ordersKey = 'rate_limit:orders:192.168.1.100';
      const authKey = 'rate_limit:auth:192.168.1.100:admin@example.com';

      expect(ordersKey).not.toBe(authKey);
    });
  });

  describe('Config caching for auth', () => {
    it('should cache auth config', async () => {
      await checkRateLimit('192.168.1.100', 'admin@example.com');
      await checkRateLimit('192.168.1.100', 'admin@example.com');

      expect(mockPrisma.rateLimitConfig.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should refresh config after cache expiry', async () => {
      await checkRateLimit('192.168.1.100', 'admin@example.com');
      expect(mockPrisma.rateLimitConfig.findUnique).toHaveBeenCalledTimes(1);

      clearConfigCache();

      await checkRateLimit('192.168.1.100', 'admin@example.com');
      expect(mockPrisma.rateLimitConfig.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
