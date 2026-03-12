'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandle } from './DragHandle';
import toast from 'react-hot-toast';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  isDragging?: boolean;
}

function SortableItem({ id, children, isDragging }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className={isSortableDragging ? 'bg-blue-50' : ''}>
      <td className="w-10 px-2 py-2">
        <div {...attributes} {...listeners}>
          <DragHandle isDragging={isSortableDragging} />
        </div>
      </td>
      {children}
    </tr>
  );
}

interface PriorityItem {
  id: string;
  priority: number;
  [key: string]: any;
}

interface ReorderableTableProps<T extends PriorityItem> {
  data: T[];
  entityType: string;
  onReorderSuccess?: () => void;
  children: (props: { item: T; index: number }) => React.ReactNode;
  columns: React.ReactNode;
  keyExtractor?: (item: T) => string;
}

export function ReorderableTable<T extends PriorityItem>({
  data,
  entityType,
  onReorderSuccess,
  children,
  columns,
  keyExtractor = (item) => item.id,
}: ReorderableTableProps<T>) {
  const [items, setItems] = useState(data);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  useMemo(() => {
    setItems(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        setActiveId(null);
        return;
      }

      const oldIndex = items.findIndex((item) => keyExtractor(item) === active.id);
      const newIndex = items.findIndex((item) => keyExtractor(item) === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        setActiveId(null);
        return;
      }

      const newItems = arrayMove(items, oldIndex, newIndex);
      const movedItem = newItems[newIndex];

      setItems(newItems);
      setActiveId(null);

      setIsReordering(true);

      try {
        const response = await fetch(`/api/admin/${entityType}/reorder`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: movedItem.id,
            newPriority: newIndex + 1,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Ошибка изменения порядка');
        }

        toast.success('Порядок успешно изменён');
        onReorderSuccess?.();
      } catch (error: any) {
        console.error('[REORDER] Error:', error);
        toast.error(error.message || 'Ошибка изменения порядка');
        setItems(data);
      } finally {
        setIsReordering(false);
      }
    },
    [items, data, entityType, keyExtractor, onReorderSuccess]
  );

  const activeItem = activeId ? items.find((item) => keyExtractor(item) === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-10 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              
            </th>
            {columns}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <SortableContext
            items={items.map((item) => keyExtractor(item))}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item, index) => (
              <SortableItem key={keyExtractor(item)} id={keyExtractor(item)}>
                {children({ item, index })}
              </SortableItem>
            ))}
          </SortableContext>
        </tbody>
      </table>

      <DragOverlay>
        {activeItem ? (
          <table className="w-full">
            <tbody>
              <tr className="bg-blue-100 shadow-lg rounded">
                <td className="w-10 px-2 py-2">
                  <DragHandle isDragging />
                </td>
                {children({ item: activeItem, index: 0 })}
              </tr>
            </tbody>
          </table>
        ) : null}
      </DragOverlay>

      {isReordering && (
        <div className="fixed inset-0 bg-black bg-opacity-10 pointer-events-none z-40" />
      )}
    </DndContext>
  );
}
