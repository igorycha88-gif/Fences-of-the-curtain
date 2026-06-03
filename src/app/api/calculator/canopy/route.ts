import { NextRequest, NextResponse } from 'next/server';
import { calculateCanopy } from '@/services/calculator';
import { canopyCalculatorSchema } from '@/lib/validators';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const validatedData = canopyCalculatorSchema.parse(body);

    logger.info('Canopy calculation request', { method: 'POST', path: '/api/calculator/canopy', body: validatedData });

    const result = await calculateCanopy(validatedData);

    logger.info('Canopy calculation success', { status: 200, duration: Date.now() - startTime });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error('Canopy calculator error', { error, duration: Date.now() - startTime });

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Ошибка расчета' },
      { status: 500 }
    );
  }
}
