import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { headers } from 'next/headers';
import { getClientIPFromHeaders } from '@/lib/utils';

export interface LogActionParams {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: Prisma.InputJsonValue | null;
  newValues?: Prisma.InputJsonValue | null;
  details?: Prisma.InputJsonValue;
}

export class AuditLogService {
  async logAction(params: LogActionParams) {
    const headersList = await headers();
    const ipAddress = getClientIPFromHeaders(headersList) || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues ?? undefined,
        newValues: params.newValues ?? undefined,
        details: params.details,
        ipAddress,
        userAgent,
      },
    });
  }

  async getAuditLogs(params: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const {
      userId,
      action,
      entityType,
      entityId,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 50,
    } = params;
    const skip = (page - 1) * pageSize;
    const safePageSize = Math.min(pageSize, 100);

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: safePageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  }

  async getEstimateEditHistory(entityIds: string | string[]) {
    const ids = Array.isArray(entityIds) ? entityIds : [entityIds];
    return prisma.auditLog.findMany({
      where: {
        action: { in: ['CREATE_ADMIN_ESTIMATE', 'UPDATE_ADMIN_ESTIMATE'] },
        entityType: 'FenceEstimate',
        entityId: { in: ids },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActionsByUser(userId: string, limit: number = 100) {
    return prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const auditLogService = new AuditLogService();
