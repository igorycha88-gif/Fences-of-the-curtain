import { describe, it, expect } from '@jest/globals';
import { profnastilTypeSchema, profnastilTypeUpdateSchema } from '@/lib/validators/profnastilType';

describe('ProfnastilType Validators', () => {
  describe('profnastilTypeSchema', () => {
    const validInput = {
      name: 'Профнастил С-21',
      metalThickness: 0.5,
      fullWidth: 1000,
      usefulWidth: 900,
      length: 2000,
      coating: 'Полимерное (одностороннее)',
      retailPricePerUnit: 1500,
    };

    it('should validate valid input', () => {
      const result = profnastilTypeSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
        expect(result.data.sortOrder).toBe(0);
      }
    });

    it('should validate with all fields', () => {
      const data = {
        ...validInput,
        description: 'Описание профнастила',
        color: 'RR 23',
        purchasePricePerLinearMeter: 500,
        purchasePricePerUnit: 1000,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
        image: '/prof.png',
        active: false,
        sortOrder: 5,
      };
      const result = profnastilTypeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2 chars', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, name: 'П' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('2 символа');
      }
    });

    it('should reject name longer than 200 chars', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, name: 'А'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should reject metalThickness below 0.3', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, metalThickness: 0.2 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('0.3');
      }
    });

    it('should reject metalThickness above 1.5', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, metalThickness: 1.6 });
      expect(result.success).toBe(false);
    });

    it('should reject fullWidth below 500', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, fullWidth: 499 });
      expect(result.success).toBe(false);
    });

    it('should reject fullWidth above 1500', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, fullWidth: 1501 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer fullWidth', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, fullWidth: 1000.5 });
      expect(result.success).toBe(false);
    });

    it('should reject usefulWidth below 400', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, usefulWidth: 399 });
      expect(result.success).toBe(false);
    });

    it('should reject usefulWidth above 1400', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, usefulWidth: 1401 });
      expect(result.success).toBe(false);
    });

    it('should reject length below 500', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, length: 499 });
      expect(result.success).toBe(false);
    });

    it('should reject length above 12000', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, length: 12001 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid coating', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, coating: 'Неправильное' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Недопустимое покрытие');
      }
    });

    it('should accept all valid coating types', () => {
      const coatings = ['Полимерное (одностороннее)', 'Полимерное (двустороннее)', 'Оцинковка'];
      for (const coating of coatings) {
        const result = profnastilTypeSchema.safeParse({ ...validInput, coating });
        expect(result.success).toBe(true);
      }
    });

    it('should reject usefulWidth > fullWidth (refinement)', () => {
      const result = profnastilTypeSchema.safeParse({
        ...validInput,
        usefulWidth: 1100,
        fullWidth: 1000,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const hasRefinementError = result.error.errors.some(e =>
          e.message.includes('Полезная ширина') || e.path.includes('usefulWidth')
        );
        expect(hasRefinementError).toBe(true);
      }
    });

    it('should accept usefulWidth == fullWidth', () => {
      const result = profnastilTypeSchema.safeParse({
        ...validInput,
        usefulWidth: 1000,
        fullWidth: 1000,
      });
      expect(result.success).toBe(true);
    });

    it('should reject validFrom >= validUntil', () => {
      const result = profnastilTypeSchema.safeParse({
        ...validInput,
        validFrom: new Date('2026-12-01'),
        validUntil: new Date('2026-01-01'),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.errors.find(e => e.message.includes('позже'));
        expect(msg).toBeDefined();
      }
    });

    it('should accept validFrom < validUntil', () => {
      const result = profnastilTypeSchema.safeParse({
        ...validInput,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-06-01'),
      });
      expect(result.success).toBe(true);
    });

    it('should allow nullable purchase prices', () => {
      const result = profnastilTypeSchema.safeParse({
        ...validInput,
        purchasePricePerLinearMeter: null,
        purchasePricePerUnit: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative retailPricePerUnit', () => {
      const result = profnastilTypeSchema.safeParse({ ...validInput, retailPricePerUnit: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('profnastilTypeUpdateSchema', () => {
    it('should validate partial update', () => {
      const result = profnastilTypeUpdateSchema.safeParse({ name: 'Новое название' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = profnastilTypeUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate multiple fields', () => {
      const result = profnastilTypeUpdateSchema.safeParse({
        name: 'Обновлено',
        metalThickness: 0.7,
        retailPricePerUnit: 2000,
        active: false,
      });
      expect(result.success).toBe(true);
    });

    it('should allow null purchase prices', () => {
      const result = profnastilTypeUpdateSchema.safeParse({
        purchasePricePerLinearMeter: null,
        purchasePricePerUnit: null,
      });
      expect(result.success).toBe(true);
    });

    it('should validate coating in update', () => {
      const result = profnastilTypeUpdateSchema.safeParse({
        coating: 'Оцинковка',
      });
      expect(result.success).toBe(true);
    });
  });
});
