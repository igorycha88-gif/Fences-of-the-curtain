'use client';

import type { KpiValue } from '@/services/admin/businessMetricsService';

interface KPICardProps {
  label: string;
  kpi: KpiValue;
  formatValue?: (value: number) => string;
  invertColor?: boolean;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

export default function KPICard({ label, kpi, formatValue = formatNumber, invertColor = false }: KPICardProps) {
  const trendColor =
    kpi.trendDirection === 'neutral'
      ? 'text-gray-400'
      : kpi.trendDirection === 'up'
        ? invertColor ? 'text-red-600' : 'text-green-600'
        : invertColor ? 'text-green-600' : 'text-red-600';

  const trendIcon = kpi.trendDirection === 'up' ? '↗' : kpi.trendDirection === 'down' ? '↘' : '→';

  return (
    <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-5 shadow-md border" data-testid={`kpi-${label}`}>
      <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1 md:mb-2">{label}</h3>
      <p className="text-xl md:text-3xl font-bold text-gray-900">{formatValue(kpi.value)}</p>
      <p className={`text-xs md:text-sm mt-1 ${trendColor}`} data-testid="kpi-trend">
        {kpi.trend === null ? '—' : `${trendIcon} ${kpi.trend > 0 ? '+' : ''}${kpi.trend}%`}
        <span className="text-gray-400 ml-1">vs {formatValue(kpi.previousValue)}</span>
      </p>
    </div>
  );
}
