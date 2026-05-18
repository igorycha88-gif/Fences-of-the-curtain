import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { seoMonitoringService } from '@/services/admin/seoMonitoringService';
import { safeErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const { active, group, sortOrder } = body;

    const result = await seoMonitoringService.updateKeyword(id, {
      active,
      group,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating SEO keyword:', error);
    if (error instanceof Error && error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return safeErrorResponse(error, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    await seoMonitoringService.deleteKeyword(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting SEO keyword:', error);
    if (error instanceof Error && error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return safeErrorResponse(error, 500);
  }
}
