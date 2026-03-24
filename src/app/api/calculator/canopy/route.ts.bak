import { NextRequest, NextResponse } from 'next/server';
import { calculateCanopy } from '@/services/calculator';
import { canopyCalculatorSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = canopyCalculatorSchema.parse(body);

    const result = await calculateCanopy(validatedData);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Canopy calculator error:', error);
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
