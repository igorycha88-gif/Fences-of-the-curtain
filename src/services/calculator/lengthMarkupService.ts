import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import type { FenceLengthMarkupInput, FenceLengthMarkupUpdate } from '@/lib/validators/lengthMarkup';

const CACHE_KEY_PREFIX = 'calculator:length-markup:';
const CACHE_TTL = 300;

interface MarkupRule {
  id: string;
  minLength: number;
  maxLength: number;
  markupPercent: number;
  active: boolean;
  priority: number;
}

export class LengthMarkupService {
  async getMarkupsForFenceType(fenceTypeId: string): Promise<MarkupRule[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}${fenceTypeId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as MarkupRule[];
      }
    } catch (error) {
      console.error('[LengthMarkup] Redis cache error:', error);
    }

    const markups = await prisma.fenceLengthMarkup.findMany({
      where: { fenceTypeId },
      orderBy: { priority: 'asc' },
    });

    const result: MarkupRule[] = markups.map((m) => ({
      id: m.id,
      minLength: m.minLength,
      maxLength: m.maxLength,
      markupPercent: m.markupPercent,
      active: m.active,
      priority: m.priority,
    }));

    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
    } catch (error) {
      console.error('[LengthMarkup] Redis cache set error:', error);
    }

    return result;
  }

  async findMarkupPercent(fenceTypeId: string, fenceLength: number): Promise<number> {
    const fenceType = await prisma.fenceType.findUnique({
      where: { id: fenceTypeId },
      select: { markupEnabled: true },
    });

    if (!fenceType || !fenceType.markupEnabled) {
      return 0;
    }

    const markups = await this.getMarkupsForFenceType(fenceTypeId);

    const matchingRule = markups.find(
      (m) => m.active && fenceLength >= m.minLength && fenceLength <= m.maxLength
    );

    return matchingRule ? matchingRule.markupPercent : 0;
  }

  async createMarkup(
    fenceTypeId: string,
    data: FenceLengthMarkupInput,
    userId: string
  ): Promise<MarkupRule> {
    await this.validateNoOverlap(fenceTypeId, data.minLength, data.maxLength);

    const markup = await prisma.fenceLengthMarkup.create({
      data: {
        fenceTypeId,
        minLength: data.minLength,
        maxLength: data.maxLength,
        markupPercent: data.markupPercent,
        active: data.active ?? true,
        priority: data.priority ?? 0,
      },
    });

    await this.invalidateCache(fenceTypeId);

    await this.logChange(markup.id, fenceTypeId, 'CREATE', null, markup, userId);

    return {
      id: markup.id,
      minLength: markup.minLength,
      maxLength: markup.maxLength,
      markupPercent: markup.markupPercent,
      active: markup.active,
      priority: markup.priority,
    };
  }

  async updateMarkup(
    markupId: string,
    fenceTypeId: string,
    data: FenceLengthMarkupUpdate,
    userId: string
  ): Promise<MarkupRule> {
    const existing = await prisma.fenceLengthMarkup.findUnique({
      where: { id: markupId },
    });

    if (!existing) {
      throw new Error('Markup rule not found');
    }

    const newMin = data.minLength ?? existing.minLength;
    const newMax = data.maxLength ?? existing.maxLength;

    await this.validateNoOverlap(fenceTypeId, newMin, newMax, markupId);

    const updated = await prisma.fenceLengthMarkup.update({
      where: { id: markupId },
      data: {
        ...(data.minLength !== undefined ? { minLength: data.minLength } : {}),
        ...(data.maxLength !== undefined ? { maxLength: data.maxLength } : {}),
        ...(data.markupPercent !== undefined ? { markupPercent: data.markupPercent } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
      },
    });

    await this.invalidateCache(fenceTypeId);

    await this.logChange(markupId, fenceTypeId, 'UPDATE', existing, updated, userId);

    return {
      id: updated.id,
      minLength: updated.minLength,
      maxLength: updated.maxLength,
      markupPercent: updated.markupPercent,
      active: updated.active,
      priority: updated.priority,
    };
  }

  async deleteMarkup(markupId: string, userId: string): Promise<void> {
    const existing = await prisma.fenceLengthMarkup.findUnique({
      where: { id: markupId },
    });

    if (!existing) {
      throw new Error('Markup rule not found');
    }

    await prisma.fenceLengthMarkup.delete({
      where: { id: markupId },
    });

    await this.invalidateCache(existing.fenceTypeId);

    await this.logChange(markupId, existing.fenceTypeId, 'DELETE', existing, null, userId);
  }

  async validateNoOverlap(
    fenceTypeId: string,
    minLength: number,
    maxLength: number,
    excludeId?: string
  ): Promise<void> {
    const existing = await prisma.fenceLengthMarkup.findMany({
      where: {
        fenceTypeId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    for (const rule of existing) {
      const overlaps = minLength <= rule.maxLength && maxLength >= rule.minLength;
      if (overlaps) {
        throw new Error(
          `Интервал ${minLength}-${maxLength} м пересекается с существующим интервалом ${rule.minLength}-${rule.maxLength} м`
        );
      }
    }
  }

  async invalidateCache(fenceTypeId: string): Promise<void> {
    try {
      await redis.del(`${CACHE_KEY_PREFIX}${fenceTypeId}`);
    } catch (error) {
      console.error('[LengthMarkup] Cache invalidation error:', error);
    }
  }

  private async logChange(
    entityId: string,
    fenceTypeId: string,
    action: string,
    oldData: any,
    newData: any,
    userId: string
  ): Promise<void> {
    try {
      await prisma.referenceChangeLog.create({
        data: {
          entityType: 'FenceLengthMarkup',
          entityId,
          fieldName: action,
          oldValue: oldData ? JSON.parse(JSON.stringify(oldData)) : undefined,
          newValue: newData ? JSON.parse(JSON.stringify(newData)) : undefined,
          changedBy: userId,
        },
      });
    } catch (error) {
      console.error('[LengthMarkup] Failed to log change:', error);
    }
  }
}

export const lengthMarkupService = new LengthMarkupService();
