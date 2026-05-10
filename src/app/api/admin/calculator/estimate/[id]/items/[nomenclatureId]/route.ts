import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { adminCalculatorService } from '@/services/admin/adminCalculatorService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nomenclatureId: string }> }
) {
  const authResult = await requireAdmin(request, 'orders');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id, nomenclatureId } = await params;

    const result = await adminCalculatorService.removeNomenclatureItem(
      id,
      nomenclatureId,
      authResult.session.userId
    );

    return NextResponse.json(result);
  } catch (error) {
    const { id, nomenclatureId } = await params;
    if (error instanceof Error) {
      if (error.message === 'ESTIMATE_NOT_FOUND') {
        console.warn(`[Admin Calculator] ESTIMATE_NOT_FOUND: estimateId=${id}, nomenclatureId=${nomenclatureId}`);
        return NextResponse.json({ error: 'Расчёт не найден', code: 'ESTIMATE_NOT_FOUND' }, { status: 404 });
      }
      if (error.message === 'NOT_ADMIN_ESTIMATE') {
        return NextResponse.json({ error: 'Нельзя редактировать клиентский расчёт', code: 'NOT_ADMIN_ESTIMATE' }, { status: 403 });
      }
      if (error.message === 'ITEM_NOT_FOUND') {
        console.warn(`[Admin Calculator] ITEM_NOT_FOUND: estimateId=${id}, nomenclatureId=${nomenclatureId}`);
        return NextResponse.json({ error: 'Позиция не найдена', code: 'ITEM_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[Admin Calculator] Remove item error:', error);
    return NextResponse.json({ error: 'Ошибка удаления позиции' }, { status: 500 });
  }
}
