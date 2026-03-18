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
  } catch (error) {
    console.error('[AUDIT_ERROR] Failed to create audit log:', error);
  }
}

export function createAuditLogAsync(params: AuditLogParams): void {
  setImmediate(() => createAuditLog(params));
}

export function resetSystemUserIdCache(): void {
  systemUserId = null;
}
