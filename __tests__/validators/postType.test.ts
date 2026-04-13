import { describe, it, expect } from '@jest/globals';
import { postTypeSchema, postTypeUpdateSchema } from '@/lib/validators/postType';

describe('PostType Validators - new unified structure', () => {
  describe('postTypeSchema', () => {
    it('should validate valid post with new fields', () => {
      const validData = {
        name: 'Столб 60x60x2.5',
        description: 'Стандартный столб для забора',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
        purchasePricePerUnit: 600,
        active: true,
      };

      const result = postTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should reject sectionWidth less than 40mm', () => {
      const invalidData = {
        name: 'Тестовый столб',
        sectionWidth: 39,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('40 мм');
      }
    });

    it('should reject sectionWidth greater than 120mm', () => {
      const invalidData = {
        name: 'Тестовый столб',
        sectionWidth: 121,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('120 мм');
      }
    });

    it('should reject sectionHeight less than 40mm', () => {
      const invalidData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 39,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('40 мм');
      }
    });

    it('should reject sectionHeight greater than 120mm', () => {
      const invalidData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 121,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('120 мм');
      }
    });

    it('should reject wallThickness less than 1.5mm', () => {
      const invalidData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 1.4,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('1.5 мм');
      }
    });

    it('should reject wallThickness greater than 5.0mm', () => {
      const invalidData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 5.1,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('5.0');
      }
    });

    it('should reject pricePerMeter negative', () => {
      const invalidData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: -10,
        length: 2.5,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate length field', () => {
      const validData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 3.0,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(3.0);
      }
    });

    it('should reject length < 1.5', () => {
      const invalidData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 1.0,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject length > 6.0', () => {
      const invalidData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 7.0,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow null purchasePricePerUnit', () => {
      const dataWithNull = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
        purchasePricePerUnit: null,
      };

      const result = postTypeSchema.safeParse(dataWithNull);
      expect(result.success).toBe(true);
    });

    it('should allow undefined purchasePricePerUnit', () => {
      const dataWithoutPurchase = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(dataWithoutPurchase);
      expect(result.success).toBe(true);
    });

    it('should reject negative purchasePricePerUnit', () => {
      const invalidData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
        purchasePricePerUnit: -10,
      };

      const result = postTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate valid purchasePricePerUnit', () => {
      const validData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
        purchasePricePerUnit: 240,
      };

      const result = postTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.purchasePricePerUnit).toBe(240);
      }
    });

    it('should ignore old availableLengths field if provided', () => {
      const dataWithOldField = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
        availableLengths: [{ length: 2.5, pricePerMeter: 300 }],
      };

      const result = postTypeSchema.safeParse(dataWithOldField);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2.5);
      }
    });

    it('should ignore old purchasePrices field if provided', () => {
      const dataWithOldField = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
        purchasePrices: [{ length: 2.5, purchasePrice: 240 }],
      };

      const result = postTypeSchema.safeParse(dataWithOldField);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2.5);
      }
    });

    it('should accept forMesh true', () => {
      const validData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
        forMesh: true,
      };

      const result = postTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.forMesh).toBe(true);
      }
    });

    it('should accept forMesh false', () => {
      const validData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
        forMesh: false,
      };

      const result = postTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.forMesh).toBe(false);
      }
    });

    it('should default forMesh to false when not provided', () => {
      const validData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
      };

      const result = postTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.forMesh).toBe(false);
      }
    });

    it('should validate date fields', () => {
      const validData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
        validFrom: new Date('2026-01-01'),
        expirationDate: new Date('2026-12-31'),
      };

      const result = postTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject expirationDate before validFrom', () => {
      const invalidData = {
        name: 'Тестовый столб',
        sectionWidth: 60,
        sectionHeight: 60,
        wallThickness: 2.5,
        pricePerMeter: 300,
        length: 2.5,
        retailPricePerUnit: 750,
        validFrom: new Date('2026-12-31'),
        expirationDate: new Date('2026-01-01'),
      };

      const result = postTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('позже даты начала');
      }
    });
  });

  describe('postTypeUpdateSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        name: 'Обновленный столб',
        pricePerMeter: 350,
      };

      const result = postTypeUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = postTypeUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate length in updates', () => {
      const updateData = {
        length: 3.0,
      };

      const result = postTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should validate purchasePricePerUnit in updates', () => {
      const updateData = {
        purchasePricePerUnit: 250,
      };

      const result = postTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should allow null purchasePricePerUnit in updates', () => {
      const updateData = {
        purchasePricePerUnit: null,
      };

      const result = postTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should reject negative purchasePricePerUnit in updates', () => {
      const updateData = {
        purchasePricePerUnit: -10,
      };

      const result = postTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });

    it('should validate section dimensions in updates', () => {
      const updateData = {
        sectionWidth: 80,
        sectionHeight: 80,
      };

      const result = postTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should accept forMesh in partial updates', () => {
      const updateData = {
        forMesh: true,
      };

      const result = postTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.forMesh).toBe(true);
      }
    });

    it('should accept forMesh false in partial updates', () => {
      const updateData = {
        forMesh: false,
      };

      const result = postTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.forMesh).toBe(false);
      }
    });

    it('should reject invalid sectionWidth in updates', () => {
      const updateData = {
        sectionWidth: 200,
      };

      const result = postTypeUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });
  });
});
