import { prisma } from '@/lib/prisma';
import { roundUp } from '@/lib/utils/roundUp';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export interface PostCalculationResult {
  category: 'posts';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: 'шт';
  pricePerUnit: number;
  totalPrice: number;
}

export interface PostCalculationError {
  error: 'NO_POSTS_FOUND';
  message: string;
  details: {
    requiredHeight: number;
    availableMaxHeight?: number;
    suggestion: string;
  };
}

const UNDERGROUND_DEPTH_MM = 1200;

async function getActivePosts() {
  return cache.getOrSet(
    CACHE_KEYS.POSTS_ACTIVE,
    async () => {
      const now = new Date();
      return prisma.postType.findMany({
        where: {
          active: true,
          OR: [
            { validFrom: null },
            { validFrom: { lte: now } },
          ],
          AND: {
            OR: [
              { expirationDate: null },
              { expirationDate: { gt: now } },
            ],
          },
        },
        orderBy: [{ length: 'asc' }],
      });
    },
    CACHE_TTL.REFERENCE_DATA
  );
}

export async function calculatePosts(
  fenceLengthM: number,
  fenceHeightM: number,
  postSpacingM: number
): Promise<PostCalculationResult> {
  const postCount = roundUp(fenceLengthM / postSpacingM) + 2;
  const requiredHeightMm = (fenceHeightM * 1000) + UNDERGROUND_DEPTH_MM;

  const posts = await getActivePosts();

  const matchingPosts = posts.filter(p => p.length >= requiredHeightMm / 1000);

  if (matchingPosts.length === 0) {
    const allPosts = posts.sort((a, b) => b.length - a.length);
    
    const error: PostCalculationError = {
      error: 'NO_POSTS_FOUND',
      message: 'Не найдены столбы подходящей высоты',
      details: {
        requiredHeight: requiredHeightMm,
        availableMaxHeight: allPosts[0]?.length ? allPosts[0].length * 1000 : undefined,
        suggestion: 'Свяжитесь с нами для индивидуального расчета',
      },
    };
    throw error;
  }

  const selectedPost = matchingPosts[0];
  const pricePerUnit = selectedPost.retailPricePerUnit;
  const totalPrice = postCount * pricePerUnit;

  return {
    category: 'posts',
    nomenclatureId: selectedPost.id,
    nomenclatureName: selectedPost.name,
    quantity: postCount,
    unit: 'шт',
    pricePerUnit,
    totalPrice,
  };
}
