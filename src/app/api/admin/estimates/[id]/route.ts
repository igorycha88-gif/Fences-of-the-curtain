import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { estimatesService } from '@/services/admin/estimatesService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const estimate = await estimatesService.getEstimateById(id);

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('[API] Error fetching estimate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
