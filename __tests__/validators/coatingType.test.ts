import { describe, it, expect } from '@jest/globals';
import { coatingTypeSchema, coatingTypeUpdateSchema } from '@/lib/validators/coatingType';

describe('CoatingType Validators', () => {
  describe('coatingTypeSchema', () => {
    it('should validate valid coating type data', () => {
      const validData = {
        name: 'Полимерное одностороннее',
        description: 'Описание покрытия',
        baseCost: 50,
        markupCoef: 1.15,
        active: true,
        sortOrder: 0,
      };

      const result = coatingTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalData = {
        name: 'Новое покрытие',
      };

      const result = coatingTypeSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.baseCost).toBe(0);
        expect(result.data.markupCoef).toBe(1.0);
        expect(result.data.active).toBe(true);
        expect(result.data.sortOrder).toBe(0);
      }
    });

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        name: 'А',
      };

      const result = coatingTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('минимум 2 символа');
      }
    });

    it('should reject name longer than 100 characters', () => {
      const invalidData = {
        name: 'А'.repeat(101),
      };

      const result = coatingTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('100 символов');
      }
    });

    it('should reject baseCost less than 0', () => {
      const invalidData = {
        name: 'Тестовое покрытие',
        baseCost: -5,
      };

      const result = coatingTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('не менее 0');
      }
    });

    it('should reject markupCoef less than 1.0', () => {
      const invalidData = {
        name: 'Тестовое покрытие',
        markupCoef: 0.9,
      };

      const result = coatingTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('не менее 1.0');
      }
    });

    it('should reject markupCoef greater than 3.0', () => {
      const invalidData = {
        name: 'Тестовое покрытие',
        markupCoef: 3.1,
      };

      const result = coatingTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('3.0');
      }
    });

    it('should reject description longer than 300 characters', () => {
      const invalidData = {
        name: 'Тестовое покрытие',
        description: 'А'.repeat(301),
      };

      const result = coatingTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('300 символов');
      }
    });
  });

  describe('coatingTypeUpdateSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        name: 'Обновленное покрытие',
      };

      const result = coatingTypeUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = coatingTypeUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate multiple fields', () => {
      const partialData = {
        name: 'Обновленное покрытие',
        baseCost: 60,
        active: false,
      };

      const result = coatingTypeUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });
  });
});
