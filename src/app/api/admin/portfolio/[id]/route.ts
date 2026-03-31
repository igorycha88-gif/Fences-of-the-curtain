import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { portfolioService } from '@/services/admin/portfolioService';
import { portfolioUpdateSchema } from '@/lib/validators/portfolio';
import { ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const item = await portfolioService.getById(id);

    if (!item) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching portfolio item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const { id } = await params;
    const body = await request.json();
    const validatedData = portfolioUpdateSchema.parse(body);

    const result = await portfolioService.update(id, validatedData, session.userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating portfolio item:', error);
    
    if (error instanceof ZodError) {
      return validationError(error);
    }
    
    if (error.message === 'Элемент портфолио не найден') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const { id } = await params;
    await portfolioService.delete(id, session.userId);

    return NextResponse.json({ success: true, message: 'Portfolio item deleted' });
  } catch (error: any) {
    console.error('Error deleting portfolio item:', error);
    
    if (error.message === 'Элемент портфолио не найден') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const { id } = await params;
    const result = await portfolioService.toggleActive(id, session.userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error toggling portfolio item:', error);
    
    if (error.message === 'Элемент портфолио не найден') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
