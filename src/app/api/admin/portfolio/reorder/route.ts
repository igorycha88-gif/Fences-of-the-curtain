import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { portfolioService } from '@/services/admin/portfolioService';
import { reorderSchema } from '@/lib/validators/portfolio';
import { ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'CONTENT_MANAGER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = reorderSchema.parse(body);

    const result = await portfolioService.reorder(validatedData.items, session.user.id);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error reordering portfolio:', error);
    
    if (error instanceof ZodError) {
      return validationError(error);
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
