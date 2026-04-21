import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { trussRoofCoveringCreateSchema } from '@/lib/validators/trussCalculator';
import { ZodError } from 'zod';
import { safeErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const covering = await prisma.trussRoofCovering.findUnique({ where: { id } });
    if (!covering) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
    }
    return NextResponse.json({ covering });
  } catch (error) {
    console.error('[TRUSS-ROOF-COVERING GET] Error:', error);
    return safeErrorResponse(error, 500);
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
    const parsed = trussRoofCoveringCreateSchema.partial().parse(body);

    const data: any = { ...parsed };
    if (data.validFrom !== undefined) {
      data.validFrom = data.validFrom ? new Date(data.validFrom) : null;
    }
    if (data.expirationDate !== undefined) {
      data.expirationDate = data.expirationDate ? new Date(data.expirationDate) : null;
    }

    const covering = await prisma.trussRoofCovering.update({
      where: { id },
      data,
    });
    return NextResponse.json({ covering });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors.map((e: any) => ({
        path: e.path,
        message: e.message,
      })) }, { status: 400 });
    }
    console.error('[TRUSS-ROOF-COVERING PUT] Error:', error);
    return safeErrorResponse(error, 500);
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
    await prisma.trussRoofCovering.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TRUSS-ROOF-COVERING DELETE] Error:', error);
    return safeErrorResponse(error, 500);
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
    const current = await prisma.trussRoofCovering.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
    }

    const updated = await prisma.trussRoofCovering.update({
      where: { id },
      data: { isActive: !current.isActive },
    });
    return NextResponse.json({ covering: updated });
  } catch (error) {
    console.error('[TRUSS-ROOF-COVERING PATCH] Error:', error);
    return safeErrorResponse(error, 500);
  }
}
