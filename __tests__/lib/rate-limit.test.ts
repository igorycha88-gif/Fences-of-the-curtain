import { checkRateLimit, resetRateLimit, getConfig, updateConfig } from '../../src/lib/rate-limit';

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
    mockRedis = require('../../src/lib/redis').redis;
    mockPrisma = require('../../src/lib/prisma').prisma;

    mockPrisma.rateLimitConfig.findUnique.mockResolvedValue({
      id: 'auth',
      maxAttempts: 5,
      windowMs: 900000,
      updatedAt: new Date(),
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
});
