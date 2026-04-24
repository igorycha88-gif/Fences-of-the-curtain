import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateFence, FenceCalculatorInput } from '@/services/calculator/fenceCalculator';

const baseInput: FenceCalculatorInput = {
  fenceTypeId: 'ft-1',
  length: 30,
  height: 2,
  postType: '60x60',
  lagType: '40x20',
  lagRows: 2,
  hasGate: false,
  hasWicket: false,
  coating: 'POLYMER_SINGLE',
};

describe('fenceCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateFence — basic (no gate, no wicket)', () => {
    it('should calculate materials and works for a basic fence', async () => {
      const result = await calculateFence(baseInput);

      expect(result.materials).toBeDefined();
      expect(result.works).toBeDefined();
      expect(result.materialsTotal).toBeGreaterThan(0);
      expect(result.worksTotal).toBeGreaterThan(0);
      expect(result.grandTotal).toBe(result.materialsTotal + result.worksTotal);
    });

    it('should compute coverage area = length * height', async () => {
      const result = await calculateFence(baseInput);

      const profnastilItem = result.materials.find(m => m.name === 'Профнастил С8');
      expect(profnastilItem).toBeDefined();
      expect(profnastilItem!.quantity).toBe(30 * 2);
      expect(profnastilItem!.total).toBe(30 * 2 * 450);
    });

    it('should compute posts count = ceil(length / postSpacingM) + 1', async () => {
      const result = await calculateFence(baseInput);

      const postSpacingM = 2500 / 1000;
      const expectedPosts = Math.ceil(30 / postSpacingM) + 1;
      const postItem = result.materials.find(m => m.name === 'Столбы металлические');
      expect(postItem).toBeDefined();
      expect(postItem!.quantity).toBe(expectedPosts);
      expect(postItem!.total).toBe(expectedPosts * 1200);
    });

    it('should compute lag length = length * lagRows', async () => {
      const result = await calculateFence(baseInput);

      const expectedLagsLength = 30 * 2;
      const lagItem = result.materials.find(m => m.name === 'Лаги металлические');
      expect(lagItem).toBeDefined();
      expect(lagItem!.quantity).toBe(expectedLagsLength);
      expect(lagItem!.total).toBe(expectedLagsLength * 300);
    });

    it('should include крепеж = length * 10', async () => {
      const result = await calculateFence(baseInput);

      const fastener = result.materials.find(m => m.name === 'Крепеж');
      expect(fastener).toBeDefined();
      expect(fastener!.quantity).toBe(30 * 10);
      expect(fastener!.total).toBe(30 * 10 * 5);
    });

    it('should include work: Монтаж забора', async () => {
      const result = await calculateFence(baseInput);

      const montage = result.works.find(w => w.name === 'Монтаж забора');
      expect(montage).toBeDefined();
      expect(montage!.quantity).toBe(30);
      expect(montage!.total).toBe(30 * 800);
    });

    it('should include work: Бетонирование столбов', async () => {
      const result = await calculateFence(baseInput);

      const postSpacingM = 2500 / 1000;
      const expectedPosts = Math.ceil(30 / postSpacingM) + 1;
      const beton = result.works.find(w => w.name === 'Бетонирование столбов');
      expect(beton).toBeDefined();
      expect(beton!.quantity).toBe(expectedPosts);
      expect(beton!.total).toBe(expectedPosts * 500);
    });
  });

  describe('calculateFence — with gate (SWING)', () => {
    it('should add swing gate material and installation work', async () => {
      const input: FenceCalculatorInput = {
        ...baseInput,
        hasGate: true,
        gateType: 'SWING',
        gateWidth: 4,
      };

      const result = await calculateFence(input);

      const gate = result.materials.find(m => m.name === 'Ворота распашные');
      expect(gate).toBeDefined();
      expect(gate!.quantity).toBe(1);
      expect(gate!.pricePerUnit).toBe(15000);
      expect(gate!.total).toBe(15000);

      const gateWork = result.works.find(w => w.name === 'Установка ворот');
      expect(gateWork).toBeDefined();
      expect(gateWork!.total).toBe(5000);
    });
  });

  describe('calculateFence — with gate (SLIDING)', () => {
    it('should add sliding gate material and installation work', async () => {
      const input: FenceCalculatorInput = {
        ...baseInput,
        hasGate: true,
        gateType: 'SLIDING',
        gateWidth: 5,
      };

      const result = await calculateFence(input);

      const gate = result.materials.find(m => m.name === 'Ворота откатные');
      expect(gate).toBeDefined();
      expect(gate!.quantity).toBe(1);
      expect(gate!.pricePerUnit).toBe(25000);
      expect(gate!.total).toBe(25000);

      const gateWork = result.works.find(w => w.name === 'Установка ворот');
      expect(gateWork).toBeDefined();
      expect(gateWork!.total).toBe(5000);
    });
  });

  describe('calculateFence — with wicket', () => {
    it('should add wicket material and installation work', async () => {
      const input: FenceCalculatorInput = {
        ...baseInput,
        hasWicket: true,
        wicketWidth: 1,
      };

      const result = await calculateFence(input);

      const wicket = result.materials.find(m => m.name === 'Калитка');
      expect(wicket).toBeDefined();
      expect(wicket!.quantity).toBe(1);
      expect(wicket!.pricePerUnit).toBe(8000);
      expect(wicket!.total).toBe(8000);

      const wicketWork = result.works.find(w => w.name === 'Установка калитки');
      expect(wicketWork).toBeDefined();
      expect(wicketWork!.total).toBe(3000);
    });
  });

  describe('calculateFence — with gate and wicket', () => {
    it('should include both gate and wicket materials and works', async () => {
      const input: FenceCalculatorInput = {
        ...baseInput,
        hasGate: true,
        gateType: 'SWING',
        gateWidth: 4,
        hasWicket: true,
        wicketWidth: 1.2,
      };

      const result = await calculateFence(input);

      const gate = result.materials.find(m => m.name === 'Ворота распашные');
      const wicket = result.materials.find(m => m.name === 'Калитка');
      expect(gate).toBeDefined();
      expect(wicket).toBeDefined();

      const gateWork = result.works.find(w => w.name === 'Установка ворот');
      const wicketWork = result.works.find(w => w.name === 'Установка калитки');
      expect(gateWork).toBeDefined();
      expect(wicketWork).toBeDefined();
    });
  });

  describe('calculateFence — custom postSpacing and difficultyCoef', () => {
    it('should respect custom postSpacing', async () => {
      const input: FenceCalculatorInput = {
        ...baseInput,
        postSpacing: 3000,
      };

      const result = await calculateFence(input);

      const postSpacingM = 3000 / 1000;
      const expectedPosts = Math.ceil(30 / postSpacingM) + 1;
      const postItem = result.materials.find(m => m.name === 'Столбы металлические');
      expect(postItem!.quantity).toBe(expectedPosts);
    });

    it('should apply difficultyCoef to worksTotal', async () => {
      const input: FenceCalculatorInput = {
        ...baseInput,
        difficultyCoef: 1.2,
      };

      const result = await calculateFence(input);

      const rawWorkSum = result.works.reduce((sum, w) => sum + w.total, 0);
      expect(result.worksTotal).toBe(rawWorkSum * 1.2);
    });

    it('should use default difficultyCoef of 1.0 when not provided', async () => {
      const result = await calculateFence(baseInput);

      const rawWorkSum = result.works.reduce((sum, w) => sum + w.total, 0);
      expect(result.worksTotal).toBe(rawWorkSum);
    });
  });

  describe('verify totals', () => {
    it('materialsTotal should equal sum of all material totals', async () => {
      const result = await calculateFence(baseInput);

      const expectedTotal = result.materials.reduce((sum, m) => sum + m.total, 0);
      expect(result.materialsTotal).toBe(expectedTotal);
    });

    it('worksTotal should equal sum of work totals * difficultyCoef', async () => {
      const input: FenceCalculatorInput = {
        ...baseInput,
        difficultyCoef: 1.5,
      };

      const result = await calculateFence(input);

      const rawWorkSum = result.works.reduce((sum, w) => sum + w.total, 0);
      expect(result.worksTotal).toBe(rawWorkSum * 1.5);
    });

    it('grandTotal should equal materialsTotal + worksTotal', async () => {
      const result = await calculateFence(baseInput);

      expect(result.grandTotal).toBe(result.materialsTotal + result.worksTotal);
    });

    it('grandTotal should equal materialsTotal + worksTotal with gate and wicket', async () => {
      const input: FenceCalculatorInput = {
        ...baseInput,
        hasGate: true,
        gateType: 'SLIDING',
        hasWicket: true,
        difficultyCoef: 1.3,
      };

      const result = await calculateFence(input);

      expect(result.grandTotal).toBe(result.materialsTotal + result.worksTotal);
    });
  });

  describe('calculateFence — edge cases', () => {
    it('should handle zero length', async () => {
      const input: FenceCalculatorInput = { ...baseInput, length: 0 };
      const result = await calculateFence(input);

      const profnastil = result.materials.find(m => m.name === 'Профнастил С8');
      expect(profnastil!.quantity).toBe(0);
      expect(profnastil!.total).toBe(0);
    });

    it('should handle very small length', async () => {
      const input: FenceCalculatorInput = { ...baseInput, length: 0.5 };
      const result = await calculateFence(input);

      expect(result.materials.length).toBeGreaterThan(0);
      expect(result.works.length).toBeGreaterThan(0);
    });

    it('should handle lagRows = 3', async () => {
      const input: FenceCalculatorInput = { ...baseInput, lagRows: 3 };
      const result = await calculateFence(input);

      const lagItem = result.materials.find(m => m.name === 'Лаги металлические');
      expect(lagItem!.quantity).toBe(30 * 3);
    });

    it('should default gateWidth to 4 when not provided', async () => {
      const input: FenceCalculatorInput = {
        ...baseInput,
        hasGate: true,
        gateType: 'SWING',
      };
      const result = await calculateFence(input);

      const gate = result.materials.find(m => m.name === 'Ворота распашные');
      expect(gate).toBeDefined();
    });

    it('should default wicketWidth to 1 when not provided', async () => {
      const input: FenceCalculatorInput = {
        ...baseInput,
        hasWicket: true,
      };
      const result = await calculateFence(input);

      const wicket = result.materials.find(m => m.name === 'Калитка');
      expect(wicket).toBeDefined();
    });

    it('should default postSpacing to 2500 when not provided', async () => {
      const result = await calculateFence(baseInput);

      const postItem = result.materials.find(m => m.name === 'Столбы металлические');
      const expectedPosts = Math.ceil(30 / 2.5) + 1;
      expect(postItem!.quantity).toBe(expectedPosts);
    });

    it('should default difficultyCoef to 1.0 when not provided', async () => {
      const result = await calculateFence(baseInput);

      const rawWorkSum = result.works.reduce((sum, w) => sum + w.total, 0);
      expect(result.worksTotal).toBe(rawWorkSum);
    });

    it('should use all coating types without affecting result', async () => {
      const coatings: FenceCalculatorInput['coating'][] = ['GALVANIZED', 'POLYMER_SINGLE', 'POLYMER_DOUBLE'];

      for (const coating of coatings) {
        const result = await calculateFence({ ...baseInput, coating });
        expect(result.grandTotal).toBeGreaterThan(0);
      }
    });

    it('should handle large fence with gate + wicket + high difficulty', async () => {
      const input: FenceCalculatorInput = {
        ...baseInput,
        length: 100,
        height: 3,
        lagRows: 3,
        hasGate: true,
        gateType: 'SLIDING',
        hasWicket: true,
        difficultyCoef: 1.5,
        postSpacing: 2000,
      };

      const result = await calculateFence(input);

      expect(result.materials.length).toBeGreaterThan(3);
      expect(result.works.length).toBeGreaterThan(2);
      expect(result.grandTotal).toBe(result.materialsTotal + result.worksTotal);
      expect(result.worksTotal).toBeGreaterThan(0);
    });
  });
});
