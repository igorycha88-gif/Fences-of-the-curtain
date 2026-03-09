'use client';

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

interface ColumnHeaderWithTooltipProps {
  title: string;
  tooltip: string;
}

export function ColumnHeaderWithTooltip({ title, tooltip }: ColumnHeaderWithTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={500}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            <span>{title}</span>
            <Info className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="px-3 py-2 text-xs text-white bg-gray-800 rounded shadow-lg max-w-xs z-50"
            sideOffset={5}
          >
            {tooltip}
            <Tooltip.Arrow className="fill-gray-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
