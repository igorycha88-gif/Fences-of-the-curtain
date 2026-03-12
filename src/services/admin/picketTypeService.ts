import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { PicketTypeInput, PicketTypeUpdate } from '@/lib/validators/picketType';
import { calculatePricePerUnit, calculatePicketMargin } from '@/lib/utils/priceCalculator';
import { getNextPriority } from '@/lib/utils/priorityUtils';
import { priorityService } from '@/services/admin/priorityService';

export class PicketTypeService {
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

    const where: Prisma.PicketTypeWhereInput = {};

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

    const orderBy: Prisma.PicketTypeOrderByWithRelationInput = {};
    if (sortBy && sortOrder) {
      orderBy[sortBy as keyof Prisma.PicketTypeOrderByWithRelationInput] = sortOrder;
    }

    const [pickets, total] = await Promise.all([
      prisma.picketType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.picketType.count({ where }),
    ]);

    const picketsWithPrices = pickets.map((item) => ({
      ...item,
      purchasePricePerUnit: calculatePricePerUnit(item.width, item.length, item.purchasePricePerMeter),
      retailPricePerUnit: calculatePricePerUnit(item.width, item.length, item.retailPricePerMeter),
    }));

    return {
      pickets: picketsWithPrices,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    const item = await prisma.picketType.findUnique({
      where: { id },
    });

    if (!item) return null;

    return {
      ...item,
      purchasePricePerUnit: calculatePricePerUnit(item.width, item.length, item.purchasePricePerMeter),
      retailPricePerUnit: calculatePricePerUnit(item.width, item.length, item.retailPricePerMeter),
    };
  }

  async create(data: PicketTypeInput, userId: string) {
    console.log('[PICKET SERVICE] Creating picket with data:', JSON.stringify(data, null, 2));

    const existing = await prisma.picketType.findFirst({
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

    const allItems = await prisma.picketType.findMany({
      select: { id: true, priority: true },
    });
    const nextPriority = getNextPriority(allItems);

    const picket = await prisma.picketType.create({
      data: {
        name: data.name,
        description: data.description,
        metalThickness: data.metalThickness,
        width: data.width,
        length: data.length,
        coating: data.coating,
        color: data.color,
        purchasePricePerMeter: data.purchasePricePerMeter,
        retailPricePerMeter: data.retailPricePerMeter,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        image: data.image,
        active: data.active ?? true,
        priority: nextPriority,
      },
    });

    console.log('[PICKET SERVICE] Created picket:', picket.id);

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'PicketType',
        entityId: picket.id,
        fieldName: 'priority',
        oldValue: undefined,
        newValue: picket.priority,
        changedBy: userId,
      },
    });

    return picket;
  }

  async update(id: string, data: PicketTypeUpdate, userId: string) {
    console.log('[PICKET SERVICE] Updating picket:', id, 'data:', JSON.stringify(data, null, 2));

    const oldItem = await prisma.picketType.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Номенклатура не найдена');
    }

    if (data.name || data.metalThickness || data.coating || data.color !== undefined) {
      const existing = await prisma.picketType.findFirst({
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

    const picket = await prisma.picketType.update({
      where: { id },
      data,
    });

    console.log('[PICKET SERVICE] Updated picket:', picket.id);

    await this.logChange(id, 'UPDATE', oldItem, picket, userId);

    return picket;
  }

  async delete(id: string, userId: string) {
    const oldItem = await prisma.picketType.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Номенклатура не найдена');
    }

    await prisma.picketType.delete({
      where: { id },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'PicketType',
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

    await priorityService.recalculateAfterDelete('picketType', userId);
  }

  async toggleActive(id: string, userId: string) {
    const oldItem = await prisma.picketType.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Номенклатура не найдена');
    }

    const picket = await prisma.picketType.update({
      where: { id },
      data: { active: !oldItem.active },
    });

    await this.logChange(id, 'TOGGLE_ACTIVE', oldItem, picket, userId);

    return picket;
  }

  async deactivateExpired() {
    const now = new Date();

    const result = await prisma.picketType.updateMany({
      where: {
        validUntil: { lt: now },
        active: true,
      },
      data: { active: false },
    });

    console.log(`[CRON] Deactivated ${result.count} expired picket types`);
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
          entityType: 'PicketType',
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

export const picketTypeService = new PicketTypeService();
