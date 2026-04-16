import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const items = await prisma.review.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { name, text, rating, image, sortOrder, active } = body;

    if (!name || !text || !rating) {
      return NextResponse.json({ error: 'name, text and rating are required' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        name,
        text,
        rating: Number(rating),
        image: image || null,
        sortOrder: sortOrder ?? 0,
        active: active ?? true,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
