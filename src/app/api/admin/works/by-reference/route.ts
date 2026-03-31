import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { workService } from '@/services/admin/workService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const referenceType = searchParams.get('referenceType');
    const referenceId = searchParams.get('referenceId');

    if (!referenceType || !referenceId) {
      return NextResponse.json({ error: 'Missing referenceType or referenceId' }, { status: 400 });
    }

    const works = await workService.getWorksForCalculatorByReference(referenceType, referenceId);

    return NextResponse.json({ items: works });
  } catch (error) {
    console.error('Error fetching works by reference:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
