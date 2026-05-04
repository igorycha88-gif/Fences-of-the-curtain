import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    fenceEstimate: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/services/calculator/fenceEstimateService', () => ({
  calculateFenceEstimateDryRun: jest.fn<any>().mockResolvedValue({
    items: [
      { category: 'posts', nomenclatureId: 'n1', nomenclatureName: 'Столб', quantity: 10, unit: 'шт', pricePerUnit: 500, totalPrice: 5000 },
      { category: 'installation', nomenclatureId: 'n2', nomenclatureName: 'Монтаж', quantity: 10, unit: 'пог.м', pricePerUnit: 300, totalPrice: 3000 },
    ],
    totals: { grandTotal: 8000 },
  }),
}));

jest.mock('@/lib/audit', () => ({
  createAuditLogAsync: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { EstimateEditorService } from '@/services/admin/estimateEditorService';

const mockAdminEstimate: any = {
  id: 'admin-est-1',
  fenceTypeId: 'ft-1',
  length: 20,
  height: 2,
  lagRows: 2,
  coating: 'GALVANIZED',
  items: [
    { category: 'posts', nomenclatureId: 'n1', nomenclatureName: 'Столб', quantity: 10, unit: 'шт', pricePerUnit: 500, totalPrice: 5000 },
    { category: 'installation', nomenclatureId: 'n2', nomenclatureName: 'Монтаж', quantity: 10, unit: 'пог.м', pricePerUnit: 300, totalPrice: 3000 },
  ],
  materialsTotal: 5000,
  installationTotal: 3000,
  grandTotal: 8000,
  isEditedByAdmin: true,
  sourceEstimateId: 'source-est-deleted',
  editedByAdminId: 'admin-1',
  editedAt: new Date(),
  editComment: null,
  manualQuantityOverrides: null,
  createdAt: new Date(),
  fenceType: { id: 'ft-1', name: 'Профнастил' },
  sourceEstimate: null,
  hasGate: false,
  gateType: null,
  gateLength: null,
  hasWicket: false,
  wicketWidth: null,
  picketStep: null,
  picketMountingType: null,
  picketProfileType: null,
  picketCoatingName: null,
};

function setupTxMock() {
  (prisma.$transaction as any).mockImplementation(async (fn: any) => {
    const tx: any = {
      fenceEstimate: {
        update: jest.fn<any>().mockResolvedValue(mockAdminEstimate),
      },
      order: {
        findFirst: jest.fn<any>().mockResolvedValue({ id: 'order-1', multiEstimateId: null }),
        update: jest.fn<any>(),
      },
    };
    return fn(tx);
  });
}

describe('EstimateEditorService - updateAdminEstimate with missing sourceEstimate', () => {
  let service: EstimateEditorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EstimateEditorService();
  });

  it('should succeed when sourceEstimate is null (deleted source)', async () => {
    (prisma.fenceEstimate.findUnique as any).mockResolvedValue(mockAdminEstimate);
    setupTxMock();

    const result = await service.updateAdminEstimate(
      'admin-est-1',
      'admin-1',
      {
        sourceEstimateId: 'admin-est-1',
        items: {},
      }
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('admin-est-1');
  });

  it('should succeed with parameter changes when sourceEstimate is null', async () => {
    (prisma.fenceEstimate.findUnique as any).mockResolvedValue(mockAdminEstimate);
    setupTxMock();

    const result = await service.updateAdminEstimate(
      'admin-est-1',
      'admin-1',
      {
        sourceEstimateId: 'admin-est-1',
        parameters: { length: 25 },
        items: {},
      }
    );

    expect(result).toBeDefined();
  });

  it('should throw if admin estimate itself not found', async () => {
    (prisma.fenceEstimate.findUnique as any).mockResolvedValue(null);

    await expect(
      service.updateAdminEstimate('nonexistent', 'admin-1', {
        sourceEstimateId: 'nonexistent',
        items: {},
      })
    ).rejects.toThrow('Admin estimate not found');
  });
});
