import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions/rbac';
import { priorityService } from '@/services/admin/priorityService';
import { z, ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

const reorderSchema = z.object({
  id: z.string().min(1),
  newPriority: z.number().int().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = reorderSchema.parse(body);

    const { entityType } = await params;
    const modelMap: Record<string, string> = {
      'profnastil-types': 'profnastilType',
      'picket-types': 'picketType',
      'post-types': 'postType',
      'lag-types': 'lagType',
      'gate-types': 'gateType',
      'wicket-types': 'wicketType',
      'fence-types': 'fenceType',
    };

    const model = modelMap[entityType];
    if (!model) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    const result = await priorityService.reorder(
      model as any,
      validatedData.id,
      validatedData.newPriority,
      session.user.id
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[REORDER] Error:', error);

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
