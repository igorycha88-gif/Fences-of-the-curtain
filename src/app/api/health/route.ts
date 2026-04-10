import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

async function checkDatabase(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

async function checkRedis(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await redis.ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
  };

  const allOk = checks.database.ok && checks.redis.ok;

  const body = {
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || 'unknown',
    checks,
  };

  if (!allOk) {
    logger.error('Health check degraded', { checks, module: 'health' });
  }

  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}
