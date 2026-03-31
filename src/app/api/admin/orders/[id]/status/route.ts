import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { ordersService } from '@/services/admin/ordersService';
import { updateOrderStatusSchema, getStatusTransitionSchema } from '@/lib/validators/order';
import { z, ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API] PATCH /api/admin/orders/[id]/status - Start', { orderId: params.id });

    const authResult = await requireAdmin(request, 'orders');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    console.log('[API] Session user:', { id: session.userId, role: session.role });

    const body = await request.json();

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
      session.userId
    );

    console.log('[API] Status updated successfully:', { 
      orderId: updatedOrder.id, 
      newStatus: updatedOrder.status 
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('[API] Error updating order status:', error);
    
    if (error instanceof ZodError) {
      return validationError(error);
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
