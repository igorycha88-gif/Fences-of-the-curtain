import { NextRequest, NextResponse } from 'next/server';
import { fenceEstimateSchema } from '@/lib/validators/fenceEstimate';
import { calculateFenceEstimate, CalculationError } from '@/services/calculator/fenceEstimateService';
import { getClientIPFromHeaders } from '@/lib/utils';
import { getSessionId } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[fence/estimate] Received body:', JSON.stringify(body, null, 2));
    const validatedData = fenceEstimateSchema.parse(body);
    console.log('[fence/estimate] Validated data:', JSON.stringify(validatedData, null, 2));

    const sessionId = await getSessionId();

    const metadata = {
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: getClientIPFromHeaders(req.headers),
      sessionId,
    };

    const result = await calculateFenceEstimate(validatedData, metadata);

    return NextResponse.json(result, { status: 201 });
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
