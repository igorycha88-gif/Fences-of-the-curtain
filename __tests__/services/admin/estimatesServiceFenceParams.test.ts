import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    fenceEstimate: {
      findFirst: jest.fn(),
    },
    meshType: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/audit', () => ({
  createAuditLogAsync: jest.fn(),
}));

jest.mock('@/services/admin/ipLookupService', () => ({
  getCityByIP: jest.fn().mockResolvedValue(null),
}));

import { prisma } from '@/lib/prisma';
import { estimatesService } from '@/services/admin/estimatesService';

const createBaseEstimate = (overrides: Record<string, unknown> = {}) => ({
  id: 'est-1',
  createdAt: new Date('2026-11-03T10:00:00.000Z'),
  fenceTypeId: 'ft-1',
  fenceType: { id: 'ft-1', name: 'Евроштакетник' },
  user: null,
  length: 50,
  height: 2,
  lagRows: 2,
  coating: 'POLYMER_SINGLE',
  gateType: 'SWING',
  gateLength: 3500,
  gateNomenclatureName: 'Ворота распашные',
  hasGate: true,
  gateTotal: 30000,
  gateInstallationTotal: 5000,
  hasWicket: false,
  wicketWidth: null,
  wicketNomenclatureName: null,
  wicketTotal: 0,
  wicketInstallationTotal: 0,
  postsTotal: 30000,
  lagsTotal: 15000,
  profnastilTotal: 0,
  mountingHardwareTotal: 5000,
  installationTotal: 40000,
  materialsTotal: 80000,
  grandTotal: 120000,
  picketStep: null,
  picketMountingType: null,
  picketProfileType: null,
  picketCoatingName: null,
  picketNomenclatureName: null,
  meshId: null,
  meshNomenclatureName: null,
  hasAutomation: false,
  automationNomenclatureName: null,
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0',
  city: 'Москва',
  items: [
    { category: 'picket', nomenclatureId: 'p1', nomenclatureName: 'Штакетник', quantity: 400, unit: 'шт', pricePerUnit: 120, totalPrice: 48000 },
    { category: 'installation', nomenclatureId: 'w1', nomenclatureName: 'Монтаж забора', quantity: 50, unit: 'м.п.', pricePerUnit: 800, totalPrice: 40000 },
  ],
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('estimatesService.getEstimateByIdWithMargin fence params', () => {
  it('should return picket params (chess mounting, step, profile)', async () => {
    (prisma.fenceEstimate.findFirst as any).mockResolvedValue(
      createBaseEstimate({
        picketMountingType: 'CHESS',
        picketStep: 6,
        picketProfileType: 'М-образный',
        picketNomenclatureName: 'Евроштакетник М-образный',
      })
    );

    const result = await estimatesService.getEstimateByIdWithMargin('est-1', false);

    expect(result).not.toBeNull();
    expect(result!.picketMountingType).toBe('CHESS');
    expect(result!.picketStep).toBe(6);
    expect(result!.picketProfileType).toBe('М-образный');
    expect(result!.picketNomenclatureName).toBe('Евроштакетник М-образный');
    expect(result!.gateType).toBe('SWING');
    expect(prisma.meshType.findUnique).not.toHaveBeenCalled();
  });

  it('should return mesh params fetched by meshId', async () => {
    (prisma.fenceEstimate.findFirst as any).mockResolvedValue(
      createBaseEstimate({
        fenceType: { id: 'ft-2', name: 'Сетка-рабица' },
        meshId: 'mesh-1',
        meshNomenclatureName: 'Сетка-рабица оцинк. 50/2.5',
      })
    );
    (prisma.meshType.findUnique as any).mockResolvedValue({
      coating: 'Оцинковка',
      cellSize: 50,
      wireThickness: 2.5,
    });

    const result = await estimatesService.getEstimateByIdWithMargin('est-1', false);

    expect(prisma.meshType.findUnique).toHaveBeenCalledWith({
      where: { id: 'mesh-1' },
      select: { coating: true, cellSize: true, wireThickness: true },
    });
    expect(result!.meshCoating).toBe('Оцинковка');
    expect(result!.meshCellSize).toBe(50);
    expect(result!.meshWireThickness).toBe(2.5);
    expect(result!.meshNomenclatureName).toBe('Сетка-рабица оцинк. 50/2.5');
  });

  it('should return null mesh params when mesh record is missing', async () => {
    (prisma.fenceEstimate.findFirst as any).mockResolvedValue(
      createBaseEstimate({ meshId: 'mesh-deleted' })
    );
    (prisma.meshType.findUnique as any).mockResolvedValue(null);

    const result = await estimatesService.getEstimateByIdWithMargin('est-1', false);

    expect(result).not.toBeNull();
    expect(result!.meshCoating).toBeNull();
    expect(result!.meshCellSize).toBeNull();
    expect(result!.meshWireThickness).toBeNull();
  });

  it('should not fail when mesh fetch throws (graceful degradation)', async () => {
    (prisma.fenceEstimate.findFirst as any).mockResolvedValue(
      createBaseEstimate({ meshId: 'mesh-1' })
    );
    (prisma.meshType.findUnique as any).mockRejectedValue(new Error('DB down'));

    const result = await estimatesService.getEstimateByIdWithMargin('est-1', false);

    expect(result).not.toBeNull();
    expect(result!.meshCoating).toBeNull();
    expect(result!.grandTotal).toBe(120000);
  });

  it('should return automation params when set', async () => {
    (prisma.fenceEstimate.findFirst as any).mockResolvedValue(
      createBaseEstimate({
        hasAutomation: true,
        automationNomenclatureName: 'Привод Doorhan SLIDE 350',
      })
    );

    const result = await estimatesService.getEstimateByIdWithMargin('est-1', false);

    expect(result!.hasAutomation).toBe(true);
    expect(result!.automationNomenclatureName).toBe('Привод Doorhan SLIDE 350');
  });

  it('should return null for unknown estimate id', async () => {
    (prisma.fenceEstimate.findFirst as any).mockResolvedValue(null);

    const result = await estimatesService.getEstimateByIdWithMargin('missing', false);

    expect(result).toBeNull();
  });
});
