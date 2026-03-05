import { Role } from '@prisma/client';

export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  MATERIALS: 'materials',
  ORDERS: 'orders',
  PRICES: 'prices',
  CONTENT: 'content',
  USERS: 'users',
  STATISTICS: 'statistics',
} as const;

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: Object.values(PERMISSIONS),
  MANAGER: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.MATERIALS,
    PERMISSIONS.ORDERS,
    PERMISSIONS.PRICES,
    PERMISSIONS.STATISTICS,
  ],
  CONTENT_MANAGER: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.CONTENT,
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function requirePermission(role: Role, permission: string): void {
  if (!hasPermission(role, permission)) {
    throw new Error('Access denied');
  }
}

export function canDelete(role: Role): boolean {
  return role === 'ADMIN';
}

export function canCreate(role: Role, permission: string): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'MANAGER' && [PERMISSIONS.MATERIALS, PERMISSIONS.ORDERS].includes(permission as any)) {
    return true;
  }
  if (role === 'CONTENT_MANAGER' && permission === PERMISSIONS.CONTENT) {
    return true;
  }
  return false;
}

export function canUpdate(role: Role, permission: string): boolean {
  return canCreate(role, permission);
}
