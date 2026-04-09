import { findPicketByParams, PicketLookupParams, PicketLookupResult } from '@/services/calculator/picketLookup';
import { calculatePicket, PicketCalculationParams } from '@/services/calculator/picketCalculator';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';

jest.mock('@/lib/prisma');
jest.mock('@/lib/cache');

const mockPicket = {
  id: 'picket-1',
  name: 'Евроштакетник П-образный 2.0м',
  description: 'Тестовый штакетник',
  metalThickness: 0.45,
  width: 115,
  length: 2000,
  color: 'RAL 8017',
  purchasePricePerUnit: 110,
  retailPricePerUnit: 156,
  validFrom: null,
  validUntil: null,
  active: true,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  priority: 0,
  profileTypeId: 'profile-1',
  coatingId: 'coating-1',
  picketProfile: {
    id: 'profile-1',
    name: 'П-образный',
    description: 'П-образный профиль',
    sortOrder: 0,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  picketCoatingType: {
    id: 'coating-1',
    name: 'Глянцевый полиэстер',
    description: 'Глянцевый полиэстер',
    sortOrder: 4,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe('picketLookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findPicketByParams', () => {
    it('should find picket by length and profile type', async () => {
      (cache.getOrSet as jest.Mock).mockResolvedValue([mockPicket]);

      const params: PicketLookupParams = {
        lengthMm: 2000,
        profileTypeName: 'П-образный',
      };

      const result = await findPicketByParams(params);

      expect(result).toEqual({
        id: 'picket-1',
        name: 'Евроштакетник П-образный 2.0м',
        length: 2000,
        width: 115,
        metalThickness: 0.45,
        retailPricePerUnit: 156,
        profileTypeName: 'П-образный',
        coatingName: 'Глянцевый полиэстер',
        color: 'RAL 8017',
      });
    });

    it('should throw error when no matching picket found', async () => {
      (cache.getOrSet as jest.Mock).mockResolvedValue([]);

      const params: PicketLookupParams = {
        lengthMm: 2000,
        profileTypeName: 'М-образный',
      };

      await expect(findPicketByParams(params)).rejects.toMatchObject({
        error: 'NO_PICKET_FOUND',
        message: 'Не найден евроштакетник с указанными параметрами',
      });
    });

    it('should not match picket with different length', async () => {
      (cache.getOrSet as jest.Mock).mockResolvedValue([mockPicket]);

      const params: PicketLookupParams = {
        lengthMm: 1800,
        profileTypeName: 'П-образный',
      };

      await expect(findPicketByParams(params)).rejects.toMatchObject({
        error: 'NO_PICKET_FOUND',
      });
    });
  });
});

describe('picketCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePicket - SINGLE mounting', () => {
    it('should calculate picket quantity for single mounting', async () => {
      (cache.getOrSet as jest.Mock).mockResolvedValue([mockPicket]);

      const params: PicketCalculationParams = {
        fenceLengthM: 10,
        fenceHeightM: 2.0,
        profileTypeName: 'П-образный',
        stepCm: 5,
        mountingType: 'SINGLE',
      };

      const result = await calculatePicket(params);

      const fenceLengthMm = 10000;
      const picketWidthMm = 115;
      const stepMm = 50;
      const expectedBaseCount = Math.ceil(fenceLengthMm / (picketWidthMm + stepMm));
      const expectedFinalCount = Math.ceil(expectedBaseCount * 1.03);

      expect(result.quantity).toBe(expectedFinalCount);
      expect(result.category).toBe('picket');
      expect(result.unit).toBe('шт');
      expect(result.nomenclatureId).toBe('picket-1');
    });

    it('should calculate picket quantity for chess mounting (double)', async () => {
      (cache.getOrSet as jest.Mock).mockResolvedValue([mockPicket]);

      const params: PicketCalculationParams = {
        fenceLengthM: 10,
        fenceHeightM: 2.0,
        profileTypeName: 'П-образный',
        stepCm: 5,
        mountingType: 'CHESS',
      };

      const result = await calculatePicket(params);

      const fenceLengthMm = 10000;
      const picketWidthMm = 115;
      const stepMm = 50;
      const expectedBaseCount = Math.ceil(fenceLengthMm / (picketWidthMm + stepMm)) * 2;
      const expectedFinalCount = Math.ceil(expectedBaseCount * 1.03);

      expect(result.quantity).toBe(expectedFinalCount);
    });

    it('should include 3% reserve in calculation', async () => {
      (cache.getOrSet as jest.Mock).mockResolvedValue([mockPicket]);

      const params: PicketCalculationParams = {
        fenceLengthM: 10,
        fenceHeightM: 2.0,
        profileTypeName: 'П-образный',
        stepCm: 5,
        mountingType: 'SINGLE',
      };

      const result = await calculatePicket(params);

      const fenceLengthMm = 10000;
      const picketWidthMm = 115;
      const stepMm = 50;
      const baseCount = Math.ceil(fenceLengthMm / (picketWidthMm + stepMm));
      const expectedWithReserve = Math.ceil(baseCount * 1.03);

      expect(result.quantity).toBe(expectedWithReserve);
    });
  });
});
