'use client';

interface DonutItem {
  label: string;
  count: number;
  percentage: number;
}

const COLORS = ['#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#10B981', '#6B7280'];

export default function DonutChart({ items, centerLabel }: { items: DonutItem[]; centerLabel: string }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  let cumulative = 0;
  const gradientStops = items.map((item, index) => {
    const from = cumulative;
    cumulative += item.percentage;
    const color = COLORS[index % COLORS.length];
    return `${color} ${from}% ${cumulative}%`;
  });

  return (
    <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-md border" data-testid="donut-chart">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">{centerLabel}</h2>
      {total === 0 ? (
        <p className="text-gray-500 text-sm py-6 text-center" data-testid="donut-empty">Нет отмен за период</p>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-36 h-36 flex-shrink-0">
            <div
              className="w-full h-full rounded-full"
              style={{ background: `conic-gradient(${gradientStops.join(', ')})` }}
              data-testid="donut-gradient"
            />
            <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-xs text-gray-500">всего</p>
              </div>
            </div>
          </div>
          <ul className="flex-1 w-full space-y-2">
            {items.map((item, index) => (
              <li key={item.label} className="flex items-center justify-between text-sm gap-2">
                <span className="flex items-center gap-2 text-gray-700 min-w-0">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0 inline-block"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="text-gray-500 flex-shrink-0">
                  {item.count} ({item.percentage}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
