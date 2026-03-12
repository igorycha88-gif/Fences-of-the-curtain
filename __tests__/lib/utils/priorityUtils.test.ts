import { describe, test, expect } from '@jest/globals';
import {
  calculateReorderUpdates,
  getNextPriority,
  validatePriority,
  sortItemsByPriority,
  recalculateAllPriorities,
  PriorityItem,
} from '@/lib/utils/priorityUtils';

describe('priorityUtils', () => {
  describe('calculateReorderUpdates', () => {
    const createItems = (count: number): PriorityItem[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `item-${i + 1}`,
        priority: i + 1,
      }));
    };

    test('should return empty array when priority unchanged', () => {
      const items = createItems(5);
      const result = calculateReorderUpdates({
        id: 'item-2',
        oldPriority: 2,
        newPriority: 2,
        allItems: items,
      });

      expect(result).toEqual([]);
    });

    test('should calculate updates when moving up (5 -> 2)', () => {
      const items = createItems(5);
      const result = calculateReorderUpdates({
        id: 'item-5',
        oldPriority: 5,
        newPriority: 2,
        allItems: items,
      });

      expect(result).toHaveLength(4);
      expect(result.find((u) => u.id === 'item-2')?.priority).toBe(3);
      expect(result.find((u) => u.id === 'item-3')?.priority).toBe(4);
      expect(result.find((u) => u.id === 'item-4')?.priority).toBe(5);
      expect(result.find((u) => u.id === 'item-5')?.priority).toBe(2);
    });

    test('should calculate updates when moving down (2 -> 5)', () => {
      const items = createItems(5);
      const result = calculateReorderUpdates({
        id: 'item-2',
        oldPriority: 2,
        newPriority: 5,
        allItems: items,
      });

      expect(result).toHaveLength(4);
      expect(result.find((u) => u.id === 'item-3')?.priority).toBe(2);
      expect(result.find((u) => u.id === 'item-4')?.priority).toBe(3);
      expect(result.find((u) => u.id === 'item-5')?.priority).toBe(4);
      expect(result.find((u) => u.id === 'item-2')?.priority).toBe(5);
    });

    test('should handle move to first position (3 -> 1)', () => {
      const items = createItems(5);
      const result = calculateReorderUpdates({
        id: 'item-3',
        oldPriority: 3,
        newPriority: 1,
        allItems: items,
      });

      expect(result).toHaveLength(3);
      expect(result.find((u) => u.id === 'item-1')?.priority).toBe(2);
      expect(result.find((u) => u.id === 'item-2')?.priority).toBe(3);
      expect(result.find((u) => u.id === 'item-3')?.priority).toBe(1);
    });

    test('should handle move to last position (2 -> 5)', () => {
      const items = createItems(5);
      const result = calculateReorderUpdates({
        id: 'item-2',
        oldPriority: 2,
        newPriority: 5,
        allItems: items,
      });

      expect(result).toHaveLength(4);
      expect(result.find((u) => u.id === 'item-2')?.priority).toBe(5);
    });

    test('should handle single item', () => {
      const items: PriorityItem[] = [{ id: 'item-1', priority: 1 }];
      const result = calculateReorderUpdates({
        id: 'item-1',
        oldPriority: 1,
        newPriority: 1,
        allItems: items,
      });

      expect(result).toEqual([]);
    });
  });

  describe('getNextPriority', () => {
    test('should return 1 for empty array', () => {
      expect(getNextPriority([])).toBe(1);
    });

    test('should return 1 for undefined/null', () => {
      expect(getNextPriority(null as any)).toBe(1);
      expect(getNextPriority(undefined as any)).toBe(1);
    });

    test('should return MAX + 1', () => {
      const items: PriorityItem[] = [
        { id: '1', priority: 1 },
        { id: '2', priority: 5 },
        { id: '3', priority: 3 },
      ];
      expect(getNextPriority(items)).toBe(6);
    });

    test('should handle sequential priorities', () => {
      const items: PriorityItem[] = [
        { id: '1', priority: 1 },
        { id: '2', priority: 2 },
        { id: '3', priority: 3 },
      ];
      expect(getNextPriority(items)).toBe(4);
    });
  });

  describe('validatePriority', () => {
    test('should validate correct priority', () => {
      const result = validatePriority(5, 10);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject non-integer', () => {
      const result = validatePriority(1.5, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Приоритет должен быть целым числом');
    });

    test('should reject priority less than 1', () => {
      const result = validatePriority(0, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Приоритет должен быть не меньше 1');
    });

    test('should reject priority greater than total items', () => {
      const result = validatePriority(11, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Приоритет не может превышать общее количество записей (10)');
    });

    test('should accept minimum valid priority', () => {
      const result = validatePriority(1, 10);
      expect(result.valid).toBe(true);
    });

    test('should accept maximum valid priority', () => {
      const result = validatePriority(10, 10);
      expect(result.valid).toBe(true);
    });
  });

  describe('sortItemsByPriority', () => {
    test('should sort items by priority ascending', () => {
      const items: PriorityItem[] = [
        { id: '3', priority: 3 },
        { id: '1', priority: 1 },
        { id: '2', priority: 2 },
      ];
      const sorted = sortItemsByPriority(items);

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    test('should not modify original array', () => {
      const items: PriorityItem[] = [
        { id: '3', priority: 3 },
        { id: '1', priority: 1 },
      ];
      const sorted = sortItemsByPriority(items);

      expect(items[0].id).toBe('3');
      expect(sorted[0].id).toBe('1');
    });
  });

  describe('recalculateAllPriorities', () => {
    test('should return updates for items with gaps', () => {
      const items: PriorityItem[] = [
        { id: '1', priority: 1 },
        { id: '2', priority: 5 },
        { id: '3', priority: 10 },
      ];
      const updates = recalculateAllPriorities(items);

      expect(updates).toHaveLength(2);
      expect(updates.find((u) => u.id === '2')?.priority).toBe(2);
      expect(updates.find((u) => u.id === '3')?.priority).toBe(3);
    });

    test('should return empty array for sequential priorities', () => {
      const items: PriorityItem[] = [
        { id: '1', priority: 1 },
        { id: '2', priority: 2 },
        { id: '3', priority: 3 },
      ];
      const updates = recalculateAllPriorities(items);

      expect(updates).toHaveLength(0);
    });

    test('should handle empty array', () => {
      const updates = recalculateAllPriorities([]);
      expect(updates).toHaveLength(0);
    });
  });
});
