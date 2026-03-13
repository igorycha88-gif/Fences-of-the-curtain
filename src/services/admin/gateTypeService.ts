import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { GateTypeInput, GateTypeUpdate } from '@/lib/validators/gateType';
import { getNextPriority } from '@/lib/utils/priorityUtils';
import { priorityService } from '@/services/admin/priorityService';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';

export class GateTypeService {
  async getAll(params: {
    active?: boolean;
    search?: string;
    type?: 'all' | 'Распашные' | 'Откатные';
    page?: number;
    pageSize?: number;
    validityFilter?: 'all' | 'active' | 'expired' | 'expiring_soon';
  }) {
    const { 
      active, 
      search, 
      type = 'all',
      page = 1, 
      pageSize = 20,
      validityFilter = 'all'
    } = params;
    const skip = (page - 1) * pageSize;
    const now = new Date();

    const where: Prisma.GateTypeWhereInput = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (type !== 'all') {
      where.type = type;
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

    const [gates, total] = await Promise.all([
      prisma.gateType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { priority: 'asc' },
      }),
      prisma.gateType.count({ where }),
    ]);

    return {
      gates,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    return prisma.gateType.findUnique({
      where: { id },
    });
  }

  async create(data: GateTypeInput, userId: string) {
    console.log('[GATE SERVICE] Creating gate with data:', JSON.stringify(data, null, 2));

    const allItems = await prisma.gateType.findMany({
      select: { id: true, priority: true },
    }) as any;
    const nextPriority = getNextPriority(allItems);

    const gate = await prisma.gateType.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        metalThickness: data.metalThickness,
        sectionWidth: data.sectionWidth,
        sectionHeight: data.sectionHeight,
        gateHeight: data.gateHeight,
        gateLength: data.gateLength,
        retailPrice: data.retailPrice,
        purchasePrice: data.purchasePrice,
        image: data.image,
        active: data.active,
        validFrom: data.validFrom,
        expirationDate: data.expirationDate,
        priority: nextPriority,
      },
    });

    console.log('[GATE SERVICE] Created gate:', gate.id);

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'GateType',
        entityId: gate.id,
        fieldName: 'priority',
        oldValue: undefined,
        newValue: gate.priority,
        changedBy: userId,
      },
    });

    return gate;
  }

  async update(id: string, data: GateTypeUpdate, userId: string) {
    console.log('[GATE SERVICE] Updating gate:', id, 'data:', JSON.stringify(data, null, 2));

    const oldGate = await prisma.gateType.findUnique({
      where: { id },
    });

    if (!oldGate) {
      throw new Error('Ворота не найдены');
    }

    if (data.name && data.name !== oldGate.name) {
      const existingGateByName = await prisma.gateType.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      });

      if (existingGateByName) {
        throw new Error('Ворота с таким названием уже существуют');
      }
    }

    const gate = await prisma.gateType.update({
      where: { id },
      data,
    });

    console.log('[GATE SERVICE] Updated gate:', gate.id);

    await this.logChange(id, 'UPDATE', oldGate, gate, userId);

    return gate;
  }

  async delete(id: string, userId: string) {
    const oldGate = await prisma.gateType.findUnique({
      where: { id },
    });

    if (!oldGate) {
      throw new Error('Ворота не найдены');
    }

    await mountingHardwareService.deleteRelationsForReference('GATE', id);

    await prisma.gateType.delete({
      where: { id },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'GateType',
        entityId: id,
        fieldName: 'deleted',
        oldValue: {
          id: oldGate.id,
          name: oldGate.name,
          priority: oldGate.priority,
        },
        newValue: undefined,
        changedBy: userId,
      },
    });

    await priorityService.recalculateAfterDelete('gateType', userId);
  }

  async toggleActive(id: string, userId: string) {
    const oldGate = await prisma.gateType.findUnique({
      where: { id },
    });

    if (!oldGate) {
      throw new Error('Ворота не найдены');
    }

    const gate = await prisma.gateType.update({
      where: { id },
      data: { active: !oldGate.active },
    });

    await this.logChange(id, 'TOGGLE_ACTIVE', oldGate, gate, userId);

    return gate;
  }

  async deactivateExpired() {
    const now = new Date();

    const result = await prisma.gateType.updateMany({
      where: {
        expirationDate: { lt: now },
        active: true,
      },
      data: { active: false },
    });

    console.log(`[CRON] Deactivated ${result.count} expired gates`);
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
          entityType: 'GateType',
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

export const gateTypeService = new GateTypeService();
