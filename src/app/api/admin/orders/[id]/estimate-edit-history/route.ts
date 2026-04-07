import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { auditLogService } from '@/services/admin/auditLogService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(req, 'orders');
    if (authResult instanceof NextResponse) return authResult;

    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { adminEstimateId: true, estimateId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const estimateIds: string[] = [];
    if (order.adminEstimateId) estimateIds.push(order.adminEstimateId);
    if (order.estimateId) estimateIds.push(order.estimateId);

    if (estimateIds.length === 0) {
      return NextResponse.json({ logs: [] });
    }

    const allLogs = await auditLogService.getEstimateEditHistory(estimateIds);

    const enrichedLogs = allLogs.map((log) => {
      const details = log.details as Record<string, unknown> | null;
      return {
        id: log.id,
        action: log.action,
        user: log.user,
        createdAt: log.createdAt,
        entityId: log.entityId,
        details: details
          ? {
              changes: (details.changes as unknown[]) || [],
              originalEstimateId: details.originalEstimateId || null,
              adminEstimateId: details.adminEstimateId || null,
              editComment: details.editComment || null,
            }
          : null,
      };
    });

    return NextResponse.json({ logs: enrichedLogs });
  } catch (error) {
    console.error('Error fetching estimate edit history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
