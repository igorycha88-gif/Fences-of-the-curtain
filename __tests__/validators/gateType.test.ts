import { describe, it, expect } from '@jest/globals';
import { gateTypeSchema, gateTypeUpdateSchema } from '@/lib/validators/gateType';

describe('GateType Validators', () => {
  describe('gateTypeSchema', () => {
    it('should validate valid gate with all fields', () => {
      const validData = {
        name: 'Ворота распашные 3x2',
        description: 'Стандартные распашные ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
        purchasePrice: 18000,
        active: true,
      };

      const result = gateTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate valid sliding gate', () => {
      const validData = {
        name: 'Ворота откатные 4x2.5',
        type: 'Откатные',
        metalThickness: 2.5,
        sectionWidth: 60,
        sectionHeight: 40,
        gateHeight: 2500,
        gateLength: 4000,
        retailPrice: 35000,
      };

      const result = gateTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('Откатные');
        expect(result.data.active).toBe(true);
      }
    });

    it('should apply default values', () => {
      const minimalData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should reject invalid type', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Неправильный тип',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Распашные');
      }
    });

    it('should reject name less than 2 characters', () => {
      const invalidData = {
        name: 'В',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('2 символа');
      }
    });

    it('should reject name more than 100 characters', () => {
      const invalidData = {
        name: 'А'.repeat(101),
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('100 символов');
      }
    });

    it('should reject description more than 500 characters', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        description: 'А'.repeat(501),
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('500 символов');
      }
    });

    it('should reject metalThickness less than 1.0mm', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 0.9,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('1.0 мм');
      }
    });

    it('should reject metalThickness greater than 5.0mm', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 5.1,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('5.0');
      }
    });

    it('should reject sectionWidth less than 20mm', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 19,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('20 мм');
      }
    });

    it('should reject sectionWidth greater than 200mm', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 201,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('200 мм');
      }
    });

    it('should reject sectionHeight less than 20mm', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 19,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('20 мм');
      }
    });

    it('should reject gateHeight less than 500mm', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 499,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('500 мм');
      }
    });

    it('should reject gateHeight greater than 3000mm', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 3001,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('3000 мм');
      }
    });

    it('should reject gateLength less than 500mm', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 499,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('500 мм');
      }
    });

    it('should reject gateLength greater than 6000mm', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 6001,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('6000 мм');
      }
    });

    it('should reject negative retailPrice', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: -1000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow null purchasePrice', () => {
      const dataWithNull = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
        purchasePrice: null,
      };

      const result = gateTypeSchema.safeParse(dataWithNull);
      expect(result.success).toBe(true);
    });

    it('should allow undefined purchasePrice', () => {
      const dataWithoutPurchase = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
      };

      const result = gateTypeSchema.safeParse(dataWithoutPurchase);
      expect(result.success).toBe(true);
    });

    it('should reject negative purchasePrice', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
        purchasePrice: -1000,
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate validFrom and expirationDate', () => {
      const validData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
        validFrom: new Date('2026-03-01'),
        expirationDate: new Date('2026-06-01'),
      };

      const result = gateTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject expirationDate before validFrom', () => {
      const invalidData = {
        name: 'Тестовые ворота',
        type: 'Распашные',
        metalThickness: 2.0,
        sectionWidth: 40,
        sectionHeight: 40,
        gateHeight: 2000,
        gateLength: 3000,
        retailPrice: 25000,
        validFrom: new Date('2026-06-01'),
        expirationDate: new Date('2026-03-01'),
      };

      const result = gateTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('позже');
      }
    });
  });

  describe('gateTypeUpdateSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        name: 'Обновленные ворота',
        retailPrice: 26000,
      };

      const result = gateTypeUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = gateTypeUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate type in updates', () => {
      const updateData = {
        type: 'Откатные',
      };

      const result = gateTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should validate purchasePrice in updates', () => {
      const updateData = {
        purchasePrice: 19000,
      };

      const result = gateTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should allow null purchasePrice in updates', () => {
      const updateData = {
        purchasePrice: null,
      };

      const result = gateTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should validate active in updates', () => {
      const updateData = {
        active: false,
      };

      const result = gateTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should validate expirationDate in updates', () => {
      const updateData = {
        expirationDate: new Date('2026-12-31'),
      };

      const result = gateTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });
});
