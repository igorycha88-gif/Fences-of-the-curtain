import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { materialsService } from '@/services/admin/materialsService';
import { hasPermission } from '@/lib/permissions/rbac';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const material = await materialsService.updateCanopyMaterial(params.id, body, session.user.id);

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error updating canopy material:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await materialsService.deleteCanopyMaterial(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting canopy material:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
