import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { ordersService } from '@/services/admin/ordersService';
import { safeParseInt } from '@/lib/parse-params';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'orders');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const params = {
      status: searchParams.get('status') as any || undefined,
      serviceType: searchParams.get('serviceType') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      search: searchParams.get('search') || undefined,
      page: safeParseInt(searchParams.get('page'), 1),
      pageSize: safeParseInt(searchParams.get('pageSize'), 20),
    };

    const result = await ordersService.getOrders(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'orders');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();

    if (!body.ids || !Array.isArray(body.ids)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const result = await ordersService.batchUpdateOrders(body.ids, body.data, session.userId);

    return NextResponse.json({ success: true, updated: result.length });
  } catch (error) {
    console.error('Error batch updating orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
