import { NextRequest, NextResponse } from 'next/server';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';
import { ReferenceTypeEnum } from '@/lib/validators/mountingHardware';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const referenceType = searchParams.get('referenceType');
    const referenceId = searchParams.get('referenceId');

    if (!referenceType || !referenceId) {
      return NextResponse.json(
        { error: 'MISSING_PARAMS', message: 'Не указаны параметры referenceType и referenceId' },
        { status: 400 }
      );
    }

    const typeValidation = ReferenceTypeEnum.safeParse(referenceType);
    if (!typeValidation.success) {
      return NextResponse.json(
        { error: 'INVALID_TYPE', message: 'Некорректный тип справочника' },
        { status: 400 }
      );
    }

    const hardware = await mountingHardwareService.getHardwareForCalculator(
      typeValidation.data,
      referenceId
    );

    return NextResponse.json({ hardware }, { status: 200 });
  } catch (error) {
    console.error('Mounting hardware fetch error:', error);
    return NextResponse.json(
      { error: 'FETCH_ERROR', message: 'Ошибка получения монтажной фурнитуры' },
      { status: 500 }
    );
  }
}
