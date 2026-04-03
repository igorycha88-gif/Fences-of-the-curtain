'use client';

import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export function MobileHeader({ onMenuClick, title }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-3 md:hidden">
      <button
        onClick={onMenuClick}
        className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <Menu className="w-5 h-5" />
      </button>
      {title && (
        <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
      )}
    </header>
  );
}
