import { NextRequest, NextResponse } from 'next/server';
import { fenceEstimateSchema } from '@/lib/validators/fenceEstimate';
import { calculateFenceEstimate, CalculationError } from '@/services/calculator/fenceEstimateService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = fenceEstimateSchema.parse(body);

    const metadata = {
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                 req.headers.get('x-real-ip') || undefined,
    };

    const result = await calculateFenceEstimate(validatedData, metadata);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error && typeof error === 'object' && 'error' in error) {
      const calcError = error as CalculationError;
      return NextResponse.json(
        {
          error: calcError.error,
          message: calcError.message,
          details: calcError.details,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error('Fence estimate error:', error);
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: error.message },
        { status: 400 }
      );
    }

    console.error('Fence estimate error:', error);
    return NextResponse.json(
      { error: 'CALCULATION_ERROR', message: 'Ошибка расчета' },
      { status: 500 }
    );
  }
}
