import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { findPicketByParams } from '@/services/calculator/picketLookup';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    picketType: {
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

import { prisma } from '@/lib/prisma';
const mockPrisma = prisma as any;

const mockPickets = [
  {
    id: 'picket-1',
    name: 'Евроштакетник М-образный 2000мм',
    length: 2000,
    width: 100,
    metalThickness: 0.5,
    retailPricePerUnit: 250,
    priority: 0,
    active: true,
    validUntil: null,
    picketProfile: {
      id: 'profile-m',
      name: 'М-образный',
    },
    picketCoatingType: {
      id: 'coating-polymer',
      name: 'Полимерное',
    },
    color: 'RAL 8017',
  },
  {
    id: 'picket-2',
    name: 'Евроштакетник П-образный 2000мм',
    length: 2000,
    width: 120,
    metalThickness: 0.5,
    retailPricePerUnit: 280,
    priority: 1,
    active: true,
    validUntil: null,
    picketProfile: {
      id: 'profile-p',
      name: 'П-образный',
    },
    picketCoatingType: {
      id: 'coating-galv',
      name: 'Оцинковка',
    },
    color: null,
  },
];

describe('picketLookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.picketType.findMany.mockResolvedValue(mockPickets);
  });

  describe('findPicketByParams — matching picket', () => {
    it('should find picket matching length and profile', async () => {
      const result = await findPicketByParams({
        lengthMm: 2000,
        profileTypeName: 'М-образный',
      });

      expect(result.id).toBe('picket-1');
      expect(result.name).toBe('Евроштакетник М-образный 2000мм');
      expect(result.length).toBe(2000);
      expect(result.width).toBe(100);
      expect(result.metalThickness).toBe(0.5);
      expect(result.retailPricePerUnit).toBe(250);
    });

    it('should return profile info from picketProfile relation', async () => {
      const result = await findPicketByParams({
        lengthMm: 2000,
        profileTypeName: 'М-образный',
      });

      expect(result.profileTypeName).toBe('М-образный');
    });

    it('should return coating info from picketCoatingType relation', async () => {
      const result = await findPicketByParams({
        lengthMm: 2000,
        profileTypeName: 'М-образный',
      });

      expect(result.coatingName).toBe('Полимерное');
      expect(result.color).toBe('RAL 8017');
    });

    it('should return null color when not set', async () => {
      const result = await findPicketByParams({
        lengthMm: 2000,
        profileTypeName: 'П-образный',
      });

      expect(result.color).toBeNull();
      expect(result.coatingName).toBe('Оцинковка');
    });
  });

  describe('findPicketByParams — NO_PICKET_FOUND', () => {
    it('should throw NO_PICKET_FOUND when no picket matches', async () => {
      await expect(
        findPicketByParams({
          lengthMm: 3000,
          profileTypeName: 'М-образный',
        })
      ).rejects.toEqual({
        error: 'NO_PICKET_FOUND',
        message: 'Не найден евроштакетник с указанными параметрами',
        details: {
          requiredLength: 3000,
          profileType: 'М-образный',
          coating: '',
          suggestion: 'Попробуйте выбрать другие параметры или свяжитесь с нами',
        },
      });
    });

    it('should throw NO_PICKET_FOUND when profile type does not match', async () => {
      await expect(
        findPicketByParams({
          lengthMm: 2000,
          profileTypeName: 'С-образный',
        })
      ).rejects.toEqual({
        error: 'NO_PICKET_FOUND',
        message: 'Не найден евроштакетник с указанными параметрами',
        details: {
          requiredLength: 2000,
          profileType: 'С-образный',
          coating: '',
          suggestion: 'Попробуйте выбрать другие параметры или свяжитесь с нами',
        },
      });
    });
  });
});
