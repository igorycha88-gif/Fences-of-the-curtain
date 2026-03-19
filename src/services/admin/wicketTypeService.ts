import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { WicketTypeInput, WicketTypeUpdate } from '@/lib/validators/wicketType';
import { getNextPriority } from '@/lib/utils/priorityUtils';
import { priorityService } from '@/services/admin/priorityService';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';
import { logPriceChange } from '@/lib/audit-helpers';

export class WicketTypeService {
  async getAll(params: {
    active?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
    validityFilter?: 'all' | 'active' | 'expired' | 'expiring_soon';
  }) {
    const { 
      active, 
      search, 
      page = 1, 
      pageSize = 20,
      validityFilter = 'all'
    } = params;
    const skip = (page - 1) * pageSize;
    const now = new Date();

    const where: Prisma.WicketTypeWhereInput = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (validityFilter === 'expired') {
      where.expirationDate = { lt: now };
    } else if (validityFilter === 'expiring_soon') {
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.expirationDate = {
        gt: now,
        lte: sevenDaysLater,
      };
    } else if (validityFilter === 'active') {
      where.active = true;
      where.OR = [
        { expirationDate: null },
        { expirationDate: { gt: now } },
      ];
    }

    const [wickets, total] = await Promise.all([
      prisma.wicketType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { priority: 'asc' },
      }),
      prisma.wicketType.count({ where }),
    ]);

    return {
      wickets,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    return prisma.wicketType.findUnique({
      where: { id },
    });
  }

  async create(data: WicketTypeInput, userId: string) {
    console.log('[WICKET SERVICE] Creating wicket with data:', JSON.stringify(data, null, 2));

    const allItems = await prisma.wicketType.findMany({
      select: { id: true, priority: true },
    }) as any;
    const nextPriority = getNextPriority(allItems);

    const wicket = await prisma.wicketType.create({
      data: {
        name: data.name,
        description: data.description,
        metalThickness: data.metalThickness,
        sectionWidth: data.sectionWidth,
        sectionHeight: data.sectionHeight,
        wicketHeight: data.wicketHeight,
        wicketLength: data.wicketLength,
        retailPrice: data.retailPrice,
        purchasePrice: data.purchasePrice,
        image: data.image,
        active: data.active,
        validFrom: data.validFrom,
        expirationDate: data.expirationDate,
        priority: nextPriority,
      },
    });

    console.log('[WICKET SERVICE] Created wicket:', wicket.id);

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'WicketType',
        entityId: wicket.id,
        fieldName: 'priority',
        oldValue: undefined,
        newValue: wicket.priority,
        changedBy: userId,
      },
    });

    return wicket;
  }

  async update(id: string, data: WicketTypeUpdate, userId: string) {
    console.log('[WICKET SERVICE] Updating wicket:', id, 'data:', JSON.stringify(data, null, 2));

    const oldWicket = await prisma.wicketType.findUnique({
      where: { id },
    });

    if (!oldWicket) {
      throw new Error('Калитка не найдена');
    }

    if (data.name && data.name !== oldWicket.name) {
      const existingWicketByName = await prisma.wicketType.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      });

      if (existingWicketByName) {
        throw new Error('Калитка с таким названием уже существует');
      }
    }

    const wicket = await prisma.wicketType.update({
      where: { id },
      data,
    });

    console.log('[WICKET SERVICE] Updated wicket:', wicket.id);

    await this.logChange(id, 'UPDATE', oldWicket, wicket, userId);

    return wicket;
  }

  async delete(id: string, userId: string) {
    const oldWicket = await prisma.wicketType.findUnique({
      where: { id },
    });

    if (!oldWicket) {
      throw new Error('Калитка не найдена');
    }

    await mountingHardwareService.deleteRelationsForReference('WICKET', id);

    await prisma.wicketType.delete({
      where: { id },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'WicketType',
        entityId: id,
        fieldName: 'deleted',
        oldValue: {
          id: oldWicket.id,
          name: oldWicket.name,
          priority: oldWicket.priority,
        },
        newValue: undefined,
        changedBy: userId,
      },
    });

    await priorityService.recalculateAfterDelete('wicketType', userId);
  }

  async toggleActive(id: string, userId: string) {
    const oldWicket = await prisma.wicketType.findUnique({
      where: { id },
    });

    if (!oldWicket) {
      throw new Error('Калитка не найдена');
    }

    const wicket = await prisma.wicketType.update({
      where: { id },
      data: { active: !oldWicket.active },
    });

    await this.logChange(id, 'TOGGLE_ACTIVE', oldWicket, wicket, userId);

    return wicket;
  }

  async deactivateExpired() {
    const now = new Date();

    const result = await prisma.wicketType.updateMany({
      where: {
        expirationDate: { lt: now },
        active: true,
      },
      data: { active: false },
    });

    console.log(`[CRON] Deactivated ${result.count} expired wickets`);
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

    logPriceChange('WicketType', entityId, oldValue, newValue, userId);

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
          entityType: 'WicketType',
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

export const wicketTypeService = new WicketTypeService();
