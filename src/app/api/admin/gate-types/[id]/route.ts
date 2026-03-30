import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import { gateTypeService } from '@/services/admin/gateTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { gateTypeUpdateSchema } from '@/lib/validators/gateType';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const gate = await gateTypeService.getById(params.id);

    if (!gate) {
      return NextResponse.json({ error: 'Ворота не найдены' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    
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
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[GATE-TYPES PUT] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      console.log('[GATE-TYPES PUT] Forbidden - no permission, role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && body.purchasePrice !== undefined) {
      console.log('[GATE-TYPES PUT] Forbidden - non-admin trying to modify purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    const validatedData = gateTypeUpdateSchema.parse(body);
    console.log('[GATE-TYPES PUT] Validated data:', JSON.stringify(validatedData, null, 2));

    await gateTypeService.update(params.id, validatedData, session.user.id);
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
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await gateTypeService.delete(params.id, session.user.id);

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
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const gate = await gateTypeService.toggleActive(params.id, session.user.id);

    return NextResponse.json(gate);
  } catch (error: any) {
    console.error('Error toggling gate type active status:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
