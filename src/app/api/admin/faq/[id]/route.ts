import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { safeErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const item = await prisma.faqItem.findUnique({ where: { id } });

    if (!item) {
      return NextResponse.json({ error: 'FAQ item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching FAQ item:', error);
    return safeErrorResponse(error, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const { question, answer, category, sortOrder, isActive } = body;

    const existing = await prisma.faqItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'FAQ item not found' }, { status: 404 });
    }

    const item = await prisma.faqItem.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(category !== undefined && { category }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error updating FAQ item:', error);
    return safeErrorResponse(error, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const existing = await prisma.faqItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'FAQ item not found' }, { status: 404 });
    }

    await prisma.faqItem.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'FAQ item deleted' });
  } catch (error: any) {
    console.error('Error deleting FAQ item:', error);
    return safeErrorResponse(error, 500);
  }
}
