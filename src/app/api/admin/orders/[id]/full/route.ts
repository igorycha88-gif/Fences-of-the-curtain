import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { ordersService } from '@/services/admin/ordersService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(req, 'orders');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;
    console.log('[API /full] Session:', { userId: session.userId, role: session.role });
    
    const { id } = await params;
    console.log('[API /full] Requested order ID:', id);
    const userRole = session.role;

    const result = await ordersService.getOrderFull(id, userRole);
    console.log('[API /full] Result:', result ? 'found' : 'not found');

    if (!result) {
      return NextResponse.json(
        { error: 'ORDER_NOT_FOUND', message: 'Заявка не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error in GET /api/admin/orders/[id]/full:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
