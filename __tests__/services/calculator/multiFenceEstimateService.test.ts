import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    multiFenceEstimate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    fenceEstimate: {
      update: jest.fn(),
    },
    $transaction: jest.fn((fn: any) => fn({
      multiFenceEstimate: {
        create: jest.fn(),
      },
      fenceEstimate: {
        update: jest.fn(),
      },
    })),
  },
}));

const mockCalculateFenceEstimate = jest.fn();
jest.mock('@/services/calculator/fenceEstimateService', () => ({
  calculateFenceEstimate: (...args: any[]) => mockCalculateFenceEstimate(...args),
}));

jest.mock('@/services/admin/ipLookupService', () => ({
  getCityByIP: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/audit', () => ({
  createAuditLogAsync: jest.fn().mockResolvedValue(undefined),
  getSystemUserId: jest.fn().mockResolvedValue('system-user-id'),
}));

import { prisma } from '@/lib/prisma';
import { calculateMultiFenceEstimate, getMultiFenceEstimateById } from '@/services/calculator/multiFenceEstimateService';

const mockPrisma = prisma as any;

const mockEstimateResult = {
  estimateId: 'est-1',
  items: [],
  totals: {
    materials: 50000,
    installation: 20000,
    grandTotal: 70000,
  },
  parameters: {
    fenceTypeId: 'ft-1',
    fenceTypeName: 'Профнастил',
    length: 30,
    height: 2,
    lagRows: 2 as 2 | 3,
    coating: 'POLYMER_SINGLE' as const,
  },
  calculatedAt: new Date().toISOString(),
};

const mockEstimateResult2 = {
  estimateId: 'est-2',
  items: [],
  totals: {
    materials: 30000,
    installation: 15000,
    grandTotal: 45000,
  },
  parameters: {
    fenceTypeId: 'ft-2',
    fenceTypeName: 'Евроштакетник',
    length: 20,
    height: 1.5,
    lagRows: 3 as 2 | 3,
    coating: 'GALVANIZED' as const,
  },
  calculatedAt: new Date().toISOString(),
};

describe('multiFenceEstimateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateMultiFenceEstimate — single estimate', () => {
    it('should calculate a single estimate and persist it', async () => {
      mockCalculateFenceEstimate.mockResolvedValue(mockEstimateResult);

      const mockMulti = {
        id: 'multi-1',
        totalMaterials: 50000,
        totalInstallation: 20000,
        grandTotal: 70000,
        estimatesCount: 1,
        createdAt: new Date(),
      };

      const txMultiCreate = jest.fn().mockResolvedValue(mockMulti);
      const txFenceUpdate = jest.fn().mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation(async (fn: any) =>
        fn({ multiFenceEstimate: { create: txMultiCreate }, fenceEstimate: { update: txFenceUpdate } })
      );

      const result = await calculateMultiFenceEstimate({
        estimates: [{ fenceTypeId: 'ft-1', length: 30, height: 2, lagRows: 2, coating: 'POLYMER_SINGLE' }],
      } as any);

      expect(result.multiEstimateId).toBe('multi-1');
      expect(result.estimates).toHaveLength(1);
      expect(result.totals.totalMaterials).toBe(50000);
      expect(result.totals.totalInstallation).toBe(20000);
      expect(result.totals.grandTotal).toBe(70000);
    });
  });

  describe('calculateMultiFenceEstimate — multiple estimates', () => {
    it('should sum totals from multiple estimates', async () => {
      mockCalculateFenceEstimate
        .mockResolvedValueOnce(mockEstimateResult)
        .mockResolvedValueOnce(mockEstimateResult2);

      const mockMulti = {
        id: 'multi-2',
        totalMaterials: 80000,
        totalInstallation: 35000,
        grandTotal: 115000,
        estimatesCount: 2,
        createdAt: new Date(),
      };

      const txMultiCreate = jest.fn().mockResolvedValue(mockMulti);
      const txFenceUpdate = jest.fn().mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation(async (fn: any) =>
        fn({ multiFenceEstimate: { create: txMultiCreate }, fenceEstimate: { update: txFenceUpdate } })
      );

      const result = await calculateMultiFenceEstimate({
        estimates: [
          { fenceTypeId: 'ft-1', length: 30, height: 2, lagRows: 2, coating: 'POLYMER_SINGLE' },
          { fenceTypeId: 'ft-2', length: 20, height: 1.5, lagRows: 3, coating: 'GALVANIZED' },
        ],
      } as any);

      expect(result.estimates).toHaveLength(2);
      expect(result.totals.totalMaterials).toBe(50000 + 30000);
      expect(result.totals.totalInstallation).toBe(20000 + 15000);
      expect(result.totals.grandTotal).toBe(70000 + 45000);
    });
  });

  describe('calculateMultiFenceEstimate — handles calculation error', () => {
    it('should throw ESTIMATE_CALCULATION_FAILED when an estimate fails', async () => {
      mockCalculateFenceEstimate.mockRejectedValue(new Error('Calculation error'));

      await expect(
        calculateMultiFenceEstimate({
          estimates: [{ fenceTypeId: 'ft-1', length: 30, height: 2, lagRows: 2, coating: 'POLYMER_SINGLE' }],
        } as any)
      ).rejects.toEqual({
        error: 'ESTIMATE_CALCULATION_FAILED',
        message: 'Ошибка расчета забора #1',
        details: {
          estimateIndex: 0,
          originalError: expect.any(Error),
        },
      });
    });

    it('should indicate correct estimate index on failure', async () => {
      mockCalculateFenceEstimate
        .mockResolvedValueOnce(mockEstimateResult)
        .mockRejectedValueOnce(new Error('Bad input'));

      await expect(
        calculateMultiFenceEstimate({
          estimates: [
            { fenceTypeId: 'ft-1', length: 30, height: 2, lagRows: 2, coating: 'POLYMER_SINGLE' },
            { fenceTypeId: 'ft-2', length: 20, height: 1.5, lagRows: 3, coating: 'GALVANIZED' },
          ],
        } as any)
      ).rejects.toEqual({
        error: 'ESTIMATE_CALCULATION_FAILED',
        message: 'Ошибка расчета забора #2',
        details: {
          estimateIndex: 1,
          originalError: expect.any(Error),
        },
      });
    });
  });

  describe('getMultiFenceEstimateById — returns data', () => {
    it('should return mapped result when estimate found', async () => {
      const mockDbResult = {
        id: 'multi-1',
        totalMaterials: 50000,
        totalInstallation: 20000,
        grandTotal: 70000,
        createdAt: new Date('2025-01-01'),
        estimates: [
          {
            id: 'est-1',
            items: [],
            materialsTotal: 50000,
            installationTotal: 20000,
            grandTotal: 70000,
            fenceTypeId: 'ft-1',
            length: 30,
            height: 2,
            lagRows: 2,
            coating: 'POLYMER_SINGLE',
            hasGate: false,
            gateType: null,
            gateLength: null,
            gateHeight: null,
            gateNomenclatureId: null,
            gateNomenclatureName: null,
            hasWicket: false,
            wicketWidth: null,
            wicketHeight: null,
            wicketNomenclatureId: null,
            wicketNomenclatureName: null,
            createdAt: new Date('2025-01-01'),
            fenceType: { name: 'Профнастил' },
          },
        ],
      };

      mockPrisma.multiFenceEstimate.findUnique.mockResolvedValue(mockDbResult);

      const result = await getMultiFenceEstimateById('multi-1');

      expect(result).not.toBeNull();
      expect(result!.multiEstimateId).toBe('multi-1');
      expect(result!.estimates).toHaveLength(1);
      expect(result!.totals.grandTotal).toBe(70000);
      expect(result!.calculatedAt).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('getMultiFenceEstimateById — returns null', () => {
    it('should return null when estimate not found', async () => {
      mockPrisma.multiFenceEstimate.findUnique.mockResolvedValue(null);

      const result = await getMultiFenceEstimateById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getMultiFenceEstimateById — with gate and wicket', () => {
    it('should map gate parameters when present', async () => {
      const mockDbResult = {
        id: 'multi-2',
        totalMaterials: 50000,
        totalInstallation: 20000,
        grandTotal: 70000,
        createdAt: new Date('2025-01-01'),
        estimates: [
          {
            id: 'est-1',
            items: [],
            materialsTotal: 50000,
            installationTotal: 20000,
            grandTotal: 70000,
            fenceTypeId: 'ft-1',
            length: 30,
            height: 2,
            lagRows: 2,
            coating: 'POLYMER_SINGLE',
            hasGate: true,
            gateType: 'SWING',
            gateLength: 4000,
            gateHeight: 2000,
            gateNomenclatureId: 'gate-nom-1',
            gateNomenclatureName: 'Ворота распашные 4м',
            hasWicket: true,
            wicketWidth: 1000,
            wicketHeight: 2000,
            wicketNomenclatureId: 'wick-nom-1',
            wicketNomenclatureName: 'Калитка 1м',
            createdAt: new Date('2025-01-01'),
            fenceType: { name: 'Профнастил' },
          },
        ],
      };

      mockPrisma.multiFenceEstimate.findUnique.mockResolvedValue(mockDbResult);

      const result = await getMultiFenceEstimateById('multi-2');

      expect(result).not.toBeNull();
      expect(result!.estimates[0].result.parameters.gate).toEqual({
        id: 'gate-nom-1',
        type: 'SWING',
        length: 4000,
        height: 2000,
        selectedName: 'Ворота распашные 4м',
      });
      expect(result!.estimates[0].result.parameters.wicket).toEqual({
        id: 'wick-nom-1',
        width: 1000,
        height: 2000,
        selectedName: 'Калитка 1м',
      });
    });
  });

  describe('calculateMultiFenceEstimate — with metadata', () => {
    it('should pass metadata to calculation and persist', async () => {
      mockCalculateFenceEstimate.mockResolvedValue(mockEstimateResult);

      const mockMulti = {
        id: 'multi-meta',
        totalMaterials: 50000,
        totalInstallation: 20000,
        grandTotal: 70000,
        estimatesCount: 1,
        createdAt: new Date(),
      };

      const txMultiCreate = jest.fn().mockResolvedValue(mockMulti);
      const txFenceUpdate = jest.fn().mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation(async (fn: any) =>
        fn({ multiFenceEstimate: { create: txMultiCreate }, fenceEstimate: { update: txFenceUpdate } })
      );

      const result = await calculateMultiFenceEstimate(
        {
          estimates: [{ fenceTypeId: 'ft-1', length: 30, height: 2, lagRows: 2, coating: 'POLYMER_SINGLE' }],
        } as any,
        { userId: 'user-1', sessionId: 'session-1', ipAddress: '127.0.0.1' }
      );

      expect(result.multiEstimateId).toBe('multi-meta');
      expect(mockCalculateFenceEstimate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ userId: 'user-1' })
      );
    });
  });
});
