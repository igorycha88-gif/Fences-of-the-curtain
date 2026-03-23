import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { CreateWorkInput, UpdateWorkInput, WorkQueryInput, WorkRelationInput } from '@/lib/validators/work';
import { WorkCategory, WorkUnit, WorkCategoryNames, WorkUnitNames } from '@/lib/enums/work';
import { referenceRegistry } from '@/lib/referenceRegistry';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';
import { logPriceChange } from '@/lib/audit-helpers';

export class WorkService {
  async getAll(params: {
    search?: string;
    category?: string;
    active?: boolean;
    useInCalculator?: boolean;
    fenceType?: string;
    referenceType?: string;
    referenceId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { search, category, active, useInCalculator, fenceType, referenceType, referenceId, page = 1, pageSize = 20 } = params;
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

    if (fenceType || referenceType || referenceId) {
      where.relations = {
        some: {
          ...(fenceType && { fenceType }),
          ...(referenceType && { referenceType }),
          ...(referenceId && { referenceId }),
        },
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

    const itemsWithNames = await Promise.all(items.map(async (item) => ({
      ...item,
      categoryName: WorkCategoryNames[item.category as WorkCategory] || item.category,
      unitName: WorkUnitNames[item.unit as WorkUnit] || item.unit,
      relations: await Promise.all(item.relations.map(async (rel) => ({
        ...rel,
        fenceTypeName: rel.fenceType ? this.getFenceTypeName(rel.fenceType) : undefined,
        referenceTypeName: rel.referenceType ? this.getReferenceTypeName(rel.referenceType) : undefined,
        referenceItemName: rel.referenceType && rel.referenceId 
          ? await referenceRegistry.getItemName(rel.referenceType, rel.referenceId)
          : undefined,
      }))),
    })));

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
      relations: await Promise.all(item.relations.map(async (rel) => ({
        ...rel,
        fenceTypeName: rel.fenceType ? this.getFenceTypeName(rel.fenceType) : undefined,
        referenceTypeName: rel.referenceType ? this.getReferenceTypeName(rel.referenceType) : undefined,
        referenceItemName: rel.referenceType && rel.referenceId 
          ? await referenceRegistry.getItemName(rel.referenceType, rel.referenceId)
          : undefined,
      }))),
    };
  }

  async getByFenceType(fenceType: string) {
    const items = await prisma.work.findMany({
      where: {
        active: true,
        useInCalculator: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const filteredItems = items.filter((item) => {
      const itemRelations = (item as any).WorkRelation || [];
      return itemRelations.some((rel: any) => rel.fenceType === fenceType);
    });

    return filteredItems.map((item) => ({
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

  async getByReference(referenceType: string, referenceId: string) {
    const items = await prisma.work.findMany({
      where: {
        active: true,
        useInCalculator: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const filteredItems = items.filter((item) => {
      const itemRelations = (item as any).WorkRelation || [];
      return itemRelations.some((rel: any) => rel.referenceType === referenceType && rel.referenceId === referenceId);
    });

    const referenceItemName = referenceType && referenceId
      ? await referenceRegistry.getItemName(referenceType, referenceId)
      : undefined;

    return filteredItems.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      categoryName: WorkCategoryNames[item.category as WorkCategory] || item.category,
      unit: item.unit,
      unitName: WorkUnitNames[item.unit as WorkUnit] || item.unit,
      price: item.price,
      useInCalculator: item.useInCalculator,
      referenceItemName,
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

  private getReferenceTypeName(referenceType: string): string {
    const typeMap: Record<string, string> = {
      'GATE': 'Ворота',
      'WICKET': 'Калитки',
    };
    return typeMap[referenceType] || referenceType;
  }

  async create(data: CreateWorkInput, userId: string) {
    const { relations, ...workData } = data;

    const work = await prisma.work.create({
      data: {
        ...workData,
        relations: {
          create: relations?.map((rel) => this.prepareRelationData(rel)) || [],
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
            ...this.prepareRelationData(rel),
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

  private prepareRelationData(rel: WorkRelationInput) {
    return {
      fenceType: rel.fenceType || null,
      referenceType: rel.referenceType || null,
      referenceId: rel.referenceId || null,
    };
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
    logPriceChange('Work', entityId, oldValue, newValue, userId);

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
          oldValue: change.oldValue as Prisma.InputJsonValue,
          newValue: change.newValue as Prisma.InputJsonValue,
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

  async getReferenceOptions() {
    const [gateItems, wicketItems] = await Promise.all([
      referenceRegistry.getItems('GATE'),
      referenceRegistry.getItems('WICKET'),
    ]);

    return {
      references: [
        {
          type: 'GATE',
          name: 'Ворота',
          items: gateItems,
        },
        {
          type: 'WICKET',
          name: 'Калитки',
          items: wicketItems,
        },
      ],
    };
  }

  async getWorksForCalculator(fenceType?: string) {
    const cacheKey = fenceType 
      ? CACHE_KEYS.WORKS_BY_FENCE_TYPE(fenceType)
      : 'calculator:works:default';

    return cache.getOrSet(
      cacheKey,
      async () => {
        const works = await prisma.work.findMany({
          where: {
            active: true,
            useInCalculator: true,
          },
          orderBy: { sortOrder: 'asc' },
        });

        if (fenceType) {
          const filteredWorks = works.filter((work) => {
            const workRelations = (work as any).WorkRelation || [];
            return workRelations.some((rel: any) => rel.fenceType === fenceType);
          });
          return filteredWorks;
        }

        return works;
      },
      CACHE_TTL.REFERENCE_DATA
    );
  }

   async getWorksForCalculatorByReference(referenceType: string, referenceId: string) {
    const cacheKey = CACHE_KEYS.WORKS_BY_REFERENCE(referenceType, referenceId);
    
    return cache.getOrSet(
      cacheKey,
      async () => {
        const works = await prisma.work.findMany({
          where: {
            active: true,
            useInCalculator: true,
          },
          orderBy: { sortOrder: 'asc' },
        });
        
        const filteredWorks = works.filter((work) => {
          const workRelations = (work as any).WorkRelation || [];
          return workRelations.some((rel: any) => rel.referenceType === referenceType && rel.referenceId === referenceId);
        });
        
        return filteredWorks;
      },
      CACHE_TTL.REFERENCE_DATA
    );
  }
}

export const workService = new WorkService();
