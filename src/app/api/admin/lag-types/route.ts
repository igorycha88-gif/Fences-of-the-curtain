import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { lagTypeService } from '@/services/admin/lagTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { lagTypeSchema } from '@/lib/validators/lagType';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const search = searchParams.get('search') || undefined;
    const minThickness = searchParams.get('minThickness');
    const maxThickness = searchParams.get('maxThickness');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const validityFilter = searchParams.get('validityFilter') as 'all' | 'active' | 'expired' | 'expiring_soon' || 'all';

    const result = await lagTypeService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      minThickness: minThickness ? parseFloat(minThickness) : undefined,
      maxThickness: maxThickness ? parseFloat(maxThickness) : undefined,
      page,
      pageSize,
      validityFilter,
    });

    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin && result.lags) {
      result.lags = result.lags.map((lag: any) => {
        const { purchasePricePerUnit, ...lagWithoutPurchasePrice } = lag;
        return lagWithoutPurchasePrice;
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching lag types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[LAG-TYPES POST] Starting create lag type...');
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[LAG-TYPES POST] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      console.log('[LAG-TYPES POST] Forbidden - not admin, role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const validatedData = lagTypeSchema.parse(body);
    console.log('[LAG-TYPES POST] Validated data:', JSON.stringify(validatedData, null, 2));

    const result = await lagTypeService.create(validatedData, session.user.id);
    
    if (result && 'warning' in result) {
      console.log('[LAG-TYPES POST] Returning warning response');
      return NextResponse.json(result, { status: 200 });
    }

    console.log('[LAG-TYPES POST] Created lag with id:', (result as any).id);

    return NextResponse.json({ id: (result as any).id }, { status: 201 });
  } catch (error: any) {
    console.error('[LAG-TYPES POST] Error creating lag type:', error);
    
    if (error.name === 'ZodError') {
      console.error('[LAG-TYPES POST] Validation errors:', error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    if (error.message.includes('уже существует') || error.message.includes('должна отличаться')) {
      console.error('[LAG-TYPES POST] Duplicate/validation error');
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
