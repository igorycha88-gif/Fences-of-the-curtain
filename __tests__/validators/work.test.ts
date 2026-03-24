import { describe, it, expect } from '@jest/globals';
import { createWorkSchema, updateWorkSchema } from '@/lib/validators/work';

describe('Work Validators', () => {
  describe('createWorkSchema', () => {
    const validRelation = {
      fenceType: 'PROFNASTIL',
    };

    it('should validate valid work', () => {
      const validData = {
        name: 'Монтаж забора (базовый)',
        description: 'Стандартный монтаж забора из профнастила',
        category: 'MOUNTING',
        unit: 'M',
        price: 500.00,
        useInCalculator: true,
        sortOrder: 0,
        active: true,
        relations: [validRelation],
      };

      const result = createWorkSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalData = {
        name: 'Тестовая работа',
        category: 'MOUNTING',
        unit: 'M',
        price: 1000.00,
        relations: [validRelation],
      };

      const result = createWorkSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.useInCalculator).toBe(false);
        expect(result.data.sortOrder).toBe(0);
        expect(result.data.active).toBe(true);
      }
    });

    it('should reject name less than 2 characters', () => {
      const invalidData = {
        name: 'М',
        category: 'MOUNTING',
        unit: 'M',
        price: 500.00,
        relations: [validRelation],
      };

      const result = createWorkSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('2 символа');
      }
    });

    it('should reject name more than 200 characters', () => {
      const invalidData = {
        name: 'A'.repeat(201),
        category: 'MOUNTING',
        unit: 'M',
        price: 500.00,
        relations: [validRelation],
      };

      const result = createWorkSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject description more than 1000 characters', () => {
      const invalidData = {
        name: 'Тестовая работа',
        category: 'MOUNTING',
        unit: 'M',
        price: 500.00,
        description: 'A'.repeat(1001),
        relations: [validRelation],
      };

      const result = createWorkSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative price', () => {
      const invalidData = {
        name: 'Тестовая работа',
        category: 'MOUNTING',
        unit: 'M',
        price: -100.00,
        relations: [validRelation],
      };

      const result = createWorkSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        price: 500.00,
      };

      const result = createWorkSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all categories', () => {
      const categories = ['MOUNTING', 'DELIVERY', 'ADDITIONAL', 'MEASUREMENT'];

      categories.forEach((category) => {
        const validData = {
          name: 'Тестовая работа',
          category,
          unit: 'M',
          price: 500.00,
          relations: [validRelation],
        };

        const result = createWorkSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all units', () => {
      const units = ['M', 'KM', 'PCS', 'FIXED', 'M2'];

      units.forEach((unit) => {
        const validData = {
          name: 'Тестовая работа',
          category: 'MOUNTING',
          unit,
          price: 500.00,
          relations: [validRelation],
        };

        const result = createWorkSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('should allow empty relations array', () => {
      const validData = {
        name: 'Тестовая работа',
        category: 'MOUNTING',
        unit: 'M',
        price: 500.00,
        relations: [],
      };

      const result = createWorkSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept multiple relations', () => {
      const validData = {
        name: 'Тестовая работа',
        category: 'MOUNTING',
        unit: 'M',
        price: 500.00,
        relations: [
          { fenceType: 'PROFNASTIL' },
          { fenceType: 'PICKET' },
          { fenceType: 'GATE' },
        ],
      };

      const result = createWorkSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.relations.length).toBe(3);
      }
    });
  });

  describe('updateWorkSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        name: 'Обновленное название',
        price: 600.00,
      };

      const result = updateWorkSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateWorkSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate relations in updates', () => {
      const updateData = {
        relations: [
          { fenceType: 'WICKET' },
        ],
      };

      const result = updateWorkSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should allow updating all fields', () => {
      const updateData = {
        name: 'Полностью обновленная работа',
        description: 'Обновленное описание',
        category: 'DELIVERY',
        unit: 'KM',
        price: 100.00,
        useInCalculator: true,
        sortOrder: 5,
        active: false,
        relations: [
          { fenceType: 'PROFNASTIL' },
          { fenceType: 'PICKET' },
        ],
      };

      const result = updateWorkSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
      const invalidData = {
        name: 'Тест',
        category: 'INVALID_CATEGORY',
      };

      const result = updateWorkSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid unit', () => {
      const invalidData = {
        name: 'Тест',
        unit: 'INVALID_UNIT',
      };

      const result = updateWorkSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('relation schema with referenceType', () => {
    it('should validate valid reference relations for all types', () => {
      const validRelations = [
        { referenceType: 'LAG', referenceId: 'test-lag-id' },
        { referenceType: 'POST', referenceId: 'test-post-id' },
        { referenceType: 'PROFNASTIL', referenceId: 'test-profnastil-id' },
        { referenceType: 'PICKET', referenceId: 'test-picket-id' },
        { referenceType: 'GATE', referenceId: 'test-gate-id' },
        { referenceType: 'WICKET', referenceId: 'test-wicket-id' },
        { referenceType: 'PANEL_3D', referenceId: 'test-panel3d-id' },
      ];

      validRelations.forEach((relation) => {
        const validData = {
          name: 'Тестовая работа',
          category: 'MOUNTING',
          unit: 'M',
          price: 1000.00,
          relations: [relation],
        };

        const result = createWorkSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success && result.data.relations) {
          expect(result.data.relations[0]).toEqual(relation);
        }
      });
    });
  });
});
