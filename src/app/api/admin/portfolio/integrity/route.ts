import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = await prisma.portfolioItem.findMany({
      select: {
        id: true,
        title: true,
        images: true,
      },
    });

    const results = {
      total: items.length,
      withImages: 0,
      missingImages: 0,
      items: [] as Array<{
        id: string;
        title: string;
        images: string[];
        filesExist: boolean[];
        missingFiles: string[];
      }>,
    };

    for (const item of items) {
      const images = item.images as string[];
      const filesExist: boolean[] = [];
      const missingFiles: string[] = [];

      for (const imageUrl of images) {
        const filePath = path.join(process.cwd(), 'public', imageUrl);
        const exists = existsSync(filePath);
        filesExist.push(exists);

        if (!exists) {
          missingFiles.push(imageUrl);
        }
      }

      if (images.length > 0) {
        results.withImages++;
        if (missingFiles.length > 0) {
          results.missingImages++;
        }
      }

      results.items.push({
        id: item.id,
        title: item.title,
        images,
        filesExist,
        missingFiles,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('[PortfolioIntegrity] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
