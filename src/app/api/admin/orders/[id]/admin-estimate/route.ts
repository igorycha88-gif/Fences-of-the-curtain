import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { estimateEditorService } from '@/services/admin/estimateEditorService';
import {
  createAdminEstimateSchema,
  updateAdminEstimateSchema,
} from '@/lib/validators/adminEstimate';
import { validationError } from '@/lib/api-error';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(req, 'orders');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const { id: orderId } = await params;
    const body = await req.json();

    const parsed = createAdminEstimateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const result = await estimateEditorService.createAdminEstimate(
      orderId,
      session.userId,
      parsed.data,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[API] Error in POST /api/admin/orders/[id]/admin-estimate:', error);
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return NextResponse.json(
          { error: 'ORDER_NOT_FOUND', message: 'Заявка не найдена' },
          { status: 404 },
        );
      }
      if (error.message === 'Source estimate not found') {
        return NextResponse.json(
          { error: 'ESTIMATE_NOT_FOUND', message: 'Исходный расчет не найден' },
          { status: 404 },
        );
      }
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(req, 'orders');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const { id: orderId } = await params;

    const order = await estimateEditorService.getAdminEstimateForOrder(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'ADMIN_ESTIMATE_NOT_FOUND', message: 'Откорректированный расчет не найден' },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = updateAdminEstimateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const result = await estimateEditorService.updateAdminEstimate(
      order.id,
      session.userId,
      parsed.data,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error in PUT /api/admin/orders/[id]/admin-estimate:', error);
    if (error instanceof Error) {
      if (error.message === 'Admin estimate not found') {
        return NextResponse.json(
          { error: 'ADMIN_ESTIMATE_NOT_FOUND', message: 'Откорректированный расчет не найден' },
          { status: 404 },
        );
      }
      if (error.message === 'Specified estimate is not an admin estimate') {
        return NextResponse.json(
          { error: 'INVALID_ESTIMATE', message: 'Указанный расчет не является корректировкой админа' },
          { status: 400 },
        );
      }
      if (error.message === 'Source estimate not found for admin estimate') {
        return NextResponse.json(
          { error: 'SOURCE_ESTIMATE_NOT_FOUND', message: 'Исходный расчет не найден' },
          { status: 404 },
        );
      }
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
