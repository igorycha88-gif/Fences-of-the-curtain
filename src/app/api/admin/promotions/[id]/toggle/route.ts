import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { promotionService } from '@/services/calculator/promotionService';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const result = await promotionService.togglePromotion(params.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Promotions Toggle] Error:', error);
    if (error.message === 'Promotion not found') {
      return NextResponse.json({ error: 'Акция не найдена' }, { status: 404 });
    }
    if (error.message.includes('заголовка баннера')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
