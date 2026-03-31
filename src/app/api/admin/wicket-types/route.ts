import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { wicketTypeService } from '@/services/admin/wicketTypeService';
import { wicketTypeSchema } from '@/lib/validators/wicketType';
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
    const validityFilter = searchParams.get('validityFilter') as 'all' | 'active' | 'expired' | 'expiring_soon' || 'all';

    const result = await wicketTypeService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      page,
      pageSize,
      validityFilter,
    });

    const isAdmin = session.role === 'ADMIN';
    
    if (!isAdmin && result.wickets) {
      result.wickets = result.wickets.map((wicket: any) => {
        const { purchasePrice, ...wicketWithoutPurchasePrice } = wicket;
        return wicketWithoutPurchasePrice;
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching wicket types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[WICKET-TYPES POST] Starting create wicket type...');
    
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role !== 'ADMIN') {
      console.log('[WICKET-TYPES POST] Forbidden - not admin, role:', session.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const validatedData = wicketTypeSchema.parse(body);
    console.log('[WICKET-TYPES POST] Validated data:', JSON.stringify(validatedData, null, 2));

    const result = await wicketTypeService.create(validatedData, session.userId);

    console.log('[WICKET-TYPES POST] Created wicket with id:', result.id);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('[WICKET-TYPES POST] Error creating wicket type:', error);
    
    if (error instanceof ZodError) {
      console.error('[WICKET-TYPES POST] Validation errors:', error.errors);
      return validationError(error);
    }
    
    if (error.message.includes('уже существу')) {
      console.error('[WICKET-TYPES POST] Duplicate/validation error');
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
