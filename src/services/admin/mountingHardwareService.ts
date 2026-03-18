import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { MountingHardwareInput, MountingHardwareUpdate, ReferenceType } from '@/lib/validators/mountingHardware';
import { referenceRegistry } from '@/lib/referenceRegistry';
import { logPriceChange } from '@/lib/audit-helpers';

export class MountingHardwareService {
  async getAll(params: {
    active?: boolean;
    search?: string;
    referenceType?: ReferenceType;
    referenceId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { active, search, referenceType, referenceId, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.MountingHardwareWhereInput = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (referenceType || referenceId) {
      where.relations = {
        some: {
          ...(referenceType && { referenceType }),
          ...(referenceId && { referenceId }),
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.mountingHardware.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sortOrder: 'asc' },
        include: {
          relations: true,
        },
      }),
      prisma.mountingHardware.count({ where }),
    ]);

    const itemsWithNames = await Promise.all(
      items.map(async (item) => {
        const relationsWithNames = await Promise.all(
          item.relations.map(async (rel) => {
            const name = await this.getReferenceName(rel.referenceType as ReferenceType, rel.referenceId);
            return {
              ...rel,
              referenceName: name,
            };
          })
        );
        return {
          ...item,
          relations: relationsWithNames,
        };
      })
    );

    return {
      items: itemsWithNames,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    const item = await prisma.mountingHardware.findUnique({
      where: { id },
      include: {
        relations: true,
      },
    });

    if (!item) return null;

    const relationsWithNames = await Promise.all(
      item.relations.map(async (rel) => {
        const name = await this.getReferenceName(rel.referenceType as ReferenceType, rel.referenceId);
        return {
          ...rel,
          referenceName: name,
        };
      })
    );

    return {
      ...item,
      relations: relationsWithNames,
    };
  }

  private async getReferenceName(referenceType: ReferenceType, referenceId: string): Promise<string> {
    return referenceRegistry.getItemName(referenceType, referenceId);
  }

  async create(data: MountingHardwareInput, userId: string) {
    console.log('[MOUNTING HARDWARE SERVICE] Creating with data:', JSON.stringify(data, null, 2));

    const { relations, ...hardwareData } = data;

    const hardware = await prisma.mountingHardware.create({
      data: {
        ...hardwareData,
        relations: {
          create: relations.map((rel) => ({
            referenceType: rel.referenceType,
            referenceId: rel.referenceId,
          })),
        },
      },
      include: {
        relations: true,
      },
    });

    console.log('[MOUNTING HARDWARE SERVICE] Created:', hardware.id);

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'MountingHardware',
        entityId: hardware.id,
        fieldName: 'created',
        oldValue: undefined,
        newValue: { name: hardware.name },
        changedBy: userId,
      },
    });

    return hardware;
  }

  async update(id: string, data: MountingHardwareUpdate, userId: string) {
    console.log('[MOUNTING HARDWARE SERVICE] Updating:', id, 'data:', JSON.stringify(data, null, 2));

    const oldItem = await prisma.mountingHardware.findUnique({
      where: { id },
      include: { relations: true },
    });

    if (!oldItem) {
      throw new Error('Позиция не найдена');
    }

    const { relations, ...hardwareData } = data;

    if (relations) {
      await prisma.mountingHardwareRelation.deleteMany({
        where: { mountingHardwareId: id },
      });

      await prisma.mountingHardwareRelation.createMany({
        data: relations.map((rel) => ({
          mountingHardwareId: id,
          referenceType: rel.referenceType,
          referenceId: rel.referenceId,
        })),
      });
    }

    const hardware = await prisma.mountingHardware.update({
      where: { id },
      data: hardwareData,
      include: {
        relations: true,
      },
    });

    console.log('[MOUNTING HARDWARE SERVICE] Updated:', hardware.id);

    await this.logChange(id, 'UPDATE', oldItem, hardware, userId);

    return hardware;
  }

  async delete(id: string, userId: string) {
    const oldItem = await prisma.mountingHardware.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Позиция не найдена');
    }

    await prisma.mountingHardware.delete({
      where: { id },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'MountingHardware',
        entityId: id,
        fieldName: 'deleted',
        oldValue: { id: oldItem.id, name: oldItem.name },
        newValue: undefined,
        changedBy: userId,
      },
    });
  }

  async toggleActive(id: string, userId: string) {
    const oldItem = await prisma.mountingHardware.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Позиция не найдена');
    }

    const item = await prisma.mountingHardware.update({
      where: { id },
      data: { active: !oldItem.active },
    });

    await this.logChange(id, 'TOGGLE_ACTIVE', oldItem, item, userId);

    return item;
  }

  async deactivateExpired() {
    const now = new Date();

    const result = await prisma.mountingHardware.updateMany({
      where: {
        validUntil: { lt: now },
        active: true,
      },
      data: { active: false },
    });

    console.log(`[CRON] Deactivated ${result.count} expired mounting hardware items`);
    return result.count;
  }

  async deleteRelationsForReference(referenceType: ReferenceType, referenceId: string) {
    const result = await prisma.mountingHardwareRelation.deleteMany({
      where: {
        referenceType,
        referenceId,
      },
    });

    console.log(`[MOUNTING HARDWARE] Deleted ${result.count} relations for ${referenceType}:${referenceId}`);

    const orphanedHardware = await prisma.mountingHardware.findMany({
      where: {
        relations: { none: {} },
      },
      select: { id: true, name: true },
    });

    if (orphanedHardware.length > 0) {
      console.log(`[MOUNTING HARDWARE] Warning: ${orphanedHardware.length} items have no relations:`, 
        orphanedHardware.map(h => h.name).join(', ')
      );
    }

    return { deletedCount: result.count, orphanedHardware };
  }

  async getReferenceOptions() {
    const references = referenceRegistry.getAll();
    const result: Record<string, Array<{ id: string; name: string }>> = {};
    
    await Promise.all(
      references.map(async (ref) => {
        result[ref.type] = await referenceRegistry.getItems(ref.type);
      })
    );
    
    return result;
  }

  async getHardwareForCalculator(referenceType: ReferenceType, referenceId: string) {
    const hardware = await prisma.mountingHardware.findMany({
      where: {
        active: true,
        useInCalculator: true,
        relations: {
          some: {
            referenceType,
            referenceId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        retailPrice: true,
        calculationMethod: true,
        calculationValue: true,
      },
    });

    return hardware;
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

    logPriceChange('MountingHardware', entityId, oldValue, newValue, userId);

    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    if (oldValue && newValue) {
      const fields = Object.keys(newValue) as Array<keyof typeof newValue>;

      for (const field of fields) {
        if (field !== 'relations' && oldValue[field] !== newValue[field]) {
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
          entityType: 'MountingHardware',
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

export const mountingHardwareService = new MountingHardwareService();
