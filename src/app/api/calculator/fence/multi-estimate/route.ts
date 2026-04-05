import { NextRequest, NextResponse } from 'next/server';
import { multiFenceEstimateSchema } from '@/lib/validators/multiFenceEstimate';
import { calculateMultiFenceEstimate, MultiEstimateCalculationError } from '@/services/calculator/multiFenceEstimateService';
import { getClientIPFromHeaders } from '@/lib/utils';
import { getSessionId } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = multiFenceEstimateSchema.parse(body);

    const sessionId = await getSessionId();

    const metadata = {
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: getClientIPFromHeaders(req.headers),
      sessionId,
    };

    const result = await calculateMultiFenceEstimate(validatedData, metadata);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'error' in error) {
      const calcError = error as MultiEstimateCalculationError;
      return NextResponse.json(
        {
          error: calcError.error,
          message: calcError.message,
          details: calcError.details,
          estimateIndex: calcError.estimateIndex,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error('Multi fence estimate error:', error);
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: error.message },
        { status: 400 }
      );
    }

    console.error('Multi fence estimate error:', error);
    return NextResponse.json(
      { error: 'CALCULATION_ERROR', message: 'Ошибка расчета' },
      { status: 500 }
    );
  }
}
