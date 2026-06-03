import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const coverings = await cache.getOrSet(
      CACHE_KEYS.CANOPY_ROOF_COVERINGS_ACTIVE,
      async () => {
        return prisma.trussRoofCovering.findMany({
          where: { isActive: true },
          orderBy: { priority: 'asc' },
          select: {
            id: true,
            name: true,
            retailPricePerSqm: true,
            thickness: true,
          },
        });
      },
      CACHE_TTL.REFERENCE_DATA
    );

    return NextResponse.json(coverings);
  } catch (error) {
    logger.error('Error fetching canopy roof coverings', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
