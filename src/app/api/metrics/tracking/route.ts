import { NextRequest, NextResponse } from 'next/server';
import { getTrackingMetricsString } from '@/lib/tracking-metrics';
import { isAuthorizedMonitoringRequest, getClientIp } from '@/lib/monitoring-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const clientIp = getClientIp(req);

  try {
    if (!isAuthorizedMonitoringRequest(req)) {
      logger.warn('Tracking metrics access denied', {
        module: 'api/metrics/tracking',
        operation: 'GET',
        ip: clientIp,
        path: req.nextUrl?.pathname || '/api/metrics/tracking',
      });
      return new NextResponse('Forbidden', { status: 403 });
    }

    const metrics = await getTrackingMetricsString();

    logger.info('Tracking metrics served', {
      module: 'api/metrics/tracking',
      operation: 'GET',
      status: 200,
      ip: clientIp,
      durationMs: Date.now() - startedAt,
    });

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    logger.error('Tracking metrics endpoint failed', {
      module: 'api/metrics/tracking',
      operation: 'GET',
      ip: clientIp,
      status: 500,
      durationMs: Date.now() - startedAt,
      error,
    });
    return NextResponse.json({ error: 'Failed to generate tracking metrics' }, { status: 500 });
  }
}
