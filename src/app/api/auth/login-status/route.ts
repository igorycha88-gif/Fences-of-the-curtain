import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimitByEndpoint, getRateLimitStatus } from '@/lib/rate-limit';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return 'unknown';
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const ip = getClientIp(req);
  const email = req.nextUrl.searchParams.get('email')?.trim() || '';
  const module_ = 'api/auth/login-status';

  try {
    if (!EMAIL_REGEX.test(email)) {
      logger.warn('[LOGIN STATUS] Invalid email parameter', {
        module: module_,
        operation: 'GET',
        ip,
      });
      return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 });
    }

    const rl = await applyRateLimitByEndpoint(ip, 'login-status');
    if (!rl.allowed) {
      logger.warn('[LOGIN STATUS] Rate limit exceeded for status endpoint', {
        module: module_,
        operation: 'GET',
        ip,
        attempts: rl.attempts,
        durationMs: Date.now() - start,
      });
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': String(rl.remaining),
            'X-RateLimit-Reset': String(Math.floor(rl.resetAt.getTime() / 1000)),
          },
        }
      );
    }

    let blocked = false;
    let resetAt: string | null = null;
    try {
      const status = await getRateLimitStatus(ip, email);
      if (!status.allowed) {
        blocked = true;
        resetAt = status.resetAt.toISOString();
      }
    } catch (statusError) {
      logger.error('[LOGIN STATUS] Failed to get rate limit status, fail-open', {
        module: module_,
        operation: 'getRateLimitStatus',
        ip,
        error: statusError instanceof Error ? statusError.message : 'Unknown error',
      });
    }

    logger.info('[LOGIN STATUS] Status served', {
      module: module_,
      operation: 'GET',
      ip,
      status: 200,
      blocked,
      durationMs: Date.now() - start,
    });

    return NextResponse.json({ blocked, resetAt });
  } catch (error) {
    logger.error('[LOGIN STATUS] Unexpected error', {
      module: module_,
      operation: 'GET',
      ip,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
