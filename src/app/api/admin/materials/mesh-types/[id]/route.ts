import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { meshService } from '@/services/admin/meshService';
import { createAuditLogAsync } from '@/lib/audit';
import { meshUpdateSchema } from '@/lib/validators/mesh';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAdmin(req, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const item = await meshService.getById(params.id);

    if (!item) {
      return NextResponse.json({ error: 'Сетка-рабица не найдена' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('[API] Error in GET /api/admin/materials/mesh-types/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAdmin(req, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role === 'CONTENT_MANAGER') {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const userId = session.userId;
    const body = await req.json();
    const validatedData = meshUpdateSchema.parse(body);
    const result = await meshService.update(params.id, validatedData, userId);

    await createAuditLogAsync({
      userId,
      action: 'UPDATE_MESH',
      entityType: 'MeshType',
      entityId: params.id,
      details: { name: body.name },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error in PUT /api/admin/materials/mesh-types/[id]:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('не найдена') ? 404 : 500 }
      );
    }

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAdmin(req, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role === 'CONTENT_MANAGER') {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const userId = session.userId;
    await meshService.delete(params.id, userId);

    await createAuditLogAsync({
      userId,
      action: 'DELETE_MESH',
      entityType: 'MeshType',
      entityId: params.id,
      details: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error in DELETE /api/admin/materials/mesh-types/[id]:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('не найдена') ? 404 : 500 }
      );
    }

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAdmin(req, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role === 'CONTENT_MANAGER') {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const userId = session.userId;
    const result = await meshService.toggleActive(params.id, userId);

    await createAuditLogAsync({
      userId,
      action: 'TOGGLE_ACTIVE_MESH',
      entityType: 'MeshType',
      entityId: params.id,
      details: { active: result.active },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error in PATCH /api/admin/materials/mesh-types/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: error instanceof Error && error.message.includes('не найдена') ? 404 : 500 }
    );
  }
}
