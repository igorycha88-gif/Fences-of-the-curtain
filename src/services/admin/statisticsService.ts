import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const IN_PROGRESS_STATUSES = ['ESTIMATE_APPROVAL', 'MEASUREMENT', 'PRODUCTION', 'INSTALLATION'] as const;

export class StatisticsService {
  async getDashboardStats(period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const now = new Date();
    const startDate = this.getStartDate(period);

    const [
      newOrders,
      ordersInProgress,
      completedOrders,
      totalOrders,
      calculations,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          status: 'NEW',
          createdAt: { gte: startDate },
        },
      }),
      prisma.order.count({
        where: {
          status: { in: [...IN_PROGRESS_STATUSES] },
        },
      }),
      prisma.order.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
          status: { in: ['NEW', ...IN_PROGRESS_STATUSES, 'COMPLETED'] },
        },
      }),
    ]);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        calculatedCost: true,
        createdAt: true,
        serviceType: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.calculatedCost, 0);
    const averageOrderCost = orders.length > 0 ? totalRevenue / orders.length : 0;

    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      newOrders,
      ordersInProgress,
      completedOrders,
      totalOrders,
      averageOrderCost: Math.round(averageOrderCost),
      totalRevenue,
      conversionRate: Math.round(conversionRate * 10) / 10,
      period,
      startDate,
      endDate: now,
    };
  }

  async getOrdersByDay(period: 'day' | 'week' | 'month' = 'month') {
    const startDate = this.getStartDate(period);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const groupedByDate = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groupedByDate).map(([date, count]) => ({
      date,
      count,
    }));
  }

  async getOrdersByType() {
    const orders = await prisma.order.findMany({
      select: {
        serviceType: true,
      },
    });

    const grouped = orders.reduce((acc, order) => {
      acc[order.serviceType] = (acc[order.serviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return grouped;
  }

  async getOrdersByStatus() {
    const orders = await prisma.order.findMany({
      select: {
        status: true,
      },
    });

    const grouped = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return grouped;
  }

  async getRecentOrders(limit: number = 5) {
    return prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async getStatisticsByPeriod(
    period: 'day' | 'week' | 'month' | 'quarter' | 'year',
    dateFrom?: Date,
    dateTo?: Date
  ) {
    const startDate = dateFrom || this.getStartDate(period);
    const endDate = dateTo || new Date();

    const [orders, completedOrders, inProgressOrders, cancelledOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.order.findMany({
        where: {
          status: { in: [...IN_PROGRESS_STATUSES] },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.order.findMany({
        where: {
          status: 'CANCELLED',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.calculatedCost, 0);
    const averageCheck = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    const ordersByType = orders.reduce((acc, order) => {
      acc[order.serviceType] = (acc[order.serviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: orders.length,
      byStatus: {
        new: orders.filter((o) => o.status === 'NEW').length,
        inProgress: inProgressOrders.length,
        completed: completedOrders.length,
        cancelled: cancelledOrders.length,
      },
      byType: ordersByType,
      conversion: orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0,
      averageCheck: Math.round(averageCheck),
      totalRevenue,
      period: { startDate, endDate },
    };
  }

  private getStartDate(period: 'day' | 'week' | 'month' | 'quarter' | 'year'): Date {
    const now = new Date();

    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(now.getFullYear(), now.getMonth(), diff);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
}

export const statisticsService = new StatisticsService();
