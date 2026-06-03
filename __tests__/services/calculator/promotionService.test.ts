import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PromotionService } from '@/services/calculator/promotionService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    promotion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as any;

describe('PromotionService.isLengthInRange', () => {
  const service = new PromotionService();

  const basePromotion = {
    id: 'test-id',
    fenceTypeId: 'ft-1',
    name: 'Test',
    discountType: 'BOTH' as const,
    discountPercent: 10,
    bannerTitle: null,
    bannerText: null,
    active: true,
    startDate: null,
    endDate: null,
    fenceTypeName: 'Test',
    minLength: null as number | null,
    maxLength: null as number | null,
  };

  it('returns true when no length restrictions', () => {
    expect(service.isLengthInRange(basePromotion, 50)).toBe(true);
    expect(service.isLengthInRange(basePromotion, 0)).toBe(true);
    expect(service.isLengthInRange(basePromotion, 10000)).toBe(true);
  });

  it('returns true when length >= minLength', () => {
    const promo = { ...basePromotion, minLength: 100 };
    expect(service.isLengthInRange(promo, 100)).toBe(true);
    expect(service.isLengthInRange(promo, 150)).toBe(true);
  });

  it('returns false when length < minLength', () => {
    const promo = { ...basePromotion, minLength: 100 };
    expect(service.isLengthInRange(promo, 99)).toBe(false);
    expect(service.isLengthInRange(promo, 50)).toBe(false);
  });

  it('returns true when length <= maxLength', () => {
    const promo = { ...basePromotion, maxLength: 200 };
    expect(service.isLengthInRange(promo, 200)).toBe(true);
    expect(service.isLengthInRange(promo, 150)).toBe(true);
  });

  it('returns false when length > maxLength', () => {
    const promo = { ...basePromotion, maxLength: 200 };
    expect(service.isLengthInRange(promo, 201)).toBe(false);
    expect(service.isLengthInRange(promo, 500)).toBe(false);
  });

  it('returns true when length within range', () => {
    const promo = { ...basePromotion, minLength: 50, maxLength: 200 };
    expect(service.isLengthInRange(promo, 50)).toBe(true);
    expect(service.isLengthInRange(promo, 100)).toBe(true);
    expect(service.isLengthInRange(promo, 200)).toBe(true);
  });

  it('returns false when length outside range', () => {
    const promo = { ...basePromotion, minLength: 50, maxLength: 200 };
    expect(service.isLengthInRange(promo, 49)).toBe(false);
    expect(service.isLengthInRange(promo, 201)).toBe(false);
  });

  it('treats minLength=0 as no bottom restriction', () => {
    const promo = { ...basePromotion, minLength: 0 };
    expect(service.isLengthInRange(promo, 0)).toBe(true);
    expect(service.isLengthInRange(promo, 1)).toBe(true);
  });

  it('handles single-point range (minLength === maxLength)', () => {
    const promo = { ...basePromotion, minLength: 100, maxLength: 100 };
    expect(service.isLengthInRange(promo, 100)).toBe(true);
    expect(service.isLengthInRange(promo, 99)).toBe(false);
    expect(service.isLengthInRange(promo, 101)).toBe(false);
  });

  it('handles floating-point boundaries', () => {
    const promo = { ...basePromotion, minLength: 50.5, maxLength: 200.5 };
    expect(service.isLengthInRange(promo, 50.5)).toBe(true);
    expect(service.isLengthInRange(promo, 50.4)).toBe(false);
    expect(service.isLengthInRange(promo, 200.5)).toBe(true);
    expect(service.isLengthInRange(promo, 200.6)).toBe(false);
  });

  it('handles length=0 with no restrictions', () => {
    expect(service.isLengthInRange(basePromotion, 0)).toBe(true);
  });

  it('handles only maxLength without minLength', () => {
    const promo = { ...basePromotion, maxLength: 50 };
    expect(service.isLengthInRange(promo, 0)).toBe(true);
    expect(service.isLengthInRange(promo, 50)).toBe(true);
    expect(service.isLengthInRange(promo, 51)).toBe(false);
  });
});

describe('PromotionService.applyPromotionDiscount', () => {
  const service = new PromotionService();

  const basePromotion = {
    id: 'test-id',
    fenceTypeId: 'ft-1',
    name: 'Test',
    discountType: 'BOTH' as const,
    discountPercent: 10,
    bannerTitle: null,
    bannerText: null,
    active: true,
    startDate: null,
    endDate: null,
    fenceTypeName: 'Test',
    minLength: null as number | null,
    maxLength: null as number | null,
  };

  const baseItems = [
    { category: 'materials', nomenclatureId: 'n1', nomenclatureName: 'Лист', quantity: 10, unit: 'шт', pricePerUnit: 100, totalPrice: 1000 },
    { category: 'installation', nomenclatureId: 'n2', nomenclatureName: 'Монтаж', quantity: 10, unit: 'пог.м', pricePerUnit: 50, totalPrice: 500 },
  ];

  it('applies discount to both materials and installation for BOTH type', () => {
    const result = service.applyPromotionDiscount(baseItems, basePromotion);
    expect(result.discountTotal).toBe(150);
    expect(result.totalBeforeDiscount).toBe(1500);
    expect(result.items[0].totalPrice).toBe(900);
    expect(result.items[1].totalPrice).toBe(450);
  });

  it('applies discount only to materials for MATERIALS type', () => {
    const promo = { ...basePromotion, discountType: 'MATERIALS' as const };
    const result = service.applyPromotionDiscount(baseItems, promo);
    expect(result.discountTotal).toBe(100);
    expect(result.items[0].totalPrice).toBe(900);
    expect(result.items[1].totalPrice).toBe(500);
  });

  it('applies discount only to installation for WORKS type', () => {
    const promo = { ...basePromotion, discountType: 'WORKS' as const };
    const result = service.applyPromotionDiscount(baseItems, promo);
    expect(result.discountTotal).toBe(50);
    expect(result.items[0].totalPrice).toBe(1000);
    expect(result.items[1].totalPrice).toBe(450);
  });

  it('rounds discount total to 2 decimal places', () => {
    const items = [
      { category: 'materials', nomenclatureId: 'n1', nomenclatureName: 'Лист', quantity: 3, unit: 'шт', pricePerUnit: 33.33, totalPrice: 99.99 },
    ];
    const promo = { ...basePromotion, discountPercent: 7 };
    const result = service.applyPromotionDiscount(items, promo);
    expect(result.discountTotal).toBe(Math.round(99.99 * 0.07 * 100) / 100);
  });
});

describe('PromotionService.getActivePromotionsForBanner', () => {
  const service = new PromotionService();

  const makeDbPromo = (overrides: Record<string, any> = {}) => ({
    id: 'promo-1',
    fenceTypeId: 'ft-1',
    name: 'Test Promo',
    discountType: 'BOTH',
    discountPercent: 10,
    bannerTitle: 'Скидка 10%',
    bannerText: null,
    active: true,
    startDate: null,
    endDate: null,
    minLength: null,
    maxLength: null,
    fenceType: { name: 'Профнастил' },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all active promotions with bannerTitle', async () => {
    mockPrisma.promotion.findMany.mockResolvedValue([
      makeDbPromo({ id: 'p1', fenceTypeId: 'ft-1', bannerTitle: 'Акция 1', fenceType: { name: 'Профнастил' } }),
      makeDbPromo({ id: 'p2', fenceTypeId: 'ft-2', bannerTitle: 'Акция 2', discountPercent: 15, fenceType: { name: 'Евроштакетник' } }),
    ]);

    const result = await service.getActivePromotionsForBanner();

    expect(result).toHaveLength(2);
    expect(result[0].bannerTitle).toBe('Акция 1');
    expect(result[1].bannerTitle).toBe('Акция 2');
    expect(result[1].fenceTypeName).toBe('Евроштакетник');
  });

  it('returns empty array when no active promotions', async () => {
    mockPrisma.promotion.findMany.mockResolvedValue([]);

    const result = await service.getActivePromotionsForBanner();

    expect(result).toHaveLength(0);
  });

  it('filters out promotions with future startDate', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    mockPrisma.promotion.findMany.mockResolvedValue([
      makeDbPromo({ id: 'p1', startDate: futureDate.toISOString() }),
    ]);

    const result = await service.getActivePromotionsForBanner();

    expect(result).toHaveLength(0);
  });

  it('filters out promotions with past endDate', async () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    mockPrisma.promotion.findMany.mockResolvedValue([
      makeDbPromo({ id: 'p1', endDate: pastDate.toISOString() }),
    ]);

    const result = await service.getActivePromotionsForBanner();

    expect(result).toHaveLength(0);
  });

  it('includes promotion with no date restrictions', async () => {
    mockPrisma.promotion.findMany.mockResolvedValue([
      makeDbPromo({ id: 'p1', startDate: null, endDate: null }),
    ]);

    const result = await service.getActivePromotionsForBanner();

    expect(result).toHaveLength(1);
  });

  it('queries database directly without Redis cache', async () => {
    mockPrisma.promotion.findMany.mockResolvedValue([]);

    await service.getActivePromotionsForBanner();

    expect(mockPrisma.promotion.findMany).toHaveBeenCalledWith({
      where: {
        active: true,
        bannerTitle: { not: null },
      },
      include: { fenceType: { select: { name: true } } },
    });
  });
});
