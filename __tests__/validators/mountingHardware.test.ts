import { describe, it, expect } from '@jest/globals';
import { mountingHardwareSchema, mountingHardwareUpdateSchema, mountingHardwareRelationSchema, ReferenceTypeEnum } from '@/lib/validators/mountingHardware';

describe('MountingHardware Validators', () => {
  describe('mountingHardwareRelationSchema', () => {
    it('should validate valid relation', () => {
      const validData = {
        referenceType: 'LAG',
        referenceId: 'clh123456789',
      };

      const result = mountingHardwareRelationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept all reference types', () => {
      const types = ['LAG', 'POST', 'PROFNASTIL', 'PICKET', 'GATE', 'WICKET'];
      
      types.forEach((type) => {
        const result = mountingHardwareRelationSchema.safeParse({
          referenceType: type,
          referenceId: 'test-id',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid reference type', () => {
      const invalidData = {
        referenceType: 'INVALID',
        referenceId: 'test-id',
      };

      const result = mountingHardwareRelationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty referenceId', () => {
      const invalidData = {
        referenceType: 'LAG',
        referenceId: '',
      };

      const result = mountingHardwareRelationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('mountingHardwareSchema', () => {
    const validRelation = {
      referenceType: 'LAG' as const,
      referenceId: 'clh123456789',
    };

    it('should validate valid mounting hardware', () => {
      const validData = {
        name: 'Саморез 4.2x19 мм',
        description: 'Саморез кровельный с EPDM шайбой',
        purchasePrice: 2.50,
        retailPrice: 5.00,
        validUntil: '2026-12-31T00:00:00.000Z',
        active: true,
        sortOrder: 0,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalData = {
        name: 'Тестовый саморез',
        purchasePrice: 1.00,
        retailPrice: 2.00,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
        expect(result.data.sortOrder).toBe(0);
      }
    });

    it('should reject name less than 2 characters', () => {
      const invalidData = {
        name: 'A',
        purchasePrice: 1.00,
        retailPrice: 2.00,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('2 символа');
      }
    });

    it('should reject name more than 200 characters', () => {
      const invalidData = {
        name: 'A'.repeat(201),
        purchasePrice: 1.00,
        retailPrice: 2.00,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject description more than 1000 characters', () => {
      const invalidData = {
        name: 'Тестовый саморез',
        description: 'A'.repeat(1001),
        purchasePrice: 1.00,
        retailPrice: 2.00,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative purchasePrice', () => {
      const invalidData = {
        name: 'Тестовый саморез',
        purchasePrice: -1,
        retailPrice: 2.00,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative retailPrice', () => {
      const invalidData = {
        name: 'Тестовый саморез',
        purchasePrice: 1.00,
        retailPrice: -2.00,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty relations array', () => {
      const invalidData = {
        name: 'Тестовый саморез',
        purchasePrice: 1.00,
        retailPrice: 2.00,
        relations: [],
      };

      const result = mountingHardwareSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('хотя бы одну связь');
      }
    });

    it('should accept multiple relations', () => {
      const validData = {
        name: 'Тестовый саморез',
        purchasePrice: 1.00,
        retailPrice: 2.00,
        relations: [
          { referenceType: 'LAG', referenceId: 'lag-1' },
          { referenceType: 'POST', referenceId: 'post-1' },
          { referenceType: 'PROFNASTIL', referenceId: 'prof-1' },
        ],
      };

      const result = mountingHardwareSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow null validUntil', () => {
      const validData = {
        name: 'Тестовый саморез',
        purchasePrice: 1.00,
        retailPrice: 2.00,
        validUntil: null,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow null description', () => {
      const validData = {
        name: 'Тестовый саморез',
        description: null,
        purchasePrice: 1.00,
        retailPrice: 2.00,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('BY_INVERSE_RATIO validation', () => {
    const validRelation = {
      referenceType: 'POST' as const,
      referenceId: 'post-123',
    };

    it('should validate BY_INVERSE_RATIO with valid N', () => {
      const validData = {
        name: 'Цемент мешок 25кг',
        purchasePrice: 500.00,
        retailPrice: 750.00,
        useInCalculator: true,
        calculationMethod: 'BY_INVERSE_RATIO',
        calculationValue: 4,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept N=1 for BY_INVERSE_RATIO', () => {
      const validData = {
        name: 'Уплотнитель',
        purchasePrice: 50.00,
        retailPrice: 100.00,
        useInCalculator: true,
        calculationMethod: 'BY_INVERSE_RATIO',
        calculationValue: 1,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept N=10000 for BY_INVERSE_RATIO', () => {
      const validData = {
        name: 'Тест',
        purchasePrice: 10.00,
        retailPrice: 20.00,
        useInCalculator: true,
        calculationMethod: 'BY_INVERSE_RATIO',
        calculationValue: 10000,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject non-integer N for BY_INVERSE_RATIO', () => {
      const invalidData = {
        name: 'Тест',
        purchasePrice: 10.00,
        retailPrice: 20.00,
        useInCalculator: true,
        calculationMethod: 'BY_INVERSE_RATIO',
        calculationValue: 4.5,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject N < 1 for BY_INVERSE_RATIO', () => {
      const invalidData = {
        name: 'Тест',
        purchasePrice: 10.00,
        retailPrice: 20.00,
        useInCalculator: true,
        calculationMethod: 'BY_INVERSE_RATIO',
        calculationValue: 0,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject N > 10000 for BY_INVERSE_RATIO', () => {
      const invalidData = {
        name: 'Тест',
        purchasePrice: 10.00,
        retailPrice: 20.00,
        useInCalculator: true,
        calculationMethod: 'BY_INVERSE_RATIO',
        calculationValue: 10001,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject null N for BY_INVERSE_RATIO', () => {
      const invalidData = {
        name: 'Тест',
        purchasePrice: 10.00,
        retailPrice: 20.00,
        useInCalculator: true,
        calculationMethod: 'BY_INVERSE_RATIO',
        calculationValue: null,
        relations: [validRelation],
      };

      const result = mountingHardwareSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('mountingHardwareUpdateSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        name: 'Обновленное название',
        retailPrice: 10.00,
      };

      const result = mountingHardwareUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = mountingHardwareUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate relations in updates', () => {
      const updateData = {
        relations: [
          { referenceType: 'GATE', referenceId: 'gate-1' },
        ],
      };

      const result = mountingHardwareUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should allow updating active status', () => {
      const updateData = {
        active: false,
      };

      const result = mountingHardwareUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should allow updating purchasePrice', () => {
      const updateData = {
        purchasePrice: 3.50,
      };

      const result = mountingHardwareUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });

  describe('ReferenceTypeEnum', () => {
    it('should contain all expected values', () => {
      const expectedValues = ['LAG', 'POST', 'PROFNASTIL', 'PICKET', 'GATE', 'WICKET'];
      const enumValues = ReferenceTypeEnum.options;
      
      expect(enumValues).toEqual(expect.arrayContaining(expectedValues));
      expect(enumValues.length).toBe(expectedValues.length);
    });
  });
});
