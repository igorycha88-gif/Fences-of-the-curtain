import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';
import { mountingHardwareSchema, ReferenceType } from '@/lib/validators/mountingHardware';
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
    const referenceType = searchParams.get('referenceType') as ReferenceType | undefined;
    const referenceId = searchParams.get('referenceId') || undefined;
    const page = safeParseInt(searchParams.get('page'), 1);
    const pageSize = safeParseInt(searchParams.get('pageSize'), 20);

    const result = await mountingHardwareService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      referenceType,
      referenceId,
      page,
      pageSize,
    });

    const isAdmin = session.role === 'ADMIN';
    
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
    
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role !== 'ADMIN') {
      console.log('[MOUNTING-HARDWARE POST] Forbidden - not admin, role:', session.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const validatedData = mountingHardwareSchema.parse(body);
    console.log('[MOUNTING-HARDWARE POST] Validated data:', JSON.stringify(validatedData, null, 2));

    const result = await mountingHardwareService.create(validatedData, session.userId);

    console.log('[MOUNTING-HARDWARE POST] Created with id:', result.id);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('[MOUNTING-HARDWARE POST] Error:', error);
    
    if (error instanceof ZodError) {
      console.error('[MOUNTING-HARDWARE POST] Validation errors:', error.errors);
      return validationError(error);
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
