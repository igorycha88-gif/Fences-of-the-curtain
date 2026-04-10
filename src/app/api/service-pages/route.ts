import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pages = await prisma.pageContent.findMany({
      where: {
        category: { not: null },
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        seoTitle: true,
        seoDescription: true,
        coverImage: true,
        priceRange: true,
        category: true,
        sortOrder: true,
      },
    });

    const items = pages.map((page) => {
      const contentStr =
        typeof page.content === 'string'
          ? page.content
          : JSON.stringify(page.content);
      const excerpt = contentStr.slice(0, 200);

      return {
        id: page.id,
        slug: page.slug,
        title: page.title,
        excerpt,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        coverImage: page.coverImage,
        priceRange: page.priceRange,
        category: page.category,
        sortOrder: page.sortOrder,
      };
    });

    return NextResponse.json(
      { items },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching service pages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
