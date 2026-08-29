import { MetricsPeriod } from '@/services/admin/businessMetricsService';

const VALID_PERIODS: MetricsPeriod[] = ['day', 'week', 'month', 'quarter', 'year'];

export interface ParsedMetricsQuery {
  filters: {
    period: MetricsPeriod;
    dateFrom?: Date;
    dateTo?: Date;
    serviceType?: string;
    managerId?: string;
  };
}

export interface ParsedMetricsQueryError {
  error: string;
}

export function parseMetricsQuery(searchParams: URLSearchParams): ParsedMetricsQuery | ParsedMetricsQueryError {
  const periodParam = searchParams.get('period') || 'month';
  if (!VALID_PERIODS.includes(periodParam as MetricsPeriod)) {
    return { error: 'Недопустимое значение period' };
  }
  const dateFromParam = searchParams.get('dateFrom');
  const dateToParam = searchParams.get('dateTo');
  const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
  const dateTo = dateToParam ? new Date(dateToParam) : undefined;
  if (dateFromParam && (Number.isNaN(dateFrom!.getTime()) || dateFrom!.getTime() > Date.now() + 86400000)) {
    return { error: 'Недопустимое значение dateFrom' };
  }
  if (dateToParam && Number.isNaN(dateTo!.getTime())) {
    return { error: 'Недопустимое значение dateTo' };
  }
  return {
    filters: {
      period: periodParam as MetricsPeriod,
      dateFrom,
      dateTo,
      serviceType: searchParams.get('serviceType') || undefined,
      managerId: searchParams.get('managerId') || undefined,
    },
  };
}
