export interface PriorityItem {
  id: string;
  priority: number;
}

export interface ReorderParams {
  id: string;
  oldPriority: number;
  newPriority: number;
  allItems: PriorityItem[];
}

export interface PriorityUpdate {
  id: string;
  priority: number;
}

export function calculateReorderUpdates(params: ReorderParams): PriorityUpdate[] {
  const { id, oldPriority, newPriority, allItems } = params;

  if (oldPriority === newPriority) {
    return [];
  }

  const updates: PriorityUpdate[] = [];

  if (newPriority > oldPriority) {
    for (const item of allItems) {
      if (item.priority > oldPriority && item.priority <= newPriority && item.id !== id) {
        updates.push({
          id: item.id,
          priority: item.priority - 1,
        });
      }
    }
  } else {
    for (const item of allItems) {
      if (item.priority >= newPriority && item.priority < oldPriority && item.id !== id) {
        updates.push({
          id: item.id,
          priority: item.priority + 1,
        });
      }
    }
  }

  updates.push({
    id,
    priority: newPriority,
  });

  return updates;
}

export function getNextPriority(items: PriorityItem[]): number {
  if (!items || items.length === 0) {
    return 1;
  }

  const maxPriority = Math.max(...items.map((item) => item.priority));
  return maxPriority + 1;
}

export function validatePriority(priority: number, totalItems: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(priority)) {
    return { valid: false, error: 'Приоритет должен быть целым числом' };
  }

  if (priority < 1) {
    return { valid: false, error: 'Приоритет должен быть не меньше 1' };
  }

  if (priority > totalItems) {
    return { valid: false, error: `Приоритет не может превышать общее количество записей (${totalItems})` };
  }

  return { valid: true };
}

export function sortItemsByPriority<T extends PriorityItem>(items: T[]): T[] {
  return [...items].sort((a, b) => a.priority - b.priority);
}

export function recalculateAllPriorities<T extends PriorityItem>(items: T[]): PriorityUpdate[] {
  const sortedItems = sortItemsByPriority(items);
  const updates: PriorityUpdate[] = [];

  sortedItems.forEach((item, index) => {
    const newPriority = index + 1;
    if (item.priority !== newPriority) {
      updates.push({
        id: item.id,
        priority: newPriority,
      });
    }
  });

  return updates;
}
