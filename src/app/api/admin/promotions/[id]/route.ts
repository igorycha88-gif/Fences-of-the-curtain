import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { promotionService } from '@/services/calculator/promotionService';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();

    if (body.discountPercent !== undefined && (body.discountPercent < 1 || body.discountPercent > 50)) {
      return NextResponse.json(
        { error: 'Процент скидки должен быть от 1 до 50' },
        { status: 400 }
      );
    }

    if (body.active === true && !body.bannerTitle) {
      return NextResponse.json(
        { error: 'Для активации акции необходимо указать заголовок баннера' },
        { status: 400 }
      );
    }

    if (body.minLength !== undefined && body.minLength !== null) {
      if (typeof body.minLength !== 'number' || isNaN(body.minLength) || body.minLength < 0) {
        return NextResponse.json(
          { error: 'Минимальный метраж должен быть неотрицательным числом' },
          { status: 400 }
        );
      }
    }

    if (body.maxLength !== undefined && body.maxLength !== null) {
      if (typeof body.maxLength !== 'number' || isNaN(body.maxLength) || body.maxLength < 0) {
        return NextResponse.json(
          { error: 'Максимальный метраж должен быть неотрицательным числом' },
          { status: 400 }
        );
      }
    }

    if (body.minLength != null && body.maxLength != null && body.minLength > body.maxLength) {
      return NextResponse.json(
        { error: 'Минимальный метраж не может быть больше максимального' },
        { status: 400 }
      );
    }

    const promotion = await promotionService.updatePromotion(params.id, {
      name: body.name,
      discountType: body.discountType,
      discountPercent: body.discountPercent,
      bannerTitle: body.bannerTitle,
      bannerText: body.bannerText,
      startDate: body.startDate ? new Date(body.startDate) : (body.startDate === null ? null : undefined),
      endDate: body.endDate ? new Date(body.endDate) : (body.endDate === null ? null : undefined),
      minLength: body.minLength !== undefined ? (body.minLength === null ? null : body.minLength) : undefined,
      maxLength: body.maxLength !== undefined ? (body.maxLength === null ? null : body.maxLength) : undefined,
    });

    return NextResponse.json({ promotion });
  } catch (error: any) {
    console.error('[Promotions PUT] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    await promotionService.deletePromotion(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Promotions DELETE] Error:', error);
    if (error.message === 'Promotion not found') {
      return NextResponse.json({ error: 'Акция не найдена' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
