import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { panel3dService } from '@/services/admin/panel3dService';
import { createAuditLogAsync } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAdmin(req, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await req.json();
    const { workId } = body;

    if (!workId) {
      return NextResponse.json({ error: 'Не указан ID работы' }, { status: 400 });
    }

    const userId = session.userId;
    await panel3dService.addWork(params.id, workId, userId);

    await createAuditLogAsync({
      userId,
      action: 'ADD_WORK_PANEL3D',
      entityType: 'Panel3D',
      entityId: params.id,
      details: { workId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error in POST /api/admin/panel3d/[id]/works:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: error instanceof Error && error.message.includes('уже привязана') ? 400 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; workId: string } }) {
  try {
    const authResult = await requireAdmin(req, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const userId = session.userId;
    await panel3dService.removeWork(params.id, params.workId);

    await createAuditLogAsync({
      userId,
      action: 'REMOVE_WORK_PANEL3D',
      entityType: 'Panel3D',
      entityId: params.id,
      details: { workId: params.workId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error in DELETE /api/admin/panel3d/[id]/works:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
