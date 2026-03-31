import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { gateTypeService } from '@/services/admin/gateTypeService';
import { gateTypeSchema } from '@/lib/validators/gateType';
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
    const type = searchParams.get('type') as 'all' | 'Распашные' | 'Откатные' || 'all';
    const page = safeParseInt(searchParams.get('page'), 1);
    const pageSize = safeParseInt(searchParams.get('pageSize'), 20);
    const validityFilter = searchParams.get('validityFilter') as 'all' | 'active' | 'expired' | 'expiring_soon' || 'all';

    const result = await gateTypeService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      type,
      page,
      pageSize,
      validityFilter,
    });

    const isAdmin = session.role === 'ADMIN';
    
    if (!isAdmin && result.gates) {
      result.gates = result.gates.map((gate: any) => {
        const { purchasePrice, ...gateWithoutPurchasePrice } = gate;
        return gateWithoutPurchasePrice;
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching gate types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[GATE-TYPES POST] Starting create gate type...');
    
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role !== 'ADMIN') {
      console.log('[GATE-TYPES POST] Forbidden - not admin, role:', session.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const validatedData = gateTypeSchema.parse(body);
    console.log('[GATE-TYPES POST] Validated data:', JSON.stringify(validatedData, null, 2));

    const result = await gateTypeService.create(validatedData, session.userId);

    console.log('[GATE-TYPES POST] Created gate with id:', result.id);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('[GATE-TYPES POST] Error creating gate type:', error);
    
    if (error instanceof ZodError) {
      console.error('[GATE-TYPES POST] Validation errors:', error.errors);
      return validationError(error);
    }
    
    if (error.message.includes('уже существу')) {
      console.error('[GATE-TYPES POST] Duplicate/validation error');
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
