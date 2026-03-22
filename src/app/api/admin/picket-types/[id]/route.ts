import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import { picketTypeService } from '@/services/admin/picketTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { picketTypeUpdateSchema } from '@/lib/validators/picketType';
import { validationError } from '@/lib/api-error';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const picket = await picketTypeService.getById(params.id);

    if (!picket) {
      return NextResponse.json({ error: 'Номенклатура не найдена' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin) {
      const { purchasePricePerMeter, purchasePricePerUnit, ...itemWithoutPurchasePrice } = picket as any;
      return NextResponse.json(itemWithoutPurchasePrice);
    }

    return NextResponse.json(picket);
  } catch (error) {
    console.error('Error fetching picket type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PICKET-TYPES PUT] Starting update picket type, id:', params.id);
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[PICKET-TYPES PUT] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      console.log('[PICKET-TYPES PUT] Forbidden - no permission, role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && body.purchasePricePerMeter !== undefined) {
      console.log('[PICKET-TYPES PUT] Forbidden - non-admin trying to modify purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    const validatedData = picketTypeUpdateSchema.parse(body);
    console.log('[PICKET-TYPES PUT] Validated data:', JSON.stringify(validatedData, null, 2));

    await picketTypeService.update(params.id, validatedData, session.user.id);
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

    await picketTypeService.delete(params.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting picket type:', error);
    
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

    const picket = await picketTypeService.toggleActive(params.id, session.user.id);

    return NextResponse.json(picket);
  } catch (error: any) {
    console.error('Error toggling picket type active status:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
