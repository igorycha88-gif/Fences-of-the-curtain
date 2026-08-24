import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { requireAuth } from '@/lib/admin-auth';
import { isNotifiableEvent, sendAnalyticsNotification } from '@/services/telegram/analytics-notifier';
import { getMoscowDate } from '@/lib/timezone';
import { buildTrackingWrites, extractExternalHost, extractServiceLabel, ACTIVE_WINDOW_SEC } from '@/lib/tracking-metrics';
import logger from '@/lib/logger';

const ANALYTICS_KEY_PREFIX = 'analytics:';
const ANALYTICS_TTL = 86400 * 30;
const SESSION_TTL = 86400 * 1;

const ANALYTICS_RATE_LIMIT = { max: 100, windowSec: 60 };
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function logMetricError(context: string, err: unknown) {
  logger.error('Analytics metric error', {
    module: 'api/analytics/events',
    operation: 'logMetricError',
    context,
    error: err,
  });
}

function resolveTimestampMs(raw: unknown): number {
  const now = Date.now();
  if (typeof raw !== 'string' && typeof raw !== 'number') return now;
  const parsed = new Date(raw as string | number).getTime();
  if (!Number.isFinite(parsed)) return now;
  if (Math.abs(parsed - now) > MAX_TIMESTAMP_SKEW_MS) return now;
  return parsed;
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const ip = getClientIp(req);
    const rlKey = `rate_limit:analytics:${ip}`;
    const attempts = await redis.incr(rlKey);
    if (attempts === 1) {
      await redis.expire(rlKey, ANALYTICS_RATE_LIMIT.windowSec);
    }
    if (attempts > ANALYTICS_RATE_LIMIT.max) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { eventName, sessionId, page, referrer, timestamp } = body;

    if (!eventName || !sessionId) {
      return NextResponse.json(
        { error: 'eventName and sessionId are required' },
        { status: 400 }
      );
    }

    if (!SAFE_ID_REGEX.test(String(eventName))) {
      return NextResponse.json(
        { error: 'Invalid eventName format' },
        { status: 400 }
      );
    }

    if (!SAFE_ID_REGEX.test(String(sessionId))) {
      return NextResponse.json(
        { error: 'Invalid sessionId format' },
        { status: 400 }
      );
    }

    const metricsPage = (page || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestampMs = resolveTimestampMs(timestamp);
    const isoTimestamp = new Date(timestampMs).toISOString();

    const sessionKey = `${ANALYTICS_KEY_PREFIX}sessions:${sessionId}`;

    let prevLastActive: string | null = null;
    try {
      prevLastActive = await redis.hget(sessionKey, 'lastActive');
    } catch (err) {
      logMetricError('hget_last_active', err);
    }

    let totalEventsAfter = 0;
    let pageViewsAfter = 0;
    try {
      totalEventsAfter = await redis.hincrby(sessionKey, 'totalEvents', 1);
      if (eventName === 'page_view') {
        pageViewsAfter = await redis.hincrby(sessionKey, 'pageViews', 1);
      }
    } catch (err) {
      logMetricError('session_counters', err);
    }

    const gapMs = prevLastActive ? timestampMs - new Date(prevLastActive).getTime() : Number.NaN;
    const sessionJustStarted =
      totalEventsAfter <= 1 || !Number.isFinite(gapMs) || gapMs > ACTIVE_WINDOW_SEC * 1000;
    const isEngagement = totalEventsAfter === 2;
    const isFirstPageView = pageViewsAfter === 1;

    const properties =
      typeof body.properties === 'object' && body.properties !== null
        ? (body.properties as Record<string, unknown>)
        : {};
    const service = extractServiceLabel(String(eventName), String(page || ''), properties);
    const referralHost = extractExternalHost(referrer);

    const pipeline = redis.pipeline();

    const dailyKey = `${ANALYTICS_KEY_PREFIX}daily:${getMoscowDate()}`;
    pipeline.hincrby(dailyKey, eventName, 1);
    pipeline.expire(dailyKey, ANALYTICS_TTL);

    const pageKey = `${ANALYTICS_KEY_PREFIX}pages:${metricsPage}`;
    pipeline.hincrby(pageKey, eventName, 1);
    pipeline.expire(pageKey, ANALYTICS_TTL);

    const eventsKey = `${ANALYTICS_KEY_PREFIX}metrics:events:${eventName}:${metricsPage}`;
    pipeline.hincrby(eventsKey, 'count', 1);
    pipeline.expire(eventsKey, ANALYTICS_TTL);

    pipeline.hset(sessionKey, 'lastActive', isoTimestamp);
    pipeline.hsetnx(sessionKey, 'startTime', isoTimestamp);
    pipeline.expire(sessionKey, SESSION_TTL);

    buildTrackingWrites(pipeline, {
      eventName: String(eventName),
      sessionId: String(sessionId),
      timestampMs,
      sessionJustStarted,
      isEngagement,
      isFirstPageView,
      service,
      referralHost,
    });

    await pipeline.exec();

    logger.info('Analytics event recorded', {
      module: 'api/analytics/events',
      operation: 'POST',
      eventName: String(eventName),
      durationMs: Date.now() - startedAt,
    });

    if (isNotifiableEvent(eventName)) {
      sendAnalyticsNotification({
        eventName,
        page: metricsPage,
        sessionId,
        timestamp: isoTimestamp,
        ip,
      }).catch(err => logMetricError('telegram_notification', err));
    }

    if (eventName === 'contact_form_submit') {
      redis.incr('analytics:metrics:rates:forms_last_minute').then(() => {
        redis.expire('analytics:metrics:rates:forms_last_minute', 60);
      }).catch(err => logMetricError('forms_last_minute', err));
    }

    if (['page_view', 'contact_form_submit'].includes(eventName)) {
      redis.hgetall(dailyKey).then(data => {
        const pv = parseInt(data['page_view'] || '0', 10);
        const fs = parseInt(data['contact_form_submit'] || '0', 10);
        if (pv > 0) {
          redis.set('analytics:metrics:rates:funnel_completion', String(fs / pv), 'EX', 3600);
        }
      }).catch(err => logMetricError('funnel_completion', err));
    }

    const today = getMoscowDate();
    const uniquePipeline = redis.pipeline();
    uniquePipeline.sadd(`analytics:metrics:unique_users_set:${today}`, sessionId);
    uniquePipeline.expire(`analytics:metrics:unique_users_set:${today}`, 86400);
    uniquePipeline.scard(`analytics:metrics:unique_users_set:${today}`);
    uniquePipeline.exec().then(results => {
      if (!results || !results[2]) return;
      const scardResult = results[2][1];
      if (scardResult !== undefined && scardResult !== null) {
        redis.set('analytics:metrics:unique_users_today', String(scardResult), 'EX', 86400);
      }
    }).catch(err => logMetricError('unique_users', err));

    redis.hget(sessionKey, 'startTime').then(startTime => {
      if (!startTime) return;
      const durationSec = (timestampMs - new Date(startTime).getTime()) / 1000;
      if (durationSec > 0 && durationSec < 86400) {
        const durPipeline = redis.pipeline();
        durPipeline.lpush('analytics:metrics:recent_session_durations', String(durationSec));
        durPipeline.ltrim('analytics:metrics:recent_session_durations', 0, 199);
        durPipeline.expire('analytics:metrics:recent_session_durations', 86400);
        durPipeline.exec().then(() => {
          redis.lrange('analytics:metrics:recent_session_durations', 0, -1).then(durations => {
            if (durations.length > 0) {
              const avg = durations.reduce((s, d) => s + parseFloat(d), 0) / durations.length;
              redis.set('analytics:metrics:avg_session_duration', String(avg), 'EX', 86400);
            }
          }).catch(err => logMetricError('session_duration_avg', err));
        }).catch(err => logMetricError('session_duration_pipeline', err));
      }
    }).catch(err => logMetricError('session_duration', err));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error('Analytics error', {
      module: 'api/analytics/events',
      operation: 'POST',
      status: 500,
      durationMs: Date.now() - startedAt,
      error,
    });
    return NextResponse.json(
      { error: 'Failed to record analytics event' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7d';

    const days = period === '30d' ? 30 : period === '24h' ? 1 : 7;
    const results: Record<string, Record<string, number>> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' });
      const dailyKey = `${ANALYTICS_KEY_PREFIX}daily:${dateStr}`;
      const data = await redis.hgetall(dailyKey);
      if (Object.keys(data).length > 0) {
        results[dateStr] = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, Number(v)])
        );
      }
    }

    return NextResponse.json({ data: results, period });
  } catch (error) {
    logger.error('Analytics fetch error', {
      module: 'api/analytics/events',
      operation: 'GET',
      status: 500,
      error,
    });
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
