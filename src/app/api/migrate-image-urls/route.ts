import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('[MIGRATION-TRIGGER] Migration trigger received');

    const items = await prisma.portfolioItem.findMany({
      where: {
        images: {
          not: null,
        },
      },
    });

    console.log('[MIGRATION-TRIGGER] Found items to migrate:', items.length);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      const images = item.images as string[];

      if (!Array.isArray(images) || images.length === 0) {
        console.log('[MIGRATION-TRIGGER] Skipping item:', item.id, '- no images');
        skippedCount++;
        continue;
      }

      let updated = false;

      for (let i = 0; i < images.length; i++) {
        const url = images[i];

        if (!url || typeof url !== 'string') {
          continue;
        }

        if (url.startsWith('/')) {
          continue;
        }

        const normalizedUrl = '/' + url.replace(/^\/+/, '');
        console.log(`[MIGRATION-TRIGGER] Item ${item.id}, image ${i}: ${url} -> ${normalizedUrl}`);

        if (url !== normalizedUrl) {
          updated = true;
        }

        images[i] = normalizedUrl;
      }

      if (updated) {
        await prisma.portfolioItem.update({
          where: { id: item.id },
          data: { images },
        });
        updatedCount++;
        console.log('[MIGRATION-TRIGGER] Updated item:', item.id);
      } else {
        skippedCount++;
      }
    }

    console.log('[MIGRATION-TRIGGER] Migration completed:', {
      updated: updatedCount,
      skipped: skippedCount,
      total: items.length,
    });

    return NextResponse.json({
      message: 'Migration completed',
      updated: updatedCount,
      skipped: skippedCount,
      total: items.length,
    });
  } catch (error: any) {
    console.error('[MIGRATION-TRIGGER] Error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = await prisma.portfolioItem.count({
      where: {
        images: {
          not: null,
        },
      },
    });

    return NextResponse.json({
      totalItems: stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to get stats',
        details: error.message,
      },
      { status: 500 }
    );
  }
}