import { describe, it, expect } from '@jest/globals';
import { fenceTypeSchema, fenceTypeUpdateSchema } from '@/lib/validators/fenceType';

describe('FenceType Validators', () => {
  describe('fenceTypeSchema', () => {
    it('should validate valid fence type data', () => {
      const validData = {
        name: 'Профнастил',
        description: 'Описание типа забора',
        difficultyCoef: 1.0,
        postSpacing: 2.5,
        defaultLagRows: 2,
        active: true,
        priority: 0,
      };

      const result = fenceTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalData = {
        name: 'Тестовый забор',
      };

      const result = fenceTypeSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.difficultyCoef).toBe(1.0);
        expect(result.data.postSpacing).toBe(2.5);
        expect(result.data.defaultLagRows).toBe(2);
        expect(result.data.active).toBe(true);
        expect(result.data.priority).toBe(0);
      }
    });

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        name: 'А',
      };

      const result = fenceTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('минимум 2 символа');
      }
    });

    it('should reject name longer than 100 characters', () => {
      const invalidData = {
        name: 'А'.repeat(101),
      };

      const result = fenceTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('100 символов');
      }
    });

    it('should reject difficultyCoef less than 0.5', () => {
      const invalidData = {
        name: 'Тест',
        difficultyCoef: 0.4,
      };

      const result = fenceTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('не менее 0.5');
      }
    });

    it('should reject difficultyCoef greater than 3.0', () => {
      const invalidData = {
        name: 'Тест',
        difficultyCoef: 3.1,
      };

      const result = fenceTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('3.0');
      }
    });

    it('should reject postSpacing less than 1.5', () => {
      const invalidData = {
        name: 'Тест',
        postSpacing: 1.4,
      };

      const result = fenceTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('не менее 1.5');
      }
    });

    it('should reject postSpacing greater than 4.0', () => {
      const invalidData = {
        name: 'Тест',
        postSpacing: 4.1,
      };

      const result = fenceTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('4.0');
      }
    });

    it('should accept only 2 or 3 for defaultLagRows', () => {
      const validData2 = { name: 'Тест', defaultLagRows: 2 };
      const validData3 = { name: 'Тест', defaultLagRows: 3 };
      const invalidData = { name: 'Тест', defaultLagRows: 4 };

      expect(fenceTypeSchema.safeParse(validData2).success).toBe(true);
      expect(fenceTypeSchema.safeParse(validData3).success).toBe(true);
      expect(fenceTypeSchema.safeParse(invalidData).success).toBe(false);
    });

    it('should reject description longer than 500 characters', () => {
      const invalidData = {
        name: 'Тест',
        description: 'А'.repeat(501),
      };

      const result = fenceTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('500 символов');
      }
    });
  });

  describe('fenceTypeUpdateSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        name: 'Новое название',
      };

      const result = fenceTypeUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = fenceTypeUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate multiple fields', () => {
      const partialData = {
        name: 'Новое название',
        difficultyCoef: 1.5,
        active: false,
      };

      const result = fenceTypeUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });
  });
});
