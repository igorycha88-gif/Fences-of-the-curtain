'use client';

import type { MetricsPeriod } from '@/services/admin/businessMetricsService';

export interface MetricsFilterState {
  period: MetricsPeriod;
  serviceType: string;
  managerId: string;
}

interface MetricsFiltersProps {
  value: MetricsFilterState;
  serviceTypes: { value: string; label: string }[];
  managers: { value: string; label: string }[];
  onChange: (patch: Partial<MetricsFilterState>) => void;
  onRefresh: () => void;
  loading: boolean;
}

const PERIOD_OPTIONS: { value: MetricsPeriod; label: string }[] = [
  { value: 'day', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
];

export default function MetricsFilters({ value, serviceTypes, managers, onChange, onRefresh, loading }: MetricsFiltersProps) {
  const selectClass =
    'border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px]';

  return (
    <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-md border flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6" data-testid="metrics-filters">
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <span className="whitespace-nowrap">Период:</span>
        <select
          value={value.period}
          onChange={(e) => onChange({ period: e.target.value as MetricsPeriod })}
          className={selectClass}
          aria-label="Период"
          data-testid="filter-period"
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <span className="whitespace-nowrap">Тип услуги:</span>
        <select
          value={value.serviceType}
          onChange={(e) => onChange({ serviceType: e.target.value })}
          className={selectClass}
          aria-label="Тип услуги"
          data-testid="filter-service-type"
        >
          <option value="">Все</option>
          {serviceTypes.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <span className="whitespace-nowrap">Менеджер:</span>
        <select
          value={value.managerId}
          onChange={(e) => onChange({ managerId: e.target.value })}
          className={selectClass}
          aria-label="Менеджер"
          data-testid="filter-manager"
        >
          <option value="">Все</option>
          {managers.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="ml-auto px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
        data-testid="filter-refresh"
      >
        {loading ? 'Загрузка...' : 'Обновить'}
      </button>
    </div>
  );
}
