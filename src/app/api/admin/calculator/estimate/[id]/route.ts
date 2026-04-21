import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { validationError } from '@/lib/api-error';
import { adminUpdateEstimateItemsSchema } from '@/lib/validators/adminCalculator';
import { adminCalculatorService } from '@/services/admin/adminCalculatorService';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request, 'orders');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = adminUpdateEstimateItemsSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const result = await adminCalculatorService.updateEstimateItems(
      id,
      parsed.data,
      authResult.session.userId
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'ESTIMATE_NOT_FOUND') {
        return NextResponse.json({ error: 'Расчёт не найден' }, { status: 404 });
      }
      if (error.message === 'NOT_ADMIN_ESTIMATE') {
        return NextResponse.json({ error: 'Нельзя редактировать клиентский расчёт' }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[Admin Calculator] Update error:', error);
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request, 'orders');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const result = await adminCalculatorService.getEstimate(id);

    if (!result) {
      return NextResponse.json({ error: 'Расчёт не найден' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Admin Calculator] Get error:', error);
    return NextResponse.json({ error: 'Ошибка получения расчёта' }, { status: 500 });
  }
}
