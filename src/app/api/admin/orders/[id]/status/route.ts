import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ordersService } from '@/services/admin/ordersService';
import { hasPermission } from '@/lib/permissions/rbac';
import { updateOrderStatusSchema } from '@/lib/validators/order';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'orders')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateOrderStatusSchema.parse(body);

    const order = await ordersService.updateOrderStatus(
      params.id,
      validatedData.status as any,
      validatedData.comment,
      session.user.id
    );

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid status transition')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === 'Order not found') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
