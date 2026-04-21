import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { profnastilTypeService } from '@/services/admin/profnastilTypeService';
import { profnastilTypeUpdateSchema } from '@/lib/validators/profnastilType';
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

    const profnastil = await profnastilTypeService.getById(params.id);

    if (!profnastil) {
      return NextResponse.json({ error: 'Номенклатура не найдена' }, { status: 404 });
    }

    const isAdmin = session.role === 'ADMIN';

    if (!isAdmin) {
      const { purchasePricePerUnit, purchasePricePerLinearMeter, ...itemWithoutPurchasePrice } = profnastil as any;
      return NextResponse.json(itemWithoutPurchasePrice);
    }

    return NextResponse.json(profnastil);
  } catch (error) {
    console.error('Error fetching profnastil type:', error);
    return safeErrorResponse(error, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PROFNASTIL-TYPES PUT] Starting update profnastil type, id:', params.id);
    
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();
    
    const isAdmin = session.role === 'ADMIN';

    if (!isAdmin && body.purchasePricePerUnit !== undefined) {
      console.log('[PROFNASTIL-TYPES PUT] Forbidden - non-admin trying to modify purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    if (!isAdmin && body.purchasePricePerLinearMeter !== undefined) {
      console.log('[PROFNASTIL-TYPES PUT] Forbidden - non-admin trying to modify purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    const validatedData = profnastilTypeUpdateSchema.parse(body);
    console.log('[PROFNASTIL-TYPES PUT] Validated data:', JSON.stringify(validatedData, null, 2));

    const updated = await profnastilTypeService.update(params.id, validatedData, session.userId);
    console.log('[PROFNASTIL-TYPES PUT] Updated successfully');

    if (!isAdmin) {
      const { purchasePricePerUnit, purchasePricePerLinearMeter, ...itemWithoutPurchasePrice } = updated as any;
      return NextResponse.json(itemWithoutPurchasePrice);
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[PROFNASTIL-TYPES PUT] Error updating profnastil type:', error);
    
    if (error instanceof ZodError) {
      console.error('[PROFNASTIL-TYPES PUT] Validation errors:', error.errors);
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

    await profnastilTypeService.delete(params.id, session.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting profnastil type:', error);
    
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

    const profnastil = await profnastilTypeService.toggleActive(params.id, session.userId);

    return NextResponse.json(profnastil);
  } catch (error: any) {
    console.error('Error toggling profnastil type active status:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return safeErrorResponse(error, 500);
  }
}
