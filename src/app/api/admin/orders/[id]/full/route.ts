import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ordersService } from '@/services/admin/ordersService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    console.log('[API /full] Session:', session ? { userId: (session.user as any)?.id, role: (session.user as any)?.role } : null);
    
    if (!session?.user) {
      console.log('[API /full] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('[API /full] Requested order ID:', id);
    const userRole = (session.user as any).role;

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
