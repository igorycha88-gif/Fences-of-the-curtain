import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { CoatingTypeInput, CoatingTypeUpdate } from '@/lib/validators/coatingType';

export class CoatingTypeService {
  async getAll(params: {
    active?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { active, search, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CoatingTypeWhereInput = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [coatings, total] = await Promise.all([
      prisma.coatingType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.coatingType.count({ where }),
    ]);

    return {
      coatings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    return prisma.coatingType.findUnique({
      where: { id },
    });
  }

  async create(data: CoatingTypeInput, userId: string) {
    const coating = await prisma.coatingType.create({
      data,
    });

    await this.logChange(coating.id, 'CREATE', null, coating, userId);

    return coating;
  }

  async update(id: string, data: CoatingTypeUpdate, userId: string) {
    const oldCoating = await prisma.coatingType.findUnique({
      where: { id },
    });

    if (!oldCoating) {
      throw new Error('Тип покрытия не найден');
    }

    const coating = await prisma.coatingType.update({
      where: { id },
      data,
    });

    await this.logChange(id, 'UPDATE', oldCoating, coating, userId);

    return coating;
  }

  async delete(id: string, userId: string) {
    const oldCoating = await prisma.coatingType.findUnique({
      where: { id },
    });

    if (!oldCoating) {
      throw new Error('Тип покрытия не найден');
    }

    await prisma.coatingType.delete({
      where: { id },
    });

    await this.logChange(id, 'DELETE', oldCoating, null, userId);
  }

  async toggleActive(id: string, userId: string) {
    const oldCoating = await prisma.coatingType.findUnique({
      where: { id },
    });

    if (!oldCoating) {
      throw new Error('Тип покрытия не найден');
    }

    const coating = await prisma.coatingType.update({
      where: { id },
      data: { active: !oldCoating.active },
    });

    await this.logChange(id, 'TOGGLE_ACTIVE', oldCoating, coating, userId);

    return coating;
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
          entityType: 'CoatingType',
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

export const coatingTypeService = new CoatingTypeService();
