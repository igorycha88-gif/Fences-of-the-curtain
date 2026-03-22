import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { auditLogService } from '@/services/admin/auditLogService';
import { hasPermission } from '@/lib/permissions/rbac';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only ADMIN can access audit logs' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const entityId = searchParams.get('entityId') || undefined;
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 100);

    const result = await auditLogService.getAuditLogs({
      userId,
      action,
      entityType,
      entityId,
      dateFrom,
      dateTo,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
