import { describe, it, expect } from '@jest/globals';
import {
  recalculateParamsSchema,
  createAdminEstimateSchema,
  updateAdminEstimateSchema,
  recalculateEstimateSchema,
} from '@/lib/validators/adminEstimate';

describe('AdminEstimate Validators', () => {
  describe('recalculateParamsSchema', () => {
    it('should validate valid partial params', () => {
      const result = recalculateParamsSchema.safeParse({ length: 50, height: 2.0 });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = recalculateParamsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate all fields', () => {
      const data = {
        length: 100,
        height: 2.5,
        coating: 'GALVANIZED',
        lagRows: 3,
        hasGate: true,
        gateType: 'SWING',
        gateWidth: 3.5,
        hasWicket: true,
        wicketWidth: 1.0,
        picketProfileType: 'profile-1',
        picketCoating: 'coating-1',
        picketStep: 5,
        picketMountingType: 'CHESS',
      };
      const result = recalculateParamsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject length below 1', () => {
      const result = recalculateParamsSchema.safeParse({ length: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject length above 1000', () => {
      const result = recalculateParamsSchema.safeParse({ length: 1001 });
      expect(result.success).toBe(false);
    });

    it('should reject height below 1.5', () => {
      const result = recalculateParamsSchema.safeParse({ height: 1.0 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid coating', () => {
      const result = recalculateParamsSchema.safeParse({ coating: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid lagRows', () => {
      const result = recalculateParamsSchema.safeParse({ lagRows: 4 });
      expect(result.success).toBe(false);
    });
  });

  describe('createAdminEstimateSchema', () => {
    it('should validate valid input', () => {
      const data = {
        sourceEstimateId: 'est-1',
        items: {
          deleted: ['item-1', 'item-2'],
          added: [
            {
              category: 'posts',
              nomenclatureId: 'nom-1',
              nomenclatureName: 'Столб',
              quantity: 5,
              unit: 'шт',
              pricePerUnit: 1000,
            },
          ],
        },
      };
      const result = createAdminEstimateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with parameters', () => {
      const data = {
        sourceEstimateId: 'est-1',
        parameters: { length: 60 },
        items: {},
      };
      const result = createAdminEstimateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty sourceEstimateId', () => {
      const data = {
        sourceEstimateId: '',
        items: {},
      };
      const result = createAdminEstimateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject editComment over 500 chars', () => {
      const data = {
        sourceEstimateId: 'est-1',
        editComment: 'А'.repeat(501),
        items: {},
      };
      const result = createAdminEstimateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate with quantityOverrides', () => {
      const data = {
        sourceEstimateId: 'est-1',
        items: {
          quantityOverrides: [
            { nomenclatureId: 'nom-1', quantity: 15 },
          ],
        },
      };
      const result = createAdminEstimateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid added item', () => {
      const data = {
        sourceEstimateId: 'est-1',
        items: {
          added: [{ category: '', nomenclatureId: '', quantity: -1 }],
        },
      };
      const result = createAdminEstimateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updateAdminEstimateSchema', () => {
    it('should validate valid partial update', () => {
      const data = {
        editComment: 'Обновление',
        items: { deleted: ['item-1'] },
      };
      const result = updateAdminEstimateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty items object', () => {
      const result = updateAdminEstimateSchema.safeParse({ items: {} });
      expect(result.success).toBe(true);
    });

    it('should validate with sourceEstimateId and items', () => {
      const data = { sourceEstimateId: 'est-2', items: {} };
      const result = updateAdminEstimateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('recalculateEstimateSchema', () => {
    it('should validate valid input', () => {
      const data = {
        estimateId: 'est-1',
        parameters: { length: 60, height: 2.5 },
      };
      const result = recalculateEstimateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty estimateId', () => {
      const data = {
        estimateId: '',
        parameters: { length: 60 },
      };
      const result = recalculateEstimateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty parameters', () => {
      const data = {
        estimateId: 'est-1',
      };
      const result = recalculateEstimateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate with all parameter fields', () => {
      const data = {
        estimateId: 'est-1',
        parameters: {
          length: 60,
          height: 2.0,
          coating: 'POLYMER_DOUBLE',
          lagRows: 2,
          hasGate: false,
          hasWicket: false,
        },
      };
      const result = recalculateEstimateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
