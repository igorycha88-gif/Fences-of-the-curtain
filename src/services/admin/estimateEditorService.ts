import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { calculateFenceEstimateDryRun } from '@/services/calculator/fenceEstimateService';
import { createAuditLogAsync } from '@/lib/audit';
import type {
  CreateAdminEstimateInput,
  UpdateAdminEstimateInput,
  RecalculateEstimateInput,
  AddedItem,
  QuantityOverride,
} from '@/lib/validators/adminEstimate';
import type { FenceEstimateInput } from '@/lib/validators/fenceEstimate';

interface EstimateItem {
  category: string;
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

interface AdminEstimateResult {
  id: string;
  fenceTypeId: string;
  length: number;
  height: number;
  lagRows: number;
  coating: string;
  items: EstimateItem[];
  materialsTotal: number;
  installationTotal: number;
  grandTotal: number;
  isEditedByAdmin: boolean;
  sourceEstimateId: string;
  editedByAdminId: string;
  editedAt: string;
  editComment: string | null;
  manualQuantityOverrides: Record<string, { auto: number; manual: number }> | null;
  createdAt: string;
}

interface RecalculateResult {
  items: EstimateItem[];
  materialsTotal: number;
  installationTotal: number;
  grandTotal: number;
}

type AuditChange =
  | { type: 'PARAMETER_CHANGED'; field: string; oldValue: unknown; newValue: unknown }
  | { type: 'QUANTITY_OVERRIDDEN'; nomenclatureId: string; nomenclatureName: string; autoQuantity: number; manualQuantity: number }
  | { type: 'ITEM_ADDED'; item: AddedItem & { totalPrice: number } }
  | { type: 'ITEM_DELETED'; item: { nomenclatureId: string; nomenclatureName: string; quantity: number; unit: string; pricePerUnit: number; totalPrice: number } };

export class EstimateEditorService {
  async recalculateWithParams(input: RecalculateEstimateInput): Promise<RecalculateResult> {
    const { estimateId, parameters } = input;

    const sourceEstimate = await prisma.fenceEstimate.findUnique({
      where: { id: estimateId },
      include: { fenceType: true },
    });

    if (!sourceEstimate) {
      throw new Error('Source estimate not found');
    }

    const mergedParams = this.buildMergedParams(sourceEstimate, parameters);
    const dryRunResult = await calculateFenceEstimateDryRun(mergedParams);

    const materialsTotal = dryRunResult.items
      .filter((i) => i.category !== 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);
    const installationTotal = dryRunResult.items
      .filter((i) => i.category === 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);

    return {
      items: dryRunResult.items as EstimateItem[],
      materialsTotal,
      installationTotal,
      grandTotal: dryRunResult.totals.grandTotal,
    };
  }

  async createAdminEstimate(
    orderId: string,
    adminUserId: string,
    input: CreateAdminEstimateInput
  ): Promise<AdminEstimateResult> {
    const { sourceEstimateId, editComment, parameters, items: itemChanges } = input;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, multiEstimateId: true, adminEstimateId: true },
    });
    if (!order) {
      throw new Error('Order not found');
    }

    const isMultiEstimate = !!order.multiEstimateId;

    const sourceEstimate = await prisma.fenceEstimate.findUnique({
      where: { id: sourceEstimateId },
      include: { fenceType: true },
    });
    if (!sourceEstimate) {
      throw new Error('Source estimate not found');
    }

    const auditChanges: AuditChange[] = [];

    let currentItems: EstimateItem[];

    if (parameters && Object.keys(parameters).length > 0) {
      const mergedParams = this.buildMergedParams(sourceEstimate, parameters);
      const dryRunResult = await calculateFenceEstimateDryRun(mergedParams);
      currentItems = dryRunResult.items as EstimateItem[];

      const paramFields = ['length', 'height', 'coating', 'lagRows', 'hasGate', 'gateType', 'gateWidth', 'hasWicket', 'wicketWidth'] as const;
      for (const field of paramFields) {
        if (parameters[field] !== undefined) {
          const oldValue = (sourceEstimate as any)[field];
          const newValue = parameters[field];
          if (oldValue !== newValue) {
            auditChanges.push({ type: 'PARAMETER_CHANGED', field, oldValue, newValue });
          }
        }
      }
    } else {
      currentItems = (sourceEstimate.items as unknown as EstimateItem[]).map((item) => ({ ...item }));
    }

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

    const materialsTotal = currentItems
      .filter((i) => i.category !== 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);
    const installationTotal = currentItems
      .filter((i) => i.category === 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);
    const grandTotal = materialsTotal + installationTotal;

    const adminEstimate = await prisma.$transaction(async (tx) => {
      const estimate = await tx.fenceEstimate.create({
        data: {
          id: `admin-estimate-${crypto.randomUUID()}`,
          fenceTypeId: sourceEstimate.fenceTypeId,
          length: parameters?.length ?? sourceEstimate.length,
          height: parameters?.height ?? sourceEstimate.height,
          lagRows: parameters?.lagRows ?? sourceEstimate.lagRows,
          coating: parameters?.coating ?? sourceEstimate.coating,
          postsTotal: currentItems.find((i) => i.category === 'posts')?.totalPrice ?? 0,
          lagsTotal: currentItems.find((i) => i.category === 'lags')?.totalPrice ?? 0,
          profnastilTotal: currentItems.find((i) => i.category === 'profnastil')?.totalPrice ?? 0,
          mountingHardwareTotal: currentItems
            .filter((i) => i.category === 'mounting_hardware')
            .reduce((s, i) => s + i.totalPrice, 0),
          gateTotal: currentItems.find((i) => i.category === 'gates')?.totalPrice ?? 0,
          gateInstallationTotal: currentItems
            .filter((i) => i.category === 'installation' && i.nomenclatureName.toLowerCase().includes('ворот'))
            .reduce((s, i) => s + i.totalPrice, 0),
          hasGate: parameters?.hasGate ?? sourceEstimate.hasGate,
          gateType: parameters?.gateType ?? sourceEstimate.gateType,
          gateLength: parameters?.gateWidth ? Math.round(parameters.gateWidth * 1000) : sourceEstimate.gateLength,
          gateNomenclatureId: sourceEstimate.gateNomenclatureId,
          gateNomenclatureName: sourceEstimate.gateNomenclatureName,
          hasWicket: parameters?.hasWicket ?? sourceEstimate.hasWicket,
          wicketWidth: parameters?.wicketWidth ? Math.round(parameters.wicketWidth * 1000) : sourceEstimate.wicketWidth,
          wicketNomenclatureId: sourceEstimate.wicketNomenclatureId,
          wicketNomenclatureName: sourceEstimate.wicketNomenclatureName,
          wicketTotal: currentItems.find((i) => i.category === 'wickets')?.totalPrice ?? 0,
          wicketInstallationTotal: currentItems
            .filter((i) => i.category === 'installation' && i.nomenclatureName.toLowerCase().includes('калитк'))
            .reduce((s, i) => s + i.totalPrice, 0),
          panel3dId: sourceEstimate.panel3dId,
          panel3dNomenclatureName: sourceEstimate.panel3dNomenclatureName,
          panel3dTotal: currentItems.find((i) => i.category === 'panel3d')?.totalPrice ?? 0,
          panel3dInstallationTotal: currentItems
            .filter((i) => i.category === 'installation' && i.nomenclatureName.toLowerCase().includes('панел'))
            .reduce((s, i) => s + i.totalPrice, 0),
          picketNomenclatureId: sourceEstimate.picketNomenclatureId,
          picketNomenclatureName: sourceEstimate.picketNomenclatureName,
          picketTotal: currentItems.find((i) => i.category === 'picket')?.totalPrice ?? 0,
          picketStep: parameters?.picketStep ?? sourceEstimate.picketStep,
          picketMountingType: parameters?.picketMountingType ?? sourceEstimate.picketMountingType,
          picketProfileType: parameters?.picketProfileType ?? sourceEstimate.picketProfileType,
          picketCoatingName: parameters?.picketCoating ?? sourceEstimate.picketCoatingName,
          installationTotal,
          materialsTotal,
          grandTotal,
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
          ...(isMultiEstimate
            ? {}
            : { adminEstimateId: estimate.id }),
        },
      });

      return estimate;
    });

    createAuditLogAsync({
      userId: adminUserId,
      action: 'CREATE_ADMIN_ESTIMATE',
      entityType: 'FenceEstimate',
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
  ): Promise<AdminEstimateResult> {
    const existing = await prisma.fenceEstimate.findUnique({
      where: { id: adminEstimateId },
      include: { fenceType: true, sourceEstimate: true },
    });

    if (!existing) {
      throw new Error('Admin estimate not found');
    }
    if (!existing.isEditedByAdmin) {
      throw new Error('Specified estimate is not an admin estimate');
    }

    const sourceEstimate = existing.sourceEstimate;
    if (!sourceEstimate) {
      throw new Error('Source estimate not found for admin estimate');
    }

    const { editComment, parameters, items: itemChanges } = input;

    const auditChanges: AuditChange[] = [];
    let currentItems: EstimateItem[];

    if (parameters && Object.keys(parameters).length > 0) {
      const mergedParams = this.buildMergedParams(sourceEstimate, parameters);
      const dryRunResult = await calculateFenceEstimateDryRun(mergedParams);
      currentItems = dryRunResult.items as EstimateItem[];

      const paramFields = ['length', 'height', 'coating', 'lagRows', 'hasGate', 'gateType', 'gateWidth', 'hasWicket', 'wicketWidth'] as const;
      for (const field of paramFields) {
        if (parameters[field] !== undefined) {
          const oldValue = (existing as any)[field];
          const newValue = parameters[field];
          if (oldValue !== newValue) {
            auditChanges.push({ type: 'PARAMETER_CHANGED', field, oldValue, newValue });
          }
        }
      }
    } else {
      currentItems = (existing.items as unknown as EstimateItem[]).map((item) => ({ ...item }));
    }

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

    const materialsTotal = currentItems
      .filter((i) => i.category !== 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);
    const installationTotal = currentItems
      .filter((i) => i.category === 'installation')
      .reduce((sum, i) => sum + i.totalPrice, 0);
    const grandTotal = materialsTotal + installationTotal;

    const updated = await prisma.$transaction(async (tx) => {
      const estimate = await tx.fenceEstimate.update({
        where: { id: adminEstimateId },
        data: {
          length: parameters?.length ?? existing.length,
          height: parameters?.height ?? existing.height,
          lagRows: parameters?.lagRows ?? existing.lagRows,
          coating: parameters?.coating ?? existing.coating,
          postsTotal: currentItems.find((i) => i.category === 'posts')?.totalPrice ?? 0,
          lagsTotal: currentItems.find((i) => i.category === 'lags')?.totalPrice ?? 0,
          profnastilTotal: currentItems.find((i) => i.category === 'profnastil')?.totalPrice ?? 0,
          mountingHardwareTotal: currentItems
            .filter((i) => i.category === 'mounting_hardware')
            .reduce((s, i) => s + i.totalPrice, 0),
          gateTotal: currentItems.find((i) => i.category === 'gates')?.totalPrice ?? 0,
          gateInstallationTotal: currentItems
            .filter((i) => i.category === 'installation' && i.nomenclatureName.toLowerCase().includes('ворот'))
            .reduce((s, i) => s + i.totalPrice, 0),
          hasGate: parameters?.hasGate ?? existing.hasGate,
          gateType: parameters?.gateType ?? existing.gateType,
          gateLength: parameters?.gateWidth ? Math.round(parameters.gateWidth * 1000) : existing.gateLength,
          hasWicket: parameters?.hasWicket ?? existing.hasWicket,
          wicketWidth: parameters?.wicketWidth ? Math.round(parameters.wicketWidth * 1000) : existing.wicketWidth,
          wicketTotal: currentItems.find((i) => i.category === 'wickets')?.totalPrice ?? 0,
          wicketInstallationTotal: currentItems
            .filter((i) => i.category === 'installation' && i.nomenclatureName.toLowerCase().includes('калитк'))
            .reduce((s, i) => s + i.totalPrice, 0),
          panel3dTotal: currentItems.find((i) => i.category === 'panel3d')?.totalPrice ?? 0,
          panel3dInstallationTotal: currentItems
            .filter((i) => i.category === 'installation' && i.nomenclatureName.toLowerCase().includes('панел'))
            .reduce((s, i) => s + i.totalPrice, 0),
          picketTotal: currentItems.find((i) => i.category === 'picket')?.totalPrice ?? 0,
          installationTotal,
          materialsTotal,
          grandTotal,
          items: JSON.parse(JSON.stringify(currentItems)),
          editedAt: new Date(),
          editComment: editComment !== undefined ? editComment ?? null : existing.editComment,
          manualQuantityOverrides: Object.keys(overrides).length > 0 ? overrides : Prisma.JsonNull,
        },
      });

      const relatedOrder = await tx.order.findFirst({
        where: { adminEstimateId: adminEstimateId },
        select: { id: true, multiEstimateId: true },
      });

      if (relatedOrder && !relatedOrder.multiEstimateId) {
        await tx.order.update({
          where: { id: relatedOrder.id },
          data: { calculatedCost: grandTotal },
        });
      }

      return estimate;
    });

    createAuditLogAsync({
      userId: adminUserId,
      action: 'UPDATE_ADMIN_ESTIMATE',
      entityType: 'FenceEstimate',
      entityId: adminEstimateId,
      details: {
        changes: auditChanges as unknown as Prisma.InputJsonValue,
        adminEstimateId,
        editComment: editComment ?? null,
      } as unknown as Prisma.InputJsonValue,
    });

    return this.formatResult(updated);
  }

  async getAdminEstimateForOrder(orderId: string): Promise<AdminEstimateResult | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { adminEstimateId: true },
    });

    if (!order || !order.adminEstimateId) {
      return null;
    }

    const adminEstimate = await prisma.fenceEstimate.findUnique({
      where: { id: order.adminEstimateId },
    });

    if (!adminEstimate) {
      return null;
    }

    return this.formatResult(adminEstimate);
  }

  async getAdminCorrectionForEstimate(sourceEstimateId: string): Promise<AdminEstimateResult | null> {
    const correction = await prisma.fenceEstimate.findFirst({
      where: {
        sourceEstimateId,
        isEditedByAdmin: true,
      },
      orderBy: { editedAt: 'desc' },
    });

    if (!correction) {
      return null;
    }

    return this.formatResult(correction);
  }

  private buildMergedParams(
    source: {
      fenceTypeId: string;
      length: number;
      height: number;
      lagRows: number;
      coating: string;
      hasGate: boolean;
      gateType: string | null;
      gateLength: number | null;
      hasWicket: boolean;
      wicketWidth: number | null;
      picketStep: number | null;
      picketMountingType: string | null;
      picketProfileType: string | null;
      picketCoatingName: string | null;
    },
    newParams: Partial<FenceEstimateInput>
  ): FenceEstimateInput {
    return {
      fenceTypeId: source.fenceTypeId,
      length: newParams.length ?? source.length,
      height: newParams.height ?? source.height,
      lagRows: newParams.lagRows ?? (source.lagRows as 2 | 3),
      coating: (newParams.coating ?? source.coating) as 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE',
      hasGate: newParams.hasGate ?? source.hasGate,
      gateType: (newParams.gateType ?? source.gateType ?? undefined) as 'SWING' | 'SLIDING' | undefined,
      gateWidth: newParams.gateWidth ?? (source.gateLength ? source.gateLength / 1000 : undefined),
      hasWicket: newParams.hasWicket ?? source.hasWicket,
      wicketWidth: newParams.wicketWidth ?? (source.wicketWidth ? source.wicketWidth / 1000 : undefined),
      picketStep: newParams.picketStep ?? source.picketStep ?? undefined,
      picketMountingType: (newParams.picketMountingType ?? source.picketMountingType ?? undefined) as 'SINGLE' | 'CHESS' | undefined,
      picketProfileType: newParams.picketProfileType ?? source.picketProfileType ?? undefined,
      picketCoating: newParams.picketCoating ?? source.picketCoatingName ?? undefined,
    };
  }

  private formatResult(estimate: {
    id: string;
    fenceTypeId: string;
    length: number;
    height: number;
    lagRows: number;
    coating: string;
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
  }): AdminEstimateResult {
    return {
      id: estimate.id,
      fenceTypeId: estimate.fenceTypeId,
      length: estimate.length,
      height: estimate.height,
      lagRows: estimate.lagRows,
      coating: estimate.coating,
      items: (estimate.items as EstimateItem[]).map((item) => ({ ...item })),
      materialsTotal: estimate.materialsTotal,
      installationTotal: estimate.installationTotal,
      grandTotal: estimate.grandTotal,
      isEditedByAdmin: estimate.isEditedByAdmin,
      sourceEstimateId: estimate.sourceEstimateId ?? '',
      editedByAdminId: estimate.editedByAdminId ?? '',
      editedAt: estimate.editedAt?.toISOString() ?? '',
      editComment: estimate.editComment,
      manualQuantityOverrides: estimate.manualQuantityOverrides as Record<string, { auto: number; manual: number }> | null,
      createdAt: estimate.createdAt.toISOString(),
    };
  }
}

export const estimateEditorService = new EstimateEditorService();
