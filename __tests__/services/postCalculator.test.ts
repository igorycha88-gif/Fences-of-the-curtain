import { calculatePosts, calculatePostsForProfnastil, calculatePostsForPanel3D, PostCalculationError } from '@/services/calculator/postCalculator';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    postType: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delPattern: jest.fn().mockResolvedValue(undefined),
    getOrSet: jest.fn().mockImplementation(async (key: string, factory: () => Promise<any>, ttl: number) => {
      return await factory();
    }),
    healthCheck: jest.fn().mockResolvedValue({ redis: false, memory: true }),
  },
}));

jest.mock('@/lib/utils/roundUp', () => ({
  roundUp: jest.fn((value: number) => Math.ceil(value)),
}));

const mockPrisma = prisma as any;
const mockRoundUp = require('@/lib/utils/roundUp').roundUp as any;

describe('postCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePostsForProfnastil', () => {
    it('should calculate posts for profnastil with correct height formula (fenceHeight * 1000 - 200 + 1200)', async () => {
      const fenceLengthM = 10;
      const fenceHeightM = 2;
      const postSpacingM = 2.5;

      mockRoundUp.mockReturnValue(4);

      const mockPosts = [
        {
          id: 'post1',
          name: 'Столб 3.0м',
          length: 3.0,
          retailPricePerUnit: 1500,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
        {
          id: 'post2',
          name: 'Столб 3.2м',
          length: 3.2,
          retailPricePerUnit: 1800,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
      ];

      mockPrisma.postType.findMany.mockResolvedValue(mockPosts as any);

      const result = await calculatePostsForProfnastil(fenceLengthM, fenceHeightM, postSpacingM);

      const requiredHeightMm = (fenceHeightM * 1000 - 200) + 1200;
      const requiredHeightM = requiredHeightMm / 1000;

      expect(mockPrisma.postType.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          active: true,
        }),
        orderBy: [{ length: 'asc' }],
      });

      expect(result.category).toBe('posts');
      expect(result.quantity).toBe(6);
      expect(result.totalPrice).toBe(9000);
      expect(result.pricePerUnit).toBe(1500);
    });

    it('should exclude forMesh=true posts from profnastil calculation', async () => {
      const fenceLengthM = 10;
      const fenceHeightM = 2;
      const postSpacingM = 2.5;

      mockRoundUp.mockReturnValue(4);

      const mockPosts = [
        {
          id: 'mesh-post',
          name: 'Столб для сетки 2.9м',
          length: 2.9,
          retailPricePerUnit: 800,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: true,
        },
        {
          id: 'normal-post',
          name: 'Столб 3.0м',
          length: 3.0,
          retailPricePerUnit: 1500,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
      ];

      mockPrisma.postType.findMany.mockResolvedValue(mockPosts as any);

      const result = await calculatePostsForProfnastil(fenceLengthM, fenceHeightM, postSpacingM);

      expect(result.nomenclatureId).toBe('normal-post');
      expect(result.pricePerUnit).toBe(1500);
    });

    it('should throw NO_POSTS_FOUND when only forMesh=true posts exist', async () => {
      const fenceLengthM = 10;
      const fenceHeightM = 2;
      const postSpacingM = 2.5;

      mockRoundUp.mockReturnValue(4);

      const mockPosts = [
        {
          id: 'mesh-post',
          name: 'Столб для сетки 3.0м',
          length: 3.0,
          retailPricePerUnit: 900,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: true,
        },
      ];

      mockPrisma.postType.findMany.mockResolvedValue(mockPosts as any);

      let error: PostCalculationError | null = null;
      try {
        await calculatePostsForProfnastil(fenceLengthM, fenceHeightM, postSpacingM);
      } catch (e) {
        error = e as PostCalculationError;
      }

      expect(error).not.toBeNull();
      expect(error!.error).toBe('NO_POSTS_FOUND');
    });

    it('should select shortest post that meets required height', async () => {
      const fenceLengthM = 10;
      const fenceHeightM = 2;
      const postSpacingM = 2.5;

      mockRoundUp.mockReturnValue(4);

      const mockPosts = [
        {
          id: 'post1',
          name: 'Столб 2.8м',
          length: 2.8,
          retailPricePerUnit: 1400,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
        {
          id: 'post2',
          name: 'Столб 3.0м',
          length: 3.0,
          retailPricePerUnit: 2000,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
      ];

      mockPrisma.postType.findMany.mockResolvedValue(mockPosts as any);

      const result = await calculatePostsForProfnastil(fenceLengthM, fenceHeightM, postSpacingM);

      const requiredHeightMm = (fenceHeightM * 1000 - 200) + 1200;

      expect(requiredHeightMm).toBe(3000);

      expect(result.nomenclatureId).toBe('post2');
      expect(result.nomenclatureName).toBe('Столб 3.0м');
    });

    it('should throw error when no suitable posts found', async () => {
      const fenceLengthM = 10;
      const fenceHeightM = 3;
      const postSpacingM = 2.5;

      mockRoundUp.mockReturnValue(4);

      const mockPosts = [
        {
          id: 'post1',
          name: 'Столб 3.0м',
          length: 3.0,
          retailPricePerUnit: 1400,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
      ];

      mockPrisma.postType.findMany.mockResolvedValue(mockPosts as any);

      let error: PostCalculationError | null = null;
      try {
        await calculatePostsForProfnastil(fenceLengthM, fenceHeightM, postSpacingM);
      } catch (e) {
        error = e as PostCalculationError;
      }

      expect(error).not.toBeNull();
      expect(error!.error).toBe('NO_POSTS_FOUND');
      expect(error!.details.requiredHeight).toBe(4000);
    });
  });

  describe('calculatePostsForPanel3D', () => {
    it('should calculate posts for 3D panels with correct height formula (fenceHeight * 1000 + 1200)', async () => {
      const fenceLengthM = 10;
      const fenceHeightM = 2;
      const postSpacingM = 2.5;

      mockRoundUp.mockReturnValue(4);

      const mockPosts = [
        {
          id: 'post1',
          name: 'Столб 3.2м',
          length: 3.2,
          retailPricePerUnit: 1800,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
        {
          id: 'post2',
          name: 'Столб 3.5м',
          length: 3.5,
          retailPricePerUnit: 2000,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
      ];

      mockPrisma.postType.findMany.mockResolvedValue(mockPosts as any);

      const result = await calculatePostsForPanel3D(fenceLengthM, fenceHeightM, postSpacingM);

      const requiredHeightMm = (fenceHeightM * 1000) + 1200;
      const requiredHeightM = requiredHeightMm / 1000;

      expect(mockPrisma.postType.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          active: true,
        }),
        orderBy: [{ length: 'asc' }],
      });

      expect(result.category).toBe('posts');
      expect(result.quantity).toBe(6);
      expect(result.totalPrice).toBe(10800);
      expect(result.pricePerUnit).toBe(1800);
    });

    it('should select shortest post that meets required height for 3D panels', async () => {
      const fenceLengthM = 10;
      const fenceHeightM = 2;
      const postSpacingM = 2.5;

      mockRoundUp.mockReturnValue(4);

      const mockPosts = [
        {
          id: 'post1',
          name: 'Столб 3.2м',
          length: 3.2,
          retailPricePerUnit: 1800,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
        {
          id: 'post2',
          name: 'Столб 3.5м',
          length: 3.5,
          retailPricePerUnit: 2000,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
      ];

      mockPrisma.postType.findMany.mockResolvedValue(mockPosts as any);

      const result = await calculatePostsForPanel3D(fenceLengthM, fenceHeightM, postSpacingM);

      const requiredHeightMm = (fenceHeightM * 1000) + 1200;

      expect(requiredHeightMm).toBe(3200);

      expect(result.nomenclatureId).toBe('post1');
      expect(result.nomenclatureName).toBe('Столб 3.2м');
    });

    it('should exclude forMesh=true posts from 3D panels calculation', async () => {
      const fenceLengthM = 10;
      const fenceHeightM = 2;
      const postSpacingM = 2.5;

      mockRoundUp.mockReturnValue(4);

      const mockPosts = [
        {
          id: 'mesh-post',
          name: 'Столб для сетки 3.0м',
          length: 3.0,
          retailPricePerUnit: 800,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: true,
        },
        {
          id: 'normal-post',
          name: 'Столб 3.2м',
          length: 3.2,
          retailPricePerUnit: 1800,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
      ];

      mockPrisma.postType.findMany.mockResolvedValue(mockPosts as any);

      const result = await calculatePostsForPanel3D(fenceLengthM, fenceHeightM, postSpacingM);

      expect(result.nomenclatureId).toBe('normal-post');
      expect(result.pricePerUnit).toBe(1800);
    });

    it('should throw error when no suitable posts found for 3D panels', async () => {
      const fenceLengthM = 10;
      const fenceHeightM = 3;
      const postSpacingM = 2.5;

      mockRoundUp.mockReturnValue(4);

      const mockPosts = [
        {
          id: 'post1',
          name: 'Столб 3.2м',
          length: 3.2,
          retailPricePerUnit: 1800,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
      ];

      mockPrisma.postType.findMany.mockResolvedValue(mockPosts as any);

      let error: PostCalculationError | null = null;
      try {
        await calculatePostsForPanel3D(fenceLengthM, fenceHeightM, postSpacingM);
      } catch (e) {
        error = e as PostCalculationError;
      }

      expect(error).not.toBeNull();
      expect(error!.error).toBe('NO_POSTS_FOUND');
      expect(error!.details.requiredHeight).toBe(4200);
    });
  });

  describe('calculatePosts (default)', () => {
    it('should delegate to calculatePostsForPanel3D', async () => {
      const fenceLengthM = 10;
      const fenceHeightM = 2;
      const postSpacingM = 2.5;

      mockPrisma.postType.findMany.mockResolvedValue([
        {
          id: 'post1',
          name: 'Столб 3.2м',
          length: 3.2,
          retailPricePerUnit: 1800,
          active: true,
          validFrom: null,
          expirationDate: null,
          forMesh: false,
        },
      ] as any);
      mockRoundUp.mockReturnValue(4);

      const result = await calculatePosts(fenceLengthM, fenceHeightM, postSpacingM);

      expect(result.category).toBe('posts');
    });
  });
});
