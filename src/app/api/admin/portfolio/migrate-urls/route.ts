import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = await prisma.portfolioItem.findMany();

    let updatedCount = 0;

    for (const item of items) {
      const images = item.images as string[];

      if (!Array.isArray(images)) {
        continue;
      }

      const updatedImages = images.map(img => {
        if (typeof img === 'string' && !img.startsWith('/')) {
          return '/' + img.replace(/^\/+/, '');
        }
        return img;
      });

      const hasChanges = updatedImages.some((img, index) => img !== images[index]);

      if (hasChanges) {
        await prisma.portfolioItem.update({
          where: { id: item.id },
          data: { images: updatedImages },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: 'Миграция завершена успешно',
      updatedCount,
      totalItems: items.length,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Ошибка миграции', details: error.message },
      { status: 500 }
    );
  }
}