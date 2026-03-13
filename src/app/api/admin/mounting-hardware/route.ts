import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';
import { hasPermission } from '@/lib/permissions/rbac';
import { mountingHardwareSchema, ReferenceType } from '@/lib/validators/mountingHardware';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const search = searchParams.get('search') || undefined;
    const referenceType = searchParams.get('referenceType') as ReferenceType | undefined;
    const referenceId = searchParams.get('referenceId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await mountingHardwareService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      referenceType,
      referenceId,
      page,
      pageSize,
    });

    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin && result.items) {
      result.items = result.items.map((item: any) => {
        const { purchasePrice, ...itemWithoutPurchasePrice } = item;
        return itemWithoutPurchasePrice;
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching mounting hardware:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[MOUNTING-HARDWARE POST] Starting create...');
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.log('[MOUNTING-HARDWARE POST] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      console.log('[MOUNTING-HARDWARE POST] Forbidden - not admin, role:', session.user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    console.log('[MOUNTING-HARDWARE POST] Request body:', JSON.stringify(body, null, 2));
    
    const validatedData = mountingHardwareSchema.parse(body);
    console.log('[MOUNTING-HARDWARE POST] Validated data:', JSON.stringify(validatedData, null, 2));

    const result = await mountingHardwareService.create(validatedData, session.user.id);

    console.log('[MOUNTING-HARDWARE POST] Created with id:', result.id);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('[MOUNTING-HARDWARE POST] Error:', error);
    
    if (error.name === 'ZodError') {
      console.error('[MOUNTING-HARDWARE POST] Validation errors:', error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
