import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { wicketTypeService } from '@/services/admin/wicketTypeService';
import { wicketTypeUpdateSchema } from '@/lib/validators/wicketType';
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

    const wicket = await wicketTypeService.getById(params.id);

    if (!wicket) {
      return NextResponse.json({ error: 'Калитка не найдена' }, { status: 404 });
    }

    const isAdmin = session.role === 'ADMIN';
    
    if (!isAdmin) {
      const { purchasePrice, ...wicketWithoutPurchasePrice } = wicket;
      return NextResponse.json(wicketWithoutPurchasePrice);
    }

    return NextResponse.json(wicket);
  } catch (error) {
    console.error('Error fetching wicket type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[WICKET-TYPES PUT] Starting update wicket type, id:', params.id);
    
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();
    
    const isAdmin = session.role === 'ADMIN';

    if (!isAdmin && body.purchasePrice !== undefined) {
      console.log('[WICKET-TYPES PUT] Forbidden - non-admin trying to modify purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    const validatedData = wicketTypeUpdateSchema.parse(body);
    console.log('[WICKET-TYPES PUT] Validated data:', JSON.stringify(validatedData, null, 2));

    await wicketTypeService.update(params.id, validatedData, session.userId);
    console.log('[WICKET-TYPES PUT] Updated successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[WICKET-TYPES PUT] Error updating wicket type:', error);
    
    if (error instanceof ZodError) {
      console.error('[WICKET-TYPES PUT] Validation errors:', error.errors);
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

    await wicketTypeService.delete(params.id, session.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting wicket type:', error);
    
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

    const wicket = await wicketTypeService.toggleActive(params.id, session.userId);

    return NextResponse.json(wicket);
  } catch (error: any) {
    console.error('Error toggling wicket type active status:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
