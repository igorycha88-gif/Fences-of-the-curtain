import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CanopyCalculatorInput } from '@/services/calculator/canopyCalculator';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    trussProfileType: {
      findUnique: jest.fn(),
    },
    trussRoofCovering: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { calculateCanopy } from '@/services/calculator/canopyCalculator';

const mockPrisma = prisma as any;

const mockPost = {
  id: 'post-1',
  name: 'Профиль 80x80x3',
  retailPricePerMeter: 1200,
  retailPricePerUnit: 5000,
};

const mockRoofCovering = {
  id: 'covering-1',
  name: 'Поликарбонат 8мм',
  retailPricePerSqm: 800,
  thickness: 8,
};

const baseInput: CanopyCalculatorInput = {
  canopyType: 'SINGLE_SLOPE',
  purpose: 'car-1',
  postTypeId: 'post-1',
  length: 6,
  width: 3,
  height: 2.5,
  ridgeHeight: 1.0,
  roofCoveringId: 'covering-1',
  installationType: 'ground',
  hasWaterSystem: false,
};

function setupMocks() {
  mockPrisma.trussProfileType.findUnique.mockResolvedValue(mockPost);
  mockPrisma.trussRoofCovering.findUnique.mockResolvedValue(mockRoofCovering);
}

describe('canopyCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe('calculateCanopy — SINGLE_SLOPE (no water system)', () => {
    it('should calculate basic single-slope canopy', async () => {
      const result = await calculateCanopy(baseInput);

      expect(result.materials).toBeDefined();
      expect(result.works).toBeDefined();
      expect(result.materialsTotal).toBeGreaterThan(0);
      expect(result.worksTotal).toBeGreaterThan(0);
      expect(result.grandTotal).toBe(result.materialsTotal + result.worksTotal);
    });

    it('should use roof covering name and price from DB', async () => {
      const result = await calculateCanopy(baseInput);

      const roofMaterial = result.materials.find(m => m.name === 'Поликарбонат 8мм');
      expect(roofMaterial).toBeDefined();
      expect(roofMaterial!.pricePerUnit).toBe(800);
    });

    it('should apply area coefficient of 1.0 for SINGLE_SLOPE', async () => {
      const result = await calculateCanopy(baseInput);

      const roofArea = 6 * 3 * 1.0;
      const roofMaterial = result.materials.find(m => m.name === 'Поликарбонат 8мм')!;
      expect(roofMaterial.quantity).toBeCloseTo(roofArea, 5);
    });

    it('should use post profile name and price from DB', async () => {
      const result = await calculateCanopy(baseInput);

      const posts = result.materials.find(m => m.name === 'Профиль 80x80x3');
      expect(posts).toBeDefined();
      expect(posts!.pricePerUnit).toBe(5000);
    });

    it('should not include water system material', async () => {
      const result = await calculateCanopy(baseInput);

      const waterSystem = result.materials.find(m => m.name === 'Водосточная система');
      expect(waterSystem).toBeUndefined();
    });
  });

  describe('calculateCanopy — DOUBLE_SLOPE', () => {
    it('should apply area coefficient of 1.1 for DOUBLE_SLOPE', async () => {
      const input: CanopyCalculatorInput = { ...baseInput, canopyType: 'DOUBLE_SLOPE' };
      const result = await calculateCanopy(input);

      const roofArea = 6 * 3 * 1.1;
      const roofMaterial = result.materials.find(m => m.name === 'Поликарбонат 8мм')!;
      expect(roofMaterial.quantity).toBeCloseTo(roofArea, 5);
    });
  });

  describe('calculateCanopy — ARCH', () => {
    it('should apply area coefficient of 1.15 for ARCH', async () => {
      const input: CanopyCalculatorInput = { ...baseInput, canopyType: 'ARCH' };
      const result = await calculateCanopy(input);

      const roofArea = 6 * 3 * 1.15;
      const roofMaterial = result.materials.find(m => m.name === 'Поликарбонат 8мм')!;
      expect(roofMaterial.quantity).toBeCloseTo(roofArea, 5);
    });
  });

  describe('calculateCanopy — SINGLE_SLOPE_CURVED', () => {
    it('should apply area coefficient of 1.1 for SINGLE_SLOPE_CURVED', async () => {
      const input: CanopyCalculatorInput = { ...baseInput, canopyType: 'SINGLE_SLOPE_CURVED' };
      const result = await calculateCanopy(input);

      const roofArea = 6 * 3 * 1.1;
      const roofMaterial = result.materials.find(m => m.name === 'Поликарбонат 8мм')!;
      expect(roofMaterial.quantity).toBeCloseTo(roofArea, 5);
    });
  });

  describe('calculateCanopy — with water system', () => {
    it('should include water system material', async () => {
      const input: CanopyCalculatorInput = { ...baseInput, hasWaterSystem: true };
      const result = await calculateCanopy(input);

      const perimeter = (6 + 3) * 2;
      const waterSystem = result.materials.find(m => m.name === 'Водосточная система');
      expect(waterSystem).toBeDefined();
      expect(waterSystem!.quantity).toBeCloseTo(perimeter, 5);
      expect(waterSystem!.total).toBeCloseTo(perimeter * 350, 5);
    });

    it('should have more materials with water system than without', async () => {
      const resultWithout = await calculateCanopy(baseInput);
      const resultWith = await calculateCanopy({ ...baseInput, hasWaterSystem: true });

      expect(resultWith.materials.length).toBe(resultWithout.materials.length + 1);
      expect(resultWith.materialsTotal).toBeGreaterThan(resultWithout.materialsTotal);
    });
  });

  describe('material quantities and totals', () => {
    it('should calculate frame profile correctly (perimeter)', async () => {
      const result = await calculateCanopy(baseInput);

      const perimeter = (6 + 3) * 2;
      const frame = result.materials.find(m => m.name === 'Профиль 60x60 для каркаса');
      expect(frame!.quantity).toBeCloseTo(perimeter, 5);
      expect(frame!.total).toBeCloseTo(perimeter * 450, 5);
    });

    it('should calculate rafters correctly (length * 3)', async () => {
      const result = await calculateCanopy(baseInput);

      const rafters = result.materials.find(m => m.name === 'Профиль 40x20 для стропил');
      expect(rafters!.quantity).toBeCloseTo(6 * 3, 5);
      expect(rafters!.total).toBeCloseTo(6 * 3 * 280, 5);
    });

    it('should calculate posts (at least 4, ceil(perimeter/3))', async () => {
      const result = await calculateCanopy(baseInput);

      const perimeter = (6 + 3) * 2;
      const expectedPosts = Math.max(4, Math.ceil(perimeter / 3));
      const posts = result.materials.find(m => m.name === 'Профиль 80x80x3');
      expect(posts!.quantity).toBe(expectedPosts);
      expect(posts!.total).toBe(expectedPosts * 5000);
    });

    it('should use retailPricePerMeter * height when retailPricePerUnit is 0', async () => {
      mockPrisma.trussProfileType.findUnique.mockResolvedValue({
        ...mockPost,
        retailPricePerUnit: 0,
      });

      const result = await calculateCanopy(baseInput);

      const posts = result.materials.find(m => m.name === 'Профиль 80x80x3')!;
      const perimeter = (6 + 3) * 2;
      const expectedPosts = Math.max(4, Math.ceil(perimeter / 3));
      expect(posts.pricePerUnit).toBe(1200 * 2.5);
      expect(posts.total).toBe(expectedPosts * 1200 * 2.5);
    });

    it('should calculate fasteners (ceil(roofArea * 15))', async () => {
      const result = await calculateCanopy(baseInput);

      const roofArea = 6 * 3 * 1.0;
      const fastener = result.materials.find(m => m.name === 'Крепеж');
      expect(fastener!.quantity).toBe(Math.ceil(roofArea * 15));
      expect(fastener!.total).toBe(Math.ceil(roofArea * 15) * 8);
    });
  });

  describe('work totals', () => {
    it('should calculate canopy installation work', async () => {
      const result = await calculateCanopy(baseInput);

      const roofArea = 6 * 3 * 1.0;
      const installation = result.works.find(w => w.name === 'Монтаж навеса');
      expect(installation!.quantity).toBeCloseTo(roofArea, 5);
      expect(installation!.total).toBeCloseTo(roofArea * 1500, 5);
    });

    it('should calculate post installation work', async () => {
      const result = await calculateCanopy(baseInput);

      const perimeter = (6 + 3) * 2;
      const expectedPosts = Math.max(4, Math.ceil(perimeter / 3));
      const postWork = result.works.find(w => w.name === 'Установка стоек');
      expect(postWork!.quantity).toBe(expectedPosts);
      expect(postWork!.total).toBe(expectedPosts * 1000);
    });

    it('worksTotal should equal sum of all work totals', async () => {
      const result = await calculateCanopy(baseInput);

      const expectedWorksTotal = result.works.reduce((sum, w) => sum + w.total, 0);
      expect(result.worksTotal).toBeCloseTo(expectedWorksTotal, 5);
    });

    it('materialsTotal should equal sum of all material totals', async () => {
      const result = await calculateCanopy(baseInput);

      const expectedMaterialsTotal = result.materials.reduce((sum, m) => sum + m.total, 0);
      expect(result.materialsTotal).toBeCloseTo(expectedMaterialsTotal, 5);
    });

    it('grandTotal should equal materialsTotal + worksTotal', async () => {
      const result = await calculateCanopy(baseInput);

      expect(result.grandTotal).toBe(result.materialsTotal + result.worksTotal);
    });
  });

  describe('error handling', () => {
    it('should throw error when post profile not found', async () => {
      mockPrisma.trussProfileType.findUnique.mockResolvedValue(null);

      await expect(calculateCanopy(baseInput)).rejects.toThrow('Профиль столба не найден');
    });

    it('should throw error when roof covering not found', async () => {
      mockPrisma.trussRoofCovering.findUnique.mockResolvedValue(null);

      await expect(calculateCanopy(baseInput)).rejects.toThrow('Покрытие крыши не найдено');
    });
  });

  describe('edge cases', () => {
    it('should have at least 4 posts even for small canopy', async () => {
      const smallInput: CanopyCalculatorInput = {
        ...baseInput,
        length: 3,
        width: 2,
      };

      const result = await calculateCanopy(smallInput);

      const posts = result.materials.find(m => m.name === 'Профиль 80x80x3');
      expect(posts!.quantity).toBeGreaterThanOrEqual(4);
    });

    it('should handle large canopy dimensions', async () => {
      const input: CanopyCalculatorInput = {
        ...baseInput,
        length: 20,
        width: 10,
        hasWaterSystem: true,
      };

      const result = await calculateCanopy(input);

      expect(result.materials.length).toBeGreaterThan(0);
      expect(result.grandTotal).toBeGreaterThan(0);
      expect(result.grandTotal).toBe(result.materialsTotal + result.worksTotal);
    });

    it('should apply correct coefficient for each canopy type', async () => {
      const singleResult = await calculateCanopy({ ...baseInput, canopyType: 'SINGLE_SLOPE' });
      const doubleResult = await calculateCanopy({ ...baseInput, canopyType: 'DOUBLE_SLOPE' });
      const archResult = await calculateCanopy({ ...baseInput, canopyType: 'ARCH' });

      const singleRoof = singleResult.materials.find(m => m.name === 'Поликарбонат 8мм')!;
      const doubleRoof = doubleResult.materials.find(m => m.name === 'Поликарбонат 8мм')!;
      const archRoof = archResult.materials.find(m => m.name === 'Поликарбонат 8мм')!;

      expect(singleRoof.quantity).toBeLessThan(doubleRoof.quantity);
      expect(doubleRoof.quantity).toBeLessThan(archRoof.quantity);
    });

    it('should have one more material with water system', async () => {
      const resultWithout = await calculateCanopy(baseInput);
      const resultWith = await calculateCanopy({ ...baseInput, hasWaterSystem: true });
      expect(resultWith.materials.length).toBe(resultWithout.materials.length + 1);
    });
  });

  describe('logging', () => {
    it('should log calculation start and completion', async () => {
      const { default: logger } = require('@/lib/logger');

      await calculateCanopy(baseInput);

      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith(
        'Starting canopy calculation',
        expect.objectContaining({ input: expect.any(Object) })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Canopy calculation completed',
        expect.objectContaining({ grandTotal: expect.any(Number) })
      );
    });

    it('should log error when post profile not found', async () => {
      const { default: logger } = require('@/lib/logger');
      mockPrisma.trussProfileType.findUnique.mockResolvedValue(null);

      await expect(calculateCanopy(baseInput)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Post profile not found',
        expect.objectContaining({ postTypeId: 'post-1' })
      );
    });
  });
});
