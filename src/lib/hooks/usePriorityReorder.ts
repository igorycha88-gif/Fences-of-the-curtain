import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UsePriorityReorderOptions {
  entityType: string;
  onSuccess?: () => void;
}

interface PriorityItem {
  id: string;
  priority: number;
  [key: string]: any;
}

export function usePriorityReorder({ entityType, onSuccess }: UsePriorityReorderOptions) {
  const [isReordering, setIsReordering] = useState(false);

  const reorderItems = useCallback(
    async (id: string, newPriority: number, items: PriorityItem[]) => {
      const oldItem = items.find((item) => item.id === id);
      if (!oldItem) {
        toast.error('Элемент не найден');
        return false;
      }

      const oldPriority = oldItem.priority;
      if (oldPriority === newPriority) {
        return true;
      }

      setIsReordering(true);

      try {
        const response = await fetch(`/api/admin/${entityType}/reorder`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id,
            newPriority,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Ошибка изменения приоритета');
        }

        toast.success('Приоритет успешно изменён');
        onSuccess?.();
        return true;
      } catch (error: any) {
        console.error('[PRIORITY REORDER] Error:', error);
        toast.error(error.message || 'Ошибка изменения приоритета');
        return false;
      } finally {
        setIsReordering(false);
      }
    },
    [entityType, onSuccess]
  );

  const moveItem = useCallback(
    (fromIndex: number, toIndex: number, items: PriorityItem[]): PriorityItem[] => {
      const result = Array.from(items);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    },
    []
  );

  return {
    isReordering,
    reorderItems,
    moveItem,
  };
}
