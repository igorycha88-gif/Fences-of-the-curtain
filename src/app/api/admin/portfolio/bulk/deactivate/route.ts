import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { portfolioService } from '@/services/admin/portfolioService';
import { bulkOperationSchema } from '@/lib/validators/portfolio';
import { ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'CONTENT_MANAGER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = bulkOperationSchema.parse(body);

    const result = await portfolioService.bulkDeactivate(validatedData.ids, session.user.id);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error bulk deactivating:', error);
    
    if (error instanceof ZodError) {
      return validationError(error);
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
