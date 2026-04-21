import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { calculateFenceEstimate, calculateFenceEstimateDryRun, FenceEstimateCoreResult, FenceEstimateResult } from '@/services/calculator/fenceEstimateService';
import { calculateMultiFenceEstimate } from '@/services/calculator/multiFenceEstimateService';
import { calculateExtendedItems, calculateSummary, ExtendedEstimateItem, EstimateSummary } from '@/lib/utils/marginCalculator';
import { createAuditLogAsync } from '@/lib/audit';
import type { FenceEstimateInput } from '@/lib/validators/fenceEstimate';
import type { AdminUpdateEstimateItems, AdminAddItem, AdminCreateOrder } from '@/lib/validators/adminCalculator';

export interface AdminEstimateResult {
  estimateId: string;
  items: ExtendedEstimateItem[];
  summary: EstimateSummary;
  parameters: FenceEstimateResult['parameters'];
  calculatedAt: string;
}

export interface AdminMultiEstimateResult {
  multiEstimateId: string;
  estimates: AdminEstimateResult[];
  totals: {
    materials: number;
    installation: number;
    grandTotal: number;
  };
  calculatedAt: string;
}

class AdminCalculatorService {

  async calculateAndSave(
    input: FenceEstimateInput,
    adminUserId: string
  ): Promise<AdminEstimateResult> {
    const result = await calculateFenceEstimate(input, {
      userId: adminUserId,
    });

    await prisma.fenceEstimate.update({
      where: { id: result.estimateId },
      data: {
        isEditedByAdmin: true,
        editedByAdminId: adminUserId,
        editedAt: new Date(),
      },
    });

    const extendedItems = await calculateExtendedItems(
      result.items as unknown as Parameters<typeof calculateExtendedItems>[0]
    );
    const summary = calculateSummary(extendedItems);

    await createAuditLogAsync({
      userId: adminUserId,
      action: 'CREATE_ADMIN_ESTIMATE',
      entityType: 'FenceEstimate',
      entityId: result.estimateId,
      newValues: { fenceTypeId: input.fenceTypeId, length: input.length, height: input.height },
    });

    return {
      estimateId: result.estimateId,
      items: extendedItems,
      summary,
      parameters: result.parameters,
      calculatedAt: result.calculatedAt,
    };
  }

  async recalculate(
    input: FenceEstimateInput
  ): Promise<{ items: ExtendedEstimateItem[]; summary: EstimateSummary; parameters: FenceEstimateResult['parameters'] }> {
    const result = await calculateFenceEstimateDryRun(input);

    const extendedItems = await calculateExtendedItems(
      result.items as unknown as Parameters<typeof calculateExtendedItems>[0]
    );
    const summary = calculateSummary(extendedItems);

    return {
      items: extendedItems,
      summary,
      parameters: result.parameters,
    };
  }

  async updateEstimateItems(
    estimateId: string,
    data: AdminUpdateEstimateItems,
    adminUserId: string
  ): Promise<AdminEstimateResult> {
    const estimate = await prisma.fenceEstimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new Error('ESTIMATE_NOT_FOUND');
    }

    if (!estimate.isEditedByAdmin) {
      throw new Error('NOT_ADMIN_ESTIMATE');
    }

    const baseItems = data.items.filter(i => !i.isDeleted);
    const itemsJson = baseItems.map(item => ({
      category: item.category,
      nomenclatureId: item.nomenclatureId,
      nomenclatureName: item.nomenclatureName,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      totalPrice: Math.round(item.quantity * item.pricePerUnit * 100) / 100,
    }));

    const materialsTotal = itemsJson
      .filter(i => i.category !== 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);
    const installationTotal = itemsJson
      .filter(i => i.category === 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);
    const grandTotal = Math.round((materialsTotal + installationTotal) * 100) / 100;

    const overrides: Record<string, { auto: number; manual: number }> = {};
    for (const item of data.items) {
      if (item.autoQuantity !== undefined && item.autoQuantity !== item.quantity) {
        overrides[item.nomenclatureId] = { auto: item.autoQuantity, manual: item.quantity };
      }
    }

    await prisma.fenceEstimate.update({
      where: { id: estimateId },
      data: {
        items: itemsJson,
        materialsTotal,
        installationTotal,
        grandTotal,
        manualQuantityOverrides: Object.keys(overrides).length > 0 ? overrides : Prisma.DbNull,
        editComment: data.editComment || null,
        editedAt: new Date(),
        editedByAdminId: adminUserId,
      },
    });

    const extendedItems = await calculateExtendedItems(itemsJson);
    const summary = calculateSummary(extendedItems);

    const fenceType = await prisma.fenceType.findUnique({
      where: { id: estimate.fenceTypeId },
      select: { name: true },
    });

    await createAuditLogAsync({
      userId: adminUserId,
      action: 'UPDATE_ADMIN_ESTIMATE_ITEMS',
      entityType: 'FenceEstimate',
      entityId: estimateId,
      newValues: { itemsCount: baseItems.length, grandTotal, editComment: data.editComment },
    });

    return {
      estimateId,
      items: extendedItems,
      summary,
      parameters: {
        fenceTypeId: estimate.fenceTypeId,
        fenceTypeName: fenceType?.name || '',
        length: estimate.length,
        height: estimate.height,
        lagRows: estimate.lagRows as 2 | 3,
        coating: estimate.coating as 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE',
      },
      calculatedAt: estimate.createdAt.toISOString(),
    };
  }

  async addNomenclatureItem(
    estimateId: string,
    item: AdminAddItem,
    adminUserId: string
  ): Promise<AdminEstimateResult> {
    const estimate = await prisma.fenceEstimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new Error('ESTIMATE_NOT_FOUND');
    }

    if (!estimate.isEditedByAdmin) {
      throw new Error('NOT_ADMIN_ESTIMATE');
    }

    const currentItems = estimate.items as unknown as Array<{
      category: string;
      nomenclatureId: string;
      nomenclatureName: string;
      quantity: number;
      unit: string;
      pricePerUnit: number;
      totalPrice: number;
    }>;

    const existingIndex = currentItems.findIndex(
      i => i.nomenclatureId === item.nomenclatureId
    );

    if (existingIndex >= 0) {
      currentItems[existingIndex].quantity += item.quantity;
      currentItems[existingIndex].totalPrice =
        Math.round(currentItems[existingIndex].quantity * currentItems[existingIndex].pricePerUnit * 100) / 100;
    } else {
      currentItems.push({
        category: item.category,
        nomenclatureId: item.nomenclatureId,
        nomenclatureName: item.nomenclatureName,
        quantity: item.quantity,
        unit: item.unit,
        pricePerUnit: item.pricePerUnit,
        totalPrice: Math.round(item.quantity * item.pricePerUnit * 100) / 100,
      });
    }

    const materialsTotal = currentItems
      .filter(i => i.category !== 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);
    const installationTotal = currentItems
      .filter(i => i.category === 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);
    const grandTotal = Math.round((materialsTotal + installationTotal) * 100) / 100;

    await prisma.fenceEstimate.update({
      where: { id: estimateId },
      data: {
        items: currentItems,
        materialsTotal,
        installationTotal,
        grandTotal,
        editedAt: new Date(),
        editedByAdminId: adminUserId,
      },
    });

    const extendedItems = await calculateExtendedItems(currentItems);
    const summary = calculateSummary(extendedItems);

    const fenceType = await prisma.fenceType.findUnique({
      where: { id: estimate.fenceTypeId },
      select: { name: true },
    });

    await createAuditLogAsync({
      userId: adminUserId,
      action: 'ADD_ADMIN_ESTIMATE_ITEM',
      entityType: 'FenceEstimate',
      entityId: estimateId,
      newValues: { nomenclatureId: item.nomenclatureId, nomenclatureName: item.nomenclatureName, quantity: item.quantity },
    });

    return {
      estimateId,
      items: extendedItems,
      summary,
      parameters: {
        fenceTypeId: estimate.fenceTypeId,
        fenceTypeName: fenceType?.name || '',
        length: estimate.length,
        height: estimate.height,
        lagRows: estimate.lagRows as 2 | 3,
        coating: estimate.coating as 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE',
      },
      calculatedAt: estimate.createdAt.toISOString(),
    };
  }

  async removeNomenclatureItem(
    estimateId: string,
    nomenclatureId: string,
    adminUserId: string
  ): Promise<AdminEstimateResult> {
    const estimate = await prisma.fenceEstimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new Error('ESTIMATE_NOT_FOUND');
    }

    if (!estimate.isEditedByAdmin) {
      throw new Error('NOT_ADMIN_ESTIMATE');
    }

    const currentItems = estimate.items as unknown as Array<{
      category: string;
      nomenclatureId: string;
      nomenclatureName: string;
      quantity: number;
      unit: string;
      pricePerUnit: number;
      totalPrice: number;
    }>;

    const itemToRemove = currentItems.find(i => i.nomenclatureId === nomenclatureId);
    if (!itemToRemove) {
      throw new Error('ITEM_NOT_FOUND');
    }

    const updatedItems = currentItems.filter(i => i.nomenclatureId !== nomenclatureId);

    const materialsTotal = updatedItems
      .filter(i => i.category !== 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);
    const installationTotal = updatedItems
      .filter(i => i.category === 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);
    const grandTotal = Math.round((materialsTotal + installationTotal) * 100) / 100;

    await prisma.fenceEstimate.update({
      where: { id: estimateId },
      data: {
        items: updatedItems,
        materialsTotal,
        installationTotal,
        grandTotal,
        editedAt: new Date(),
        editedByAdminId: adminUserId,
      },
    });

    const extendedItems = await calculateExtendedItems(updatedItems);
    const summary = calculateSummary(extendedItems);

    const fenceType = await prisma.fenceType.findUnique({
      where: { id: estimate.fenceTypeId },
      select: { name: true },
    });

    await createAuditLogAsync({
      userId: adminUserId,
      action: 'REMOVE_ADMIN_ESTIMATE_ITEM',
      entityType: 'FenceEstimate',
      entityId: estimateId,
      oldValues: { nomenclatureId, nomenclatureName: itemToRemove.nomenclatureName, quantity: itemToRemove.quantity },
    });

    return {
      estimateId,
      items: extendedItems,
      summary,
      parameters: {
        fenceTypeId: estimate.fenceTypeId,
        fenceTypeName: fenceType?.name || '',
        length: estimate.length,
        height: estimate.height,
        lagRows: estimate.lagRows as 2 | 3,
        coating: estimate.coating as 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE',
      },
      calculatedAt: estimate.createdAt.toISOString(),
    };
  }

  async calculateMultiAndSave(
    inputs: FenceEstimateInput[],
    adminUserId: string
  ): Promise<AdminMultiEstimateResult> {
    const multiResult = await calculateMultiFenceEstimate(
      { estimates: inputs },
      { userId: adminUserId }
    );

    for (const { result: est } of multiResult.estimates) {
      await prisma.fenceEstimate.update({
        where: { id: est.estimateId },
        data: {
          isEditedByAdmin: true,
          editedByAdminId: adminUserId,
          editedAt: new Date(),
        },
      });
    }

    const adminEstimates: AdminEstimateResult[] = [];
    for (const { result: est } of multiResult.estimates) {
      const extendedItems = await calculateExtendedItems(
        est.items as unknown as Parameters<typeof calculateExtendedItems>[0]
      );
      const summary = calculateSummary(extendedItems);
      adminEstimates.push({
        estimateId: est.estimateId,
        items: extendedItems,
        summary,
        parameters: est.parameters,
        calculatedAt: est.calculatedAt,
      });
    }

    await createAuditLogAsync({
      userId: adminUserId,
      action: 'CREATE_ADMIN_MULTI_ESTIMATE',
      entityType: 'MultiFenceEstimate',
      entityId: multiResult.multiEstimateId,
      newValues: { estimatesCount: inputs.length },
    });

    return {
      multiEstimateId: multiResult.multiEstimateId,
      estimates: adminEstimates,
      totals: {
        materials: multiResult.totals.totalMaterials,
        installation: multiResult.totals.totalInstallation,
        grandTotal: multiResult.totals.grandTotal,
      },
      calculatedAt: multiResult.calculatedAt,
    };
  }

  async createOrderFromEstimate(
    data: AdminCreateOrder,
    adminUserId: string
  ): Promise<{ orderId: string; estimateId: string; status: string }> {
    const estimate = await prisma.fenceEstimate.findUnique({
      where: { id: data.estimateId },
    });

    if (!estimate) {
      throw new Error('ESTIMATE_NOT_FOUND');
    }

    const existingOrder = await prisma.order.findFirst({
      where: { adminEstimateId: data.estimateId, active: true },
      select: { id: true },
    });
    if (existingOrder) {
      throw new Error('ESTIMATE_ALREADY_HAS_ORDER');
    }

    let multiEstimateId = data.multiEstimateId || null;
    if (multiEstimateId) {
      const multiEst = await prisma.multiFenceEstimate.findUnique({
        where: { id: multiEstimateId },
      });
      if (!multiEst) {
        throw new Error('MULTI_ESTIMATE_NOT_FOUND');
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      return await tx.order.create({
        data: {
          id: `order-${crypto.randomUUID()}`,
          clientName: data.clientName,
          phone: data.phone,
          email: data.email || null,
          serviceType: 'CALCULATOR',
          parameters: {
            fenceTypeId: estimate.fenceTypeId,
            length: estimate.length,
            height: estimate.height,
            lagRows: estimate.lagRows,
            coating: estimate.coating,
            hasGate: estimate.hasGate,
            gateType: estimate.gateType,
            gateLength: estimate.gateLength,
            hasWicket: estimate.hasWicket,
            wicketWidth: estimate.wicketWidth,
          },
          calculatedCost: estimate.grandTotal,
          status: 'NEW',
          managerComment: data.comment || null,
          adminEstimateId: data.estimateId,
          multiEstimateId,
          statusHistory: [
            {
              status: 'NEW',
              changedAt: new Date().toISOString(),
              changedBy: adminUserId,
              comment: 'Заявка создана администратором через калькулятор',
            },
          ],
        },
      });
    });

    await createAuditLogAsync({
      userId: adminUserId,
      action: 'CREATE_ADMIN_ORDER',
      entityType: 'Order',
      entityId: order.id,
      newValues: {
        clientName: data.clientName,
        phone: data.phone,
        estimateId: data.estimateId,
        grandTotal: estimate.grandTotal,
      },
    });

    return {
      orderId: order.id,
      estimateId: data.estimateId,
      status: 'NEW',
    };
  }

  async getEstimate(estimateId: string): Promise<AdminEstimateResult | null> {
    const estimate = await prisma.fenceEstimate.findUnique({
      where: { id: estimateId },
      include: { fenceType: true },
    });

    if (!estimate) {
      return null;
    }

    const items = estimate.items as unknown as Parameters<typeof calculateExtendedItems>[0];
    const extendedItems = await calculateExtendedItems(items);
    const summary = calculateSummary(extendedItems);

    return {
      estimateId: estimate.id,
      items: extendedItems,
      summary,
      parameters: {
        fenceTypeId: estimate.fenceTypeId,
        fenceTypeName: estimate.fenceType.name,
        length: estimate.length,
        height: estimate.height,
        lagRows: estimate.lagRows as 2 | 3,
        coating: estimate.coating as 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE',
      },
      calculatedAt: estimate.createdAt.toISOString(),
    };
  }
}

export const adminCalculatorService = new AdminCalculatorService();
