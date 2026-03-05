import { describe, it, expect } from '@jest/globals';
import { lagTypeSchema, lagTypeUpdateSchema } from '@/lib/validators/lagType';

describe('LagType Validators', () => {
  describe('lagTypeSchema', () => {
    it('should validate valid lag type data', () => {
      const validData = {
        name: 'Профиль 40x20x2.0',
        description: 'Стандартная лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: 150,
        availableLengths: [
          { length: 2.5, priceCoef: 1.0 },
          { length: 3.0, priceCoef: 1.1 },
        ],
        active: true,
        sortOrder: 0,
      };

      const result = lagTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: 150,
      };

      const result = lagTypeSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
        expect(result.data.sortOrder).toBe(0);
      }
    });

    it('should reject width less than 20mm', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 19,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: 150,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('20 мм');
      }
    });

    it('should reject height less than 20mm', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 19,
        metalThickness: 2.0,
        basePricePerMeter: 150,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('20 мм');
      }
    });

    it('should reject metalThickness less than 1.0mm', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 0.9,
        basePricePerMeter: 150,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('1.0 мм');
      }
    });

    it('should reject metalThickness greater than 5.0mm', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 5.1,
        basePricePerMeter: 150,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('5.0');
      }
    });

    it('should reject basePricePerMeter negative', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: -10,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate availableLengths', () => {
      const dataWithLengths = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: 150,
        availableLengths: [
          { length: 2.5, priceCoef: 1.0 },
          { length: 3.0, priceCoef: 1.1 },
        ],
      };

      const result = lagTypeSchema.safeParse(dataWithLengths);
      expect(result.success).toBe(true);
      if (result.success && result.data.availableLengths) {
        expect(result.data.availableLengths).toHaveLength(2);
        expect(result.data.availableLengths![0].priceCoef).toBe(1.0);
        expect(result.data.availableLengths![1].priceCoef).toBe(1.1);
      }
    });

    it('should reject length outside valid range', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: 150,
        availableLengths: [
          { length: 1.4, priceCoef: 1.0 },
          { length: 6.1, priceCoef: 1.0 },
        ],
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('lagTypeUpdateSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        name: 'Обновленная лага',
        basePricePerMeter: 160,
      };

      const result = lagTypeUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = lagTypeUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
