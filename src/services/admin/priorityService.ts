import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { calculateReorderUpdates, getNextPriority, validatePriority, PriorityItem, PriorityUpdate } from '@/lib/utils/priorityUtils';

type ModelName = 
  | 'profnastilType' 
  | 'picketType' 
  | 'postType' 
  | 'lagType' 
  | 'gateType' 
  | 'wicketType' 
  | 'fenceType'
  | 'panel3D';

const modelMap: Record<ModelName, any> = {
  profnastilType: prisma.profnastilType,
  picketType: prisma.picketType,
  postType: prisma.postType,
  lagType: prisma.lagType,
  gateType: prisma.gateType,
  wicketType: prisma.wicketType,
  fenceType: prisma.fenceType,
  panel3D: (prisma as any).panel3D,
};

interface ReorderResult {
  success: boolean;
  affected: number;
  item: { id: string; priority: number };
}

export class PriorityService {
  async reorder(
    model: ModelName,
    id: string,
    newPriority: number,
    userId: string
  ): Promise<ReorderResult> {
    const allItems = await modelMap[model].findMany({
      select: { id: true, priority: true },
    }) as PriorityItem[];

    const validation = validatePriority(newPriority, allItems.length);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const targetItem = allItems.find((item) => item.id === id);
    if (!targetItem) {
      throw new Error('Запись не найдена');
    }

    const oldPriority = targetItem.priority;

    if (oldPriority === newPriority) {
      return {
        success: true,
        affected: 0,
        item: { id, priority: newPriority },
      };
    }

    const duplicateItem = allItems.find(
      (item) => item.id !== id && item.priority === newPriority
    );
    if (duplicateItem && oldPriority !== newPriority) {
      const updates = calculateReorderUpdates({
        id,
        oldPriority,
        newPriority,
        allItems,
      });

      await prisma.$transaction(async (tx) => {
        for (const update of updates) {
          await (tx as any)[model].update({
            where: { id: update.id },
            data: { priority: update.priority },
          });
        }

        await prisma.referenceChangeLog.create({
          data: {
            entityType: model.charAt(0).toUpperCase() + model.slice(1),
            entityId: id,
            fieldName: 'priority',
            oldValue: oldPriority,
            newValue: newPriority,
            changedBy: userId,
          },
        });
      });

      return {
        success: true,
        affected: updates.length,
        item: { id, priority: newPriority },
      };
    }

    const updates = calculateReorderUpdates({
      id,
      oldPriority,
      newPriority,
      allItems,
    });

    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await (tx as any)[model].update({
          where: { id: update.id },
          data: { priority: update.priority },
        });
      }

      await prisma.referenceChangeLog.create({
        data: {
          entityType: model.charAt(0).toUpperCase() + model.slice(1),
          entityId: id,
          fieldName: 'priority',
          oldValue: oldPriority,
          newValue: newPriority,
          changedBy: userId,
        },
      });
    });

    return {
      success: true,
      affected: updates.length,
      item: { id, priority: newPriority },
    };
  }

  async getNextPriorityValue(model: ModelName): Promise<number> {
    const allItems = await modelMap[model].findMany({
      select: { id: true, priority: true },
    }) as PriorityItem[];

    return getNextPriority(allItems);
  }

  async recalculateAllPriorities(model: ModelName): Promise<void> {
    const allItems = await modelMap[model].findMany({
      select: { id: true, priority: true },
      orderBy: { priority: 'asc' as any },
    }) as PriorityItem[];

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < allItems.length; i++) {
        const newPriority = i + 1;
        if (allItems[i].priority !== newPriority) {
          await (tx as any)[model].update({
            where: { id: allItems[i].id },
            data: { priority: newPriority },
          });
        }
      }
    });
  }

  async recalculateAfterDelete(model: ModelName, userId: string): Promise<void> {
    const allItems = await modelMap[model].findMany({
      select: { id: true, priority: true },
      orderBy: { priority: 'asc' as any },
    }) as PriorityItem[];

    const updates: PriorityUpdate[] = [];

    for (let i = 0; i < allItems.length; i++) {
      const newPriority = i + 1;
      if (allItems[i].priority !== newPriority) {
        updates.push({
          id: allItems[i].id,
          priority: newPriority,
        });
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const update of updates) {
          const oldPriority = allItems.find((item) => item.id === update.id)?.priority || 0;
          await (tx as any)[model].update({
            where: { id: update.id },
            data: { priority: update.priority },
          });

          await prisma.referenceChangeLog.create({
            data: {
              entityType: model.charAt(0).toUpperCase() + model.slice(1),
              entityId: update.id,
              fieldName: 'priority',
              oldValue: oldPriority,
              newValue: update.priority,
              changedBy: userId,
            },
          });
        }
      });
    }
  }
}

export const priorityService = new PriorityService();
