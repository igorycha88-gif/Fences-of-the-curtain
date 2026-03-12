import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wicketTypeService } from '@/services/admin/wicketTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { wicketTypeSchema } from '@/lib/validators/wicketType';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const validityFilter = searchParams.get('validityFilter') as 'all' | 'active' | 'expired' | 'expiring_soon' || 'all';

    const result = await wicketTypeService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      page,
      pageSize,
      validityFilter,
    });

    const isAdmin = session.user.role === 'ADMIN';
    
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
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[WICKET-TYPES POST] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      console.log('[WICKET-TYPES POST] Forbidden - not admin, role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    console.log('[WICKET-TYPES POST] Request body:', JSON.stringify(body, null, 2));
    
    const validatedData = wicketTypeSchema.parse(body);
    console.log('[WICKET-TYPES POST] Validated data:', JSON.stringify(validatedData, null, 2));

    const result = await wicketTypeService.create(validatedData, session.user.id);

    console.log('[WICKET-TYPES POST] Created wicket with id:', result.id);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('[WICKET-TYPES POST] Error creating wicket type:', error);
    
    if (error.name === 'ZodError') {
      console.error('[WICKET-TYPES POST] Validation errors:', error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    if (error.message.includes('уже существу')) {
      console.error('[WICKET-TYPES POST] Duplicate/validation error');
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
