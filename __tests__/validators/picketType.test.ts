import { describe, it, expect } from '@jest/globals';
import { picketTypeSchema, picketTypeUpdateSchema } from '@/lib/validators/picketType';

describe('PicketType Validators', () => {
  describe('picketTypeSchema', () => {
    const validInput = {
      name: 'Евроштакетник Модерн',
      metalThickness: 0.5,
      width: 100,
      length: 2000,
      profileTypeId: 'profile-1',
      coatingId: 'coating-1',
      retailPricePerUnit: 150,
    };

    it('should validate valid input', () => {
      const result = picketTypeSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
        expect(result.data.sortOrder).toBe(0);
      }
    });

    it('should validate with all fields', () => {
      const data = {
        ...validInput,
        description: 'Описание штакетника',
        color: 'RR 23',
        purchasePricePerUnit: 100,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
        image: '/picket.png',
        active: false,
        sortOrder: 5,
      };
      const result = picketTypeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2 chars', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, name: 'С' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('2 символа');
      }
    });

    it('should reject name longer than 200 chars', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, name: 'А'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should reject metalThickness below 0.3', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, metalThickness: 0.2 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('0.3');
      }
    });

    it('should reject metalThickness above 1.5', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, metalThickness: 1.6 });
      expect(result.success).toBe(false);
    });

    it('should reject width below 50', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, width: 49 });
      expect(result.success).toBe(false);
    });

    it('should reject width above 200', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, width: 201 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer width', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, width: 100.5 });
      expect(result.success).toBe(false);
    });

    it('should reject length below 500', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, length: 499 });
      expect(result.success).toBe(false);
    });

    it('should reject length above 3000', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, length: 3001 });
      expect(result.success).toBe(false);
    });

    it('should reject empty profileTypeId', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, profileTypeId: '' });
      expect(result.success).toBe(false);
    });

    it('should reject empty coatingId', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, coatingId: '' });
      expect(result.success).toBe(false);
    });

    it('should reject negative retailPricePerUnit', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, retailPricePerUnit: -1 });
      expect(result.success).toBe(false);
    });

    it('should allow nullable purchasePricePerUnit', () => {
      const result = picketTypeSchema.safeParse({ ...validInput, purchasePricePerUnit: null });
      expect(result.success).toBe(true);
    });

    it('should reject validFrom >= validUntil', () => {
      const result = picketTypeSchema.safeParse({
        ...validInput,
        validFrom: new Date('2026-12-01'),
        validUntil: new Date('2026-01-01'),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('позже');
      }
    });

    it('should accept validFrom < validUntil', () => {
      const result = picketTypeSchema.safeParse({
        ...validInput,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-06-01'),
      });
      expect(result.success).toBe(true);
    });

    it('should accept null dates', () => {
      const result = picketTypeSchema.safeParse({
        ...validInput,
        validFrom: null,
        validUntil: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('picketTypeUpdateSchema', () => {
    it('should validate partial update', () => {
      const result = picketTypeUpdateSchema.safeParse({ name: 'Новое название' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = picketTypeUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate multiple fields', () => {
      const result = picketTypeUpdateSchema.safeParse({
        name: 'Обновлено',
        metalThickness: 0.7,
        retailPricePerUnit: 200,
        active: false,
      });
      expect(result.success).toBe(true);
    });

    it('should allow null purchasePricePerUnit', () => {
      const result = picketTypeUpdateSchema.safeParse({ purchasePricePerUnit: null });
      expect(result.success).toBe(true);
    });
  });
});
