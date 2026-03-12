import { describe, it, expect } from '@jest/globals';
import { lagTypeSchema, lagTypeUpdateSchema } from '@/lib/validators/lagType';

describe('LagType Validators - new structure', () => {
  describe('lagTypeSchema', () => {
    it('should validate valid lag with new fields', () => {
      const validData = {
        name: 'Профиль 40x20x2.0',
        description: 'Стандартная лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 150,
        length: 2500,
        purchasePricePerUnit: 120,
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
        retailPricePerUnit: 150,
        length: 2500,
      };

      const result = lagTypeSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should reject width less than 20mm', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 19,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 150,
        length: 2500,
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
        retailPricePerUnit: 150,
        length: 2500,
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
        retailPricePerUnit: 150,
        length: 2500,
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
        retailPricePerUnit: 150,
        length: 2500,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('5.0');
      }
    });

    it('should reject retailPricePerUnit negative', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: -10,
        length: 2500,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate length field', () => {
      const validData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 150,
        length: 3000,
      };

      const result = lagTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(3000);
      }
    });

    it('should reject length < 1500', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 150,
        length: 1000,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject length > 6000', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 150,
        length: 7000,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer length', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 150,
        length: 2500.5,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('целым числом');
      }
    });

    it('should allow null purchasePricePerUnit', () => {
      const dataWithNull = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 150,
        length: 2500,
        purchasePricePerUnit: null,
      };

      const result = lagTypeSchema.safeParse(dataWithNull);
      expect(result.success).toBe(true);
    });

    it('should allow undefined purchasePricePerUnit', () => {
      const dataWithoutPurchase = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 150,
        length: 2500,
      };

      const result = lagTypeSchema.safeParse(dataWithoutPurchase);
      expect(result.success).toBe(true);
    });

    it('should reject negative purchasePricePerUnit', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 150,
        length: 2500,
        purchasePricePerUnit: -10,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate valid purchasePricePerUnit', () => {
      const validData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        retailPricePerUnit: 150,
        length: 2500,
        purchasePricePerUnit: 120,
      };

      const result = lagTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.purchasePricePerUnit).toBe(120);
      }
    });
  });

  describe('lagTypeUpdateSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        name: 'Обновленная лага',
        retailPricePerUnit: 160,
      };

      const result = lagTypeUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = lagTypeUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate length in updates', () => {
      const updateData = {
        length: 3000,
      };

      const result = lagTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should validate purchasePricePerUnit in updates', () => {
      const updateData = {
        purchasePricePerUnit: 125,
      };

      const result = lagTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should allow null purchasePricePerUnit in updates', () => {
      const updateData = {
        purchasePricePerUnit: null,
      };

      const result = lagTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });
});
