import { timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

function keysMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

function normalizeIp(ip: string): string {
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

export function getClientIp(req: NextRequest): string {
  const raw =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return normalizeIp(raw);
}

export function isLoopbackRequest(req: NextRequest): boolean {
  const ip = getClientIp(req);
  return ip === '127.0.0.1' || ip === '::1' || ip === 'unknown';
}

export function isAuthorizedMonitoringRequest(req: NextRequest): boolean {
  const expected = process.env.MONITORING_KEY;
  if (expected && keysMatch(req.headers.get('x-monitoring-key') || '', expected)) {
    return true;
  }
  return isLoopbackRequest(req);
}
