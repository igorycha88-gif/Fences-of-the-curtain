import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = await prisma.portfolioItem.findMany({
      select: {
        id: true,
        title: true,
        images: true,
      },
    });

    let deletedCount = 0;
    const deletedItems: Array<{ id: string; title: string; missingImages: string[] }> = [];

    for (const item of items) {
      const images = item.images as string[];
      const missingImages: string[] = [];

      for (const imageUrl of images) {
        const filePath = path.join(process.cwd(), 'public', imageUrl);
        if (!existsSync(filePath)) {
          missingImages.push(imageUrl);
        }
      }

      if (missingImages.length > 0) {
        await prisma.portfolioItem.delete({
          where: { id: item.id },
        });
        deletedCount++;
        deletedItems.push({
          id: item.id,
          title: item.title,
          missingImages,
        });
      }
    }

    return NextResponse.json({
      deletedCount,
      deletedItems,
      message: `Удалено ${deletedCount} записей с отсутствующими файлами`,
    });
  } catch (error) {
    console.error('[PortfolioCleanup] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
