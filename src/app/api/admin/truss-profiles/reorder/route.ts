import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    if (authResult.session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, newPriority } = await request.json();
    if (!id || typeof newPriority !== 'number') {
      return NextResponse.json({ error: 'id и newPriority обязательны' }, { status: 400 });
    }

    await prisma.trussProfileType.update({
      where: { id },
      data: { priority: newPriority },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TRUSS-PROFILES REORDER] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
