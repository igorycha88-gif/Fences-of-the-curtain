import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE_NAME = 'session_id';
export const SESSION_MAX_AGE = 3600;

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (existingSessionId) {
    return existingSessionId;
  }

  const newSessionId = generateSessionId();
  cookieStore.set(SESSION_COOKIE_NAME, newSessionId, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });

  return newSessionId;
}

export async function getSessionFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function validateSession(sessionId: string): Promise<boolean> {
  const estimate = await prisma.fenceEstimate.findFirst({
    where: { sessionId },
    select: { id: true },
  });

  return !!estimate;
}

export async function getEstimateBySessionId(sessionId: string) {
  return prisma.fenceEstimate.findFirst({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
  });
}
