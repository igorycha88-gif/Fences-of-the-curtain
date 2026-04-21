import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { FenceTypeCalculatorService } from '@/services/calculator/fenceTypeCalculatorService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    fenceType: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const mockPrisma = prisma as any;
const mockRedisGet = redis.get as jest.Mock;
const mockRedisSet = redis.set as jest.Mock;
const mockRedisDel = redis.del as jest.Mock;

const mockFenceTypes = [
  {
    id: 'ft-1',
    name: 'Профнастил',
    description: 'Забор из профнастила',
    image: null,
    difficultyCoef: 1.0,
    postSpacing: 2500,
    defaultLagRows: 2,
    priority: 0,
    active: true,
  },
  {
    id: 'ft-2',
    name: 'Евроштакетник',
    description: 'Забор из евроштакетника',
    image: '/images/picket.jpg',
    difficultyCoef: 1.1,
    postSpacing: 2500,
    defaultLagRows: 2,
    priority: 1,
    active: true,
  },
];

describe('fenceTypeCalculatorService', () => {
  let service: FenceTypeCalculatorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FenceTypeCalculatorService();
  });

  describe('getActiveWithMaterials', () => {
    it('should return data from cache when available', async () => {
      const cached = JSON.stringify([
        { id: 'ft-cached', name: 'Cached Type', difficultyCoef: 1.0, postSpacing: 2500, defaultLagRows: 2, materialsCount: 0 },
      ]);
      mockRedisGet.mockResolvedValue(cached);

      const result = await service.getActiveWithMaterials({});

      expect(mockRedisGet).toHaveBeenCalledWith('calculator:fence-types');
      expect(result.types).toEqual(JSON.parse(cached));
      expect(mockPrisma.fenceType.findMany).not.toHaveBeenCalled();
    });

    it('should query DB on cache miss', async () => {
      mockRedisGet.mockResolvedValue(null);
      mockPrisma.fenceType.findMany.mockResolvedValue(mockFenceTypes);

      const result = await service.getActiveWithMaterials({});

      expect(mockPrisma.fenceType.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { priority: 'asc' },
      });
      expect(result.types).toHaveLength(2);
      expect(result.types[0].id).toBe('ft-1');
      expect(result.types[1].id).toBe('ft-2');
    });

    it('should cache result after DB query', async () => {
      mockRedisGet.mockResolvedValue(null);
      mockPrisma.fenceType.findMany.mockResolvedValue(mockFenceTypes);

      await service.getActiveWithMaterials({});

      expect(mockRedisSet).toHaveBeenCalledWith(
        'calculator:fence-types',
        expect.any(String),
        'EX',
        300
      );
    });

    it('should filter by onlyWithMaterials when true', async () => {
      mockRedisGet.mockResolvedValue(null);
      mockPrisma.fenceType.findMany.mockResolvedValue(mockFenceTypes);

      await service.getActiveWithMaterials({ onlyWithMaterials: true });

      expect(mockPrisma.fenceType.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          materials: {
            some: {
              active: true,
            },
          },
        },
        orderBy: { priority: 'asc' },
      });
    });

    it('should map DB result to FenceTypeCalculator interface', async () => {
      mockRedisGet.mockResolvedValue(null);
      mockPrisma.fenceType.findMany.mockResolvedValue(mockFenceTypes);

      const result = await service.getActiveWithMaterials({});

      expect(result.types[0]).toEqual({
        id: 'ft-1',
        name: 'Профнастил',
        description: 'Забор из профнастила',
        image: undefined,
        difficultyCoef: 1.0,
        postSpacing: 2500,
        defaultLagRows: 2,
        materialsCount: 0,
      });
    });
  });

  describe('invalidateCache', () => {
    it('should delete cache key', async () => {
      mockRedisDel.mockResolvedValue(1);

      await service.invalidateCache();

      expect(mockRedisDel).toHaveBeenCalledWith('calculator:fence-types');
    });
  });

  describe('Redis error handling (graceful degradation)', () => {
    it('should fallback to DB when Redis get throws', async () => {
      mockRedisGet.mockRejectedValue(new Error('Redis connection failed'));
      mockPrisma.fenceType.findMany.mockResolvedValue(mockFenceTypes);

      const result = await service.getActiveWithMaterials({});

      expect(mockPrisma.fenceType.findMany).toHaveBeenCalled();
      expect(result.types).toHaveLength(2);
    });

    it('should not throw when Redis set throws', async () => {
      mockRedisGet.mockResolvedValue(null);
      mockPrisma.fenceType.findMany.mockResolvedValue(mockFenceTypes);
      mockRedisSet.mockRejectedValue(new Error('Redis write failed'));

      const result = await service.getActiveWithMaterials({});

      expect(result.types).toHaveLength(2);
    });

    it('should not throw when Redis del throws on invalidate', async () => {
      mockRedisDel.mockRejectedValue(new Error('Redis del failed'));

      await expect(service.invalidateCache()).resolves.not.toThrow();
    });
  });
});
