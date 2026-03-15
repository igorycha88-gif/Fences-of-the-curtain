import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { getClientIPFromHeaders } from '@/lib/utils';

export class AuditLogService {
  async logAction(params: {
    userId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: any;
  }) {
    const headersList = await headers();
    const ipAddress = getClientIPFromHeaders(headersList) || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await (prisma as any).adminActionLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
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

    const where: any = {};

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
      (prisma as any).adminActionLog.findMany({
        where,
        skip,
        take: pageSize,
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
      (prisma as any).adminActionLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getActionsByUser(userId: string, limit: number = 100) {
    return (prisma as any).adminActionLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const auditLogService = new AuditLogService();
