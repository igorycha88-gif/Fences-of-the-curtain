import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { automationTypeService } from '@/services/admin/automationTypeService';
import { automationTypeUpdateSchema } from '@/lib/validators/automationType';
import { ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const item = await automationTypeService.getById(params.id);

    if (!item) {
      return NextResponse.json({ error: 'Автоматика не найдена' }, { status: 404 });
    }

    const isAdmin = session.role === 'ADMIN';

    if (!isAdmin) {
      const { purchasePrice, ...itemWithoutPurchasePrice } = item;
      return NextResponse.json(itemWithoutPurchasePrice);
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching automation type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();

    const isAdmin = session.role === 'ADMIN';

    if (!isAdmin && body.purchasePrice !== undefined) {
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    const validatedData = automationTypeUpdateSchema.parse(body);

    await automationTypeService.update(params.id, validatedData, session.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating automation type:', error);

    if (error instanceof ZodError) {
      return validationError(error);
    }

    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.message.includes('уже существу')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await automationTypeService.delete(params.id, session.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting automation type:', error);

    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const item = await automationTypeService.toggleActive(params.id, session.userId);

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error toggling automation type active status:', error);

    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
