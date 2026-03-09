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
        basePricePerMeter: 150,
        length: 2.5,
        purchasePricePerMeter: 120,
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
        length: 2.5,
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
        length: 2.5,
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
        length: 2.5,
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
        length: 2.5,
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
        length: 2.5,
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
        length: 2.5,
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
        basePricePerMeter: 150,
        length: 3.0,
      };

      const result = lagTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(3.0);
      }
    });

    it('should reject length < 1.5', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: 150,
        length: 1.0,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject length > 6.0', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: 150,
        length: 7.0,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow null purchasePricePerMeter', () => {
      const dataWithNull = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: 150,
        length: 2.5,
        purchasePricePerMeter: null,
      };

      const result = lagTypeSchema.safeParse(dataWithNull);
      expect(result.success).toBe(true);
    });

    it('should allow undefined purchasePricePerMeter', () => {
      const dataWithoutPurchase = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: 150,
        length: 2.5,
      };

      const result = lagTypeSchema.safeParse(dataWithoutPurchase);
      expect(result.success).toBe(true);
    });

    it('should reject negative purchasePricePerMeter', () => {
      const invalidData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: 150,
        length: 2.5,
        purchasePricePerMeter: -10,
      };

      const result = lagTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate valid purchasePricePerMeter', () => {
      const validData = {
        name: 'Тестовая лага',
        width: 40,
        height: 20,
        metalThickness: 2.0,
        basePricePerMeter: 150,
        length: 2.5,
        purchasePricePerMeter: 120,
      };

      const result = lagTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.purchasePricePerMeter).toBe(120);
      }
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

    it('should validate length in updates', () => {
      const updateData = {
        length: 3.0,
      };

      const result = lagTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should validate purchasePricePerMeter in updates', () => {
      const updateData = {
        purchasePricePerMeter: 125,
      };

      const result = lagTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should allow null purchasePricePerMeter in updates', () => {
      const updateData = {
        purchasePricePerMeter: null,
      };

      const result = lagTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });
});
