import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { workService } from '@/services/admin/workService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const fenceTypes = await workService.getFenceTypes();

    return NextResponse.json(fenceTypes);
  } catch (error) {
    console.error('Error fetching fence types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
