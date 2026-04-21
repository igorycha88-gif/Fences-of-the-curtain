import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { validationError } from '@/lib/api-error';
import { adminCreateOrderSchema } from '@/lib/validators/adminCalculator';
import { adminCalculatorService } from '@/services/admin/adminCalculatorService';

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request, 'orders');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const parsed = adminCreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const result = await adminCalculatorService.createOrderFromEstimate(
      parsed.data,
      authResult.session.userId
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'ESTIMATE_NOT_FOUND') {
        return NextResponse.json({ error: 'Расчёт не найден' }, { status: 404 });
      }
      if (error.message === 'ESTIMATE_ALREADY_HAS_ORDER') {
        return NextResponse.json({ error: 'По этому расчёту уже создана заявка' }, { status: 409 });
      }
      if (error.message === 'MULTI_ESTIMATE_NOT_FOUND') {
        return NextResponse.json({ error: 'Мульти-расчёт не найден' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[Admin Calculator] Create order error:', error);
    return NextResponse.json({ error: 'Ошибка создания заявки' }, { status: 500 });
  }
}
