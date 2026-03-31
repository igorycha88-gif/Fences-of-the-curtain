import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { lagTypeService } from '@/services/admin/lagTypeService';
import { lagTypeUpdateSchema } from '@/lib/validators/lagType';
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

    const lag = await lagTypeService.getById(params.id);

    if (!lag) {
      return NextResponse.json({ error: 'Лага не найдена' }, { status: 404 });
    }

    const isAdmin = session.role === 'ADMIN';
    
    if (!isAdmin) {
      const { purchasePricePerUnit, ...lagWithoutPurchasePrice } = lag;
      return NextResponse.json(lagWithoutPurchasePrice);
    }

    return NextResponse.json(lag);
  } catch (error) {
    console.error('Error fetching lag type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[LAG-TYPES PUT] Starting update lag type, id:', params.id);
    
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();
    
    const isAdmin = session.role === 'ADMIN';

    if (!isAdmin && body.purchasePricePerUnit !== undefined) {
      console.log('[LAG-TYPES PUT] Forbidden - non-admin trying to modify purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    const validatedData = lagTypeUpdateSchema.parse(body);
    console.log('[LAG-TYPES PUT] Validated data:', JSON.stringify(validatedData, null, 2));

    await lagTypeService.update(params.id, validatedData, session.userId);
    console.log('[LAG-TYPES PUT] Updated successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[LAG-TYPES PUT] Error updating lag type:', error);
    
    if (error instanceof ZodError) {
      console.error('[LAG-TYPES PUT] Validation errors:', error.errors);
      return validationError(error);
    }
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message.includes('уже существует')) {
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

    await lagTypeService.delete(params.id, session.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting lag type:', error);
    
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

    const lag = await lagTypeService.toggleActive(params.id, session.userId);

    return NextResponse.json(lag);
  } catch (error: any) {
    console.error('Error toggling lag type active status:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
