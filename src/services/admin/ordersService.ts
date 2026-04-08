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
          multiEstimate: {
            select: {
              id: true,
              grandTotal: true,
              estimates: {
                select: {
                  id: true,
                  grandTotal: true,
                },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
          adminEstimate: {
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

    const ordersWithLabels = orders.map((order) => {
      const multiEstChildren = order.multiEstimate?.estimates ?? [];
      const hasLostChildren = order.multiEstimate && multiEstChildren.length === 0;

      const estimateIds = order.multiEstimate
        ? multiEstChildren.length > 0
          ? multiEstChildren.map((e: { id: string }) => e.id)
          : hasLostChildren
            ? [order.multiEstimate.id]
            : []
        : order.estimateId
          ? [order.estimateId]
          : [];

      const finalEstimateIds = order.adminEstimateId
        ? [order.adminEstimateId, ...estimateIds]
        : estimateIds;

      return {
        ...order,
        statusLabel: STATUS_LABELS[order.status],
        calculatedCost: order.adminEstimate?.grandTotal ?? order.estimate?.grandTotal ?? order.multiEstimate?.grandTotal ?? order.calculatedCost,
        hasAdminEstimate: !!order.adminEstimateId,
        isIndividualRequest: order.serviceType === 'INDIVIDUAL_CALCULATION',
        isMultiEstimate: !!order.multiEstimate,
        estimateIds: finalEstimateIds,
      };
    });

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
          serviceType: true,
          status: true,
          calculatedCost: true,
          createdAt: true,
          updatedAt: true,
          measurementAddress: true,
          measurementDate: true,
          cancellationReason: true,
          completionDate: true,
          statusHistory: true,
          multiEstimateId: true,
          adminEstimateId: true,
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
          adminEstimate: {
            include: {
              fenceType: {
                select: { id: true, name: true },
              },
              user: {
                select: { id: true, name: true, role: true },
              },
            },
          },
          multiEstimate: {
            include: {
              estimates: {
                include: {
                  fenceType: {
                    select: { id: true, name: true },
                  },
                  user: {
                    select: { id: true, name: true, role: true },
                  },
                },
                orderBy: { createdAt: 'asc' },
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

    let resolvedOrder = order;

    if (!order.multiEstimateId && (order.parameters as any)?.isMultiEstimate) {
      console.log('[getOrderFull] Order has isMultiEstimate but no multiEstimateId, searching fallback...');
      const params = order.parameters as any;
      const fallbackMulti = await prisma.multiFenceEstimate.findFirst({
        where: {
          grandTotal: order.calculatedCost,
          totalMaterials: params.totalMaterials ?? undefined,
          totalInstallation: params.totalInstallation ?? undefined,
          estimatesCount: params.estimatesCount ?? undefined,
        },
        include: {
          estimates: {
            include: {
              fenceType: {
                select: { id: true, name: true },
              },
              user: {
                select: { id: true, name: true, role: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (fallbackMulti) {
        console.log('[getOrderFull] Found fallback MultiFenceEstimate:', fallbackMulti.id);
        resolvedOrder = {
          ...order,
          multiEstimateId: fallbackMulti.id,
          multiEstimate: fallbackMulti,
        };

        prisma.order.update({
          where: { id: order.id },
          data: { multiEstimateId: fallbackMulti.id },
        }).catch(err => console.error('[getOrderFull] Failed to update order with multiEstimateId:', err));
      } else {
        console.log('[getOrderFull] No fallback MultiFenceEstimate found');
      }
    }

    const statusHistory = (resolvedOrder.statusHistory as any[]) || [];

    const formattedHistory = statusHistory.map((entry) => ({
      status: entry.status,
      statusLabel: STATUS_LABELS[entry.status as OrderStatus] || entry.status,
      changedAt: entry.changedAt,
      changedBy: entry.changedBy,
      changedByName: entry.changedByName || 'Система',
      data: entry.data || {},
    }));

    const calculatedCost = resolvedOrder.adminEstimate?.grandTotal 
      ?? resolvedOrder.estimate?.grandTotal 
      ?? resolvedOrder.multiEstimate?.grandTotal 
      ?? resolvedOrder.calculatedCost;

    const orderWithDetails = {
      id: resolvedOrder.id,
      clientName: resolvedOrder.clientName,
      phone: resolvedOrder.phone,
      email: resolvedOrder.email,
      message: (resolvedOrder.parameters as any)?.message || null,
      status: resolvedOrder.status,
      statusLabel: STATUS_LABELS[resolvedOrder.status],
      serviceType: resolvedOrder.serviceType,
      calculatedCost,
      createdAt: resolvedOrder.createdAt.toISOString(),
      updatedAt: resolvedOrder.updatedAt.toISOString(),
      measurementAddress: resolvedOrder.measurementAddress,
      measurementDate: resolvedOrder.measurementDate?.toISOString() || null,
      cancellationReason: resolvedOrder.cancellationReason,
      completionDate: resolvedOrder.completionDate?.toISOString() || null,
      assignedUser: resolvedOrder.assignedUser
        ? {
            id: resolvedOrder.assignedUser.id,
            name: resolvedOrder.assignedUser.name || 'Неизвестный',
            role: resolvedOrder.assignedUser.role,
          }
        : null,
      statusHistory: formattedHistory,
      parameters: resolvedOrder.parameters,
    };

    let estimate = null;
    let multiEstimates = null;

    if (resolvedOrder.estimate) {
      const items = (resolvedOrder.estimate.items as any[]) || [];

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
        marginTotalRub = (resolvedOrder.estimate.grandTotal || 0) - purchaseTotal;
        marginTotalPercent = purchaseTotal > 0 ? (marginTotalRub / resolvedOrder.estimate.grandTotal) * 100 : 0;
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
        id: resolvedOrder.estimate.id,
        fenceType: resolvedOrder.estimate.fenceType,
        length: resolvedOrder.estimate.length,
        height: resolvedOrder.estimate.height,
        lagRows: resolvedOrder.estimate.lagRows,
        coating: resolvedOrder.estimate.coating,
        coatingLabel: COATING_LABELS[resolvedOrder.estimate.coating] || resolvedOrder.estimate.coating,
        hasGate: resolvedOrder.estimate.hasGate,
        gateType: resolvedOrder.estimate.gateType,
        gateTypeLabel: resolvedOrder.estimate.gateType
          ? GATE_TYPE_LABELS[resolvedOrder.estimate.gateType] || resolvedOrder.estimate.gateType
          : null,
        gateLength: resolvedOrder.estimate.gateLength,
        gateNomenclatureName: resolvedOrder.estimate.gateNomenclatureName,
        hasWicket: resolvedOrder.estimate.hasWicket,
        wicketWidth: resolvedOrder.estimate.wicketWidth,
        wicketNomenclatureName: resolvedOrder.estimate.wicketNomenclatureName,
        city: resolvedOrder.estimate.city,
        items: formattedItems,
        materialsTotal,
        installationTotal,
        grandTotal: resolvedOrder.estimate.grandTotal,
        ...(showPurchasePrices && {
          purchaseTotal,
          marginTotalRub,
          marginTotalPercent,
        }),
        userId: resolvedOrder.estimate.userId,
        user: resolvedOrder.estimate.user
          ? {
              id: resolvedOrder.estimate.user.id,
              name: resolvedOrder.estimate.user.name || 'Неизвестный',
              role: resolvedOrder.estimate.user.role,
            }
          : null,
        sessionId: resolvedOrder.estimate.sessionId,
        ipAddress: resolvedOrder.estimate.ipAddress,
        userAgent: resolvedOrder.estimate.userAgent,
        createdAt: resolvedOrder.estimate.createdAt.toISOString(),
      };
    }

    let adminEstimate = null;

    if (resolvedOrder.adminEstimate) {
      const COATING_LABELS: Record<string, string> = {
        GALVANIZED: 'Оцинковка',
        POLYMER_SINGLE: 'Полимерное одностороннее',
        POLYMER_DOUBLE: 'Полимерное двустороннее',
      };

      const GATE_TYPE_LABELS: Record<string, string> = {
        SWING: 'Распашные',
        SLIDING: 'Откатные',
      };

      const adminItems = (resolvedOrder.adminEstimate.items as any[]) || [];
      const adminMaterialsItems = adminItems.filter((item) => item.category !== 'installation');
      const adminInstallationItems = adminItems.filter((item) => item.category === 'installation');
      const adminMaterialsTotal = adminMaterialsItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const adminInstallationTotal = adminInstallationItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

      let adminPurchaseTotal = null;
      let adminMarginTotalRub = null;
      let adminMarginTotalPercent = null;

      if (showPurchasePrices) {
        adminPurchaseTotal = adminItems.reduce((sum, item) => sum + (item.purchaseTotal || 0), 0);
        adminMarginTotalRub = (resolvedOrder.adminEstimate.grandTotal || 0) - adminPurchaseTotal;
        adminMarginTotalPercent = adminPurchaseTotal > 0 ? (adminMarginTotalRub / resolvedOrder.adminEstimate.grandTotal) * 100 : 0;
      }

      const adminFormattedItems = adminItems.map((item) => ({
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

      let editedByAdminUser = null;
      if (resolvedOrder.adminEstimate.editedByAdminId) {
        editedByAdminUser = await prisma.user.findUnique({
          where: { id: resolvedOrder.adminEstimate.editedByAdminId! },
          select: { id: true, name: true, role: true },
        });
      }

      adminEstimate = {
        id: resolvedOrder.adminEstimate.id,
        fenceType: resolvedOrder.adminEstimate.fenceType,
        length: resolvedOrder.adminEstimate.length,
        height: resolvedOrder.adminEstimate.height,
        lagRows: resolvedOrder.adminEstimate.lagRows,
        coating: resolvedOrder.adminEstimate.coating,
        coatingLabel: COATING_LABELS[resolvedOrder.adminEstimate.coating] || resolvedOrder.adminEstimate.coating,
        hasGate: resolvedOrder.adminEstimate.hasGate,
        gateType: resolvedOrder.adminEstimate.gateType,
        gateTypeLabel: resolvedOrder.adminEstimate.gateType
          ? GATE_TYPE_LABELS[resolvedOrder.adminEstimate.gateType] || resolvedOrder.adminEstimate.gateType
          : null,
        gateLength: resolvedOrder.adminEstimate.gateLength,
        gateNomenclatureName: resolvedOrder.adminEstimate.gateNomenclatureName,
        hasWicket: resolvedOrder.adminEstimate.hasWicket,
        wicketWidth: resolvedOrder.adminEstimate.wicketWidth,
        wicketNomenclatureName: resolvedOrder.adminEstimate.wicketNomenclatureName,
        city: resolvedOrder.adminEstimate.city,
        items: adminFormattedItems,
        materialsTotal: adminMaterialsTotal,
        installationTotal: adminInstallationTotal,
        grandTotal: resolvedOrder.adminEstimate.grandTotal,
        ...(showPurchasePrices && {
          purchaseTotal: adminPurchaseTotal,
          marginTotalRub: adminMarginTotalRub,
          marginTotalPercent: adminMarginTotalPercent,
        }),
        userId: resolvedOrder.adminEstimate.userId,
        user: resolvedOrder.adminEstimate.user
          ? {
              id: resolvedOrder.adminEstimate.user.id,
              name: resolvedOrder.adminEstimate.user.name || 'Неизвестный',
              role: resolvedOrder.adminEstimate.user.role,
            }
          : null,
        editedByAdminId: resolvedOrder.adminEstimate.editedByAdminId,
        editedByAdmin: editedByAdminUser
          ? {
              id: editedByAdminUser.id,
              name: editedByAdminUser.name || 'Неизвестный',
              role: editedByAdminUser.role,
            }
          : null,
        editedAt: resolvedOrder.adminEstimate.editedAt?.toISOString() || null,
        editComment: resolvedOrder.adminEstimate.editComment,
        sessionId: resolvedOrder.adminEstimate.sessionId,
        ipAddress: resolvedOrder.adminEstimate.ipAddress,
        userAgent: resolvedOrder.adminEstimate.userAgent,
        createdAt: resolvedOrder.adminEstimate.createdAt.toISOString(),
        isEditedByAdmin: resolvedOrder.adminEstimate.isEditedByAdmin,
        sourceEstimateId: resolvedOrder.adminEstimate.sourceEstimateId,
        manualQuantityOverrides: resolvedOrder.adminEstimate.manualQuantityOverrides,
      };
    }

    if (resolvedOrder.multiEstimate && resolvedOrder.multiEstimate.estimates.length > 0) {
      const COATING_LABELS: Record<string, string> = {
        GALVANIZED: 'Оцинковка',
        POLYMER_SINGLE: 'Полимерное одностороннее',
        POLYMER_DOUBLE: 'Полимерное двустороннее',
      };

      const GATE_TYPE_LABELS: Record<string, string> = {
        SWING: 'Распашные',
        SLIDING: 'Откатные',
      };

      multiEstimates = resolvedOrder.multiEstimate.estimates.map((est) => {
        const items = (est.items as any[]) || [];

        const materialsItems = items.filter((item) => item.category !== 'installation');
        const installationItems = items.filter((item) => item.category === 'installation');

        const materialsTotal = materialsItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        const installationTotal = installationItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

        let purchaseTotal = null;
        let marginTotalRub = null;
        let marginTotalPercent = null;

        if (showPurchasePrices) {
          purchaseTotal = items.reduce((sum, item) => sum + (item.purchaseTotal || 0), 0);
          marginTotalRub = (est.grandTotal || 0) - purchaseTotal;
          marginTotalPercent = purchaseTotal > 0 ? (marginTotalRub / est.grandTotal) * 100 : 0;
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

        return {
          id: est.id,
          fenceType: est.fenceType,
          length: est.length,
          height: est.height,
          lagRows: est.lagRows,
          coating: est.coating,
          coatingLabel: COATING_LABELS[est.coating] || est.coating,
          hasGate: est.hasGate,
          gateType: est.gateType,
          gateTypeLabel: est.gateType
            ? GATE_TYPE_LABELS[est.gateType] || est.gateType
            : null,
          gateLength: est.gateLength,
          gateNomenclatureName: est.gateNomenclatureName,
          hasWicket: est.hasWicket,
          wicketWidth: est.wicketWidth,
          wicketNomenclatureName: est.wicketNomenclatureName,
          city: est.city,
          items: formattedItems,
          materialsTotal,
          installationTotal,
          grandTotal: est.grandTotal,
          ...(showPurchasePrices && {
            purchaseTotal,
            marginTotalRub,
            marginTotalPercent,
          }),
          userId: est.userId,
          user: est.user
            ? {
                id: est.user.id,
                name: est.user.name || 'Неизвестный',
                role: est.user.role,
              }
            : null,
          sessionId: est.sessionId,
          ipAddress: est.ipAddress,
          userAgent: est.userAgent,
          createdAt: est.createdAt.toISOString(),
        };
      });
    } else if ((resolvedOrder.parameters as any)?.isMultiEstimate && (resolvedOrder.parameters as any)?.fences) {
      console.log('[getOrderFull] MultiEstimate has no estimates, using parameters.fences as fallback');
      const params = resolvedOrder.parameters as any;
      const fenceTypes = await prisma.fenceType.findMany({
        where: { id: { in: params.fences.map((f: any) => f.fenceTypeId) } },
      });

      multiEstimates = params.fences.map((fence: any) => {
        const fenceType = fenceTypes.find((ft) => ft.id === fence.fenceTypeId);
        return {
          id: `fallback-${fence.fenceTypeId}`,
          fenceType: fenceType ? { id: fenceType.id, name: fenceType.name } : { id: fence.fenceTypeId, name: fence.fenceTypeName || 'Неизвестный' },
          length: fence.length,
          height: fence.height,
          lagRows: fence.lagRows,
          coating: fence.coating,
          coatingLabel: fence.coating === 'GALVANIZED' ? 'Оцинковка' : fence.coating === 'POLYMER_SINGLE' ? 'Полимерное одностороннее' : 'Полимерное двустороннее',
          hasGate: fence.hasGate,
          gateType: null,
          gateTypeLabel: null,
          gateLength: fence.gateLength,
          gateNomenclatureName: null,
          hasWicket: fence.hasWicket,
          wicketWidth: fence.wicketWidth,
          wicketNomenclatureName: null,
          city: null,
          items: [],
          materialsTotal: 0,
          installationTotal: 0,
          grandTotal: fence.grandTotal,
          ...(showPurchasePrices && {
            purchaseTotal: null,
            marginTotalRub: null,
            marginTotalPercent: null,
          }),
          userId: null,
          user: null,
          sessionId: null,
          ipAddress: null,
          userAgent: null,
          createdAt: resolvedOrder.createdAt.toISOString(),
        };
      });
    }

    return {
      order: orderWithDetails,
      estimate,
      adminEstimate,
      multiEstimates,
      showPurchasePrices,
    };
  }
}

export const ordersService = new OrdersService();
