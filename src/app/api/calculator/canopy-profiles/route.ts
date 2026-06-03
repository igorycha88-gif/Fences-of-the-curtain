import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';
import logger from '@/lib/logger';

const VALID_CATEGORIES = ['POST', 'CROSSBEAM', 'STRUT', 'ARCH'] as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'POST';

    if (!VALID_CATEGORIES.includes(category as any)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const cacheKey = `${CACHE_KEYS.CANOPY_POSTS_ACTIVE}:${category}`;

    const profiles = await cache.getOrSet(
      cacheKey,
      async () => {
        return prisma.trussProfileType.findMany({
          where: { isActive: true, category: category as any },
          orderBy: { priority: 'asc' },
          select: {
            id: true,
            name: true,
            retailPricePerMeter: true,
            retailPricePerUnit: true,
          },
        });
      },
      CACHE_TTL.REFERENCE_DATA
    );

    return NextResponse.json(profiles);
  } catch (error) {
    logger.error('Error fetching canopy profiles', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
