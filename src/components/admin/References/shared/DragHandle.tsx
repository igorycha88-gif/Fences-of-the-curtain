'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DragHandleProps {
  className?: string;
  isDragging?: boolean;
}

export function DragHandle({ className, isDragging }: DragHandleProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center w-10 h-10 cursor-grab active:cursor-grabbing',
        'text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded',
        'transition-colors duration-150',
        isDragging && 'text-blue-500 bg-blue-50',
        className
      )}
      title="Перетащите для изменения порядка"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="rotate-90"
      >
        <circle cx="5" cy="4" r="1.5" />
        <circle cx="10" cy="4" r="1.5" />
        <circle cx="15" cy="4" r="1.5" />
        <circle cx="5" cy="10" r="1.5" />
        <circle cx="10" cy="10" r="1.5" />
        <circle cx="15" cy="10" r="1.5" />
        <circle cx="5" cy="16" r="1.5" />
        <circle cx="10" cy="16" r="1.5" />
        <circle cx="15" cy="16" r="1.5" />
      </svg>
    </div>
  );
}
