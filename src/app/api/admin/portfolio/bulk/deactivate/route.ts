import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { portfolioService } from '@/services/admin/portfolioService';
import { bulkOperationSchema } from '@/lib/validators/portfolio';
import { ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();
    const validatedData = bulkOperationSchema.parse(body);

    const result = await portfolioService.bulkDeactivate(validatedData.ids, session.userId);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error bulk deactivating:', error);
    
    if (error instanceof ZodError) {
      return validationError(error);
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
