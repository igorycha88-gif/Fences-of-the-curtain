import { describe, it, expect } from '@jest/globals';
import {
  portfolioInputSchema,
  portfolioListParamsSchema,
  bulkOperationSchema,
  reorderSchema,
} from '@/lib/validators/portfolio';

describe('Portfolio Validators', () => {
  describe('portfolioInputSchema', () => {
    const validInput = {
      title: 'Забор из профнастила',
      category: 'fence',
      images: ['/uploads/img1.jpg', '/uploads/img2.jpg'],
    };

    it('should validate valid input', () => {
      const result = portfolioInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showCost).toBe(false);
        expect(result.data.active).toBe(true);
      }
    });

    it('should validate with all fields', () => {
      const data = {
        ...validInput,
        type: 'Профнастил',
        description: 'Описание проекта',
        cost: 150000,
        showCost: true,
        active: false,
      };
      const result = portfolioInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = portfolioInputSchema.safeParse({ ...validInput, title: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('обязательно');
      }
    });

    it('should reject title over 255 chars', () => {
      const result = portfolioInputSchema.safeParse({ ...validInput, title: 'А'.repeat(256) });
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const result = portfolioInputSchema.safeParse({ ...validInput, category: 'roof' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid categories', () => {
      expect(portfolioInputSchema.safeParse({ ...validInput, category: 'fence' }).success).toBe(true);
      expect(portfolioInputSchema.safeParse({ ...validInput, category: 'canopy' }).success).toBe(true);
      expect(portfolioInputSchema.safeParse({ ...validInput, category: 'garage' }).success).toBe(true);
    });

    it('should reject empty images array', () => {
      const result = portfolioInputSchema.safeParse({ ...validInput, images: [] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 5 images', () => {
      const images = Array.from({ length: 6 }, (_, i) => `/img${i}.jpg`);
      const result = portfolioInputSchema.safeParse({ ...validInput, images });
      expect(result.success).toBe(false);
    });

    it('should reject negative cost', () => {
      const result = portfolioInputSchema.safeParse({ ...validInput, cost: -1 });
      expect(result.success).toBe(false);
    });

    it('should allow zero cost', () => {
      const result = portfolioInputSchema.safeParse({ ...validInput, cost: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject description over 2000 chars', () => {
      const result = portfolioInputSchema.safeParse({ ...validInput, description: 'А'.repeat(2001) });
      expect(result.success).toBe(false);
    });

    it('should reject type over 100 chars', () => {
      const result = portfolioInputSchema.safeParse({ ...validInput, type: 'А'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('portfolioListParamsSchema', () => {
    it('should apply default values', () => {
      const result = portfolioListParamsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('should validate with all params', () => {
      const data = {
        page: 2,
        pageSize: 50,
        search: 'забор',
        category: 'fence',
        active: true,
      };
      const result = portfolioListParamsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject page below 1', () => {
      const result = portfolioListParamsSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject pageSize above 100', () => {
      const result = portfolioListParamsSchema.safeParse({ pageSize: 101 });
      expect(result.success).toBe(false);
    });

    it('should reject pageSize below 1', () => {
      const result = portfolioListParamsSchema.safeParse({ pageSize: 0 });
      expect(result.success).toBe(false);
    });

    it('should coerce string page to number', () => {
      const result = portfolioListParamsSchema.safeParse({ page: '3' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
      }
    });

    it('should coerce string active to boolean', () => {
      const result = portfolioListParamsSchema.safeParse({ active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });
  });

  describe('bulkOperationSchema', () => {
    it('should validate with 1 id', () => {
      const result = bulkOperationSchema.safeParse({ ids: ['id-1'] });
      expect(result.success).toBe(true);
    });

    it('should validate with 50 ids', () => {
      const ids = Array.from({ length: 50 }, (_, i) => `id-${i}`);
      const result = bulkOperationSchema.safeParse({ ids });
      expect(result.success).toBe(true);
    });

    it('should reject empty ids array', () => {
      const result = bulkOperationSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 50 ids', () => {
      const ids = Array.from({ length: 51 }, (_, i) => `id-${i}`);
      const result = bulkOperationSchema.safeParse({ ids });
      expect(result.success).toBe(false);
    });
  });

  describe('reorderSchema', () => {
    it('should validate valid reorder', () => {
      const data = {
        items: [
          { id: 'id-1', sortOrder: 0 },
          { id: 'id-2', sortOrder: 1 },
        ],
      };
      const result = reorderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty items array', () => {
      const result = reorderSchema.safeParse({ items: [] });
      expect(result.success).toBe(false);
    });

    it('should reject negative sortOrder', () => {
      const data = {
        items: [{ id: 'id-1', sortOrder: -1 }],
      };
      const result = reorderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate single item', () => {
      const data = {
        items: [{ id: 'id-1', sortOrder: 0 }],
      };
      const result = reorderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
