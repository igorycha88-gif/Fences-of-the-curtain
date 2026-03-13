import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { fenceTypeCalculatorService } from '@/services/calculator/fenceTypeCalculatorService';

export async function GET() {
  try {
    await fenceTypeCalculatorService.invalidateCache();

    const allTypes = await prisma.fenceType.findMany({
      where: { active: true },
      include: {
        materials: {
          where: { active: true },
        },
      },
      orderBy: { priority: 'asc' },
    });

    const typesWithMaterials = allTypes.filter(type => type.materials.length > 0);
    const typesWithoutMaterials = allTypes.filter(type => type.materials.length === 0);

    const apiResult = await fenceTypeCalculatorService.getActiveWithMaterials({
      onlyWithMaterials: false,
    });

    const redisKeys = await redis.keys('calculator:*');

    return NextResponse.json({
      allTypes,
      typesWithMaterials,
      typesWithoutMaterials,
      apiResult: apiResult.types,
      redisKeys,
      summary: {
        total: allTypes.length,
        withMaterials: typesWithMaterials.length,
        withoutMaterials: typesWithoutMaterials.length,
      },
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
