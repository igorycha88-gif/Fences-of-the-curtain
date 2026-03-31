import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { priorityService } from '@/services/admin/priorityService';
import { z, ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

const reorderSchema = z.object({
  id: z.string().min(1),
  newPriority: z.number().int().min(1),
});

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();
    const validatedData = reorderSchema.parse(body);

    const result = await priorityService.reorder(
      'profnastilType',
      validatedData.id,
      validatedData.newPriority,
      session.userId
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[PROFNASTIL REORDER] Error:', error);

    if (error instanceof ZodError) {
      return validationError(error);
    }

    if (error.message.includes('не найдена')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.message.includes('Приоритет')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
