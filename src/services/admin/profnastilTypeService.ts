import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ProfnastilTypeInput, ProfnastilTypeUpdate } from '@/lib/validators/profnastilType';
import { getNextPriority } from '@/lib/utils/priorityUtils';
import { priorityService } from '@/services/admin/priorityService';

export class ProfnastilTypeService {
  async getAll(params: {
    active?: boolean;
    search?: string;
    coating?: string;
    page?: number;
    pageSize?: number;
    validityFilter?: 'all' | 'active' | 'expired' | 'expiring_soon';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { 
      active, 
      search, 
      coating,
      page = 1, 
      pageSize = 20,
      validityFilter = 'all',
      sortBy = 'priority',
      sortOrder = 'asc'
    } = params;
    const skip = (page - 1) * pageSize;
    const now = new Date();

    const where: Prisma.ProfnastilTypeWhereInput = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { coating: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (coating) {
      where.coating = coating;
    }

    if (validityFilter === 'expired') {
      where.validUntil = { lt: now };
    } else if (validityFilter === 'expiring_soon') {
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.validUntil = {
        gt: now,
        lte: sevenDaysLater,
      };
    } else if (validityFilter === 'active') {
      where.active = true;
      where.OR = [
        { validUntil: null },
        { validUntil: { gt: now } },
      ];
    }

    const orderBy: Prisma.ProfnastilTypeOrderByWithRelationInput = {};
    if (sortBy && sortOrder) {
      orderBy[sortBy as keyof Prisma.ProfnastilTypeOrderByWithRelationInput] = sortOrder;
    }

    const [profnastil, total] = await Promise.all([
      prisma.profnastilType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.profnastilType.count({ where }),
    ]);

    return {
      profnastil,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    const item = await prisma.profnastilType.findUnique({
      where: { id },
    });

    return item;
  }

  async create(data: ProfnastilTypeInput, userId: string) {
    console.log('[PROFNASTIL SERVICE] Creating profnastil with data:', JSON.stringify(data, null, 2));

    const existing = await prisma.profnastilType.findFirst({
      where: {
        name: data.name,
        metalThickness: data.metalThickness,
        coating: data.coating,
        color: data.color || null,
      },
    });

    if (existing) {
      throw new Error('Номенклатура с такими параметрами уже существует');
    }

    const allItems = await prisma.profnastilType.findMany({
      select: { id: true, priority: true },
    });
    const nextPriority = getNextPriority(allItems);

    const profnastil = await prisma.profnastilType.create({
      data: {
        name: data.name,
        description: data.description,
        metalThickness: data.metalThickness,
        fullWidth: data.fullWidth,
        usefulWidth: data.usefulWidth,
        length: data.length,
        coating: data.coating,
        color: data.color,
        purchasePricePerUnit: data.purchasePricePerUnit,
        retailPricePerUnit: data.retailPricePerUnit,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        image: data.image,
        active: data.active ?? true,
        priority: nextPriority,
      },
    });

    console.log('[PROFNASTIL SERVICE] Created profnastil:', profnastil.id);

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'ProfnastilType',
        entityId: profnastil.id,
        fieldName: 'priority',
        oldValue: undefined,
        newValue: profnastil.priority,
        changedBy: userId,
      },
    });

    return profnastil;
  }

  async update(id: string, data: ProfnastilTypeUpdate, userId: string) {
    console.log('[PROFNASTIL SERVICE] Updating profnastil:', id, 'data:', JSON.stringify(data, null, 2));

    const oldItem = await prisma.profnastilType.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Номенклатура не найдена');
    }

    if (data.name || data.metalThickness || data.coating || data.color !== undefined) {
      const existing = await prisma.profnastilType.findFirst({
        where: {
          id: { not: id },
          name: data.name || oldItem.name,
          metalThickness: data.metalThickness ?? oldItem.metalThickness,
          coating: data.coating || oldItem.coating,
          color: data.color !== undefined ? data.color : oldItem.color,
        },
      });

      if (existing) {
        throw new Error('Номенклатура с такими параметрами уже существует');
      }
    }

    const profnastil = await prisma.profnastilType.update({
      where: { id },
      data,
    });

    console.log('[PROFNASTIL SERVICE] Updated profnastil:', profnastil.id);

    await this.logChange(id, 'UPDATE', oldItem, profnastil, userId);

    return profnastil;
  }

  async delete(id: string, userId: string) {
    const oldItem = await prisma.profnastilType.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Номенклатура не найдена');
    }

    await prisma.profnastilType.delete({
      where: { id },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'ProfnastilType',
        entityId: id,
        fieldName: 'deleted',
        oldValue: {
          id: oldItem.id,
          name: oldItem.name,
          priority: oldItem.priority,
        },
        newValue: undefined,
        changedBy: userId,
      },
    });

    await priorityService.recalculateAfterDelete('profnastilType', userId);
  }

  async toggleActive(id: string, userId: string) {
    const oldItem = await prisma.profnastilType.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Номенклатура не найдена');
    }

    const profnastil = await prisma.profnastilType.update({
      where: { id },
      data: { active: !oldItem.active },
    });

    await this.logChange(id, 'TOGGLE_ACTIVE', oldItem, profnastil, userId);

    return profnastil;
  }

  async deactivateExpired() {
    const now = new Date();

    const result = await prisma.profnastilType.updateMany({
      where: {
        validUntil: { lt: now },
        active: true,
      },
      data: { active: false },
    });

    console.log(`[CRON] Deactivated ${result.count} expired profnastil types`);
    return result.count;
  }

  private async logChange(
    entityId: string,
    action: string,
    oldValue: any,
    newValue: any,
    userId: string
  ) {
    if (action === 'CREATE' || action === 'DELETE') {
      return;
    }

    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    if (oldValue && newValue) {
      const fields = Object.keys(newValue) as Array<keyof typeof newValue>;

      for (const field of fields) {
        if (oldValue[field] !== newValue[field]) {
          changes.push({
            field: field as string,
            oldValue: oldValue[field],
            newValue: newValue[field],
          });
        }
      }
    }

    for (const change of changes) {
      await prisma.referenceChangeLog.create({
        data: {
          entityType: 'ProfnastilType',
          entityId,
          fieldName: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedBy: userId,
        },
      });
    }
  }
}

export const profnastilTypeService = new ProfnastilTypeService();
