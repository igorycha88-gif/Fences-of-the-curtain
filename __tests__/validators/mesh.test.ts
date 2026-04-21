import { describe, it, expect } from '@jest/globals';
import { meshSchema, meshUpdateSchema } from '@/lib/validators/mesh';

describe('Mesh Validators', () => {
  describe('meshSchema', () => {
    const validInput = {
      name: 'Сетка 3D 1.53x2.5',
      height: 1530,
      cellSize: 50,
      wireThickness: 4.0,
      coating: 'Полимерное',
      retailPricePerUnit: 2500,
    };

    it('should validate valid input with required fields', () => {
      const result = meshSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
        expect(result.data.priority).toBe(0);
      }
    });

    it('should validate valid input with all fields', () => {
      const data = {
        ...validInput,
        description: 'Описание сетки',
        purchasePricePerUnit: 1800,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
        image: '/mesh.png',
        active: false,
        priority: 10,
      };
      const result = meshSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2 chars', () => {
      const result = meshSchema.safeParse({ ...validInput, name: 'С' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('2 символа');
      }
    });

    it('should reject name longer than 200 chars', () => {
      const result = meshSchema.safeParse({ ...validInput, name: 'А'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should reject height below 500', () => {
      const result = meshSchema.safeParse({ ...validInput, height: 499 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('500');
      }
    });

    it('should reject height above 4000', () => {
      const result = meshSchema.safeParse({ ...validInput, height: 4001 });
      expect(result.success).toBe(false);
    });

    it('should reject cellSize below 10', () => {
      const result = meshSchema.safeParse({ ...validInput, cellSize: 9 });
      expect(result.success).toBe(false);
    });

    it('should reject cellSize above 100', () => {
      const result = meshSchema.safeParse({ ...validInput, cellSize: 101 });
      expect(result.success).toBe(false);
    });

    it('should reject wireThickness below 0.5', () => {
      const result = meshSchema.safeParse({ ...validInput, wireThickness: 0.4 });
      expect(result.success).toBe(false);
    });

    it('should reject wireThickness above 10', () => {
      const result = meshSchema.safeParse({ ...validInput, wireThickness: 10.1 });
      expect(result.success).toBe(false);
    });

    it('should reject empty coating', () => {
      const result = meshSchema.safeParse({ ...validInput, coating: '' });
      expect(result.success).toBe(false);
    });

    it('should reject negative retailPricePerUnit', () => {
      const result = meshSchema.safeParse({ ...validInput, retailPricePerUnit: -1 });
      expect(result.success).toBe(false);
    });

    it('should allow nullable purchasePricePerUnit', () => {
      const result = meshSchema.safeParse({ ...validInput, purchasePricePerUnit: null });
      expect(result.success).toBe(true);
    });

    it('should reject validFrom >= validUntil', () => {
      const result = meshSchema.safeParse({
        ...validInput,
        validFrom: new Date('2026-12-31'),
        validUntil: new Date('2026-01-01'),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('позже');
      }
    });

    it('should accept validFrom < validUntil', () => {
      const result = meshSchema.safeParse({
        ...validInput,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-06-01'),
      });
      expect(result.success).toBe(true);
    });

    it('should accept null validFrom and validUntil', () => {
      const result = meshSchema.safeParse({
        ...validInput,
        validFrom: null,
        validUntil: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('meshUpdateSchema', () => {
    it('should validate partial update with single field', () => {
      const result = meshUpdateSchema.safeParse({ name: 'Новое название' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = meshUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate multiple fields', () => {
      const result = meshUpdateSchema.safeParse({
        name: 'Обновлено',
        height: 2000,
        retailPricePerUnit: 3000,
        active: false,
      });
      expect(result.success).toBe(true);
    });

    it('should allow null purchasePricePerUnit', () => {
      const result = meshUpdateSchema.safeParse({ purchasePricePerUnit: null });
      expect(result.success).toBe(true);
    });

    it('should validate priority in partial update', () => {
      const result = meshUpdateSchema.safeParse({ priority: 50 });
      expect(result.success).toBe(true);
    });
  });
});
