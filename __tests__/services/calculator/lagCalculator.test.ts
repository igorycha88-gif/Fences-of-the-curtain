import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { calculateLags } from '@/services/calculator/lagCalculator';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    lagType: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delPattern: jest.fn().mockResolvedValue(undefined),
    getOrSet: jest.fn().mockImplementation(async (_key: string, factory: () => Promise<any>) => {
      return await factory();
    }),
    healthCheck: jest.fn().mockResolvedValue({ redis: false, memory: true }),
  },
}));

jest.mock('@/lib/utils/roundUp', () => ({
  roundUp: jest.fn((value: number) => Math.ceil(value)),
}));

import { prisma } from '@/lib/prisma';
const mockPrisma = prisma as any;
const { roundUp } = require('@/lib/utils/roundUp') as { roundUp: jest.Mock };

const mockLags = [
  {
    id: 'lag-1',
    name: 'Лага 40x20x3000',
    length: 3000,
    retailPricePerUnit: 350,
    active: true,
    priority: 0,
    validFrom: null,
    expirationDate: null,
  },
  {
    id: 'lag-2',
    name: 'Лага 40x20x6000',
    length: 6000,
    retailPricePerUnit: 650,
    active: true,
    priority: 1,
    validFrom: null,
    expirationDate: null,
  },
];

describe('lagCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateLags with 2 lag rows', () => {
    it('should calculate total lags = ceil(fenceLengthMm / lagLengthMm) * lagRows + 2', async () => {
      mockPrisma.lagType.findMany.mockResolvedValue(mockLags);

      const fenceLengthM = 10;
      const result = await calculateLags(fenceLengthM, 2);

      const fenceLengthMm = fenceLengthM * 1000;
      const lagLengthMm = mockLags[0].length;
      const baseLagsPerRow = Math.ceil(fenceLengthMm / lagLengthMm);
      const expectedTotal = baseLagsPerRow * 2 + 2;

      expect(result.category).toBe('lags');
      expect(result.nomenclatureId).toBe('lag-1');
      expect(result.nomenclatureName).toBe('Лага 40x20x3000');
      expect(result.quantity).toBe(expectedTotal);
      expect(result.unit).toBe('шт');
      expect(result.pricePerUnit).toBe(350);
      expect(result.totalPrice).toBe(expectedTotal * 350);
    });

    it('should select first lag by priority', async () => {
      mockPrisma.lagType.findMany.mockResolvedValue(mockLags);

      const result = await calculateLags(10, 2);

      expect(result.nomenclatureId).toBe('lag-1');
    });
  });

  describe('calculateLags with 3 lag rows', () => {
    it('should calculate with 3 rows', async () => {
      mockPrisma.lagType.findMany.mockResolvedValue(mockLags);

      const fenceLengthM = 15;
      const result = await calculateLags(fenceLengthM, 3);

      const fenceLengthMm = fenceLengthM * 1000;
      const lagLengthMm = mockLags[0].length;
      const baseLagsPerRow = Math.ceil(fenceLengthMm / lagLengthMm);
      const expectedTotal = baseLagsPerRow * 3 + 2;

      expect(result.quantity).toBe(expectedTotal);
      expect(result.totalPrice).toBe(expectedTotal * 350);
    });
  });

  describe('calculateLags — NO_LAGS_FOUND', () => {
    it('should throw NO_LAGS_FOUND when no lags in DB', async () => {
      mockPrisma.lagType.findMany.mockResolvedValue([]);

      await expect(calculateLags(10, 2)).rejects.toEqual({
        error: 'NO_LAGS_FOUND',
        message: 'Не найдены подходящие лаги',
        details: {
          suggestion: 'Свяжитесь с нами для индивидуального расчета',
        },
      });
    });
  });

  describe('lag quantity calculation details', () => {
    it('should use roundUp for base calculation', async () => {
      mockPrisma.lagType.findMany.mockResolvedValue(mockLags);
      roundUp.mockReturnValue(5);

      const result = await calculateLags(10, 2);

      expect(roundUp).toHaveBeenCalledWith((10 * 1000) / 3000);
      expect(result.quantity).toBe(5 * 2 + 2);
    });

    it('should add 2 extra lags for overlap/edges', async () => {
      mockPrisma.lagType.findMany.mockResolvedValue(mockLags);
      roundUp.mockReturnValue(4);

      const result = await calculateLags(12, 2);

      expect(result.quantity).toBe(4 * 2 + 2);
    });
  });
});
