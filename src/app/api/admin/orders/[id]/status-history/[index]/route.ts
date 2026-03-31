import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { ordersService } from '@/services/admin/ordersService';
import { statusHistoryUpdateSchema } from '@/lib/validators/order';
import { safeParseInt } from '@/lib/parse-params';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; index: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'orders');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Только администратор может редактировать историю' },
        { status: 403 }
      );
    }

    const historyIndex = safeParseInt(params.index, 0);
    if (historyIndex === 0 && params.index !== '0') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Некорректный индекс записи' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = statusHistoryUpdateSchema.parse(body);

    const historyEntry = await ordersService.updateStatusHistoryEntry(
      params.id,
      historyIndex,
      validatedData.data,
      session.userId
    );

    return NextResponse.json({ success: true, historyEntry });
  } catch (error) {
    console.error('Error updating status history:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      if (error.message === 'Invalid history index') {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Запись истории не найдена' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
