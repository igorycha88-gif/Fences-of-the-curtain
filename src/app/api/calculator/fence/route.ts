import { NextRequest, NextResponse } from 'next/server';
import { calculateFence } from '@/services/calculator';
import { fenceCalculatorSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = fenceCalculatorSchema.parse(body);

    const result = await calculateFence(validatedData);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Fence calculator error:', error);
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
