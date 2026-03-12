import { NextRequest, NextResponse } from 'next/server';
import { fenceTypeCalculatorService } from '@/services/calculator/fenceTypeCalculatorService';
import { fenceTypesQuerySchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    const validatedData = fenceTypesQuerySchema.parse(query);

    const result = await fenceTypeCalculatorService.getActiveWithMaterials({
      onlyWithMaterials: validatedData.onlyWithMaterials,
    });

    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Fence types API error:', error);
      return NextResponse.json(
        { error: 'Не удалось загрузить типы заборов' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Не удалось загрузить типы заборов' },
      { status: 500 }
    );
  }
}
