import { describe, it, expect } from '@jest/globals';
import { wicketTypeSchema, wicketTypeUpdateSchema } from '@/lib/validators/wicketType';

describe('WicketType Validators', () => {
  describe('wicketTypeSchema', () => {
    const validInput = {
      name: 'Калитка стандартная',
      metalThickness: 2.0,
      sectionWidth: 40,
      sectionHeight: 40,
      wicketHeight: 2000,
      wicketLength: 1000,
      retailPrice: 12000,
    };

    it('should validate valid input', () => {
      const result = wicketTypeSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should validate with all fields', () => {
      const data = {
        ...validInput,
        description: 'Стандартная калитка',
        purchasePrice: 8000,
        image: '/wicket.png',
        validFrom: new Date('2026-01-01'),
        expirationDate: new Date('2026-12-31'),
      };
      const result = wicketTypeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2 chars', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, name: 'К' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('2 символа');
      }
    });

    it('should reject name longer than 100 chars', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, name: 'А'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should reject metalThickness below 1.0', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, metalThickness: 0.9 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('1.0');
      }
    });

    it('should reject metalThickness above 5.0', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, metalThickness: 5.1 });
      expect(result.success).toBe(false);
    });

    it('should reject sectionWidth below 20', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, sectionWidth: 19 });
      expect(result.success).toBe(false);
    });

    it('should reject sectionWidth above 200', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, sectionWidth: 201 });
      expect(result.success).toBe(false);
    });

    it('should reject sectionHeight below 20', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, sectionHeight: 19 });
      expect(result.success).toBe(false);
    });

    it('should reject wicketHeight below 500', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, wicketHeight: 499 });
      expect(result.success).toBe(false);
    });

    it('should reject wicketHeight above 2500', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, wicketHeight: 2501 });
      expect(result.success).toBe(false);
    });

    it('should reject wicketLength below 500', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, wicketLength: 499 });
      expect(result.success).toBe(false);
    });

    it('should reject wicketLength above 2000', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, wicketLength: 2001 });
      expect(result.success).toBe(false);
    });

    it('should reject negative retailPrice', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, retailPrice: -1 });
      expect(result.success).toBe(false);
    });

    it('should allow nullable purchasePrice', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, purchasePrice: null });
      expect(result.success).toBe(true);
    });

    it('should reject validFrom >= expirationDate', () => {
      const result = wicketTypeSchema.safeParse({
        ...validInput,
        validFrom: new Date('2026-12-01'),
        expirationDate: new Date('2026-01-01'),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('позже');
      }
    });

    it('should accept validFrom < expirationDate', () => {
      const result = wicketTypeSchema.safeParse({
        ...validInput,
        validFrom: new Date('2026-01-01'),
        expirationDate: new Date('2026-06-01'),
      });
      expect(result.success).toBe(true);
    });

    it('should accept null dates', () => {
      const result = wicketTypeSchema.safeParse({
        ...validInput,
        validFrom: null,
        expirationDate: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject description over 500 chars', () => {
      const result = wicketTypeSchema.safeParse({ ...validInput, description: 'А'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  describe('wicketTypeUpdateSchema', () => {
    it('should validate partial update', () => {
      const result = wicketTypeUpdateSchema.safeParse({ name: 'Новое название' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = wicketTypeUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate multiple fields', () => {
      const result = wicketTypeUpdateSchema.safeParse({
        name: 'Обновлено',
        retailPrice: 13000,
        active: false,
      });
      expect(result.success).toBe(true);
    });

    it('should allow null purchasePrice', () => {
      const result = wicketTypeUpdateSchema.safeParse({ purchasePrice: null });
      expect(result.success).toBe(true);
    });

    it('should validate active in update', () => {
      const result = wicketTypeUpdateSchema.safeParse({ active: false });
      expect(result.success).toBe(true);
    });

    it('should validate expirationDate in update', () => {
      const result = wicketTypeUpdateSchema.safeParse({
        expirationDate: new Date('2026-12-31'),
      });
      expect(result.success).toBe(true);
    });
  });
});
