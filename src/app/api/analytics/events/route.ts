import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const ANALYTICS_KEY_PREFIX = 'analytics:';
const ANALYTICS_TTL = 86400 * 30;
const SESSION_TTL = 86400 * 1;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, sessionId, page, referrer, timestamp } = body;

    if (!eventName || !sessionId) {
      return NextResponse.json(
        { error: 'eventName and sessionId are required' },
        { status: 400 }
      );
    }

    const metricsPage = (page || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');

    const pipeline = redis.pipeline();

    const dailyKey = `${ANALYTICS_KEY_PREFIX}daily:${new Date().toISOString().split('T')[0]}`;
    pipeline.hincrby(dailyKey, eventName, 1);
    pipeline.expire(dailyKey, ANALYTICS_TTL);

    const pageKey = `${ANALYTICS_KEY_PREFIX}pages:${metricsPage}`;
    pipeline.hincrby(pageKey, eventName, 1);
    pipeline.expire(pageKey, ANALYTICS_TTL);

    pipeline.hincrby(`${ANALYTICS_KEY_PREFIX}metrics:events:${eventName}:${metricsPage}`, 'count', 1);

    const sessionKey = `${ANALYTICS_KEY_PREFIX}sessions:${sessionId}`;
    pipeline.hincrby(sessionKey, 'totalEvents', 1);
    pipeline.hset(sessionKey, 'lastActive', timestamp || new Date().toISOString());
    pipeline.expire(sessionKey, SESSION_TTL);

    await pipeline.exec();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to record analytics event' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7d';

    const days = period === '30d' ? 30 : period === '24h' ? 1 : 7;
    const results: Record<string, Record<string, number>> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
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
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
