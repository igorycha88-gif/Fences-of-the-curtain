import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

const CACHE_KEY_PREFIX = 'calculator:promotion:';

export interface PromotionData {
  id: string;
  fenceTypeId: string;
  name: string;
  discountType: 'MATERIALS' | 'WORKS' | 'BOTH';
  discountPercent: number;
  bannerTitle: string | null;
  bannerText: string | null;
  active: boolean;
  startDate: Date | null;
  endDate: Date | null;
  fenceTypeName: string;
}

export interface AppliedPromotion {
  promotionId: string;
  promotionName: string;
  discountType: 'MATERIALS' | 'WORKS' | 'BOTH';
  discountPercent: number;
  discountTotal: number;
  totalBeforeDiscount: number;
}

interface EstimateItem {
  category: string;
  nomenclatureId: string | null;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export class PromotionService {
  async getActivePromotion(fenceTypeId: string): Promise<PromotionData | null> {
    const cacheKey = `${CACHE_KEY_PREFIX}${fenceTypeId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        if (cached === '__null__') {
          return null;
        }
        const parsed = JSON.parse(cached) as PromotionData;
        if (parsed.endDate && new Date(parsed.endDate) < new Date()) {
          await redis.del(cacheKey);
          return null;
        }
        return parsed;
      }
    } catch (error) {
      console.error('[Promotion] Redis cache error:', error);
    }

    const promotion = await prisma.promotion.findUnique({
      where: { fenceTypeId },
      include: { fenceType: { select: { name: true } } },
    });

    if (!promotion || !promotion.active) {
      try {
        await redis.set(cacheKey, '__null__', 'EX', 60);
      } catch {}
      return null;
    }

    if (promotion.startDate && new Date(promotion.startDate) > new Date()) {
      return null;
    }

    if (promotion.endDate && new Date(promotion.endDate) < new Date()) {
      await prisma.promotion.update({
        where: { id: promotion.id },
        data: { active: false },
      });
      await this.invalidateCache(fenceTypeId);
      return null;
    }

    const result: PromotionData = {
      id: promotion.id,
      fenceTypeId: promotion.fenceTypeId,
      name: promotion.name,
      discountType: promotion.discountType as 'MATERIALS' | 'WORKS' | 'BOTH',
      discountPercent: promotion.discountPercent,
      bannerTitle: promotion.bannerTitle,
      bannerText: promotion.bannerText,
      active: promotion.active,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      fenceTypeName: promotion.fenceType.name,
    };

    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL.REFERENCE_DATA);
    } catch (error) {
      console.error('[Promotion] Redis cache set error:', error);
    }

    return result;
  }

  applyPromotionDiscount(
    items: EstimateItem[],
    promotion: PromotionData
  ): { items: EstimateItem[]; discountTotal: number; totalBeforeDiscount: number } {
    const totalBeforeDiscount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    let discountTotal = 0;

    const updatedItems = items.map((item) => {
      const shouldDiscount =
        promotion.discountType === 'BOTH' ||
        (promotion.discountType === 'MATERIALS' && item.category !== 'installation') ||
        (promotion.discountType === 'WORKS' && item.category === 'installation');

      if (!shouldDiscount) {
        return item;
      }

      const originalPrice = item.totalPrice;
      const discountedPrice = Math.round(originalPrice * (1 - promotion.discountPercent / 100) * 100) / 100;
      const itemDiscount = originalPrice - discountedPrice;
      discountTotal += itemDiscount;

      return {
        ...item,
        pricePerUnit: Math.round(item.pricePerUnit * (1 - promotion.discountPercent / 100) * 100) / 100,
        totalPrice: discountedPrice,
      };
    });

    return {
      items: updatedItems,
      discountTotal: Math.round(discountTotal * 100) / 100,
      totalBeforeDiscount,
    };
  }

  async getActivePromotionsForBanner(): Promise<PromotionData[]> {
    const cacheKey = CACHE_KEYS.PROMOTIONS_ALL_ACTIVE;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as PromotionData[];
        return parsed.filter((p) => !p.endDate || new Date(p.endDate) >= new Date());
      }
    } catch (error) {
      console.error('[Promotion] Redis cache error:', error);
    }

    const promotions = await prisma.promotion.findMany({
      where: {
        active: true,
        bannerTitle: { not: null },
      },
      include: { fenceType: { select: { name: true } } },
    });

    const now = new Date();
    const result: PromotionData[] = promotions
      .filter((p) => {
        if (p.startDate && new Date(p.startDate) > now) return false;
        if (p.endDate && new Date(p.endDate) < now) return false;
        return true;
      })
      .map((p) => ({
        id: p.id,
        fenceTypeId: p.fenceTypeId,
        name: p.name,
        discountType: p.discountType as 'MATERIALS' | 'WORKS' | 'BOTH',
        discountPercent: p.discountPercent,
        bannerTitle: p.bannerTitle,
        bannerText: p.bannerText,
        active: p.active,
        startDate: p.startDate,
        endDate: p.endDate,
        fenceTypeName: p.fenceType.name,
      }));

    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL.REFERENCE_DATA);
    } catch (error) {
      console.error('[Promotion] Redis cache set error:', error);
    }

    return result;
  }

  async invalidateCache(fenceTypeId?: string): Promise<void> {
    try {
      if (fenceTypeId) {
        await redis.del(`${CACHE_KEY_PREFIX}${fenceTypeId}`);
      }
      await redis.del(CACHE_KEYS.PROMOTIONS_ALL_ACTIVE);
    } catch (error) {
      console.error('[Promotion] Cache invalidation error:', error);
    }
  }

  async createPromotion(data: {
    fenceTypeId: string;
    name: string;
    discountType: 'MATERIALS' | 'WORKS' | 'BOTH';
    discountPercent: number;
    bannerTitle?: string;
    bannerText?: string;
    active?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) {
    const existing = await prisma.promotion.findUnique({
      where: { fenceTypeId: data.fenceTypeId },
    });

    if (existing) {
      return prisma.promotion.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.promotion.create({
      data,
    });
  }

  async updatePromotion(id: string, data: {
    name?: string;
    discountType?: 'MATERIALS' | 'WORKS' | 'BOTH';
    discountPercent?: number;
    bannerTitle?: string;
    bannerText?: string;
    active?: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
  }) {
    const promotion = await prisma.promotion.update({
      where: { id },
      data,
    });

    await this.invalidateCache(promotion.fenceTypeId);

    return promotion;
  }

  async deletePromotion(id: string) {
    const promotion = await prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    await prisma.promotion.delete({
      where: { id },
    });

    await this.invalidateCache(promotion.fenceTypeId);
  }

  async togglePromotion(id: string): Promise<{ active: boolean }> {
    const promotion = await prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    if (!promotion.active && !promotion.bannerTitle) {
      throw new Error('Нельзя активировать акцию без заголовка баннера');
    }

    const updated = await prisma.promotion.update({
      where: { id },
      data: { active: !promotion.active },
    });

    await this.invalidateCache(updated.fenceTypeId);

    return { active: updated.active };
  }

  async getPromotionByFenceType(fenceTypeId: string) {
    return prisma.promotion.findUnique({
      where: { fenceTypeId },
      include: { fenceType: { select: { name: true } } },
    });
  }
}

export const promotionService = new PromotionService();
