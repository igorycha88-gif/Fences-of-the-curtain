import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ordersService } from '@/services/admin/ordersService';
import { hasPermission } from '@/lib/permissions/rbac';
import { updateOrderStatusSchema, getStatusTransitionSchema } from '@/lib/validators/order';
import { z } from 'zod';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API] PATCH /api/admin/orders/[id]/status - Start', { orderId: params.id });

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('[API] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API] Session user:', { id: session.user.id, role: session.user.role });

    if (!hasPermission(session.user.role as any, 'orders')) {
      console.log('[API] Forbidden - no permission');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    console.log('[API] Request body:', body);

    const validatedData = updateOrderStatusSchema.parse(body);
    console.log('[API] Validated data:', validatedData);

    const order = await ordersService.getOrderById(params.id);
    if (!order) {
      console.log('[API] Order not found');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('[API] Current order status:', order.status);

    if (validatedData.data) {
      const transitionSchema = getStatusTransitionSchema(order.status, validatedData.status);
      console.log('[API] Using transition schema for:', `${order.status} -> ${validatedData.status}`);
      try {
        transitionSchema.parse(validatedData.data);
        console.log('[API] Transition data validated successfully');
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error('[API] Validation error:', validationError.errors);
          return NextResponse.json(
            { 
              error: 'VALIDATION_ERROR', 
              message: 'Не заполнены обязательные поля',
              details: validationError.errors.reduce((acc, err) => {
                const path = err.path.join('.');
                acc[path] = err.message;
                return acc;
              }, {} as Record<string, string>)
            }, 
            { status: 400 }
          );
        }
        throw validationError;
      }
    }

    console.log('[API] Calling ordersService.updateOrderStatus');
    const updatedOrder = await ordersService.updateOrderStatus(
      params.id,
      validatedData.status as any,
      validatedData.data,
      session.user.id
    );

    console.log('[API] Status updated successfully:', { 
      orderId: updatedOrder.id, 
      newStatus: updatedOrder.status 
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('[API] Error updating order status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid status transition')) {
        return NextResponse.json(
          { error: 'INVALID_TRANSITION', message: error.message },
          { status: 400 }
        );
      }
      if (error.message === 'Order not found') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
