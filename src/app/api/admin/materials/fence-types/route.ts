import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireAuth } from '@/lib/admin-auth';
import { fenceTypeService } from '@/services/admin/fenceTypeService';
import { fenceTypeSchema } from '@/lib/validators/fenceType';
import { safeParseInt } from '@/lib/parse-params';
import { ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

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
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();

    const validatedData = fenceTypeSchema.parse(body);

    const result = await fenceTypeService.create(validatedData, session.userId);

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
