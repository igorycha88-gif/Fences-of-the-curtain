import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createAuditLogAsync } from '@/lib/audit';
import type {
  CreateAdminEstimateInput,
  UpdateAdminEstimateInput,
  AddedItem,
} from '@/lib/validators/adminEstimate';

interface EstimateItem {
  category: string;
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export interface GateAdminEstimateResult {
  id: string;
  height: number;
  needsInstallation: boolean;
  items: EstimateItem[];
  materialsTotal: number;
  installationTotal: number;
  grandTotal: number;
  isEditedByAdmin: boolean;
  sourceEstimateId: string | null;
  editedByAdminId: string | null;
  editedAt: string | null;
  editComment: string | null;
  manualQuantityOverrides: Record<string, { auto: number; manual: number }> | null;
  editedByAdmin?: { id: string; name: string | null; email: string } | null;
  createdAt: string;
}

type AuditChange =
  | { type: 'QUANTITY_OVERRIDDEN'; nomenclatureId: string; nomenclatureName: string; autoQuantity: number; manualQuantity: number }
  | { type: 'ITEM_ADDED'; item: AddedItem & { totalPrice: number } }
  | { type: 'ITEM_DELETED'; item: { nomenclatureId: string; nomenclatureName: string; quantity: number; unit: string; pricePerUnit: number; totalPrice: number } };

function recalcTotals(items: EstimateItem[]) {
  const materialsTotal = items
    .filter((i) => i.category !== 'installation')
    .reduce((sum, i) => sum + i.totalPrice, 0);
  const installationTotal = items
    .filter((i) => i.category === 'installation')
    .reduce((sum, i) => sum + i.totalPrice, 0);
  const grandTotal = Math.round((materialsTotal + installationTotal) * 100) / 100;
  return { materialsTotal, installationTotal, grandTotal };
}

export class GateEstimateEditorService {

  async createAdminEstimate(
    orderId: string,
    adminUserId: string,
    input: CreateAdminEstimateInput
  ): Promise<GateAdminEstimateResult> {
    const { sourceEstimateId, editComment, items: itemChanges } = input;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, adminGateEstimateId: true, gateEstimateId: true },
    });
    if (!order) {
      throw new Error('Order not found');
    }

    const sourceEstimate = await prisma.gateEstimate.findUnique({
      where: { id: sourceEstimateId },
    });
    if (!sourceEstimate) {
      throw new Error('Source estimate not found');
    }

    if (order.gateEstimateId !== sourceEstimateId) {
      throw new Error('Source estimate does not belong to this order');
    }

    const auditChanges: AuditChange[] = [];
    let currentItems: EstimateItem[] = (sourceEstimate.items as unknown as EstimateItem[]).map((item) => ({ ...item }));

    const overrides: Record<string, { auto: number; manual: number }> = {};

    const deleted = itemChanges.deleted || [];
    if (deleted.length > 0) {
      const deletedSet = new Set(deleted);
      const toDelete = currentItems.filter((item) => deletedSet.has(item.nomenclatureId));
      for (const item of toDelete) {
        auditChanges.push({
          type: 'ITEM_DELETED',
          item: {
            nomenclatureId: item.nomenclatureId,
            nomenclatureName: item.nomenclatureName,
            quantity: item.quantity,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.totalPrice,
          },
        });
      }
      currentItems = currentItems.filter((item) => !deletedSet.has(item.nomenclatureId));
    }

    const added = itemChanges.added || [];
    for (const addItem of added) {
      const newItem: EstimateItem = {
        category: addItem.category,
        nomenclatureId: addItem.nomenclatureId,
        nomenclatureName: addItem.nomenclatureName,
        quantity: addItem.quantity,
        unit: addItem.unit,
        pricePerUnit: addItem.pricePerUnit,
        totalPrice: addItem.quantity * addItem.pricePerUnit,
      };
      currentItems.push(newItem);
      auditChanges.push({ type: 'ITEM_ADDED', item: { ...addItem, totalPrice: newItem.totalPrice } });
    }

    const quantityOverrides = itemChanges.quantityOverrides || [];
    if (quantityOverrides.length > 0) {
      const overrideMap = new Map<string, number>();
      for (const o of quantityOverrides) {
        overrideMap.set(o.nomenclatureId, o.quantity);
      }

      currentItems = currentItems.map((item) => {
        const newQty = overrideMap.get(item.nomenclatureId);
        if (newQty !== undefined && newQty !== item.quantity) {
          overrides[item.nomenclatureId] = { auto: item.quantity, manual: newQty };
          auditChanges.push({
            type: 'QUANTITY_OVERRIDDEN',
            nomenclatureId: item.nomenclatureId,
            nomenclatureName: item.nomenclatureName,
            autoQuantity: item.quantity,
            manualQuantity: newQty,
          });
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.pricePerUnit,
          };
        }
        return item;
      });
    }

    const totals = recalcTotals(currentItems);

    const adminEstimate = await prisma.$transaction(async (tx) => {
      const estimate = await tx.gateEstimate.create({
        data: {
          id: `admin-gate-${crypto.randomUUID()}`,
          height: sourceEstimate.height,
          needsInstallation: sourceEstimate.needsInstallation,
          materialsTotal: totals.materialsTotal,
          installationTotal: totals.installationTotal,
          grandTotal: totals.grandTotal,
          items: JSON.parse(JSON.stringify(currentItems)),
          isEditedByAdmin: true,
          sourceEstimateId,
          editedByAdminId: adminUserId,
          editedAt: new Date(),
          editComment: editComment ?? null,
          manualQuantityOverrides: Object.keys(overrides).length > 0 ? overrides : Prisma.JsonNull,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          adminGateEstimateId: estimate.id,
          calculatedCost: totals.grandTotal,
        },
      });

      return estimate;
    });

    createAuditLogAsync({
      userId: adminUserId,
      action: 'CREATE_ADMIN_GATE_ESTIMATE',
      entityType: 'GateEstimate',
      entityId: adminEstimate.id,
      details: {
        changes: auditChanges as unknown as Prisma.InputJsonValue,
        originalEstimateId: sourceEstimateId,
        adminEstimateId: adminEstimate.id,
        editComment: editComment ?? null,
      } as unknown as Prisma.InputJsonValue,
    });

    return this.formatResult(adminEstimate);
  }

  async updateAdminEstimate(
    adminEstimateId: string,
    adminUserId: string,
    input: UpdateAdminEstimateInput
  ): Promise<GateAdminEstimateResult> {
    const existing = await prisma.gateEstimate.findUnique({
      where: { id: adminEstimateId },
    });

    if (!existing) {
      throw new Error('Admin estimate not found');
    }
    if (!existing.isEditedByAdmin) {
      throw new Error('Specified estimate is not an admin estimate');
    }

    const { editComment, items: itemChanges } = input;

    const auditChanges: AuditChange[] = [];
    let currentItems: EstimateItem[] = (existing.items as unknown as EstimateItem[]).map((item) => ({ ...item }));

    const overrides: Record<string, { auto: number; manual: number }> =
      (existing.manualQuantityOverrides as Record<string, { auto: number; manual: number }>) ?? {};

    const deleted = itemChanges.deleted || [];
    if (deleted.length > 0) {
      const deletedSet = new Set(deleted);
      const toDelete = currentItems.filter((item) => deletedSet.has(item.nomenclatureId));
      for (const item of toDelete) {
        auditChanges.push({
          type: 'ITEM_DELETED',
          item: {
            nomenclatureId: item.nomenclatureId,
            nomenclatureName: item.nomenclatureName,
            quantity: item.quantity,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.totalPrice,
          },
        });
      }
      currentItems = currentItems.filter((item) => !deletedSet.has(item.nomenclatureId));
    }

    const added = itemChanges.added || [];
    for (const addItem of added) {
      const newItem: EstimateItem = {
        category: addItem.category,
        nomenclatureId: addItem.nomenclatureId,
        nomenclatureName: addItem.nomenclatureName,
        quantity: addItem.quantity,
        unit: addItem.unit,
        pricePerUnit: addItem.pricePerUnit,
        totalPrice: addItem.quantity * addItem.pricePerUnit,
      };
      currentItems.push(newItem);
      auditChanges.push({ type: 'ITEM_ADDED', item: { ...addItem, totalPrice: newItem.totalPrice } });
    }

    const quantityOverrides = itemChanges.quantityOverrides || [];
    if (quantityOverrides.length > 0) {
      const overrideMap = new Map<string, number>();
      for (const o of quantityOverrides) {
        overrideMap.set(o.nomenclatureId, o.quantity);
      }

      currentItems = currentItems.map((item) => {
        const newQty = overrideMap.get(item.nomenclatureId);
        if (newQty !== undefined && newQty !== item.quantity) {
          overrides[item.nomenclatureId] = { auto: item.quantity, manual: newQty };
          auditChanges.push({
            type: 'QUANTITY_OVERRIDDEN',
            nomenclatureId: item.nomenclatureId,
            nomenclatureName: item.nomenclatureName,
            autoQuantity: item.quantity,
            manualQuantity: newQty,
          });
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.pricePerUnit,
          };
        }
        return item;
      });
    }

    const totals = recalcTotals(currentItems);

    const updated = await prisma.$transaction(async (tx) => {
      const estimate = await tx.gateEstimate.update({
        where: { id: adminEstimateId },
        data: {
          materialsTotal: totals.materialsTotal,
          installationTotal: totals.installationTotal,
          grandTotal: totals.grandTotal,
          items: JSON.parse(JSON.stringify(currentItems)),
          editedAt: new Date(),
          editedByAdminId: adminUserId,
          editComment: editComment !== undefined ? editComment ?? null : existing.editComment,
          manualQuantityOverrides: Object.keys(overrides).length > 0 ? overrides : Prisma.JsonNull,
        },
      });

      const relatedOrder = await tx.order.findFirst({
        where: { adminGateEstimateId: adminEstimateId },
        select: { id: true },
      });

      if (relatedOrder) {
        await tx.order.update({
          where: { id: relatedOrder.id },
          data: { calculatedCost: totals.grandTotal },
        });
      }

      return estimate;
    });

    createAuditLogAsync({
      userId: adminUserId,
      action: 'UPDATE_ADMIN_GATE_ESTIMATE',
      entityType: 'GateEstimate',
      entityId: adminEstimateId,
      details: {
        changes: auditChanges as unknown as Prisma.InputJsonValue,
        adminEstimateId,
        editComment: editComment ?? null,
      } as unknown as Prisma.InputJsonValue,
    });

    return this.formatResult(updated);
  }

  async getAdminEstimateForOrder(orderId: string): Promise<GateAdminEstimateResult | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { adminGateEstimateId: true },
    });

    if (!order || !order.adminGateEstimateId) {
      return null;
    }

    const adminEstimate = await prisma.gateEstimate.findUnique({
      where: { id: order.adminGateEstimateId },
      include: { editedByAdmin: { select: { id: true, name: true, email: true } } },
    });

    if (!adminEstimate) {
      return null;
    }

    return this.formatResult(adminEstimate);
  }

  async getAdminCorrectionForEstimate(sourceEstimateId: string): Promise<GateAdminEstimateResult | null> {
    const correction = await prisma.gateEstimate.findFirst({
      where: {
        sourceEstimateId,
        isEditedByAdmin: true,
      },
      orderBy: { editedAt: 'desc' },
      include: { editedByAdmin: { select: { id: true, name: true, email: true } } },
    });

    if (!correction) {
      return null;
    }

    return this.formatResult(correction);
  }

  private formatResult(estimate: {
    id: string;
    height: number;
    needsInstallation: boolean;
    items: unknown;
    materialsTotal: number;
    installationTotal: number;
    grandTotal: number;
    isEditedByAdmin: boolean;
    sourceEstimateId: string | null;
    editedByAdminId: string | null;
    editedAt: Date | null;
    editComment: string | null;
    manualQuantityOverrides: unknown;
    createdAt: Date;
    editedByAdmin?: { id: string; name: string | null; email: string } | null;
  }): GateAdminEstimateResult {
    return {
      id: estimate.id,
      height: estimate.height,
      needsInstallation: estimate.needsInstallation,
      items: (estimate.items as EstimateItem[]).map((item) => ({ ...item })),
      materialsTotal: estimate.materialsTotal,
      installationTotal: estimate.installationTotal,
      grandTotal: estimate.grandTotal,
      isEditedByAdmin: estimate.isEditedByAdmin,
      sourceEstimateId: estimate.sourceEstimateId,
      editedByAdminId: estimate.editedByAdminId,
      editedAt: estimate.editedAt?.toISOString() ?? null,
      editComment: estimate.editComment,
      manualQuantityOverrides: estimate.manualQuantityOverrides as Record<string, { auto: number; manual: number }> | null,
      editedByAdmin: estimate.editedByAdmin ?? undefined,
      createdAt: estimate.createdAt.toISOString(),
    };
  }
}

export const gateEstimateEditorService = new GateEstimateEditorService();
