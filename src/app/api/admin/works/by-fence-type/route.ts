import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { workService } from '@/services/admin/workService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

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
