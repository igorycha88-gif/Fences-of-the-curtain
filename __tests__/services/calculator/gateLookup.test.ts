import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { findGateByTypeAndLength } from '@/services/calculator/gateLookup';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    gateType: {
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

const mockGates = [
  {
    id: 'swing-4000-2000',
    name: 'Ворота распашные 4000x2000',
    type: 'Распашные',
    gateHeight: 2000,
    gateLength: 4000,
    retailPrice: 15000,
    active: true,
    priority: 0,
    validFrom: null,
    expirationDate: null,
  },
  {
    id: 'swing-4000-2500',
    name: 'Ворота распашные 4000x2500',
    type: 'Распашные',
    gateHeight: 2500,
    gateLength: 4000,
    retailPrice: 18000,
    active: true,
    priority: 1,
    validFrom: null,
    expirationDate: null,
  },
  {
    id: 'swing-5000-2000',
    name: 'Ворота распашные 5000x2000',
    type: 'Распашные',
    gateHeight: 2000,
    gateLength: 5000,
    retailPrice: 20000,
    active: true,
    priority: 0,
    validFrom: null,
    expirationDate: null,
  },
  {
    id: 'sliding-4000-2000',
    name: 'Ворота откатные 4000x2000',
    type: 'Откатные',
    gateHeight: 2000,
    gateLength: 4000,
    retailPrice: 25000,
    active: true,
    priority: 0,
    validFrom: null,
    expirationDate: null,
  },
  {
    id: 'sliding-5000-2000-p1',
    name: 'Ворота откатные 5000x2000 (приоритет 1)',
    type: 'Откатные',
    gateHeight: 2000,
    gateLength: 5000,
    retailPrice: 28000,
    active: true,
    priority: 1,
    validFrom: null,
    expirationDate: null,
  },
  {
    id: 'sliding-5000-2000-p2',
    name: 'Ворота откатные 5000x2000 (приоритет 2)',
    type: 'Откатные',
    gateHeight: 2000,
    gateLength: 5000,
    retailPrice: 26000,
    active: true,
    priority: 2,
    validFrom: null,
    expirationDate: null,
  },
];

describe('gateLookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.gateType.findMany.mockResolvedValue(mockGates);
  });

  describe('exact width match', () => {
    it('should find gate with exact width match', async () => {
      const result = await findGateByTypeAndLength('SWING', 4000, 2000);

      expect(result.gateLength).toBe(4000);
      expect(result.type).toBe('Распашные');
    });
  });

  describe('nearest width match', () => {
    it('should find nearest wider gate when exact width not available', async () => {
      const result = await findGateByTypeAndLength('SWING', 4500, 2000);

      expect(result.gateLength).toBeGreaterThanOrEqual(4500);
      expect(result.id).toBe('swing-5000-2000');
    });
  });

  describe('height matching — exact', () => {
    it('should prefer exact height match', async () => {
      const result = await findGateByTypeAndLength('SWING', 4000, 2000);

      expect(result.gateHeight).toBe(2000);
      expect(result.id).toBe('swing-4000-2000');
    });
  });

  describe('height matching — nearest (taller)', () => {
    it('should select gate with minimum height >= required', async () => {
      const result = await findGateByTypeAndLength('SWING', 4000, 2200);

      expect(result.gateHeight).toBeGreaterThanOrEqual(2200);
      expect(result.id).toBe('swing-4000-2500');
    });
  });

  describe('height matching — fallback to tallest when no match', () => {
    it('should fallback to tallest available gate when no gate meets height', async () => {
      const result = await findGateByTypeAndLength('SWING', 4000, 3000);

      expect(result.gateHeight).toBe(2500);
    });
  });

  describe('SWING type maps to Распашные', () => {
    it('should map SWING to Распашные', async () => {
      const result = await findGateByTypeAndLength('SWING', 4000, 2000);

      expect(result.type).toBe('Распашные');
    });
  });

  describe('SLIDING type maps to Откатные', () => {
    it('should map SLIDING to Откатные', async () => {
      const result = await findGateByTypeAndLength('SLIDING', 4000, 2000);

      expect(result.type).toBe('Откатные');
    });
  });

  describe('NO_GATE_FOUND', () => {
    it('should throw NO_GATE_FOUND when no gates match width', async () => {
      await expect(
        findGateByTypeAndLength('SWING', 10000, 2000)
      ).rejects.toEqual({
        error: 'NO_GATE_FOUND',
        message: 'Не найдены ворота с указанными параметрами',
        details: {
          requiredWidth: 10000,
          requiredHeight: 2000,
          gateType: 'Распашные',
          suggestion: 'Попробуйте выбрать другую ширину или тип ворот',
        },
      });
    });

    it('should throw NO_GATE_FOUND when no gates match type', async () => {
      await expect(
        findGateByTypeAndLength('SLIDING', 10000, 2000)
      ).rejects.toEqual({
        error: 'NO_GATE_FOUND',
        message: 'Не найдены ворота с указанными параметрами',
        details: {
          requiredWidth: 10000,
          requiredHeight: 2000,
          gateType: 'Откатные',
          suggestion: 'Попробуйте выбрать другую ширину или тип ворот',
        },
      });
    });
  });

  describe('priority sorting', () => {
    it('should select gate with lowest priority among same dimensions', async () => {
      const result = await findGateByTypeAndLength('SLIDING', 5000, 2000);

      expect(result.id).toBe('sliding-5000-2000-p1');
      expect(result.retailPrice).toBe(28000);
    });
  });

  describe('return value structure', () => {
    it('should return all required fields', async () => {
      const result = await findGateByTypeAndLength('SWING', 4000, 2000);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('gateHeight');
      expect(result).toHaveProperty('gateLength');
      expect(result).toHaveProperty('retailPrice');
    });
  });

  describe('width matching — no exact match falls back to wider', () => {
    it('should use wider gates when no exact width match', async () => {
      const result = await findGateByTypeAndLength('SWING', 4200, 2000);

      expect(result.gateLength).toBeGreaterThanOrEqual(4200);
    });
  });

  describe('height matching — multiple exact height matches', () => {
    it('should select lowest priority when multiple exact height matches', async () => {
      const result = await findGateByTypeAndLength('SLIDING', 5000, 2000);

      expect(result.id).toBe('sliding-5000-2000-p1');
      expect(result.gateHeight).toBe(2000);
    });
  });

  describe('no matching type', () => {
    it('should throw when no gates of requested type exist', async () => {
      mockPrisma.gateType.findMany.mockResolvedValueOnce([
        { ...mockGates[0], type: 'Другой' },
      ]);

      await expect(
        findGateByTypeAndLength('SWING', 4000, 2000)
      ).rejects.toHaveProperty('error', 'NO_GATE_FOUND');
    });
  });
});
