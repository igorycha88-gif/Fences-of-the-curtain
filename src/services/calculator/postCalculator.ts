import { prisma } from '@/lib/prisma';
import { roundUp } from '@/lib/utils/roundUp';

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

export async function calculatePosts(
  fenceLengthM: number,
  fenceHeightM: number,
  postSpacingM: number
): Promise<PostCalculationResult> {
  const postCount = roundUp(fenceLengthM / postSpacingM) + 2;
  const requiredHeightMm = fenceHeightM * 1000 + UNDERGROUND_DEPTH_MM;

  const now = new Date();
  const posts = await prisma.postType.findMany({
    where: {
      active: true,
      length: { gte: requiredHeightMm / 1000 },
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
    orderBy: [{ priority: 'asc' }, { length: 'asc' }],
    take: 1,
  });

  if (posts.length === 0) {
    const allPosts = await prisma.postType.findMany({
      where: { active: true },
      orderBy: { length: 'desc' },
      take: 1,
    });
    
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

  const selectedPost = posts[0];
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
