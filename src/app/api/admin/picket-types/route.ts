import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import { picketTypeService } from '@/services/admin/picketTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { picketTypeSchema } from '@/lib/validators/picketType';
import { safeParseInt } from '@/lib/parse-params';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const search = searchParams.get('search') || undefined;
    const coating = searchParams.get('coating') || undefined;
    const page = safeParseInt(searchParams.get('page'), 1);
    const pageSize = safeParseInt(searchParams.get('pageSize'), 20);
    const validityFilter = searchParams.get('validityFilter') as 'all' | 'active' | 'expired' | 'expiring_soon' || 'all';
    const sortBy = searchParams.get('sortBy') || 'priority';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

    const result = await picketTypeService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      coating,
      page,
      pageSize,
      validityFilter,
      sortBy,
      sortOrder,
    });

    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin && result.pickets) {
      result.pickets = result.pickets.map((item: any) => {
        const { purchasePricePerMeter, purchasePricePerUnit, ...itemWithoutPurchasePrice } = item;
        return itemWithoutPurchasePrice;
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching picket types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[PICKET-TYPES POST] Starting create picket type...');
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[PICKET-TYPES POST] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      console.log('[PICKET-TYPES POST] Forbidden - no permission, role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && body.purchasePricePerMeter !== undefined) {
      console.log('[PICKET-TYPES POST] Forbidden - non-admin trying to set purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can set purchase prices' },
        { status: 403 }
      );
    }
    
    const validatedData = picketTypeSchema.parse(body);
    console.log('[PICKET-TYPES POST] Validated data:', JSON.stringify(validatedData, null, 2));

    const result = await picketTypeService.create(validatedData, session.user.id);
    console.log('[PICKET-TYPES POST] Created picket with id:', result.id);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('[PICKET-TYPES POST] Error creating picket type:', error);
    
    if (error instanceof ZodError) {
      console.error('[PICKET-TYPES POST] Validation errors:', error.errors);
      return validationError(error);
    }
    
    if (error.message.includes('уже существует')) {
      console.error('[PICKET-TYPES POST] Duplicate error');
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
