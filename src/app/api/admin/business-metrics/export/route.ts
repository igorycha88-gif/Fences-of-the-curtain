import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireAdmin } from '@/lib/admin-auth';
import { businessMetricsService, BusinessMetrics } from '@/services/admin/businessMetricsService';
import { parseMetricsQuery } from '@/lib/validators/businessMetrics';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

function buildWorkbook(metrics: BusinessMetrics): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const kpiRows = [
    { Метрика: 'Всего заявок', Значение: metrics.kpi.totalOrders.value, 'Прошлый период': metrics.kpi.totalOrders.previousValue, 'Тренд %': metrics.kpi.totalOrders.trend },
    { Метрика: 'В работе', Значение: metrics.kpi.inProgress.value, 'Прошлый период': metrics.kpi.inProgress.previousValue, 'Тренд %': metrics.kpi.inProgress.trend },
    { Метрика: 'Завершено', Значение: metrics.kpi.completed.value, 'Прошлый период': metrics.kpi.completed.previousValue, 'Тренд %': metrics.kpi.completed.trend },
    { Метрика: 'Отменено', Значение: metrics.kpi.cancelled.value, 'Прошлый период': metrics.kpi.cancelled.previousValue, 'Тренд %': metrics.kpi.cancelled.trend },
    { Метрика: 'Отменено %', Значение: metrics.kpi.cancelledPercentage },
    { Метрика: 'Конверсия %', Значение: metrics.kpi.conversion.value, 'Прошлый период': metrics.kpi.conversion.previousValue, 'Тренд %': metrics.kpi.conversion.trend },
    { Метрика: 'Средний чек', Значение: metrics.kpi.avgCheck.value, 'Прошлый период': metrics.kpi.avgCheck.previousValue, 'Тренд %': metrics.kpi.avgCheck.trend },
    { Метрика: 'Выручка', Значение: metrics.kpi.revenue.value, 'Прошлый период': metrics.kpi.revenue.previousValue, 'Тренд %': metrics.kpi.revenue.trend },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiRows), 'Сводка KPI');

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(metrics.funnel.map((s) => ({
      Статус: s.label,
      'Кол-во': s.count,
      '% от общего': s.percentage,
      'Конверсия шага %': s.stepConversion,
    }))),
    'Воронка'
  );

  const timelineRows = metrics.timeline.keys.map((key, i) => ({
    Период: key,
    'Новые заявки': metrics.timeline.new[i],
    Завершенные: metrics.timeline.completed[i],
    Отмененные: metrics.timeline.cancelled[i],
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(timelineRows), 'Динамика');

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(metrics.cancellationReasons.map((r) => ({
      Причина: r.label,
      'Кол-во': r.count,
      '%': r.percentage,
    }))),
    'Причины отмен'
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(metrics.serviceTypes.map((t) => ({
      'Тип услуги': t.label,
      'Кол-во': t.count,
      '%': t.percentage,
      Выручка: t.revenue,
    }))),
    'Типы услуг'
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(metrics.managers.map((m) => ({
      Менеджер: m.name,
      Заявок: m.total,
      'В работе': m.inProgress,
      Завершено: m.completed,
      Отменено: m.cancelled,
      'Конверсия %': m.conversion,
      'Ср. чек': m.avgCheck,
      Выручка: m.revenue,
    }))),
    'Менеджеры'
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(metrics.avgTimeByStatus.map((s) => ({
      Статус: s.label,
      'Среднее время (дней)': s.avgDays,
      'Кол-во заявок': s.ordersCount,
    }))),
    'Время по статусам'
  );

  return wb;
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const authResult = await requireAdmin(request, 'statistics');
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult.session.userId;

    logger.info('BusinessMetrics export request', {
      module: 'api/admin/business-metrics/export',
      method: request.method,
      path: request.nextUrl.pathname,
      userId,
      query: request.nextUrl.searchParams.toString(),
    });

    const parsed = parseMetricsQuery(request.nextUrl.searchParams);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const metrics = await businessMetricsService.getBusinessMetrics(parsed.filters);
    const wb = buildWorkbook(metrics);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    logger.info('BusinessMetrics export response', {
      module: 'api/admin/business-metrics/export',
      method: request.method,
      path: request.nextUrl.pathname,
      userId,
      status: 200,
      duration: Date.now() - startedAt,
      sizeBytes: buffer.length,
    });

    const fileName = `business-metrics-${metrics.period}-${new Date().toISOString().split('T')[0]}.xlsx`;
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    logger.error('BusinessMetrics export error', {
      module: 'api/admin/business-metrics/export',
      method: request.method,
      path: request.nextUrl.pathname,
      status: 500,
      duration: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
