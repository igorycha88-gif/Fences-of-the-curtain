import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { findWicketByHeightAndWidth } from '@/services/calculator/wicketLookup';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    wicketType: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn<any>().mockResolvedValue(null),
    set: jest.fn<any>().mockResolvedValue(undefined),
    del: jest.fn<any>().mockResolvedValue(undefined),
    delPattern: jest.fn<any>().mockResolvedValue(undefined),
    getOrSet: jest.fn<any>().mockImplementation(async (_key: string, factory: () => Promise<any>) => {
      return await factory();
    }),
    healthCheck: jest.fn<any>().mockResolvedValue({ redis: false, memory: true }),
  },
}));

import { prisma } from '@/lib/prisma';
const mockPrisma = prisma as any;

const mockWickets = [
  {
    id: 'wicket-1000-2000',
    name: 'Калитка 1000x2000',
    wicketHeight: 2000,
    wicketLength: 1000,
    retailPrice: 8000,
    active: true,
    priority: 0,
    validFrom: null,
    expirationDate: null,
  },
  {
    id: 'wicket-1000-2500',
    name: 'Калитка 1000x2500',
    wicketHeight: 2500,
    wicketLength: 1000,
    retailPrice: 9500,
    active: true,
    priority: 1,
    validFrom: null,
    expirationDate: null,
  },
  {
    id: 'wicket-1200-2000-p0',
    name: 'Калитка 1200x2000 (приоритет 0)',
    wicketHeight: 2000,
    wicketLength: 1200,
    retailPrice: 9000,
    active: true,
    priority: 0,
    validFrom: null,
    expirationDate: null,
  },
  {
    id: 'wicket-1200-2000-p3',
    name: 'Калитка 1200x2000 (приоритет 3)',
    wicketHeight: 2000,
    wicketLength: 1200,
    retailPrice: 8500,
    active: true,
    priority: 3,
    validFrom: null,
    expirationDate: null,
  },
];

describe('wicketLookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.wicketType.findMany.mockResolvedValue(mockWickets);
  });

  describe('exact match', () => {
    it('should find wicket with exact width and height match', async () => {
      const result = await findWicketByHeightAndWidth(2000, 1000);

      expect(result.id).toBe('wicket-1000-2000');
      expect(result.wicketHeight).toBe(2000);
      expect(result.wicketLength).toBe(1000);
      expect(result.retailPrice).toBe(8000);
    });
  });

  describe('nearest match', () => {
    it('should find nearest wider wicket when exact width not available', async () => {
      const result = await findWicketByHeightAndWidth(2000, 1100);

      expect(result.wicketLength).toBeGreaterThanOrEqual(1100);
      expect(result.id).toBe('wicket-1200-2000-p0');
    });

    it('should find nearest taller wicket when exact height not available', async () => {
      const result = await findWicketByHeightAndWidth(2200, 1000);

      expect(result.wicketHeight).toBeGreaterThanOrEqual(2200);
      expect(result.id).toBe('wicket-1000-2500');
    });
  });

  describe('NO_WICKET_FOUND — no width match', () => {
    it('should throw NO_WICKET_FOUND when no wicket matches width', async () => {
      await expect(
        findWicketByHeightAndWidth(2000, 2000)
      ).rejects.toEqual({
        error: 'NO_WICKET_FOUND',
        message: 'Не найдена калитка с указанными параметрами',
        details: {
          requiredWidth: 2000,
          requiredHeight: 2000,
          suggestion: 'Попробуйте выбрать другую ширину калитки',
        },
      });
    });
  });

  describe('NO_WICKET_FOUND — no height match', () => {
    it('should throw NO_WICKET_FOUND when no wicket matches height', async () => {
      await expect(
        findWicketByHeightAndWidth(3000, 1000)
      ).rejects.toEqual({
        error: 'NO_WICKET_FOUND',
        message: 'Не найдена калитка с указанными параметрами',
        details: {
          requiredWidth: 1000,
          requiredHeight: 3000,
          suggestion: 'Попробуйте выбрать другую высоту или ширину калитки',
        },
      });
    });
  });

  describe('priority sorting', () => {
    it('should select wicket with lowest priority among same dimensions', async () => {
      const result = await findWicketByHeightAndWidth(2000, 1200);

      expect(result.id).toBe('wicket-1200-2000-p0');
      expect(result.retailPrice).toBe(9000);
    });
  });
});
