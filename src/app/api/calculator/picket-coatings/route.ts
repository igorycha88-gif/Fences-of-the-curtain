import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export async function GET(req: NextRequest) {
  try {
    const coatings = await cache.getOrSet(
      CACHE_KEYS.PICKET_COATINGS_ACTIVE,
      async () => {
        return prisma.picketCoating.findMany({
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        });
      },
      CACHE_TTL.REFERENCE_DATA
    );

    return NextResponse.json(coatings);
  } catch (error) {
    console.error('Error fetching picket coatings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
