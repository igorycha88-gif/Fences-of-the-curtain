import { describe, it, expect } from '@jest/globals';
import { panel3dSchema, panel3dUpdateSchema } from '@/lib/validators/panel3d';

describe('Panel3D Validators', () => {
  describe('panel3dSchema', () => {
    const validInput = {
      name: '3D панель 1.53x2.5',
      panelHeight: 1530,
      panelWidth: 2500,
      rodDiameter: 4,
      cellWidth: 50,
      cellHeight: 200,
      retailPricePerUnit: 3500,
    };

    it('should validate valid input', () => {
      const result = panel3dSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
        expect(result.data.priority).toBe(0);
      }
    });

    it('should validate with all fields', () => {
      const data = {
        ...validInput,
        description: 'Описание 3D панели',
        purchasePricePerUnit: 2500,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
        image: '/panel.png',
        active: false,
        priority: 10,
      };
      const result = panel3dSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2 chars', () => {
      const result = panel3dSchema.safeParse({ ...validInput, name: 'П' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('2 символа');
      }
    });

    it('should reject name longer than 200 chars', () => {
      const result = panel3dSchema.safeParse({ ...validInput, name: 'А'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should reject panelHeight below 500', () => {
      const result = panel3dSchema.safeParse({ ...validInput, panelHeight: 499 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('500');
      }
    });

    it('should reject panelHeight above 3000', () => {
      const result = panel3dSchema.safeParse({ ...validInput, panelHeight: 3001 });
      expect(result.success).toBe(false);
    });

    it('should reject panelWidth below 500', () => {
      const result = panel3dSchema.safeParse({ ...validInput, panelWidth: 499 });
      expect(result.success).toBe(false);
    });

    it('should reject panelWidth above 3000', () => {
      const result = panel3dSchema.safeParse({ ...validInput, panelWidth: 3001 });
      expect(result.success).toBe(false);
    });

    it('should reject rodDiameter below 2', () => {
      const result = panel3dSchema.safeParse({ ...validInput, rodDiameter: 1.5 });
      expect(result.success).toBe(false);
    });

    it('should reject rodDiameter above 6', () => {
      const result = panel3dSchema.safeParse({ ...validInput, rodDiameter: 7 });
      expect(result.success).toBe(false);
    });

    it('should reject cellWidth below 20', () => {
      const result = panel3dSchema.safeParse({ ...validInput, cellWidth: 19 });
      expect(result.success).toBe(false);
    });

    it('should reject cellWidth above 200', () => {
      const result = panel3dSchema.safeParse({ ...validInput, cellWidth: 201 });
      expect(result.success).toBe(false);
    });

    it('should reject cellHeight below 20', () => {
      const result = panel3dSchema.safeParse({ ...validInput, cellHeight: 19 });
      expect(result.success).toBe(false);
    });

    it('should reject cellHeight above 200', () => {
      const result = panel3dSchema.safeParse({ ...validInput, cellHeight: 201 });
      expect(result.success).toBe(false);
    });

    it('should reject negative retailPricePerUnit', () => {
      const result = panel3dSchema.safeParse({ ...validInput, retailPricePerUnit: -1 });
      expect(result.success).toBe(false);
    });

    it('should allow nullable purchasePricePerUnit', () => {
      const result = panel3dSchema.safeParse({ ...validInput, purchasePricePerUnit: null });
      expect(result.success).toBe(true);
    });

    it('should reject validFrom >= validUntil', () => {
      const result = panel3dSchema.safeParse({
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
      const result = panel3dSchema.safeParse({
        ...validInput,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-06-01'),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('panel3dUpdateSchema', () => {
    it('should validate partial update', () => {
      const result = panel3dUpdateSchema.safeParse({ name: 'Новое название' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = panel3dUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate multiple fields', () => {
      const result = panel3dUpdateSchema.safeParse({
        name: 'Обновлено',
        panelHeight: 2000,
        retailPricePerUnit: 4000,
        active: false,
      });
      expect(result.success).toBe(true);
    });

    it('should allow null purchasePricePerUnit', () => {
      const result = panel3dUpdateSchema.safeParse({ purchasePricePerUnit: null });
      expect(result.success).toBe(true);
    });

    it('should validate priority in update', () => {
      const result = panel3dUpdateSchema.safeParse({ priority: 50 });
      expect(result.success).toBe(true);
    });
  });
});
