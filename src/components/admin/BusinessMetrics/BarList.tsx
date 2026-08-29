'use client';

interface BarItem {
  label: string;
  display: string;
  count: number;
  percentage: number;
}

export default function BarList({ title, items, color = 'bg-blue-500', testId }: { title: string; items: BarItem[]; color?: string; testId: string }) {
  return (
    <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-md border" data-testid={testId}>
      <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {items.length === 0 || items.every((i) => i.count === 0) ? (
        <p className="text-gray-500 text-sm py-6 text-center" data-testid={`${testId}-empty`}>Нет данных за период</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs md:text-sm mb-1">
                <span className="font-medium text-gray-700 truncate">{item.label}</span>
                <span className="text-gray-500 flex-shrink-0 ml-2">
                  {item.display} ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 md:h-4">
                <div
                  className={`${color} h-3 md:h-4 rounded-full transition-all duration-500 min-w-[2px]`}
                  style={{ width: `${Math.max(item.percentage, 0.5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
