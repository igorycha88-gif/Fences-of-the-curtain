import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions/rbac';
import type { Role } from '@prisma/client';

export interface AdminSession {
  userId: string;
  email: string;
  name?: string | null;
  role: Role;
}

export async function requireAuth(
  request: NextRequest
): Promise<{ session: AdminSession } | NextResponse> {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.id || !token.role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session: AdminSession = {
    userId: token.id as string,
    email: token.email as string,
    name: token.name as string | null,
    role: token.role as Role,
  };

  return { session };
}

export function requirePermission(
  session: AdminSession,
  permission: string
): true | NextResponse {
  if (!hasPermission(session.role, permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return true;
}

export async function requireAdmin(
  request: NextRequest,
  permission: string
): Promise<{ session: AdminSession } | NextResponse> {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const permResult = requirePermission(authResult.session, permission);
  if (permResult instanceof NextResponse) return permResult;

  return authResult;
}
