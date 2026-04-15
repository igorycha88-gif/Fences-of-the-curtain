import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { getClientIPFromHeaders } from '@/lib/utils';
import { Prisma } from '@prisma/client';

export type AuditAction =
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER'
  | 'UPDATE_ORDER_STATUS'
  | 'DELETE_ORDER'
  | 'BATCH_UPDATE_ORDERS'
  | 'EDIT_STATUS_HISTORY'
  | 'UPDATE_PRICE'
  | 'UPDATE_ESTIMATE_PRICES'
  | 'CREATE_ADMIN_ESTIMATE'
  | 'UPDATE_ADMIN_ESTIMATE'
  | 'CREATE_REFERENCE'
  | 'UPDATE_REFERENCE'
  | 'DELETE_REFERENCE';

export interface AuditLogParams {
  userId: string;
  action: AuditAction | string;
  entityType?: string;
  entityId?: string;
  oldValues?: Prisma.InputJsonValue | null;
  newValues?: Prisma.InputJsonValue | null;
  details?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

let systemUserId: string | null = null;

export async function getSystemUserId(): Promise<string> {
  if (systemUserId) {
    return systemUserId;
  }

  const systemUser = await prisma.user.findUnique({
    where: { email: 'system@fences.local' },
    select: { id: true },
  });

  if (systemUser) {
    systemUserId = systemUser.id;
    return systemUserId;
  }

  const newSystemUser = await prisma.user.create({
    data: {
      email: 'system@fences.local',
      name: 'Система',
      password: 'system_internal_disabled',
      role: 'ADMIN',
      phone: '+70000000000',
      active: false,
    },
    select: { id: true },
  });

  systemUserId = newSystemUser.id;
  return systemUserId;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    let ipAddress = params.ipAddress || 'unknown';
    let userAgent = params.userAgent || 'unknown';

    if (!params.ipAddress && !params.userAgent) {
      try {
        const headersList = await headers();
        ipAddress = getClientIPFromHeaders(headersList) || 'unknown';
        userAgent = headersList.get('user-agent') || 'unknown';
      } catch {
      }
    }

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
  } catch (error) {
    console.error('[AUDIT_ERROR] Failed to create audit log:', error);
  }
}

export async function createAuditLogAsync(params: AuditLogParams): Promise<void> {
  let ipAddress = 'unknown';
  let userAgent = 'unknown';

  try {
    const headersList = await headers();
    ipAddress = getClientIPFromHeaders(headersList) || 'unknown';
    userAgent = headersList.get('user-agent') || 'unknown';
  } catch {
  }

  const enrichedParams: AuditLogParams = { ...params, ipAddress, userAgent };
  setImmediate(() => createAuditLog(enrichedParams));
}

export function resetSystemUserIdCache(): void {
  systemUserId = null;
}
