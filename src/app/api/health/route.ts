import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

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
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return { ok: true, latencyMs: 0, error: 'not configured' };
    }

    const start = Date.now();
    const client = new Redis(redisUrl);
    await client.ping();
    const latencyMs = Date.now() - start;
    client.disconnect();
    return { ok: true, latencyMs };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: true, latencyMs: 0, error: e instanceof Error ? e.message : String(e) };
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
