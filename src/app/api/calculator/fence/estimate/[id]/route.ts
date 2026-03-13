import { NextRequest, NextResponse } from 'next/server';
import { getFenceEstimateById } from '@/services/calculator/fenceEstimateService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await getFenceEstimateById(id);

    if (!result) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Смета не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Get fence estimate error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Ошибка получения сметы' },
      { status: 500 }
    );
  }
}
