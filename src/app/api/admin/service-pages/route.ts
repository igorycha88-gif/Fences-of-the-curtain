import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pages = await prisma.pageContent.findMany({
      where: {
        category: { not: null },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ items: pages });
  } catch (error) {
    console.error('Error fetching service pages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      slug,
      title,
      content,
      seoTitle,
      seoDescription,
      seoKeywords,
      category,
      coverImage,
      priceRange,
      isActive,
      sortOrder,
    } = body;

    if (!slug || !title || !category) {
      return NextResponse.json(
        { error: 'slug, title and category are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.pageContent.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'Page with this slug already exists' },
        { status: 409 }
      );
    }

    const page = await prisma.pageContent.create({
      data: {
        slug,
        title,
        content: content ?? {},
        seoTitle: seoTitle ?? null,
        seoDescription: seoDescription ?? null,
        seoKeywords: seoKeywords ?? null,
        category,
        coverImage: coverImage ?? null,
        priceRange: priceRange ?? null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Error creating service page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
