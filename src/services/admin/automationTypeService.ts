import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AutomationTypeInput, AutomationTypeUpdate } from '@/lib/validators/automationType';
import { getNextPriority } from '@/lib/utils/priorityUtils';
import { priorityService } from '@/services/admin/priorityService';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';
import { logPriceChange } from '@/lib/audit-helpers';

export class AutomationTypeService {
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

    const where: Prisma.AutomationTypeWhereInput = {};

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

    const [items, total] = await Promise.all([
      prisma.automationType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { priority: 'asc' },
      }),
      prisma.automationType.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    return prisma.automationType.findUnique({
      where: { id },
    });
  }

  async create(data: AutomationTypeInput, userId: string) {
    const allItems = await prisma.automationType.findMany({
      select: { id: true, priority: true },
    }) as any;
    const nextPriority = getNextPriority(allItems);

    const item = await prisma.automationType.create({
      data: {
        name: data.name,
        description: data.description,
        retailPrice: data.retailPrice,
        purchasePrice: data.purchasePrice,
        image: data.image,
        active: data.active,
        validFrom: data.validFrom,
        expirationDate: data.expirationDate,
        priority: nextPriority,
      },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'AutomationType',
        entityId: item.id,
        fieldName: 'priority',
        oldValue: undefined,
        newValue: item.priority,
        changedBy: userId,
      },
    });

    return item;
  }

  async update(id: string, data: AutomationTypeUpdate, userId: string) {
    const oldItem = await prisma.automationType.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Автоматика не найдена');
    }

    if (data.name && data.name !== oldItem.name) {
      const existingItem = await prisma.automationType.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      });

      if (existingItem) {
        throw new Error('Автоматика с таким названием уже существует');
      }
    }

    const item = await prisma.automationType.update({
      where: { id },
      data,
    });

    await this.logChange(id, 'UPDATE', oldItem, item, userId);

    return item;
  }

  async delete(id: string, userId: string) {
    const oldItem = await prisma.automationType.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Автоматика не найдена');
    }

    await mountingHardwareService.deleteRelationsForReference('AUTOMATION', id);

    await prisma.automationType.delete({
      where: { id },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'AutomationType',
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

    await priorityService.recalculateAfterDelete('automationType', userId);
  }

  async toggleActive(id: string, userId: string) {
    const oldItem = await prisma.automationType.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Автоматика не найдена');
    }

    const item = await prisma.automationType.update({
      where: { id },
      data: { active: !oldItem.active },
    });

    await this.logChange(id, 'TOGGLE_ACTIVE', oldItem, item, userId);

    return item;
  }

  async deactivateExpired() {
    const now = new Date();

    const result = await prisma.automationType.updateMany({
      where: {
        expirationDate: { lt: now },
        active: true,
      },
      data: { active: false },
    });

    console.log(`[CRON] Deactivated ${result.count} expired automation types`);
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

    logPriceChange('AutomationType', entityId, oldValue, newValue, userId);

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
          entityType: 'AutomationType',
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

export const automationTypeService = new AutomationTypeService();
