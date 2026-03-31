import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { workService } from '@/services/admin/workService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const result = await workService.getReferenceOptions();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching reference options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
