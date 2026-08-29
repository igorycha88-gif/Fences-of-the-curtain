'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BusinessMetrics, MetricsPeriod } from '@/services/admin/businessMetricsService';
import KPICard, { formatCurrency, formatNumber } from '@/components/admin/BusinessMetrics/KPICard';
import FunnelChart from '@/components/admin/BusinessMetrics/FunnelChart';
import TimelineChart from '@/components/admin/BusinessMetrics/TimelineChart';
import DonutChart from '@/components/admin/BusinessMetrics/DonutChart';
import BarList from '@/components/admin/BusinessMetrics/BarList';
import ManagersTable from '@/components/admin/BusinessMetrics/ManagersTable';
import MetricsFilters from '@/components/admin/BusinessMetrics/MetricsFilters';
import logger from '@/lib/logger';

function BusinessMetricsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = (searchParams.get('period') as MetricsPeriod) || 'month';
  const serviceType = searchParams.get('serviceType') || '';
  const managerId = searchParams.get('managerId') || '';

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('period', period);
    if (serviceType) params.set('serviceType', serviceType);
    if (managerId) params.set('managerId', managerId);
    return params.toString();
  }, [period, serviceType, managerId]);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/business-metrics?${queryString}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setMetrics(data as BusinessMetrics);
    } catch (err) {
      logger.error('BusinessMetrics page fetch failed', {
        module: 'admin/business-metrics',
        error: err instanceof Error ? err.message : String(err),
      });
      setError(err instanceof Error ? err.message : 'Не удалось загрузить метрики');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleFilterChange = (patch: { period?: MetricsPeriod; serviceType?: string; managerId?: string }) => {
    const params = new URLSearchParams();
    const nextPeriod = patch.period ?? period;
    const nextServiceType = patch.serviceType ?? serviceType;
    const nextManagerId = patch.managerId ?? managerId;
    params.set('period', nextPeriod);
    if (nextServiceType) params.set('serviceType', nextServiceType);
    if (nextManagerId) params.set('managerId', nextManagerId);
    router.replace(`/admin/business-metrics?${params.toString()}`, { scroll: false });
  };

  const serviceTypeOptions = (metrics?.serviceTypes || []).map((t) => ({ value: t.serviceType, label: t.label }));
  const managerOptions = (metrics?.managers || [])
    .filter((m) => m.id)
    .map((m) => ({ value: m.id!, label: m.name }));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 md:mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Бизнес-метрики</h1>
        <a
          href={`/api/admin/business-metrics/export?${queryString}`}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 inline-flex items-center min-h-[40px]"
          data-testid="export-button"
        >
          Экспорт в Excel
        </a>
      </div>

      <MetricsFilters
        value={{ period, serviceType, managerId }}
        serviceTypes={serviceTypeOptions}
        managers={managerOptions}
        onChange={handleFilterChange}
        onRefresh={fetchMetrics}
        loading={loading}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4" data-testid="metrics-error">
          {error}
        </div>
      )}

      {loading && !metrics ? (
        <div className="text-center py-12 text-gray-500" data-testid="metrics-loading">Загрузка...</div>
      ) : metrics ? (
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" data-testid="kpi-grid">
            <KPICard label="Всего заявок" kpi={metrics.kpi.totalOrders} />
            <KPICard label="В работе" kpi={metrics.kpi.inProgress} />
            <KPICard label="Завершено" kpi={metrics.kpi.completed} />
            <KPICard label="Отменено" kpi={metrics.kpi.cancelled} invertColor />
            <KPICard label="Конверсия, %" kpi={metrics.kpi.conversion} />
            <KPICard label="Средний чек" kpi={metrics.kpi.avgCheck} formatValue={formatCurrency} />
            <KPICard label="Выручка" kpi={metrics.kpi.revenue} formatValue={formatCurrency} />
            <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-5 shadow-md border">
              <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1 md:mb-2">Доля отмен</h3>
              <p className="text-xl md:text-3xl font-bold text-gray-900">{metrics.kpi.cancelledPercentage}%</p>
              <p className="text-xs md:text-sm mt-1 text-gray-400">от всех заявок периода</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <FunnelChart stages={metrics.funnel} />
            <TimelineChart timeline={metrics.timeline} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <DonutChart items={metrics.cancellationReasons} centerLabel="Причины отмен" />
            <BarList
              title="Типы услуг"
              testId="service-types"
              items={metrics.serviceTypes.map((t) => ({
                label: t.label,
                count: t.count,
                percentage: t.percentage,
                display: `${formatNumber(t.count)} · ${formatCurrency(t.revenue)}`,
              }))}
            />
          </div>

          <ManagersTable managers={metrics.managers} />

          <BarList
            title="Среднее время по статусам (дней)"
            testId="status-time"
            color="bg-orange-500"
            items={(() => {
              const maxAvg = Math.max(...metrics.avgTimeByStatus.map((s) => s.avgDays), 1);
              return metrics.avgTimeByStatus
                .filter((s) => s.ordersCount > 0)
                .map((s) => ({
                  label: s.label,
                  count: s.ordersCount,
                  percentage: Math.round((s.avgDays / maxAvg) * 1000) / 10,
                  display: `${s.avgDays} дн.`,
                }));
            })()}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function BusinessMetricsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Загрузка...</div>}>
      <BusinessMetricsPageContent />
    </Suspense>
  );
}
