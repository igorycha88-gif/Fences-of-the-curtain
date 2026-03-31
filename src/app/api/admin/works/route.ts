import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { workService } from '@/services/admin/workService';
import { createWorkSchema, workQuerySchema } from '@/lib/validators/work';
import { safeParseInt } from '@/lib/parse-params';
import { ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const useInCalculator = searchParams.get('useInCalculator');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const fenceType = searchParams.get('fenceType') || undefined;
    const page = safeParseInt(searchParams.get('page'), 1);
    const pageSize = safeParseInt(searchParams.get('pageSize'), 20);

    const result = await workService.getAll({
      active: active ? active === 'true' : undefined,
      useInCalculator: useInCalculator ? useInCalculator === 'true' : undefined,
      category,
      search,
      fenceType,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching works:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const validatedData = createWorkSchema.parse(body);

    const result = await workService.create(validatedData, session.userId);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating work:', error);
    
    if (error instanceof ZodError) {
      return validationError(error);
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
