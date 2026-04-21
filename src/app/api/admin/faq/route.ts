import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { safeErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const items = await prisma.faqItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching FAQ items:', error);
    return safeErrorResponse(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { question, answer, category, sortOrder, isActive } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: 'question and answer are required' }, { status: 400 });
    }

    const item = await prisma.faqItem.create({
      data: {
        question,
        answer,
        category: category || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error creating FAQ item:', error);
    return safeErrorResponse(error, 500);
  }
}
