import { describe, it, expect } from '@jest/globals';
import { fenceHeightSchema, fenceHeightUpdateSchema } from '@/lib/validators/fenceHeight';

describe('FenceHeight Validators', () => {
  describe('fenceHeightSchema', () => {
    it('should validate valid height data', () => {
      const validData = {
        materialId: 'material-id-123',
        height: 2.0,
        priceCoef: 1.1,
        isCustom: false,
        comment: undefined,
      };

      const result = fenceHeightSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Validation errors:', result.error.errors);
      }
    });

    it('should apply default values', () => {
      const minimalData = {
        materialId: 'material-id',
        height: 1.8,
      };

      const result = fenceHeightSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priceCoef).toBe(1.0);
        expect(result.data.isCustom).toBe(false);
      }
    });

    it('should reject height less than 1.0', () => {
      const invalidData = {
        materialId: 'material-id',
        height: 0.9,
      };

      const result = fenceHeightSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('не менее 1.0');
      }
    });

    it('should reject height greater than 5.0', () => {
      const invalidData = {
        materialId: 'material-id',
        height: 5.1,
      };

      const result = fenceHeightSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('5.0');
      }
    });

    it('should reject priceCoef less than 0.5', () => {
      const invalidData = {
        materialId: 'material-id',
        height: 2.0,
        priceCoef: 0.4,
      };

      const result = fenceHeightSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('не менее 0.5');
      }
    });

    it('should reject priceCoef greater than 3.0', () => {
      const invalidData = {
        materialId: 'material-id',
        height: 2.0,
        priceCoef: 3.1,
      };

      const result = fenceHeightSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('3.0');
      }
    });

    it('should validate custom height with comment', () => {
      const customData = {
        materialId: 'material-id',
        height: 3.5,
        priceCoef: 1.5,
        isCustom: true,
        comment: 'Под заказ',
      };

      const result = fenceHeightSchema.safeParse(customData);
      expect(result.success).toBe(true);
    });

    it('should reject comment longer than 200 characters', () => {
      const invalidData = {
        materialId: 'material-id',
        height: 2.0,
        comment: 'А'.repeat(201),
      };

      const result = fenceHeightSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('200 символов');
      }
    });

    it('should require materialId', () => {
      const invalidData = {
        height: 2.0,
      };

      const result = fenceHeightSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('fenceHeightUpdateSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        priceCoef: 1.2,
      };

      const result = fenceHeightUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = fenceHeightUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should update comment only', () => {
      const partialData = {
        comment: 'Новое примечание',
      };

      const result = fenceHeightUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });
  });
});
