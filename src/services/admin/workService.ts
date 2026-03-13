import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { CreateWorkInput, UpdateWorkInput, WorkQueryInput } from '@/lib/validators/work';
import { WorkCategory, WorkUnit, WorkCategoryNames, WorkUnitNames } from '@/lib/enums/work';
import { referenceRegistry } from '@/lib/referenceRegistry';

export class WorkService {
  async getAll(params: {
    search?: string;
    category?: string;
    active?: boolean;
    useInCalculator?: boolean;
    fenceType?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { search, category, active, useInCalculator, fenceType, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.WorkWhereInput = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (useInCalculator !== undefined) {
      where.useInCalculator = useInCalculator;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (fenceType) {
      where.relations = {
        some: { fenceType },
      };
    }

    const [items, total] = await Promise.all([
      prisma.work.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sortOrder: 'asc' },
        include: {
          relations: true,
        },
      }),
      prisma.work.count({ where }),
    ]);

    const itemsWithNames = items.map((item) => ({
      ...item,
      categoryName: WorkCategoryNames[item.category as WorkCategory] || item.category,
      unitName: WorkUnitNames[item.unit as WorkUnit] || item.unit,
      relations: item.relations.map((rel) => ({
        ...rel,
        fenceTypeName: this.getFenceTypeName(rel.fenceType),
      })),
    }));

    return {
      items: itemsWithNames,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    const item = await prisma.work.findUnique({
      where: { id },
      include: {
        relations: true,
      },
    });

    if (!item) return null;

    return {
      ...item,
      categoryName: WorkCategoryNames[item.category as WorkCategory] || item.category,
      unitName: WorkUnitNames[item.unit as WorkUnit] || item.unit,
      relations: item.relations.map((rel) => ({
        ...rel,
        fenceTypeName: this.getFenceTypeName(rel.fenceType),
      })),
    };
  }

  async getByFenceType(fenceType: string) {
    const items = await prisma.work.findMany({
      where: {
        active: true,
        useInCalculator: true,
        relations: {
          some: { fenceType },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      categoryName: WorkCategoryNames[item.category as WorkCategory] || item.category,
      unit: item.unit,
      unitName: WorkUnitNames[item.unit as WorkUnit] || item.unit,
      price: item.price,
      useInCalculator: item.useInCalculator,
    }));
  }

  private getFenceTypeName(fenceType: string): string {
    const typeMap: Record<string, string> = {
      'PROFNASTIL': 'Профнастил',
      'PICKET': 'Евроштакетник',
      'GATE': 'Ворота',
      'WICKET': 'Калитки',
    };
    return typeMap[fenceType] || fenceType;
  }

  async create(data: CreateWorkInput, userId: string) {
    const { relations, ...workData } = data;

    const work = await prisma.work.create({
      data: {
        ...workData,
        relations: {
          create: relations?.map((rel) => ({
            fenceType: rel.fenceType,
          })) || [],
        },
      },
      include: {
        relations: true,
      },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'Work',
        entityId: work.id,
        fieldName: 'created',
        oldValue: undefined,
        newValue: { name: work.name },
        changedBy: userId,
      },
    });

    return work;
  }

  async update(id: string, data: UpdateWorkInput, userId: string) {
    const oldItem = await prisma.work.findUnique({
      where: { id },
      include: { relations: true },
    });

    if (!oldItem) {
      throw new Error('Работа не найдена');
    }

    const { relations, ...workData } = data;

    if (relations !== undefined) {
      await prisma.workRelation.deleteMany({
        where: { workId: id },
      });

      if (relations.length > 0) {
        await prisma.workRelation.createMany({
          data: relations.map((rel) => ({
            workId: id,
            fenceType: rel.fenceType,
          })),
        });
      }
    }

    const work = await prisma.work.update({
      where: { id },
      data: workData,
      include: {
        relations: true,
      },
    });

    await this.logChange(id, oldItem, work, userId);

    return work;
  }

  async delete(id: string, userId: string) {
    const oldItem = await prisma.work.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Работа не найдена');
    }

    await prisma.work.delete({
      where: { id },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'Work',
        entityId: id,
        fieldName: 'deleted',
        oldValue: { id: oldItem.id, name: oldItem.name },
        newValue: undefined,
        changedBy: userId,
      },
    });
  }

  async toggleActive(id: string, userId: string) {
    const oldItem = await prisma.work.findUnique({
      where: { id },
    });

    if (!oldItem) {
      throw new Error('Работа не найдена');
    }

    const item = await prisma.work.update({
      where: { id },
      data: { active: !oldItem.active },
    });

    await this.logChange(id, oldItem, item, userId);

    return item;
  }

  private async logChange(
    entityId: string,
    oldValue: any,
    newValue: any,
    userId: string
  ) {
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
          entityType: 'Work',
          entityId,
          fieldName: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedBy: userId,
        },
      });
    }
  }

  async getFenceTypes() {
    return [
      { value: 'PROFNASTIL', label: 'Профнастил' },
      { value: 'PICKET', label: 'Евроштакетник' },
      { value: 'GATE', label: 'Ворота' },
      { value: 'WICKET', label: 'Калитки' },
    ];
  }

  async getWorksForCalculator(fenceType?: string) {
    const where: Prisma.WorkWhereInput = {
      active: true,
      useInCalculator: true,
    };

    if (fenceType) {
      where.relations = {
        some: { fenceType },
      };
    } else {
      where.relations = {
        none: {},
      };
    }

    const works = await prisma.work.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return works;
  }
}

export const workService = new WorkService();
