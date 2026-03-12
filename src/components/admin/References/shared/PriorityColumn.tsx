'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriorityColumnProps {
  value: number;
  totalItems: number;
  onChange: (newPriority: number) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function PriorityColumn({
  value,
  totalItems,
  onChange,
  disabled = false,
  className,
}: PriorityColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  const handleDoubleClick = () => {
    if (!disabled) {
      setIsEditing(true);
      setEditValue(value.toString());
      setError(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value.toString());
    setError(null);
  };

  const handleSubmit = useCallback(async () => {
    const newPriority = parseInt(editValue, 10);

    if (isNaN(newPriority)) {
      setError('Введите число');
      return;
    }

    if (newPriority < 1) {
      setError('Мин. значение: 1');
      return;
    }

    if (newPriority > totalItems) {
      setError(`Макс. значение: ${totalItems}`);
      return;
    }

    if (newPriority === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onChange(newPriority);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setIsLoading(false);
    }
  }, [editValue, totalItems, value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn('flex flex-col items-center', className)}>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-16 h-8 text-center border rounded px-2"
            min={1}
            max={totalItems}
            autoFocus
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && (
          <span className="text-xs text-red-500 mt-1">{error}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        !disabled && 'cursor-pointer hover:bg-gray-50 rounded px-2 py-1',
        className
      )}
      onDoubleClick={handleDoubleClick}
      title={!disabled ? 'Двойной клик для редактирования' : undefined}
    >
      <span className="font-medium">{value}</span>
    </div>
  );
}
