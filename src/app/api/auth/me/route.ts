import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[AUTH /me] Checking session...');
  
  const session = await getServerSession(authOptions);

  console.log('[AUTH /me] Session result:', session ? 'Found' : 'Not found');
  
  if (!session) {
    console.log('[AUTH /me] Returning 401 Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[AUTH /me] User authenticated, role:', session.user?.role);
  return NextResponse.json({ user: session.user });
}

function hasPermission(userRole: string, requiredRole: Role): boolean {
  const roleHierarchy = {
    ADMIN: 3,
    MANAGER: 2,
    CONTENT_MANAGER: 1,
  };

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];
}
