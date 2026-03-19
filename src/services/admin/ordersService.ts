import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { OrderStatus } from '@prisma/client';
import { 
  STATUS_LABELS, 
  VALID_STATUS_TRANSITIONS, 
  StatusChangeData,
  getStatusTransitionSchema 
} from '@/lib/validators/order';
import { createAuditLogAsync } from '@/lib/audit';

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
          estimate: {
            select: {
              id: true,
              grandTotal: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    const ordersWithLabels = orders.map((order) => ({
      ...order,
      statusLabel: STATUS_LABELS[order.status],
      calculatedCost: order.estimate?.grandTotal ?? order.calculatedCost,
    }));

    return {
      orders: ordersWithLabels,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
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
        estimate: true,
      },
    });

    if (!order) return null;

    return {
      ...order,
      statusLabel: STATUS_LABELS[order.status],
      calculatedCost: order.estimate?.grandTotal ?? order.calculatedCost,
    };
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

    if (statusChanged && !VALID_STATUS_TRANSITIONS[existing.status]?.includes(data.status!)) {
      throw new Error(`Invalid status transition from ${existing.status} to ${data.status}`);
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...data,
        ...(statusChanged && {
          statusHistory: await this.updateStatusHistory(
            existing.statusHistory as any[],
            data.status!,
            userId,
            {}
          ),
        }),
      },
      include: {
        estimate: {
          select: {
            id: true,
            grandTotal: true,
          },
        },
      },
    });

    if (statusChanged) {
      createAuditLogAsync({
        userId,
        action: 'UPDATE_ORDER_STATUS',
        entityType: 'Order',
        entityId: id,
        oldValues: { status: existing.status },
        newValues: { status: data.status },
      });
    }

    return {
      ...order,
      statusLabel: STATUS_LABELS[order.status],
      calculatedCost: order.estimate?.grandTotal ?? order.calculatedCost,
    };
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    data: StatusChangeData | undefined,
    userId: string
  ) {
    console.log('[OrdersService] updateOrderStatus called:', { id, status, data, userId });

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      console.error('[OrdersService] Order not found:', id);
      throw new Error('Order not found');
    }

    console.log('[OrdersService] Existing order:', { 
      id: existing.id, 
      status: existing.status,
      hasStatusHistory: !!existing.statusHistory 
    });

    if (!VALID_STATUS_TRANSITIONS[existing.status]?.includes(status)) {
      console.error('[OrdersService] Invalid transition:', { 
        from: existing.status, 
        to: status,
        allowed: VALID_STATUS_TRANSITIONS[existing.status] 
      });
      throw new Error(`Invalid status transition from ${existing.status} to ${status}`);
    }

    const schema = getStatusTransitionSchema(existing.status, status);
    console.log('[OrdersService] Validating data with schema for:', `${existing.status} -> ${status}`);
    
    const validatedData = (data ? schema.parse(data) : {}) as StatusChangeData;
    console.log('[OrdersService] Validated data:', validatedData);

    const updateData: Prisma.OrderUpdateInput = {
      status,
    };

    if (validatedData.measurementAddress) {
      updateData.measurementAddress = validatedData.measurementAddress;
    }
    if (validatedData.measurementDate) {
      updateData.measurementDate = new Date(validatedData.measurementDate);
    }
    if (validatedData.cancellationReason) {
      updateData.cancellationReason = validatedData.cancellationReason;
    }
    if (validatedData.completionDate) {
      updateData.completionDate = new Date(validatedData.completionDate);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const currentHistory = (existing.statusHistory as any[]) || [];
    const newHistoryEntry = {
      status,
      changedAt: new Date().toISOString(),
      changedBy: userId,
      changedByName: user?.name || 'Неизвестный',
      data: validatedData,
    };

    console.log('[OrdersService] New history entry:', newHistoryEntry);

    updateData.statusHistory = [...currentHistory, newHistoryEntry];

    console.log('[OrdersService] Updating order with data:', updateData);

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        estimate: {
          select: {
            id: true,
            grandTotal: true,
          },
        },
      },
    });

    console.log('[OrdersService] Order updated successfully');

    createAuditLogAsync({
      userId,
      action: 'UPDATE_ORDER_STATUS',
      entityType: 'Order',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status, data: validatedData },
    });

    return {
      ...order,
      statusLabel: STATUS_LABELS[order.status],
      calculatedCost: order.estimate?.grandTotal ?? order.calculatedCost,
    };
  }

  async updateStatusHistoryEntry(
    orderId: string,
    historyIndex: number,
    data: Partial<StatusChangeData>,
    userId: string
  ) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new Error('Order not found');
    }

    const history = (order.statusHistory as any[]) || [];
    if (historyIndex < 0 || historyIndex >= history.length) {
      throw new Error('Invalid history index');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const entry = history[historyIndex];
    const oldEntryData = { ...entry.data };
    history[historyIndex] = {
      ...entry,
      data: { ...entry.data, ...data },
      editedAt: new Date().toISOString(),
      editedBy: userId,
      editedByName: user?.name || 'Неизвестный',
    };

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { statusHistory: history },
    });

    createAuditLogAsync({
      userId,
      action: 'EDIT_STATUS_HISTORY',
      entityType: 'Order',
      entityId: orderId,
      oldValues: { data: oldEntryData },
      newValues: { data: history[historyIndex].data, historyIndex },
    });

    return history[historyIndex];
  }

  async deleteOrder(id: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    createAuditLogAsync({
      userId,
      action: 'DELETE_ORDER',
      entityType: 'Order',
      entityId: id,
      oldValues: {
        clientName: order.clientName,
        phone: order.phone,
        email: order.email,
        serviceType: order.serviceType,
        parameters: order.parameters,
        calculatedCost: order.calculatedCost,
        status: order.status,
        managerComment: order.managerComment,
        assignedTo: order.assignedTo,
        estimateId: order.estimateId,
      },
      newValues: null,
    });

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

        createAuditLogAsync({
          userId,
          action: 'BATCH_UPDATE_ORDERS',
          entityType: 'Order',
          entityId: id,
          oldValues: {
            status: existing.status,
            assignedTo: existing.assignedTo,
          },
          newValues: {
            status: data.status ?? existing.status,
            assignedTo: data.assignedTo ?? existing.assignedTo,
          },
        });

        return this.updateOrder(id, data, userId);
      })
    );

    return results.filter(Boolean);
  }

  private async updateStatusHistory(
    currentHistory: any[] = [],
    newStatus: OrderStatus,
    userId: string,
    data: StatusChangeData
  ): Promise<any> {
    const history = currentHistory || [];
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return [
      ...history,
      {
        status: newStatus,
        changedAt: new Date().toISOString(),
        changedBy: userId,
        changedByName: user?.name || 'Неизвестный',
        data,
      },
    ];
  }

  async getOrderFull(id: string, userRole: string) {
    console.log('[getOrderFull] Start, id:', id, 'userRole:', userRole);
    
    let order;
    try {
      order = await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          clientName: true,
          phone: true,
          email: true,
          parameters: true,
          status: true,
          calculatedCost: true,
          createdAt: true,
          updatedAt: true,
          measurementAddress: true,
          measurementDate: true,
          cancellationReason: true,
          completionDate: true,
          statusHistory: true,
          assignedUser: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          estimate: {
            include: {
              fenceType: {
                select: { id: true, name: true },
              },
              user: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
      });
      console.log('[getOrderFull] Order found:', !!order);
    } catch (dbError) {
      console.error('[getOrderFull] Database error:', dbError);
      throw dbError;
    }

    if (!order) return null;

    const showPurchasePrices = userRole === 'ADMIN';

    const statusHistory = (order.statusHistory as any[]) || [];

    const formattedHistory = statusHistory.map((entry) => ({
      status: entry.status,
      statusLabel: STATUS_LABELS[entry.status as OrderStatus] || entry.status,
      changedAt: entry.changedAt,
      changedBy: entry.changedBy,
      changedByName: entry.changedByName || 'Система',
      data: entry.data || {},
    }));

    const orderWithDetails = {
      id: order.id,
      clientName: order.clientName,
      phone: order.phone,
      email: order.email,
      message: (order.parameters as any)?.message || null,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status],
      calculatedCost: order.estimate?.grandTotal ?? order.calculatedCost,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      measurementAddress: order.measurementAddress,
      measurementDate: order.measurementDate?.toISOString() || null,
      cancellationReason: order.cancellationReason,
      completionDate: order.completionDate?.toISOString() || null,
      assignedUser: order.assignedUser
        ? {
            id: order.assignedUser.id,
            name: order.assignedUser.name || 'Неизвестный',
            role: order.assignedUser.role,
          }
        : null,
      statusHistory: formattedHistory,
    };

    let estimate = null;

    if (order.estimate) {
      const items = (order.estimate.items as any[]) || [];

      const COATING_LABELS: Record<string, string> = {
        GALVANIZED: 'Оцинковка',
        POLYMER_SINGLE: 'Полимерное одностороннее',
        POLYMER_DOUBLE: 'Полимерное двустороннее',
      };

      const GATE_TYPE_LABELS: Record<string, string> = {
        SWING: 'Распашные',
        SLIDING: 'Откатные',
      };

      const materialsItems = items.filter((item) => item.category !== 'installation');
      const installationItems = items.filter((item) => item.category === 'installation');

      const materialsTotal = materialsItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const installationTotal = installationItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

      let purchaseTotal = null;
      let marginTotalRub = null;
      let marginTotalPercent = null;

      if (showPurchasePrices) {
        purchaseTotal = items.reduce((sum, item) => sum + (item.purchaseTotal || 0), 0);
        marginTotalRub = (order.estimate.grandTotal || 0) - purchaseTotal;
        marginTotalPercent = purchaseTotal > 0 ? (marginTotalRub / order.estimate.grandTotal) * 100 : 0;
      }

      const formattedItems = items.map((item) => ({
        category: item.category,
        nomenclatureId: item.nomenclatureId,
        nomenclatureName: item.nomenclatureName,
        quantity: item.quantity,
        unit: item.unit,
        pricePerUnit: item.pricePerUnit,
        totalPrice: item.totalPrice,
        ...(showPurchasePrices && {
          purchasePricePerUnit: item.purchasePricePerUnit || null,
          purchaseTotal: item.purchaseTotal || null,
          marginRub: item.marginRub || null,
          marginPercent: item.marginPercent || null,
        }),
      }));

      estimate = {
        id: order.estimate.id,
        fenceType: order.estimate.fenceType,
        length: order.estimate.length,
        height: order.estimate.height,
        lagRows: order.estimate.lagRows,
        coating: order.estimate.coating,
        coatingLabel: COATING_LABELS[order.estimate.coating] || order.estimate.coating,
        hasGate: order.estimate.hasGate,
        gateType: order.estimate.gateType,
        gateTypeLabel: order.estimate.gateType
          ? GATE_TYPE_LABELS[order.estimate.gateType] || order.estimate.gateType
          : null,
        gateLength: order.estimate.gateLength,
        gateNomenclatureName: order.estimate.gateNomenclatureName,
        hasWicket: order.estimate.hasWicket,
        wicketWidth: order.estimate.wicketWidth,
        wicketNomenclatureName: order.estimate.wicketNomenclatureName,
        city: order.estimate.city,
        items: formattedItems,
        materialsTotal,
        installationTotal,
        grandTotal: order.estimate.grandTotal,
        ...(showPurchasePrices && {
          purchaseTotal,
          marginTotalRub,
          marginTotalPercent,
        }),
        userId: order.estimate.userId,
        user: order.estimate.user
          ? {
              id: order.estimate.user.id,
              name: order.estimate.user.name || 'Неизвестный',
              role: order.estimate.user.role,
            }
          : null,
        sessionId: order.estimate.sessionId,
        ipAddress: order.estimate.ipAddress,
        userAgent: order.estimate.userAgent,
        createdAt: order.estimate.createdAt.toISOString(),
      };
    }

    return {
      order: orderWithDetails,
      estimate,
      showPurchasePrices,
    };
  }
}

export const ordersService = new OrdersService();
