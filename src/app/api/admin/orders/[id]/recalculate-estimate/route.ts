import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { estimateEditorService } from '@/services/admin/estimateEditorService';
import { recalculateEstimateSchema } from '@/lib/validators/adminEstimate';
import { validationError } from '@/lib/api-error';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(req, 'orders');
    if (authResult instanceof NextResponse) return authResult;

    const { id: orderId } = await params;
    const body = await req.json();

    const parsed = recalculateEstimateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const result = await estimateEditorService.recalculateWithParams(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error in POST /api/admin/orders/[id]/recalculate-estimate:', error);
    if (error instanceof Error && error.message === 'Source estimate not found') {
      return NextResponse.json(
        { error: 'ESTIMATE_NOT_FOUND', message: 'Расчет не найден' },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
