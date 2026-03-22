import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workService } from '@/services/admin/workService';
import { hasPermission } from '@/lib/permissions/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fenceType = searchParams.get('fenceType');

    if (!fenceType) {
      return NextResponse.json({ error: 'fenceType parameter is required' }, { status: 400 });
    }

    const items = await workService.getByFenceType(fenceType);

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error('Error fetching works by fence type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
