import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { materialsService } from '@/services/admin/materialsService';
import { hasPermission } from '@/lib/permissions/rbac';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = await materialsService.batchUpdatePrices(body.updates, session.user.id);

    return NextResponse.json({ success: true, updated: result.length });
  } catch (error) {
    console.error('Error batch updating fence materials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
