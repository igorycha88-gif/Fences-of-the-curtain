import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { meshService } from '@/services/admin/meshService';
import { createAuditLogAsync } from '@/lib/audit';
import { meshSchema } from '@/lib/validators/mesh';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const active = searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined;
    const search = searchParams.get('search') || undefined;
    const minHeight = searchParams.get('minHeight') ? parseInt(searchParams.get('minHeight')!) : undefined;
    const maxHeight = searchParams.get('maxHeight') ? parseInt(searchParams.get('maxHeight')!) : undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined;
    const validityFilter = (searchParams.get('validityFilter') as 'all' | 'active' | 'expired' | 'expiring_soon') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined;

    const result = await meshService.getAll({
      active,
      search,
      minHeight,
      maxHeight,
      page,
      pageSize,
      validityFilter,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error in GET /api/admin/materials/mesh-types:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role === 'CONTENT_MANAGER') {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const userId = session.userId;
    const body = await req.json();
    const validatedData = meshSchema.parse(body);
    const result = await meshService.create(validatedData, userId);

    await createAuditLogAsync({
      userId,
      action: 'CREATE_MESH',
      entityType: 'MeshType',
      entityId: result.id,
      details: { name: result.name },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[API] Error in POST /api/admin/materials/mesh-types:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
