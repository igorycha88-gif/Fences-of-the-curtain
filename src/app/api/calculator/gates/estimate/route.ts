import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { gateEstimateSchema } from '@/lib/validators/gateEstimate';
import { calculateGateEstimate, CalculationError } from '@/services/calculator/gateEstimateService';
import { getClientIPFromHeaders } from '@/lib/utils';
import { getSessionId } from '@/lib/session';
import { safeErrorResponse, validationError } from '@/lib/api-error';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = gateEstimateSchema.parse(body);

    const sessionId = await getSessionId();

    const metadata = {
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: getClientIPFromHeaders(req.headers),
      sessionId,
    };

    const result = await calculateGateEstimate(validatedData, metadata);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

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
      console.error('Gate estimate error:', error);
      return safeErrorResponse(error, 400);
    }

    console.error('Gate estimate error:', error);
    return NextResponse.json(
      { error: 'CALCULATION_ERROR', message: 'Ошибка расчета' },
      { status: 500 }
    );
  }
}
