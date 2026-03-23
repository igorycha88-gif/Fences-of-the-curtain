import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import { profnastilTypeService } from '@/services/admin/profnastilTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { profnastilTypeSchema } from '@/lib/validators/profnastilType';
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

    const result = await profnastilTypeService.getAll({
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

    if (!isAdmin && result.profnastil) {
      result.profnastil = result.profnastil.map((item: any) => {
        const { purchasePricePerUnit, purchasePricePerLinearMeter, ...itemWithoutPurchasePrice } = item;
        return itemWithoutPurchasePrice;
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching profnastil types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[PROFNASTIL-TYPES POST] Starting create profnastil type...');
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[PROFNASTIL-TYPES POST] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      console.log('[PROFNASTIL-TYPES POST] Forbidden - no permission, role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && body.purchasePricePerUnit !== undefined) {
      console.log('[PROFNASTIL-TYPES POST] Forbidden - non-admin trying to set purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can set purchase prices' },
        { status: 403 }
      );
    }

    if (!isAdmin && body.purchasePricePerLinearMeter !== undefined) {
      console.log('[PROFNASTIL-TYPES POST] Forbidden - non-admin trying to set purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can set purchase prices' },
        { status: 403 }
      );
    }
    
    const validatedData = profnastilTypeSchema.parse(body);
    console.log('[PROFNASTIL-TYPES POST] Validated data:', JSON.stringify(validatedData, null, 2));

    const result = await profnastilTypeService.create(validatedData, session.user.id);
    console.log('[PROFNASTIL-TYPES POST] Created profnastil with id:', result.id);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('[PROFNASTIL-TYPES POST] Error creating profnastil type:', error);
    
    if (error instanceof ZodError) {
      console.error('[PROFNASTIL-TYPES POST] Validation errors:', error.errors);
      return validationError(error);
    }
    
    if (error.message.includes('уже существует')) {
      console.error('[PROFNASTIL-TYPES POST] Duplicate error');
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
