import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { estimatesService } from '@/services/admin/estimatesService';
import { safeParseInt } from '@/lib/parse-params';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = safeParseInt(searchParams.get('page'), 1);
    const pageSize = safeParseInt(searchParams.get('pageSize'), 20);
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const fenceTypeId = searchParams.get('fenceTypeId') || undefined;
    const minCost = searchParams.get('minCost') ? parseFloat(searchParams.get('minCost')!) : undefined;
    const maxCost = searchParams.get('maxCost') ? parseFloat(searchParams.get('maxCost')!) : undefined;
    const hasGate = searchParams.get('hasGate') ? searchParams.get('hasGate') === 'true' : undefined;
    const hasWicket = searchParams.get('hasWicket') ? searchParams.get('hasWicket') === 'true' : undefined;
    const deviceType = searchParams.get('deviceType') as 'desktop' | 'mobile' | null;
    const search = searchParams.get('search') || undefined;

    const result = await estimatesService.getEstimates({
      page,
      pageSize,
      dateFrom,
      dateTo,
      fenceTypeId,
      minCost,
      maxCost,
      hasGate,
      hasWicket,
      deviceType: deviceType || undefined,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error fetching estimates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
