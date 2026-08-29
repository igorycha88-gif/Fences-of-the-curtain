import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { businessMetricsService } from '@/services/admin/businessMetricsService';
import { parseMetricsQuery } from '@/lib/validators/businessMetrics';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const authResult = await requireAdmin(request, 'statistics');
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult.session.userId;

    logger.info('BusinessMetrics API request', {
      module: 'api/admin/business-metrics',
      method: request.method,
      path: request.nextUrl.pathname,
      userId,
      query: request.nextUrl.searchParams.toString(),
    });

    const parsed = parseMetricsQuery(request.nextUrl.searchParams);
    if ('error' in parsed) {
      logger.warn('BusinessMetrics API invalid query', {
        module: 'api/admin/business-metrics',
        userId,
        error: parsed.error,
      });
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const metrics = await businessMetricsService.getBusinessMetrics(parsed.filters);

    logger.info('BusinessMetrics API response', {
      module: 'api/admin/business-metrics',
      method: request.method,
      path: request.nextUrl.pathname,
      userId,
      status: 200,
      duration: Date.now() - startedAt,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    logger.error('BusinessMetrics API error', {
      module: 'api/admin/business-metrics',
      method: request.method,
      path: request.nextUrl.pathname,
      status: 500,
      duration: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
