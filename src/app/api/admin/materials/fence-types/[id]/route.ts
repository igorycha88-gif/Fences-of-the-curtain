import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fenceTypeService } from '@/services/admin/fenceTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { fenceTypeUpdateSchema } from '@/lib/validators/fenceType';
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

    const fenceType = await fenceTypeService.getById(params.id);

    if (!fenceType) {
      return NextResponse.json({ error: 'Тип забора не найден' }, { status: 404 });
    }

    return NextResponse.json(fenceType);
  } catch (error) {
    console.error('Error fetching fence type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[FENCE-TYPES PUT] Starting update fence type, id:', params.id);
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[FENCE-TYPES PUT] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      console.log('[FENCE-TYPES PUT] Forbidden - no permission, role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const validatedData = fenceTypeUpdateSchema.parse(body);
    console.log('[FENCE-TYPES PUT] Validated data:', JSON.stringify(validatedData, null, 2));

    await fenceTypeService.update(params.id, validatedData, session.user.id);
    console.log('[FENCE-TYPES PUT] Updated successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[FENCE-TYPES PUT] Error updating fence type:', error);
    
    if (error instanceof ZodError) {
      console.error('[FENCE-TYPES PUT] Validation errors:', error.errors);
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

    await fenceTypeService.delete(params.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting fence type:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message.includes('Невозможно удалить')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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

    const fenceType = await fenceTypeService.toggleActive(params.id, session.user.id);

    return NextResponse.json(fenceType);
  } catch (error: any) {
    console.error('Error toggling fence type active status:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
