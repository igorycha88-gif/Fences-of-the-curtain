import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { notificationRecipientService } from '@/services/admin/notificationRecipientService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const recipients = await notificationRecipientService.getRecipients({
      page: 1,
      pageSize: 1,
    });

    const recipient = recipients.recipients.find(
      (r: { id: string }) => r.id === params.id
    );

    if (!recipient) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Получатель не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(recipient);
  } catch (error) {
    console.error('Error fetching notification recipient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    await notificationRecipientService.deleteRecipient(params.id);

    return NextResponse.json({ message: 'Получатель удален' });
  } catch (error) {
    console.error('Error deleting notification recipient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();

    if (body.active !== undefined) {
      const recipient = await notificationRecipientService.toggleActive(params.id);
      return NextResponse.json(recipient);
    }

    return NextResponse.json(
      { error: 'BAD_REQUEST', message: 'Некорректный запрос' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error toggling notification recipient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
