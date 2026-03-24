import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { panel3dService } from '@/services/admin/panel3dService';
import { createAuditLogAsync } from '@/lib/audit';
import { Panel3dUpdate } from '@/lib/validators/panel3d';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await panel3dService.getById(params.id);

    if (!item) {
      return NextResponse.json({ error: '3D-панель не найдена' }, { status: 404 });
    }

    const [mountingHardware, works] = await Promise.all([
      panel3dService.getMountingHardware(params.id),
      panel3dService.getWorks(params.id),
    ]);

    return NextResponse.json({ ...item, mountingHardware, works });
  } catch (error) {
    console.error('[API] Error in GET /api/admin/panel3d/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const userId = session.user!.id;
    const result = await panel3dService.update(params.id, body, userId);

    await createAuditLogAsync({
      userId,
      action: 'UPDATE_PANEL3D',
      entityType: 'Panel3D',
      entityId: params.id,
      details: { name: body.name },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error in PUT /api/admin/panel3d/[id]:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('не найдена') ? 404 : error.message.includes('уже существует') ? 400 : 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user!.id;
    await panel3dService.delete(params.id, userId);

    await createAuditLogAsync({
      userId,
      action: 'DELETE_PANEL3D',
      entityType: 'Panel3D',
      entityId: params.id,
      details: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error in DELETE /api/admin/panel3d/[id]:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('не найдена') ? 404 : 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user!.id;
    const result = await panel3dService.toggleActive(params.id, userId);

    await createAuditLogAsync({
      userId,
      action: 'TOGGLE_ACTIVE_PANEL3D',
      entityType: 'Panel3D',
      entityId: params.id,
      details: { active: result.active },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error in PATCH /api/admin/panel3d/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: error instanceof Error && error.message.includes('не найдена') ? 404 : 500 }
    );
  }
}
