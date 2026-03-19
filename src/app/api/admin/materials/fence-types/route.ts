import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fenceTypeService } from '@/services/admin/fenceTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { fenceTypeSchema } from '@/lib/validators/fenceType';
import { safeParseInt } from '@/lib/parse-params';
import { ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const search = searchParams.get('search') || undefined;
    const page = safeParseInt(searchParams.get('page'), 1);
    const pageSize = safeParseInt(searchParams.get('pageSize'), 20);

    const result = await fenceTypeService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching fence types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[FENCE-TYPES POST] Starting create fence type...');
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[FENCE-TYPES POST] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      console.log('[FENCE-TYPES POST] Forbidden - no permission, role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const validatedData = fenceTypeSchema.parse(body);
    console.log('[FENCE-TYPES POST] Validated data:', JSON.stringify(validatedData, null, 2));

    const result = await fenceTypeService.create(validatedData, session.user.id);
    console.log('[FENCE-TYPES POST] Created fence type with id:', result.id);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('[FENCE-TYPES POST] Error creating fence type:', error);
    
    if (error instanceof ZodError) {
      console.error('[FENCE-TYPES POST] Validation errors:', error.errors);
      return validationError(error);
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
