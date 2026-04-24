import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { validationError } from '@/lib/api-error';
import { adminCalculatorInputSchema } from '@/lib/validators/adminCalculator';
import { adminCalculatorService } from '@/services/admin/adminCalculatorService';

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request, 'orders');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const parsed = adminCalculatorInputSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const result = await adminCalculatorService.calculateAndSave(
      parsed.data,
      authResult.session.userId
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'error' in error) {
      return NextResponse.json(error, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    console.error('[Admin Calculator] Calculate error:', error);
    return NextResponse.json(
      { error: 'CALCULATION_ERROR', message: 'Ошибка расчёта' },
      { status: 500 }
    );
  }
}
