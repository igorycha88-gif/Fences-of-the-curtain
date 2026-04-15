import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { trussProfileCreateSchema } from '@/lib/validators/trussCalculator';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const profile = await prisma.trussProfileType.findUnique({ where: { id } });
    if (!profile) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[TRUSS-PROFILE GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    if (authResult.session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = trussProfileCreateSchema.partial().parse(body);

    const data: any = { ...parsed };
    if (data.validFrom !== undefined) {
      data.validFrom = data.validFrom ? new Date(data.validFrom) : null;
    }
    if (data.expirationDate !== undefined) {
      data.expirationDate = data.expirationDate ? new Date(data.expirationDate) : null;
    }

    const profile = await prisma.trussProfileType.update({
      where: { id },
      data,
    });
    return NextResponse.json({ profile });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors.map((e: any) => ({
        path: e.path,
        message: e.message,
      })) }, { status: 400 });
    }
    console.error('[TRUSS-PROFILE PUT] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    if (authResult.session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.trussProfileType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TRUSS-PROFILE DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const current = await prisma.trussProfileType.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
    }

    const updated = await prisma.trussProfileType.update({
      where: { id },
      data: { isActive: !current.isActive },
    });
    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error('[TRUSS-PROFILE PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
