import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateCanopy, CanopyCalculatorInput } from '@/services/calculator/canopyCalculator';

const baseInput: CanopyCalculatorInput = {
  canopyType: 'single-slope',
  purpose: 'car-1',
  length: 6,
  width: 3,
  height: 2.5,
  frameMaterial: 'metal',
  roofMaterial: 'polycarbonate',
  installationType: 'ground',
  hasWaterSystem: false,
};

describe('canopyCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateCanopy — single-slope (no water system)', () => {
    it('should calculate basic single-slope canopy', async () => {
      const result = await calculateCanopy(baseInput);

      expect(result.materials).toBeDefined();
      expect(result.works).toBeDefined();
      expect(result.materialsTotal).toBeGreaterThan(0);
      expect(result.worksTotal).toBeGreaterThan(0);
      expect(result.grandTotal).toBe(result.materialsTotal + result.worksTotal);
    });

    it('should apply area coefficient of 1.0 for single-slope', async () => {
      const result = await calculateCanopy(baseInput);

      const roofArea = 6 * 3 * 1.0;
      const polycarb = result.materials.find(m => m.name === 'Поликарбонат сотовый 8мм');
      expect(polycarb!.quantity).toBe(roofArea);
      expect(polycarb!.total).toBe(roofArea * 800);
    });

    it('should not include water system material', async () => {
      const result = await calculateCanopy(baseInput);

      const waterSystem = result.materials.find(m => m.name === 'Водосточная система');
      expect(waterSystem).toBeUndefined();
    });
  });

  describe('calculateCanopy — double-slope', () => {
    it('should apply area coefficient of 1.1 for double-slope', async () => {
      const input: CanopyCalculatorInput = { ...baseInput, canopyType: 'double-slope' };
      const result = await calculateCanopy(input);

      const roofArea = 6 * 3 * 1.1;
      const polycarb = result.materials.find(m => m.name === 'Поликарбонат сотовый 8мм');
      expect(polycarb!.quantity).toBeCloseTo(roofArea, 5);
      expect(polycarb!.total).toBeCloseTo(roofArea * 800, 5);
    });
  });

  describe('calculateCanopy — arch', () => {
    it('should apply area coefficient of 1.15 for arch', async () => {
      const input: CanopyCalculatorInput = { ...baseInput, canopyType: 'arch' };
      const result = await calculateCanopy(input);

      const roofArea = 6 * 3 * 1.15;
      const polycarb = result.materials.find(m => m.name === 'Поликарбонат сотовый 8мм');
      expect(polycarb!.quantity).toBeCloseTo(roofArea, 5);
    });
  });

  describe('calculateCanopy — with water system', () => {
    it('should include water system material', async () => {
      const input: CanopyCalculatorInput = { ...baseInput, hasWaterSystem: true };
      const result = await calculateCanopy(input);

      const perimeter = (6 + 3) * 2;
      const waterSystem = result.materials.find(m => m.name === 'Водосточная система');
      expect(waterSystem).toBeDefined();
      expect(waterSystem!.quantity).toBe(perimeter);
      expect(waterSystem!.total).toBe(perimeter * 350);
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
      expect(frame!.quantity).toBe(perimeter);
      expect(frame!.total).toBe(perimeter * 450);
    });

    it('should calculate rafters correctly (length * 3)', async () => {
      const result = await calculateCanopy(baseInput);

      const rafters = result.materials.find(m => m.name === 'Профиль 40x20 для стропил');
      expect(rafters!.quantity).toBe(6 * 3);
      expect(rafters!.total).toBe(6 * 3 * 280);
    });

    it('should calculate posts (at least 4, ceil(perimeter/3))', async () => {
      const result = await calculateCanopy(baseInput);

      const perimeter = (6 + 3) * 2;
      const expectedPosts = Math.max(4, Math.ceil(perimeter / 3));
      const posts = result.materials.find(m => m.name === 'Стойки 80x80');
      expect(posts!.quantity).toBe(expectedPosts);
      expect(posts!.total).toBe(expectedPosts * 1800);
    });

    it('should calculate fasteners (roofArea * 15)', async () => {
      const result = await calculateCanopy(baseInput);

      const roofArea = 6 * 3 * 1.0;
      const fastener = result.materials.find(m => m.name === 'Крепеж');
      expect(fastener!.quantity).toBe(roofArea * 15);
      expect(fastener!.total).toBe(roofArea * 15 * 8);
    });
  });

  describe('work totals', () => {
    it('should calculate canopy installation work (roofArea * 1500)', async () => {
      const result = await calculateCanopy(baseInput);

      const roofArea = 6 * 3 * 1.0;
      const installation = result.works.find(w => w.name === 'Монтаж навеса');
      expect(installation!.quantity).toBe(roofArea);
      expect(installation!.total).toBe(roofArea * 1500);
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
      expect(result.worksTotal).toBe(expectedWorksTotal);
    });

    it('materialsTotal should equal sum of all material totals', async () => {
      const result = await calculateCanopy(baseInput);

      const expectedMaterialsTotal = result.materials.reduce((sum, m) => sum + m.total, 0);
      expect(result.materialsTotal).toBe(expectedMaterialsTotal);
    });

    it('grandTotal should equal materialsTotal + worksTotal', async () => {
      const result = await calculateCanopy(baseInput);

      expect(result.grandTotal).toBe(result.materialsTotal + result.worksTotal);
    });
  });

  describe('edge cases', () => {
    it('should have at least 4 posts even for small canopy', async () => {
      const smallInput: CanopyCalculatorInput = {
        ...baseInput,
        length: 2,
        width: 1,
      };

      const result = await calculateCanopy(smallInput);

      const posts = result.materials.find(m => m.name === 'Стойки 80x80');
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
      const singleResult = await calculateCanopy({ ...baseInput, canopyType: 'single-slope' });
      const doubleResult = await calculateCanopy({ ...baseInput, canopyType: 'double-slope' });
      const archResult = await calculateCanopy({ ...baseInput, canopyType: 'arch' });

      const singlePoly = singleResult.materials.find(m => m.name === 'Поликарбонат сотовый 8мм')!;
      const doublePoly = doubleResult.materials.find(m => m.name === 'Поликарбонат сотовый 8мм')!;
      const archPoly = archResult.materials.find(m => m.name === 'Поликарбонат сотовый 8мм')!;

      expect(singlePoly.quantity).toBeLessThan(doublePoly.quantity);
      expect(doublePoly.quantity).toBeLessThan(archPoly.quantity);
    });

    it('should calculate rafters as length * 3 regardless of type', async () => {
      for (const type of ['single-slope', 'double-slope', 'arch'] as const) {
        const result = await calculateCanopy({ ...baseInput, canopyType: type });
        const rafters = result.materials.find(m => m.name === 'Профиль 40x20 для стропил')!;
        expect(rafters.quantity).toBe(6 * 3);
      }
    });

    it('should have consistent materials count', async () => {
      const result = await calculateCanopy(baseInput);
      expect(result.materials.length).toBeGreaterThan(0);
    });

    it('should have one more material with water system', async () => {
      const resultWithout = await calculateCanopy(baseInput);
      const resultWith = await calculateCanopy({ ...baseInput, hasWaterSystem: true });
      expect(resultWith.materials.length).toBe(resultWithout.materials.length + 1);
    });
  });
});
