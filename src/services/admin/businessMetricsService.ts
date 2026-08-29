import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import logger from '@/lib/logger';
import { STATUS_LABELS, CANCELLATION_REASON_LABELS } from '@/lib/validators/order';

export type MetricsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';
type Granularity = 'day' | 'week' | 'month';

const IN_PROGRESS_STATUSES = ['ESTIMATE_APPROVAL', 'MEASUREMENT', 'PRODUCTION', 'INSTALLATION'] as const;
const FUNNEL_STATUSES = [
  'NEW',
  'ESTIMATE_APPROVAL',
  'MEASUREMENT',
  'PRODUCTION',
  'INSTALLATION',
  'COMPLETED',
] as const;

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  fence: 'Заборы',
  gates: 'Ворота и калитки',
  canopy: 'Навесы',
  INDIVIDUAL_CALCULATION: 'Индивидуальный расчёт',
};

export interface BusinessMetricsFilters {
  period?: MetricsPeriod;
  dateFrom?: Date;
  dateTo?: Date;
  serviceType?: string;
  managerId?: string;
}

export interface KpiValue {
  value: number;
  previousValue: number;
  trend: number | null;
  trendDirection: 'up' | 'down' | 'neutral';
}

export interface KpiBlock {
  totalOrders: KpiValue;
  inProgress: KpiValue;
  completed: KpiValue;
  cancelled: KpiValue;
  cancelledPercentage: number;
  conversion: KpiValue;
  avgCheck: KpiValue;
  revenue: KpiValue;
}

export interface FunnelStage {
  status: string;
  label: string;
  count: number;
  percentage: number;
  stepConversion: number | null;
}

export interface TimelineData {
  granularity: Granularity;
  keys: string[];
  new: number[];
  completed: number[];
  cancelled: number[];
}

export interface CancellationReasonStat {
  reason: string;
  label: string;
  count: number;
  percentage: number;
}

export interface ServiceTypeStat {
  serviceType: string;
  label: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface ManagerStat {
  id: string | null;
  name: string;
  total: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  conversion: number;
  avgCheck: number;
  revenue: number;
}

export interface StatusTimeStat {
  status: string;
  label: string;
  avgDays: number;
  ordersCount: number;
}

export interface PhoneClicksData {
  total: number;
  previousTotal: number;
  trend: number | null;
  trendDirection: 'up' | 'down' | 'neutral';
  byDay: { date: string; count: number }[];
}

export interface VisitorGeoStat {
  city: string;
  count: number;
  percentage: number;
}

export interface BusinessMetrics {
  period: MetricsPeriod;
  range: { from: string; to: string };
  kpi: KpiBlock;
  funnel: FunnelStage[];
  timeline: TimelineData;
  cancellationReasons: CancellationReasonStat[];
  serviceTypes: ServiceTypeStat[];
  managers: ManagerStat[];
  avgTimeByStatus: StatusTimeStat[];
  phoneClicks: PhoneClicksData;
  visitorGeo: VisitorGeoStat[];
}

interface StatusHistoryEntry {
  status?: string;
  changedAt?: string;
}

interface MetricsOrder {
  status: string;
  calculatedCost: number;
  serviceType: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  completionDate: Date | null;
  cancellationReason: string | null;
  statusHistory: unknown;
}

const MS_PER_DAY = 86400000;

export class BusinessMetricsService {
  async getBusinessMetrics(filters: BusinessMetricsFilters): Promise<BusinessMetrics> {
    const period = filters.period || 'month';
    logger.info('BusinessMetrics calculation started', {
      module: 'businessMetricsService',
      operation: 'getBusinessMetrics',
      period,
      serviceType: filters.serviceType,
      managerId: filters.managerId,
    });

    try {
      const end = filters.dateTo || new Date();
      const start = filters.dateFrom || this.getStartDate(period);
      const duration = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime());
      const prevStart = new Date(start.getTime() - duration);

      const whereCurrent = this.buildWhere(start, end, filters);
      const wherePrevious = this.buildWhere(prevStart, prevEnd, filters);

      const [orders, previousOrders] = await Promise.all([
        prisma.order.findMany({
          where: whereCurrent,
          select: {
            status: true,
            calculatedCost: true,
            serviceType: true,
            assignedTo: true,
            createdAt: true,
            updatedAt: true,
            completionDate: true,
            cancellationReason: true,
            statusHistory: true,
          },
        }),
        prisma.order.findMany({
          where: wherePrevious,
          select: {
            status: true,
            calculatedCost: true,
          },
        }),
      ]);

      const kpi = this.buildKpi(orders as MetricsOrder[], previousOrders);
      const funnel = this.buildFunnel(orders as MetricsOrder[]);
      const timeline = this.buildTimeline(orders as MetricsOrder[], start, end, period);
      const cancellationReasons = this.buildCancellationReasons(orders as MetricsOrder[]);
      const serviceTypes = this.buildServiceTypes(orders as MetricsOrder[]);
      const managers = await this.buildManagers(orders as MetricsOrder[]);
      const avgTimeByStatus = this.buildAvgTimeByStatus(orders as MetricsOrder[], end);
      const phoneClicks = await this.buildPhoneClicks(start, end, prevStart, prevEnd).catch((error) => {
        logger.error('PhoneClicks collection failed', {
          module: 'businessMetricsService',
          operation: 'buildPhoneClicks',
          error: error instanceof Error ? error.message : String(error),
        });
        return { total: 0, previousTotal: 0, trend: null, trendDirection: 'neutral' as const, byDay: [] };
      });
      const visitorGeo = await this.buildVisitorGeo(start, end).catch((error) => {
        logger.error('VisitorGeo collection failed', {
          module: 'businessMetricsService',
          operation: 'buildVisitorGeo',
          error: error instanceof Error ? error.message : String(error),
        });
        return [] as VisitorGeoStat[];
      });

      logger.info('BusinessMetrics calculation completed', {
        module: 'businessMetricsService',
        operation: 'getBusinessMetrics',
        period,
        ordersCount: orders.length,
        phoneClicksTotal: phoneClicks.total,
        visitorGeoCities: visitorGeo.length,
      });

      return {
        period,
        range: { from: start.toISOString(), to: end.toISOString() },
        kpi,
        funnel,
        timeline,
        cancellationReasons,
        serviceTypes,
        managers,
        avgTimeByStatus,
        phoneClicks,
        visitorGeo,
      };
    } catch (error) {
      logger.error('BusinessMetrics calculation failed', {
        module: 'businessMetricsService',
        operation: 'getBusinessMetrics',
        error: error instanceof Error ? error.message : String(error),
        period,
      });
      throw error;
    }
  }

  private buildWhere(start: Date, end: Date, filters: BusinessMetricsFilters) {
    const where: {
      createdAt: { gte: Date; lt: Date };
      serviceType?: string;
      assignedTo?: string;
    } = { createdAt: { gte: start, lt: end } };
    if (filters.serviceType) where.serviceType = filters.serviceType;
    if (filters.managerId) where.assignedTo = filters.managerId;
    return where;
  }

  private buildKpi(orders: MetricsOrder[], previousOrders: { status: string; calculatedCost: number }[]): KpiBlock {
    const completed = orders.filter((o) => o.status === 'COMPLETED');
    const cancelled = orders.filter((o) => o.status === 'CANCELLED');
    const inProgress = orders.filter((o) => IN_PROGRESS_STATUSES.includes(o.status as any));
    const revenue = completed.reduce((sum, o) => sum + o.calculatedCost, 0);
    const avgCheck = completed.length > 0 ? revenue / completed.length : 0;
    const conversion = orders.length > 0 ? (completed.length / orders.length) * 100 : 0;

    const prevCompleted = previousOrders.filter((o) => o.status === 'COMPLETED');
    const prevCancelled = previousOrders.filter((o) => o.status === 'CANCELLED');
    const prevInProgress = previousOrders.filter((o) => IN_PROGRESS_STATUSES.includes(o.status as any));
    const prevRevenue = prevCompleted.reduce((sum, o) => sum + o.calculatedCost, 0);
    const prevAvgCheck = prevCompleted.length > 0 ? prevRevenue / prevCompleted.length : 0;
    const prevConversion = previousOrders.length > 0 ? (prevCompleted.length / previousOrders.length) * 100 : 0;

    return {
      totalOrders: this.makeKpi(orders.length, previousOrders.length),
      inProgress: this.makeKpi(inProgress.length, prevInProgress.length),
      completed: this.makeKpi(completed.length, prevCompleted.length),
      cancelled: this.makeKpi(cancelled.length, prevCancelled.length),
      cancelledPercentage: orders.length > 0 ? this.round(cancelled.length / orders.length * 100, 1) : 0,
      conversion: this.makeKpi(this.round(conversion, 1), this.round(prevConversion, 1)),
      avgCheck: this.makeKpi(Math.round(avgCheck), Math.round(prevAvgCheck)),
      revenue: this.makeKpi(Math.round(revenue), Math.round(prevRevenue)),
    };
  }

  private makeKpi(value: number, previousValue: number): KpiValue {
    let trend: number | null;
    if (previousValue > 0) {
      trend = this.round(((value - previousValue) / previousValue) * 100, 1);
    } else {
      trend = value > 0 ? 100 : null;
    }
    return {
      value,
      previousValue,
      trend,
      trendDirection: trend === null || trend === 0 ? 'neutral' : trend > 0 ? 'up' : 'down',
    };
  }

  private buildFunnel(orders: MetricsOrder[]): FunnelStage[] {
    const reachedCounts: Record<string, number> = {};
    for (const order of orders) {
      for (const status of this.getReachedStatuses(order)) {
        reachedCounts[status] = (reachedCounts[status] || 0) + 1;
      }
    }
    const total = orders.length;
    let prevCount = 0;
    return FUNNEL_STATUSES.map((status) => {
      const count = reachedCounts[status] || 0;
      const stage: FunnelStage = {
        status,
        label: STATUS_LABELS[status] || status,
        count,
        percentage: total > 0 ? this.round((count / total) * 100, 1) : 0,
        stepConversion: prevCount > 0 ? this.round((count / prevCount) * 100, 1) : null,
      };
      prevCount = count;
      return stage;
    });
  }

  private getReachedStatuses(order: MetricsOrder): Set<string> {
    const reached = new Set<string>(['NEW']);
    const history = this.getHistory(order);
    for (const entry of history) {
      if (entry.status) reached.add(entry.status);
    }
    reached.add(order.status);
    return reached;
  }

  private getHistory(order: MetricsOrder): StatusHistoryEntry[] {
    const raw = Array.isArray(order.statusHistory) ? (order.statusHistory as StatusHistoryEntry[]) : [];
    return raw
      .filter((e) => e && e.status && e.changedAt)
      .sort((a, b) => new Date(a.changedAt!).getTime() - new Date(b.changedAt!).getTime());
  }

  private buildTimeline(orders: MetricsOrder[], start: Date, end: Date, period: MetricsPeriod): TimelineData {
    const granularity: Granularity = period === 'year' ? 'month' : period === 'quarter' ? 'week' : 'day';
    const keys = this.listBucketKeys(start, end, granularity);
    const index = new Map(keys.map((k, i) => [k, i]));
    const series = { new: new Array(keys.length).fill(0), completed: new Array(keys.length).fill(0), cancelled: new Array(keys.length).fill(0) };

    for (const order of orders) {
      const newKey = this.getBucketKey(order.createdAt, granularity);
      const ni = index.get(newKey);
      if (ni !== undefined) series.new[ni] += 1;

      const completedDate = order.completionDate ?? (order.status === 'COMPLETED' ? order.updatedAt : null);
      if (completedDate) {
        const ck = this.getBucketKey(completedDate, granularity);
        const ci = index.get(ck);
        if (ci !== undefined) series.completed[ci] += 1;
      }

      const cancelledDate = this.getCancelledDate(order);
      if (cancelledDate) {
        const xk = this.getBucketKey(cancelledDate, granularity);
        const xi = index.get(xk);
        if (xi !== undefined) series.cancelled[xi] += 1;
      }
    }

    return { granularity, keys, ...series };
  }

  private getCancelledDate(order: MetricsOrder): Date | null {
    const entry = this.getHistory(order).find((e) => e.status === 'CANCELLED');
    if (entry?.changedAt) return new Date(entry.changedAt);
    return order.status === 'CANCELLED' ? order.updatedAt : null;
  }

  private listBucketKeys(start: Date, end: Date, granularity: Granularity): string[] {
    const keys: string[] = [];
    if (granularity === 'month') {
      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
      while (cursor <= end) {
        keys.push(this.getBucketKey(cursor, 'month'));
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
    } else {
      const cursor = new Date(start);
      while (cursor <= end) {
        keys.push(this.getBucketKey(cursor, granularity));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
    return keys.length > 0 ? Array.from(new Set(keys)) : [this.getBucketKey(start, granularity)];
  }

  private getBucketKey(date: Date, granularity: Granularity): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    if (granularity === 'month') return `${y}-${m}`;
    if (granularity === 'week') {
      const day = date.getUTCDay();
      const monday = new Date(date);
      monday.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
      return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}-${String(monday.getUTCDate()).padStart(2, '0')}`;
    }
    return `${y}-${m}-${d}`;
  }

  private buildCancellationReasons(orders: MetricsOrder[]): CancellationReasonStat[] {
    const cancelled = orders.filter((o) => o.status === 'CANCELLED');
    const grouped: Record<string, number> = {};
    for (const order of cancelled) {
      const reason = order.cancellationReason || 'OTHER';
      grouped[reason] = (grouped[reason] || 0) + 1;
    }
    const total = cancelled.length;
    return Object.entries(grouped)
      .map(([reason, count]) => ({
        reason,
        label: CANCELLATION_REASON_LABELS[reason] || reason,
        count,
        percentage: total > 0 ? this.round((count / total) * 100, 1) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private buildServiceTypes(orders: MetricsOrder[]): ServiceTypeStat[] {
    const grouped: Record<string, { count: number; revenue: number }> = {};
    for (const order of orders) {
      const bucket = grouped[order.serviceType] || { count: 0, revenue: 0 };
      bucket.count += 1;
      if (order.status === 'COMPLETED') bucket.revenue += order.calculatedCost;
      grouped[order.serviceType] = bucket;
    }
    const total = orders.length;
    return Object.entries(grouped)
      .map(([serviceType, bucket]) => ({
        serviceType,
        label: SERVICE_TYPE_LABELS[serviceType] || serviceType,
        count: bucket.count,
        percentage: total > 0 ? this.round((bucket.count / total) * 100, 1) : 0,
        revenue: Math.round(bucket.revenue),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private async buildManagers(orders: MetricsOrder[]): Promise<ManagerStat[]> {
    const grouped = new Map<string | null, MetricsOrder[]>();
    for (const order of orders) {
      const list = grouped.get(order.assignedTo) || [];
      list.push(order);
      grouped.set(order.assignedTo, list);
    }

    const ids = Array.from(grouped.keys()).filter((id): id is string => id !== null);
    const users = ids.length > 0
      ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(users.map((u) => [u.id, u.name]));

    const stats: ManagerStat[] = [];
    for (const [id, list] of grouped) {
      const completed = list.filter((o) => o.status === 'COMPLETED');
      const revenue = completed.reduce((sum, o) => sum + o.calculatedCost, 0);
      stats.push({
        id,
        name: (id ? nameById.get(id) : null) || 'Не назначен',
        total: list.length,
        inProgress: list.filter((o) => IN_PROGRESS_STATUSES.includes(o.status as any)).length,
        completed: completed.length,
        cancelled: list.filter((o) => o.status === 'CANCELLED').length,
        conversion: list.length > 0 ? this.round((completed.length / list.length) * 100, 1) : 0,
        avgCheck: completed.length > 0 ? Math.round(revenue / completed.length) : 0,
        revenue: Math.round(revenue),
      });
    }
    return stats.sort((a, b) => b.revenue - a.revenue);
  }

  private buildAvgTimeByStatus(orders: MetricsOrder[], end: Date): StatusTimeStat[] {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const order of orders) {
      const history = this.getHistory(order);
      if (history.length === 0) {
        if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
          const duration = end.getTime() - new Date(order.createdAt).getTime();
          sums[order.status] = (sums[order.status] || 0) + Math.max(duration, 0);
          counts[order.status] = (counts[order.status] || 0) + 1;
        }
        continue;
      }
      for (let i = 0; i < history.length; i++) {
        const from = new Date(history[i].changedAt!).getTime();
        let to: number;
        if (i + 1 < history.length) {
          to = new Date(history[i + 1].changedAt!).getTime();
        } else if (history[i].status === order.status) {
          to = order.status === 'COMPLETED' || order.status === 'CANCELLED' ? from : end.getTime();
        } else {
          to = from;
        }
        sums[history[i].status!] = (sums[history[i].status!] || 0) + Math.max(to - from, 0);
        counts[history[i].status!] = (counts[history[i].status!] || 0) + 1;
      }
    }

    return [...FUNNEL_STATUSES, 'CANCELLED']
      .map((status) => ({
        status,
        label: STATUS_LABELS[status] || status,
        avgDays: counts[status] ? this.round(sums[status] / counts[status] / MS_PER_DAY, 1) : 0,
        ordersCount: counts[status] || 0,
      }));
  }

  private listMoscowDates(start: Date, end: Date): string[] {
    if (end.getTime() < start.getTime()) return [];
    const dates: string[] = [];
    const cursor = new Date(start.getTime());
    while (cursor.getTime() <= end.getTime()) {
      dates.push(cursor.toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' }));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return Array.from(new Set(dates));
  }

  private async buildPhoneClicks(start: Date, end: Date, prevStart: Date, prevEnd: Date): Promise<PhoneClicksData> {
    const currentDates = this.listMoscowDates(start, end);
    const previousDates = this.listMoscowDates(prevStart, prevEnd);
    const dates = Array.from(new Set([...currentDates, ...previousDates]));

    const pipeline = redis.pipeline();
    for (const date of dates) {
      pipeline.hget(`analytics:daily:${date}`, 'phone_click');
    }
    const results = await pipeline.exec();

    const countByDate = new Map<string, number>();
    dates.forEach((date, index) => {
      const result = results?.[index];
      const raw = result && !result[0] ? result[1] : null;
      const value = typeof raw === 'string' ? parseInt(raw, 10) : 0;
      countByDate.set(date, Number.isFinite(value) && value > 0 ? value : 0);
    });

    const total = currentDates.reduce((sum, date) => sum + (countByDate.get(date) || 0), 0);
    const previousTotal = previousDates.reduce((sum, date) => sum + (countByDate.get(date) || 0), 0);
    const kpi = this.makeKpi(total, previousTotal);

    return {
      total,
      previousTotal,
      trend: kpi.trend,
      trendDirection: kpi.trendDirection,
      byDay: currentDates.map((date) => ({ date, count: countByDate.get(date) || 0 })),
    };
  }

  private async buildVisitorGeo(start: Date, end: Date): Promise<VisitorGeoStat[]> {
    const dates = this.listMoscowDates(start, end);
    if (dates.length === 0) return [];

    const pipeline = redis.pipeline();
    for (const date of dates) {
      pipeline.hgetall(`analytics:geo:daily:${date}`);
    }
    const results = await pipeline.exec();

    const totals = new Map<string, number>();
    dates.forEach((_, index) => {
      const result = results?.[index];
      const data = result && !result[0] ? (result[1] as Record<string, string> | null) : null;
      if (!data) return;
      for (const [city, rawValue] of Object.entries(data)) {
        const value = parseInt(rawValue, 10);
        if (!Number.isFinite(value) || value <= 0 || !city) continue;
        totals.set(city, (totals.get(city) || 0) + value);
      }
    });

    const sum = [...totals.values()].reduce((acc, value) => acc + value, 0);
    return [...totals.entries()]
      .map(([city, count]) => ({
        city,
        count,
        percentage: sum > 0 ? this.round((count / sum) * 100, 1) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private round(value: number, digits: number): number {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  private getStartDate(period: MetricsPeriod): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week': {
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(now.getFullYear(), now.getMonth(), diff);
      }
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      }
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      case 'month':
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
}

export const businessMetricsService = new BusinessMetricsService();
