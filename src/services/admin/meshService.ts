import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { MeshInput, MeshUpdate } from '@/lib/validators/mesh';
import { getNextPriority } from '@/lib/utils/priorityUtils';
import { logPriceChange } from '@/lib/audit-helpers';
import { cache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cache-keys';

export class MeshService {
  private async invalidateCache() {
    await cache.del(CACHE_KEYS.MESH_ACTIVE);
  }

  async getAll(params: {
    active?: boolean;
    search?: string;
    minHeight?: number;
    maxHeight?: number;
    page?: number;
    pageSize?: number;
    validityFilter?: 'all' | 'active' | 'expired' | 'expiring_soon';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      active,
      search,
      minHeight,
      maxHeight,
      page = 1,
      pageSize = 20,
      validityFilter = 'all',
      sortBy = 'priority',
      sortOrder = 'asc'
    } = params;
    const skip = (page - 1) * pageSize;
    const now = new Date();

    const where: Prisma.MeshTypeWhereInput = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minHeight !== undefined || maxHeight !== undefined) {
      where.height = {};
      if (minHeight !== undefined) where.height.gte = minHeight;
      if (maxHeight !== undefined) where.height.lte = maxHeight;
    }

    if (validityFilter === 'expired') {
      where.validUntil = { lt: now };
    } else if (validityFilter === 'expiring_soon') {
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.validUntil = { gt: now, lt: sevenDaysLater };
    } else if (validityFilter === 'active') {
      where.OR
        ? (where.AND = [
            ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
            {
              OR: [
                { validUntil: null },
                { validUntil: { gt: now } },
              ],
            },
          ])
        : (where.OR = [
            { validUntil: null },
            { validUntil: { gt: now } },
          ]);
    }

    const orderBy: Prisma.MeshTypeOrderByWithRelationInput = {};
    if (sortBy === 'priority') orderBy.priority = sortOrder;
    else if (sortBy === 'name') orderBy.name = sortOrder;
    else if (sortBy === 'height') orderBy.height = sortOrder;
    else if (sortBy === 'retailPricePerUnit') orderBy.retailPricePerUnit = sortOrder;
    else if (sortBy === 'createdAt') orderBy.createdAt = sortOrder;
    else {
      orderBy.priority = 'asc';
      orderBy.height = 'asc';
    }

    const [items, total] = await Promise.all([
      prisma.meshType.findMany({ where, skip, take: pageSize, orderBy }),
      prisma.meshType.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getById(id: string) {
    return prisma.meshType.findUnique({ where: { id } });
  }

  async create(data: MeshInput, userId: string) {
    const allItems = await prisma.meshType.findMany({
      select: { id: true, priority: true },
    });
    const priority = data.priority ?? getNextPriority(allItems);

    const result = await prisma.meshType.create({
      data: {
        name: data.name,
        description: data.description,
        height: data.height,
        cellSize: data.cellSize,
        wireThickness: data.wireThickness,
        coating: data.coating,
        purchasePricePerUnit: data.purchasePricePerUnit ?? null,
        retailPricePerUnit: data.retailPricePerUnit,
        validFrom: data.validFrom ?? null,
        validUntil: data.validUntil ?? null,
        image: data.image ?? null,
        active: data.active ?? true,
        priority,
      },
    });

    await this.invalidateCache();
    return result;
  }

  async update(id: string, data: MeshUpdate, userId: string) {
    const existing = await prisma.meshType.findUnique({ where: { id } });
    if (!existing) throw new Error('Сетка-рабица не найдена');

    if (data.retailPricePerUnit !== undefined && data.retailPricePerUnit !== existing.retailPricePerUnit) {
      await logPriceChange('MeshType', id, { retailPricePerUnit: existing.retailPricePerUnit }, { retailPricePerUnit: data.retailPricePerUnit }, userId);
    }
    if (data.purchasePricePerUnit !== undefined && data.purchasePricePerUnit !== existing.purchasePricePerUnit) {
      await logPriceChange('MeshType', id, { purchasePricePerUnit: existing.purchasePricePerUnit }, { purchasePricePerUnit: data.purchasePricePerUnit }, userId);
    }

    const result = await prisma.meshType.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.height !== undefined && { height: data.height }),
        ...(data.cellSize !== undefined && { cellSize: data.cellSize }),
        ...(data.wireThickness !== undefined && { wireThickness: data.wireThickness }),
        ...(data.coating !== undefined && { coating: data.coating }),
        ...(data.purchasePricePerUnit !== undefined && { purchasePricePerUnit: data.purchasePricePerUnit }),
        ...(data.retailPricePerUnit !== undefined && { retailPricePerUnit: data.retailPricePerUnit }),
        ...(data.validFrom !== undefined && { validFrom: data.validFrom }),
        ...(data.validUntil !== undefined && { validUntil: data.validUntil }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.priority !== undefined && { priority: data.priority }),
      },
    });

    await this.invalidateCache();
    return result;
  }

  async delete(id: string, userId: string) {
    const existing = await prisma.meshType.findUnique({ where: { id } });
    if (!existing) throw new Error('Сетка-рабица не найдена');

    await prisma.meshType.delete({ where: { id } });
    await this.invalidateCache();
    return { success: true };
  }

  async toggleActive(id: string, userId: string) {
    const existing = await prisma.meshType.findUnique({ where: { id } });
    if (!existing) throw new Error('Сетка-рабица не найдена');

    const result = await prisma.meshType.update({
      where: { id },
      data: { active: !existing.active },
    });

    await this.invalidateCache();
    return result;
  }
}

export const meshService = new MeshService();
