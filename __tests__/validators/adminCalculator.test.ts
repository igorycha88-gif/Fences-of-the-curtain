import { describe, it, expect } from '@jest/globals';
import {
  adminCalculatorInputSchema,
  adminUpdateEstimateItemsSchema,
  adminAddItemSchema,
  adminCreateOrderSchema,
  adminMultiEstimateSchema,
} from '@/lib/validators/adminCalculator';

describe('AdminCalculator Validators', () => {
  describe('adminCalculatorInputSchema', () => {
    const validInput = {
      fenceTypeId: 'fence-1',
      length: 50,
      height: 2.0,
    };

    it('should validate valid input with required fields only', () => {
      const result = adminCalculatorInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.coating).toBe('POLYMER_SINGLE');
        expect(result.data.hasGate).toBe(false);
        expect(result.data.hasWicket).toBe(false);
      }
    });

    it('should validate valid input with all fields', () => {
      const data = {
        fenceTypeId: 'fence-1',
        length: 100,
        height: 2.5,
        lagRows: 3,
        coating: 'GALVANIZED',
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

      const result = adminCalculatorInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject length below 1', () => {
      const result = adminCalculatorInputSchema.safeParse({ ...validInput, length: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject length above 1000', () => {
      const result = adminCalculatorInputSchema.safeParse({ ...validInput, length: 1001 });
      expect(result.success).toBe(false);
    });

    it('should reject height below 1.5', () => {
      const result = adminCalculatorInputSchema.safeParse({ ...validInput, height: 1.4 });
      expect(result.success).toBe(false);
    });

    it('should reject height above 3.5', () => {
      const result = adminCalculatorInputSchema.safeParse({ ...validInput, height: 3.6 });
      expect(result.success).toBe(false);
    });

    it('should require gateType and gateWidth when hasGate is true', () => {
      const result = adminCalculatorInputSchema.safeParse({
        ...validInput,
        hasGate: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('ворот');
      }
    });

    it('should pass when hasGate is true and gateType + gateWidth provided', () => {
      const result = adminCalculatorInputSchema.safeParse({
        ...validInput,
        hasGate: true,
        gateType: 'SLIDING',
        gateWidth: 4.0,
      });
      expect(result.success).toBe(true);
    });

    it('should require wicketWidth when hasWicket is true', () => {
      const result = adminCalculatorInputSchema.safeParse({
        ...validInput,
        hasWicket: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('калитки');
      }
    });

    it('should pass when hasWicket is true and wicketWidth provided', () => {
      const result = adminCalculatorInputSchema.safeParse({
        ...validInput,
        hasWicket: true,
        wicketWidth: 0.9,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty fenceTypeId', () => {
      const result = adminCalculatorInputSchema.safeParse({ ...validInput, fenceTypeId: '' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid coating value', () => {
      const result = adminCalculatorInputSchema.safeParse({ ...validInput, coating: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });

  describe('adminUpdateEstimateItemsSchema', () => {
    it('should validate valid items', () => {
      const data = {
        items: [
          {
            nomenclatureId: 'nom-1',
            nomenclatureName: 'Столб',
            category: 'posts',
            quantity: 10,
            unit: 'шт',
            pricePerUnit: 1000,
          },
        ],
      };
      const result = adminUpdateEstimateItemsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate items with optional fields', () => {
      const data = {
        items: [
          {
            nomenclatureId: 'nom-1',
            nomenclatureName: 'Столб',
            category: 'posts',
            quantity: 10,
            unit: 'шт',
            pricePerUnit: 1000,
            purchasePrice: 700,
            isDeleted: false,
            isAdded: true,
            autoQuantity: 10,
          },
        ],
        editComment: 'Обновление',
      };
      const result = adminUpdateEstimateItemsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty items array', () => {
      const data = { items: [] };
      const result = adminUpdateEstimateItemsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject negative quantity', () => {
      const data = {
        items: [
          {
            nomenclatureId: 'nom-1',
            nomenclatureName: 'Столб',
            category: 'posts',
            quantity: -1,
            unit: 'шт',
            pricePerUnit: 1000,
          },
        ],
      };
      const result = adminUpdateEstimateItemsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative pricePerUnit', () => {
      const data = {
        items: [
          {
            nomenclatureId: 'nom-1',
            nomenclatureName: 'Столб',
            category: 'posts',
            quantity: 1,
            unit: 'шт',
            pricePerUnit: -100,
          },
        ],
      };
      const result = adminUpdateEstimateItemsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow nullable purchasePrice', () => {
      const data = {
        items: [
          {
            nomenclatureId: 'nom-1',
            nomenclatureName: 'Столб',
            category: 'posts',
            quantity: 1,
            unit: 'шт',
            pricePerUnit: 1000,
            purchasePrice: null,
          },
        ],
      };
      const result = adminUpdateEstimateItemsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject editComment over 500 chars', () => {
      const data = {
        items: [
          {
            nomenclatureId: 'nom-1',
            nomenclatureName: 'Столб',
            category: 'posts',
            quantity: 1,
            unit: 'шт',
            pricePerUnit: 1000,
          },
        ],
        editComment: 'А'.repeat(501),
      };
      const result = adminUpdateEstimateItemsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('adminAddItemSchema', () => {
    it('should validate valid item', () => {
      const data = {
        nomenclatureId: 'nom-1',
        category: 'posts',
        nomenclatureName: 'Столб',
        quantity: 5,
        unit: 'шт',
        pricePerUnit: 1000,
      };
      const result = adminAddItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate item with nullable purchasePrice', () => {
      const data = {
        nomenclatureId: 'nom-1',
        category: 'posts',
        nomenclatureName: 'Столб',
        quantity: 5,
        unit: 'шт',
        pricePerUnit: 1000,
        purchasePrice: null,
      };
      const result = adminAddItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing nomenclatureId', () => {
      const data = {
        category: 'posts',
        nomenclatureName: 'Столб',
        quantity: 5,
        unit: 'шт',
        pricePerUnit: 1000,
      };
      const result = adminAddItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject zero quantity', () => {
      const data = {
        nomenclatureId: 'nom-1',
        category: 'posts',
        nomenclatureName: 'Столб',
        quantity: 0,
        unit: 'шт',
        pricePerUnit: 1000,
      };
      const result = adminAddItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('adminCreateOrderSchema', () => {
    it('should validate valid order', () => {
      const data = {
        estimateId: 'est-1',
        clientName: 'Иван Петров',
        phone: '+79991234567',
      };
      const result = adminCreateOrderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate order with all fields', () => {
      const data = {
        estimateId: 'est-1',
        multiEstimateId: 'multi-1',
        clientName: 'Иван Петров',
        phone: '+79991234567',
        email: 'ivan@example.com',
        comment: 'Срочно',
      };
      const result = adminCreateOrderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty string for email', () => {
      const data = {
        estimateId: 'est-1',
        clientName: 'Иван Петров',
        phone: '+79991234567',
        email: '',
      };
      const result = adminCreateOrderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = {
        estimateId: 'est-1',
        clientName: 'Иван Петров',
        phone: '+79991234567',
        email: 'not-an-email',
      };
      const result = adminCreateOrderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject clientName shorter than 2 chars', () => {
      const data = {
        estimateId: 'est-1',
        clientName: 'А',
        phone: '+79991234567',
      };
      const result = adminCreateOrderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty phone', () => {
      const data = {
        estimateId: 'est-1',
        clientName: 'Иван Петров',
        phone: '',
      };
      const result = adminCreateOrderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject comment over 1000 chars', () => {
      const data = {
        estimateId: 'est-1',
        clientName: 'Иван Петров',
        phone: '+79991234567',
        comment: 'А'.repeat(1001),
      };
      const result = adminCreateOrderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('adminMultiEstimateSchema', () => {
    it('should validate with 1 estimate', () => {
      const data = {
        estimates: [
          {
            fenceTypeId: 'fence-1',
            length: 50,
            height: 2.0,
          },
        ],
      };
      const result = adminMultiEstimateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with 10 estimates', () => {
      const estimates = Array.from({ length: 10 }, (_, i) => ({
        fenceTypeId: `fence-${i}`,
        length: 50 + i,
        height: 2.0,
      }));
      const result = adminMultiEstimateSchema.safeParse({ estimates });
      expect(result.success).toBe(true);
    });

    it('should reject empty estimates array', () => {
      const result = adminMultiEstimateSchema.safeParse({ estimates: [] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 10 estimates', () => {
      const estimates = Array.from({ length: 11 }, (_, i) => ({
        fenceTypeId: `fence-${i}`,
        length: 50 + i,
        height: 2.0,
      }));
      const result = adminMultiEstimateSchema.safeParse({ estimates });
      expect(result.success).toBe(false);
    });
  });
});
