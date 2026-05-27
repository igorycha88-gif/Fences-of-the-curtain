import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { promotionService } from '@/services/calculator/promotionService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const fenceTypeId = searchParams.get('fenceTypeId');

    if (!fenceTypeId) {
      return NextResponse.json({ error: 'fenceTypeId is required' }, { status: 400 });
    }

    const promotion = await promotionService.getPromotionByFenceType(fenceTypeId);

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error('[Promotions GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();

    if (!body.fenceTypeId || !body.name || !body.discountPercent) {
      return NextResponse.json(
        { error: 'fenceTypeId, name и discountPercent обязательны' },
        { status: 400 }
      );
    }

    if (body.discountPercent < 1 || body.discountPercent > 50) {
      return NextResponse.json(
        { error: 'Процент скидки должен быть от 1 до 50' },
        { status: 400 }
      );
    }

    if (body.active && !body.bannerTitle) {
      return NextResponse.json(
        { error: 'Для активации акции необходимо указать заголовок баннера' },
        { status: 400 }
      );
    }

    const promotion = await promotionService.createPromotion({
      fenceTypeId: body.fenceTypeId,
      name: body.name,
      discountType: body.discountType || 'BOTH',
      discountPercent: body.discountPercent,
      bannerTitle: body.bannerTitle,
      bannerText: body.bannerText,
      active: body.active || false,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });

    await promotionService.invalidateCache(body.fenceTypeId);

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error: any) {
    console.error('[Promotions POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
