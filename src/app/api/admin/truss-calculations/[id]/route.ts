import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const calculation = await prisma.trussCalculation.findUnique({
      where: { id: params.id },
      include: {
        roofCovering: true,
        postProfile: true,
        crossbeamProfile: true,
        strutProfile: true,
        archProfile: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!calculation || !calculation.isActive) {
      return NextResponse.json({ error: 'Расчёт не найден' }, { status: 404 });
    }

    return NextResponse.json({ calculation });
  } catch (error) {
    console.error('[TRUSS-CALCULATION GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    if (authResult.session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.trussCalculation.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TRUSS-CALCULATION DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
