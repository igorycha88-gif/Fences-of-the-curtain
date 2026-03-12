import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { profnastilTypeService } from '@/services/admin/profnastilTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { profnastilTypeUpdateSchema } from '@/lib/validators/profnastilType';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profnastil = await profnastilTypeService.getById(params.id);

    if (!profnastil) {
      return NextResponse.json({ error: 'Номенклатура не найдена' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin) {
      const { purchasePricePerUnit, ...itemWithoutPurchasePrice } = profnastil as any;
      return NextResponse.json(itemWithoutPurchasePrice);
    }

    return NextResponse.json(profnastil);
  } catch (error) {
    console.error('Error fetching profnastil type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PROFNASTIL-TYPES PUT] Starting update profnastil type, id:', params.id);
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[PROFNASTIL-TYPES PUT] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      console.log('[PROFNASTIL-TYPES PUT] Forbidden - no permission, role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    console.log('[PROFNASTIL-TYPES PUT] Request body:', JSON.stringify(body, null, 2));
    
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && body.purchasePricePerUnit !== undefined) {
      console.log('[PROFNASTIL-TYPES PUT] Forbidden - non-admin trying to modify purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    const validatedData = profnastilTypeUpdateSchema.parse(body);
    console.log('[PROFNASTIL-TYPES PUT] Validated data:', JSON.stringify(validatedData, null, 2));

    await profnastilTypeService.update(params.id, validatedData, session.user.id);
    console.log('[PROFNASTIL-TYPES PUT] Updated successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PROFNASTIL-TYPES PUT] Error updating profnastil type:', error);
    
    if (error.name === 'ZodError') {
      console.error('[PROFNASTIL-TYPES PUT] Validation errors:', error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message.includes('уже существует')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await profnastilTypeService.delete(params.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting profnastil type:', error);
    
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
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profnastil = await profnastilTypeService.toggleActive(params.id, session.user.id);

    return NextResponse.json(profnastil);
  } catch (error: any) {
    console.error('Error toggling profnastil type active status:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
