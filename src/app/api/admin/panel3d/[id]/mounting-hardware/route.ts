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
    const { mountingHardwareId } = body;

    if (!mountingHardwareId) {
      return NextResponse.json({ error: 'Не указан ID фурнитуры' }, { status: 400 });
    }

    const userId = session.userId;
    await panel3dService.addMountingHardware(params.id, mountingHardwareId, userId);

    await createAuditLogAsync({
      userId,
      action: 'ADD_MOUNTING_HARDWARE_PANEL3D',
      entityType: 'Panel3D',
      entityId: params.id,
      details: { mountingHardwareId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error in POST /api/admin/panel3d/[id]/mounting-hardware:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: error instanceof Error && error.message.includes('уже привязана') ? 400 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; mountingHardwareId: string } }) {
  try {
    const authResult = await requireAdmin(req, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const userId = session.userId;
    await panel3dService.removeMountingHardware(params.id, params.mountingHardwareId);

    await createAuditLogAsync({
      userId,
      action: 'REMOVE_MOUNTING_HARDWARE_PANEL3D',
      entityType: 'Panel3D',
      entityId: params.id,
      details: { mountingHardwareId: params.mountingHardwareId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error in DELETE /api/admin/panel3d/[id]/mounting-hardware:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
