import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { validationError } from '@/lib/api-error';
import { adminAddItemSchema } from '@/lib/validators/adminCalculator';
import { adminCalculatorService } from '@/services/admin/adminCalculatorService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request, 'orders');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = adminAddItemSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const result = await adminCalculatorService.addNomenclatureItem(
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
    console.error('[Admin Calculator] Add item error:', error);
    return NextResponse.json({ error: 'Ошибка добавления позиции' }, { status: 500 });
  }
}
