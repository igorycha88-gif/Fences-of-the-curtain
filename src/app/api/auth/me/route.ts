import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[AUTH /me] Checking session...');
  
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    console.log('[AUTH /me] Returning 401 Unauthorized');
    return authResult;
  }

  const { session } = authResult;
  console.log('[AUTH /me] Session result:', 'Found');
  console.log('[AUTH /me] User authenticated, role:', session.role);
  return NextResponse.json({ user: { id: session.userId, email: session.email, name: session.name, role: session.role } });
}

function hasPermission(userRole: string, requiredRole: Role): boolean {
  const roleHierarchy = {
    ADMIN: 3,
    MANAGER: 2,
    CONTENT_MANAGER: 1,
  };

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];
}
