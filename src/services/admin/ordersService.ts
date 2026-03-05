import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { OrderStatus } from '@prisma/client';

export class OrdersService {
  async getOrders(params: {
    status?: OrderStatus;
    serviceType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    assignedTo?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    const {
      status,
      serviceType,
      dateFrom,
      dateTo,
      assignedTo,
      page = 1,
      pageSize = 20,
      search,
    } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async updateOrder(
    id: string,
    data: {
      status?: OrderStatus;
      managerComment?: string;
      assignedTo?: string;
    },
    userId: string
  ) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Order not found');
    }

    const statusChanged = data.status && data.status !== existing.status;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...data,
        ...(statusChanged && {
          statusHistory: this.updateStatusHistory(
            existing.statusHistory as any,
            data.status!,
            userId
          ),
        }),
      },
    });

    if (statusChanged) {
      await (prisma as any).adminActionLog.create({
        data: {
          userId,
          action: 'UPDATE_ORDER_STATUS',
          entityType: 'Order',
          entityId: id,
          details: {
            oldStatus: existing.status,
            newStatus: data.status,
          },
        },
      });
    }

    return order;
  }

  async deleteOrder(id: string) {
    return prisma.order.delete({
      where: { id },
    });
  }

  async batchUpdateOrders(
    ids: string[],
    data: {
      status?: OrderStatus;
      assignedTo?: string;
    },
    userId: string
  ) {
    const results = await Promise.all(
      ids.map(async (id) => {
        const existing = await prisma.order.findUnique({ where: { id } });
        if (!existing) return null;

        return this.updateOrder(id, data, userId);
      })
    );

    return results.filter(Boolean);
  }

  private updateStatusHistory(
    currentHistory: any[] = [],
    newStatus: OrderStatus,
    userId: string
  ): any {
    const history = currentHistory || [];
    return [
      ...history,
      {
        status: newStatus,
        timestamp: new Date().toISOString(),
        userId,
      },
    ];
  }
}

export const ordersService = new OrdersService();
