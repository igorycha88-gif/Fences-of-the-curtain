import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const CACHE_KEY = 'calculator:fence-types';
const CACHE_TTL = 300;

export interface FenceTypeCalculator {
  id: string;
  name: string;
  description?: string;
  image?: string;
  difficultyCoef: number;
  postSpacing: number;
  defaultLagRows: number;
  materialsCount: number;
}

export class FenceTypeCalculatorService {
  async getActiveWithMaterials(params: {
    onlyWithMaterials?: boolean;
  }): Promise<{ types: FenceTypeCalculator[] }> {
    const { onlyWithMaterials = false } = params;

    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return { types: JSON.parse(cached) as FenceTypeCalculator[] };
      }
    } catch (error) {
      console.error('Redis cache error:', error);
    }

    const where: any = {
      active: true,
    };

    if (onlyWithMaterials) {
      where.materials = {
        some: {
          active: true,
        },
      };
    }

    const types = await prisma.fenceType.findMany({
      where,
      include: {
        _count: {
          select: {
            materials: {
              where: {
                active: true,
              },
            },
          },
        },
      },
      orderBy: {
        priority: 'asc',
      },
    });

    const result = types.map((type) => ({
      id: type.id,
      name: type.name,
      description: type.description || undefined,
      image: type.image || undefined,
      difficultyCoef: type.difficultyCoef,
      postSpacing: type.postSpacing,
      defaultLagRows: type.defaultLagRows,
      materialsCount: type._count.materials,
    }));

    try {
      await redis.set(CACHE_KEY, JSON.stringify(result), 'EX', CACHE_TTL);
    } catch (error) {
      console.error('Redis cache set error:', error);
    }

    return { types: result };
  }

  async invalidateCache(): Promise<void> {
    try {
      await redis.del(CACHE_KEY);
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
    }
  }
}

export const fenceTypeCalculatorService = new FenceTypeCalculatorService();
