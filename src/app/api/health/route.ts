import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import logger from '@/lib/logger';
import { checkAndSend } from '@/services/cron';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

let _version: string | undefined;

function getAppVersion(): string {
  if (_version !== undefined) return _version;
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    _version = (pkg.version as string) || 'unknown';
  } catch {
    _version = process.env.npm_package_version || 'unknown';
  }
  return _version ?? 'unknown';
}

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
  checkAndSend().catch(() => {});

  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
  };

  const allOk = checks.database.ok && checks.redis.ok;

  const body = {
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: getAppVersion(),
    checks,
  };

  if (!allOk) {
    logger.error('Health check degraded', { checks, module: 'health' });
  }

  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}
