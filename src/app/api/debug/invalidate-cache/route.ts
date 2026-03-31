import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { fenceTypeCalculatorService } from '@/services/calculator/fenceTypeCalculatorService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req, 'settings');
    if (authResult instanceof NextResponse) return authResult;

    await fenceTypeCalculatorService.invalidateCache();
    return NextResponse.json({ success: true, message: 'Cache invalidated' });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json({ success: false, error: 'Failed to invalidate cache' }, { status: 500 });
  }
}
