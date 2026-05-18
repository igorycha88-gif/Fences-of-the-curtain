import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockFindMany = jest.fn() as any;
const mockCreate = jest.fn() as any;

jest.mock('@/lib/prisma', () => ({
  prisma: {
    seoKeyword: {
      findMany: mockFindMany,
    },
    seoPosition: {
      findMany: jest.fn(),
      create: mockCreate,
    },
  },
}));

const mockRedisGet = jest.fn() as any;
const mockRedisSet = jest.fn() as any;
const mockRedisDel = jest.fn() as any;

jest.mock('@/lib/redis', () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
    del: mockRedisDel,
  },
}));

jest.mock('@/services/seo/serpParser', () => ({
  parseGoogleSerp: jest.fn(),
  parseYandexSerp: jest.fn(),
  findSiteInResults: jest.fn(),
}));

jest.mock('@/services/telegram/bot', () => ({
  sendTelegramMessage: jest.fn(() => Promise.resolve(true)),
}));

describe('PositionCollector batch strategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue('OK');
    mockRedisDel.mockResolvedValue(1);
  });

  describe('collectAll with batching', () => {
    it('should return empty result when no keywords', async () => {
      mockFindMany.mockResolvedValue([]);

      const { positionCollector } = await import('@/services/seo/positionCollector');
      const result = await positionCollector.collectAll();

      expect(result.checked).toBe(0);
      expect(result.totalBatches).toBe(0);
      expect(result.totalKeywords).toBe(0);
    });

    it('should return session status', async () => {
      mockRedisGet.mockResolvedValue(JSON.stringify({
        totalBatches: 4,
        completedBatches: 2,
        totalKeywords: 138,
        batchResults: [
          { batchIndex: 0, checked: 30, errors: 0, skipped: 0, blocked: 0, duration: 600000 },
          { batchIndex: 1, checked: 35, errors: 1, skipped: 0, blocked: 0, duration: 700000 },
        ],
        startedAt: Date.now() - 3600000,
      }));

      const { positionCollector } = await import('@/services/seo/positionCollector');
      const status = await positionCollector.getSessionStatus();

      expect(status).not.toBeNull();
      expect(status!.totalBatches).toBe(4);
      expect(status!.completedBatches).toBe(2);
      expect(status!.batchResults).toHaveLength(2);
    });

    it('should return null session status when no session', async () => {
      mockRedisGet.mockResolvedValue(null);

      const { positionCollector } = await import('@/services/seo/positionCollector');
      const status = await positionCollector.getSessionStatus();

      expect(status).toBeNull();
    });
  });
});
