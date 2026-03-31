import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { gateTypeService } from '@/services/admin/gateTypeService';
import { gateTypeUpdateSchema } from '@/lib/validators/gateType';
import { ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const gate = await gateTypeService.getById(params.id);

    if (!gate) {
      return NextResponse.json({ error: 'Ворота не найдены' }, { status: 404 });
    }

    const isAdmin = session.role === 'ADMIN';
    
    if (!isAdmin) {
      const { purchasePrice, ...gateWithoutPurchasePrice } = gate;
      return NextResponse.json(gateWithoutPurchasePrice);
    }

    return NextResponse.json(gate);
  } catch (error) {
    console.error('Error fetching gate type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[GATE-TYPES PUT] Starting update gate type, id:', params.id);
    
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();
    
    const isAdmin = session.role === 'ADMIN';

    if (!isAdmin && body.purchasePrice !== undefined) {
      console.log('[GATE-TYPES PUT] Forbidden - non-admin trying to modify purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    const validatedData = gateTypeUpdateSchema.parse(body);
    console.log('[GATE-TYPES PUT] Validated data:', JSON.stringify(validatedData, null, 2));

    await gateTypeService.update(params.id, validatedData, session.userId);
    console.log('[GATE-TYPES PUT] Updated successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[GATE-TYPES PUT] Error updating gate type:', error);
    
    if (error instanceof ZodError) {
      console.error('[GATE-TYPES PUT] Validation errors:', error.errors);
      return validationError(error);
    }
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message.includes('уже существу')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await gateTypeService.delete(params.id, session.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting gate type:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const gate = await gateTypeService.toggleActive(params.id, session.userId);

    return NextResponse.json(gate);
  } catch (error: any) {
    console.error('Error toggling gate type active status:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
