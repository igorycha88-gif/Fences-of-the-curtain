import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { canDelete } from '@/lib/permissions/rbac';
import { estimatesService } from '@/services/admin/estimatesService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const userEmail = session.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { role: true, email: true, name: true },
    });

    const isAdmin = user?.role === 'ADMIN';
    const { id } = await params;

    const estimate = await estimatesService.getEstimateByIdWithMargin(id, isAdmin);

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const response = {
      ...estimate,
      showPurchasePrices: isAdmin,
      summary: estimate.summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error fetching estimate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (!canDelete(session.role)) {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const { id } = await params;

    await estimatesService.deleteEstimate(id, session.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting estimate:', error);
    if (error instanceof Error && error.message === 'Смета не найдена') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
