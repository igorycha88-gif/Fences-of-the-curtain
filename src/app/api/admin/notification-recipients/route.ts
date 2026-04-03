import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { notificationRecipientService } from '@/services/admin/notificationRecipientService';
import { z, ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

const createRecipientSchema = z.object({
  email: z.string().email('Некорректный формат email'),
  name: z.string().optional(),
  active: z.boolean().optional(),
});

const updateRecipientSchema = z.object({
  email: z.string().email('Некорректный формат email').optional(),
  name: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const active = searchParams.get('active');
    const search = searchParams.get('search') || undefined;

    const result = await notificationRecipientService.getRecipients({
      page,
      pageSize,
      active: active !== null ? active === 'true' : undefined,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching notification recipients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const validatedData = createRecipientSchema.parse(body);

    const recipient = await notificationRecipientService.createRecipient(validatedData);

    return NextResponse.json(recipient, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'RECIPENT_EXISTS', message: 'Получатель с таким email уже существует' },
        { status: 409 }
      );
    }
    console.error('Error creating notification recipient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const validatedData = updateRecipientSchema.parse(body);

    if (!body.id) {
      return NextResponse.json(
        { error: 'MISSING_ID', message: 'Не указан ID получателя' },
        { status: 400 }
      );
    }

    const recipient = await notificationRecipientService.updateRecipient(body.id, validatedData);

    return NextResponse.json(recipient);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    console.error('Error updating notification recipient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
