import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { FenceTypeInput, FenceTypeUpdate } from '@/lib/validators/fenceType';
import { fenceTypeCalculatorService } from '@/services/calculator/fenceTypeCalculatorService';
import { getNextPriority } from '@/lib/utils/priorityUtils';
import { priorityService } from '@/services/admin/priorityService';

export class FenceTypeService {
  async getAll(params: {
    active?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { active, search, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.FenceTypeWhereInput = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [types, total] = await Promise.all([
      prisma.fenceType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { priority: 'asc' },
      }),
      prisma.fenceType.count({ where }),
    ]);

    return {
      types,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    return prisma.fenceType.findUnique({
      where: { id },
      include: {
        materials: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async create(data: FenceTypeInput, userId: string) {
    const allItems = await prisma.fenceType.findMany({
      select: { id: true, priority: true },
    }) as any;
    const nextPriority = getNextPriority(allItems);

    const type = await prisma.fenceType.create({
      data: {
        ...data,
        priority: nextPriority,
      },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'FenceType',
        entityId: type.id,
        fieldName: 'priority',
        oldValue: undefined,
        newValue: type.priority,
        changedBy: userId,
      },
    });

    await fenceTypeCalculatorService.invalidateCache();

    return type;
  }

  async update(id: string, data: FenceTypeUpdate, userId: string) {
    const oldType = await prisma.fenceType.findUnique({
      where: { id },
    });

    if (!oldType) {
      throw new Error('Тип забора не найден');
    }

    const type = await prisma.fenceType.update({
      where: { id },
      data,
    });

    await this.logChange(id, 'UPDATE', oldType, type, userId);
    await fenceTypeCalculatorService.invalidateCache();

    return type;
  }

  async delete(id: string, userId: string) {
    const materialsCount = await prisma.fenceMaterial.count({
      where: { fenceTypeId: id },
    });

    if (materialsCount > 0) {
      throw new Error(
        `Невозможно удалить тип забора, используется в ${materialsCount} материалах`
      );
    }

    const oldType = await prisma.fenceType.findUnique({
      where: { id },
    });

    await prisma.fenceType.delete({
      where: { id },
    });

    if (oldType) {
      await prisma.referenceChangeLog.create({
        data: {
          entityType: 'FenceType',
          entityId: id,
          fieldName: 'deleted',
          oldValue: {
            id: oldType.id,
            name: oldType.name,
            priority: oldType.priority,
          },
          newValue: undefined,
          changedBy: userId,
        },
      });
    }

    await priorityService.recalculateAfterDelete('fenceType', userId);
    await fenceTypeCalculatorService.invalidateCache();
  }

  async toggleActive(id: string, userId: string) {
    const oldType = await prisma.fenceType.findUnique({
      where: { id },
    });

    if (!oldType) {
      throw new Error('Тип забора не найден');
    }

    const type = await prisma.fenceType.update({
      where: { id },
      data: { active: !oldType.active },
    });

    await this.logChange(id, 'TOGGLE_ACTIVE', oldType, type, userId);
    await fenceTypeCalculatorService.invalidateCache();

    return type;
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
          entityType: 'FenceType',
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

export const fenceTypeService = new FenceTypeService();
