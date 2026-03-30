import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';
import { hasPermission } from '@/lib/permissions/rbac';
import { mountingHardwareUpdateSchema } from '@/lib/validators/mountingHardware';
import { ZodError } from 'zod';
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

    const item = await mountingHardwareService.getById(params.id);

    if (!item) {
      return NextResponse.json({ error: 'Позиция не найдена' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin) {
      const { purchasePrice, ...itemWithoutPurchasePrice } = item;
      return NextResponse.json(itemWithoutPurchasePrice);
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching mounting hardware:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[MOUNTING-HARDWARE PUT] Starting update, id:', params.id);
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[MOUNTING-HARDWARE PUT] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      console.log('[MOUNTING-HARDWARE PUT] Forbidden - no permission, role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && body.purchasePrice !== undefined) {
      console.log('[MOUNTING-HARDWARE PUT] Forbidden - non-admin trying to modify purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    const validatedData = mountingHardwareUpdateSchema.parse(body);
    console.log('[MOUNTING-HARDWARE PUT] Validated data:', JSON.stringify(validatedData, null, 2));

    await mountingHardwareService.update(params.id, validatedData, session.user.id);
    console.log('[MOUNTING-HARDWARE PUT] Updated successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[MOUNTING-HARDWARE PUT] Error:', error);
    
    if (error instanceof ZodError) {
      console.error('[MOUNTING-HARDWARE PUT] Validation errors:', error.errors);
      return validationError(error);
    }
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
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

    await mountingHardwareService.delete(params.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting mounting hardware:', error);
    
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

    const item = await mountingHardwareService.toggleActive(params.id, session.user.id);

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error toggling mounting hardware active status:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
