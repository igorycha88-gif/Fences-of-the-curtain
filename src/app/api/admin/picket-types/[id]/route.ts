import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { picketTypeService } from '@/services/admin/picketTypeService';
import { picketTypeUpdateSchema } from '@/lib/validators/picketType';
import { ZodError } from 'zod';
import { validationError, safeErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const picket = await picketTypeService.getById(params.id);

    if (!picket) {
      return NextResponse.json({ error: 'Номенклатура не найдена' }, { status: 404 });
    }

    const isAdmin = session.role === 'ADMIN';
    
    if (!isAdmin) {
      const { purchasePricePerUnit, ...itemWithoutPurchasePrice } = picket as any;
      return NextResponse.json(itemWithoutPurchasePrice);
    }

    return NextResponse.json(picket);
  } catch (error) {
    console.error('Error fetching picket type:', error);
    return safeErrorResponse(error, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PICKET-TYPES PUT] Starting update picket type, id:', params.id);
    
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();
    
    const isAdmin = session.role === 'ADMIN';

    if (!isAdmin && body.purchasePricePerUnit !== undefined) {
      console.log('[PICKET-TYPES PUT] Forbidden - non-admin trying to modify purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    const validatedData = picketTypeUpdateSchema.parse(body);
    console.log('[PICKET-TYPES PUT] Validated data:', JSON.stringify(validatedData, null, 2));

    await picketTypeService.update(params.id, validatedData, session.userId);
    console.log('[PICKET-TYPES PUT] Updated successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PICKET-TYPES PUT] Error updating picket type:', error);
    
    if (error instanceof ZodError) {
      console.error('[PICKET-TYPES PUT] Validation errors:', error.errors);
      return validationError(error);
    }
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message.includes('уже существует')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return safeErrorResponse(error, 500);
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

    await picketTypeService.delete(params.id, session.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting picket type:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return safeErrorResponse(error, 500);
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

    const picket = await picketTypeService.toggleActive(params.id, session.userId);

    return NextResponse.json(picket);
  } catch (error: any) {
    console.error('Error toggling picket type active status:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return safeErrorResponse(error, 500);
  }
}
