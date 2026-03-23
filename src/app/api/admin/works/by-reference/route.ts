import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workService } from '@/services/admin/workService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
