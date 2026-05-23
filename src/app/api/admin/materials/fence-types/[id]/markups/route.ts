import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { lengthMarkupService } from '@/services/calculator/lengthMarkupService';
import { fenceLengthMarkupSchema, fenceLengthMarkupUpdateSchema } from '@/lib/validators/lengthMarkup';
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

    const markups = await lengthMarkupService.getMarkupsForFenceType(params.id);

    return NextResponse.json({ markups });
  } catch (error) {
    console.error('[Markups GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();
    const validatedData = fenceLengthMarkupSchema.parse(body);

    const markup = await lengthMarkupService.createMarkup(
      params.id,
      validatedData,
      session.userId
    );

    return NextResponse.json({ markup }, { status: 201 });
  } catch (error: any) {
    console.error('[Markups POST] Error:', error);

    if (error instanceof ZodError) {
      return validationError(error);
    }

    if (error.message.includes('пересекается')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
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
    const { markupId, ...updateData } = body;

    if (!markupId) {
      return NextResponse.json(
        { error: 'markupId обязателен' },
        { status: 400 }
      );
    }

    const validatedData = fenceLengthMarkupUpdateSchema.parse(updateData);

    const markup = await lengthMarkupService.updateMarkup(
      markupId,
      params.id,
      validatedData,
      session.userId
    );

    return NextResponse.json({ markup });
  } catch (error: any) {
    console.error('[Markups PUT] Error:', error);

    if (error instanceof ZodError) {
      return validationError(error);
    }

    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.message.includes('пересекается')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
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

    const { searchParams } = new URL(request.url);
    const markupId = searchParams.get('markupId');

    if (!markupId) {
      return NextResponse.json(
        { error: 'markupId обязателен' },
        { status: 400 }
      );
    }

    await lengthMarkupService.deleteMarkup(markupId, session.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Markups DELETE] Error:', error);

    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
