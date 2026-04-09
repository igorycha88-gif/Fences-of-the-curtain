import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ProfnastilTypeInput, ProfnastilTypeUpdate } from '@/lib/validators/profnastilType';
import { getNextPriority } from '@/lib/utils/priorityUtils';
import { priorityService } from '@/services/admin/priorityService';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';
import { logPriceChange } from '@/lib/audit-helpers';
import { invalidateProfnastilTypesCache } from '@/lib/cache-invalidation';

function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

function calculatePurchasePricePerUnit(
  purchasePricePerLinearMeter: number | null | undefined,
  length: number | null | undefined
): number | null {
  if (purchasePricePerLinearMeter === null || purchasePricePerLinearMeter === undefined) {
    return null;
  }
  if (length === null || length === undefined) {
    return null;
  }
  return roundToTwo(purchasePricePerLinearMeter * (length / 1000));
}

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

    const purchasePricePerUnit = calculatePurchasePricePerUnit(
      data.purchasePricePerLinearMeter,
      data.length
    );

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
        purchasePricePerLinearMeter: data.purchasePricePerLinearMeter,
        purchasePricePerUnit,
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

    await invalidateProfnastilTypesCache();
    console.log('[PROFNASTIL SERVICE] Cache invalidated');

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

    const newName = data.name ?? oldItem.name;
    const newMetalThickness = data.metalThickness ?? oldItem.metalThickness;
    const newCoating = data.coating ?? oldItem.coating;
    const newColor = data.color !== undefined ? data.color : oldItem.color;

    const uniqueFieldsChanged =
      newName !== oldItem.name ||
      newMetalThickness !== oldItem.metalThickness ||
      newCoating !== oldItem.coating ||
      newColor !== oldItem.color;

    if (uniqueFieldsChanged) {
      const existing = await prisma.profnastilType.findFirst({
        where: {
          id: { not: id },
          name: newName,
          metalThickness: newMetalThickness,
          coating: newCoating,
          color: newColor,
        },
      });

      if (existing) {
        throw new Error('Номенклатура с такими параметрами уже существует');
      }
    }

    let updateData = data;

    if (data.purchasePricePerLinearMeter !== undefined || data.length !== undefined) {
      const pricePerMeter = data.purchasePricePerLinearMeter ?? oldItem.purchasePricePerLinearMeter;
      const length = data.length ?? oldItem.length;

      updateData = {
        ...data,
        purchasePricePerUnit: calculatePurchasePricePerUnit(pricePerMeter, length),
      } as any;
    }

    const profnastil = await prisma.profnastilType.update({
      where: { id },
      data: updateData,
    });

    console.log('[PROFNASTIL SERVICE] Updated profnastil:', profnastil.id);

    await this.logChange(id, 'UPDATE', oldItem, profnastil, userId);

    await invalidateProfnastilTypesCache();
    console.log('[PROFNASTIL SERVICE] Cache invalidated');

    return profnastil;
  }

  async delete(id: string, userId: string) {
    const oldItem = await prisma.profnastilType.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Номенклатура не найдена');
    }

    await mountingHardwareService.deleteRelationsForReference('PROFNASTIL', id);

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
    await invalidateProfnastilTypesCache();
    console.log('[PROFNASTIL SERVICE] Cache invalidated');
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

    await invalidateProfnastilTypesCache();
    console.log('[PROFNASTIL SERVICE] Cache invalidated');

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

    logPriceChange('ProfnastilType', entityId, oldValue, newValue, userId);

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
          oldValue: change.oldValue as Prisma.InputJsonValue,
          newValue: change.newValue as Prisma.InputJsonValue,
          changedBy: userId,
        },
      });
    }
  }
}

export const profnastilTypeService = new ProfnastilTypeService();
