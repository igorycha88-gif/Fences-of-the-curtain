import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { materialsService } from '@/services/admin/materialsService';
import { hasPermission, canDelete } from '@/lib/permissions/rbac';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const material = await materialsService.updateFenceMaterial(params.id, body, session.user.id);

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error updating fence material:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canDelete(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await materialsService.deleteFenceMaterial(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fence material:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
