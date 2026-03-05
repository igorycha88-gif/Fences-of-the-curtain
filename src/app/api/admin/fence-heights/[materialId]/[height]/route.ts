import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fenceHeightService } from '@/services/admin/fenceHeightService';
import { hasPermission } from '@/lib/permissions/rbac';
import { fenceHeightUpdateSchema } from '@/lib/validators/fenceHeight';

export async function PUT(
  request: NextRequest,
  { params }: { params: { materialId: string; height: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = fenceHeightUpdateSchema.parse(body);
    const height = parseFloat(params.height);

    await fenceHeightService.updateHeight(
      params.materialId,
      height,
      validatedData,
      session.user.id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating fence height:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { materialId: string; height: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const height = parseFloat(params.height);

    await fenceHeightService.deleteHeight(params.materialId, height, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting fence height:', error);
    
    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
