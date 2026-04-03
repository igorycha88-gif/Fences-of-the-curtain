import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const ANALYTICS_KEY_PREFIX = 'analytics:';
const ANALYTICS_TTL = 86400 * 30;

function incrementMetric(key: string): void {
  redis.hincrby(key, 'count', 1).catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, sessionId, page, referrer, properties, timestamp } = body;

    if (!eventName || !sessionId) {
      return NextResponse.json(
        { error: 'eventName and sessionId are required' },
        { status: 400 }
      );
    }

    const eventKey = `${ANALYTICS_KEY_PREFIX}events:${Date.now()}:${sessionId}`;
    const eventData = {
      eventName,
      sessionId,
      page,
      referrer,
      properties,
      timestamp,
    };

    await redis.set(eventKey, JSON.stringify(eventData), 'EX', ANALYTICS_TTL);

    const dailyKey = `${ANALYTICS_KEY_PREFIX}daily:${new Date().toISOString().split('T')[0]}`;
    await redis.hincrby(dailyKey, eventName, 1);
    await redis.expire(dailyKey, ANALYTICS_TTL);

    const pageKey = `${ANALYTICS_KEY_PREFIX}pages:${page || 'unknown'}`;
    await redis.hincrby(pageKey, eventName, 1);
    await redis.expire(pageKey, ANALYTICS_TTL);

    const sessionKey = `${ANALYTICS_KEY_PREFIX}sessions:${sessionId}`;
    await redis.hset(sessionKey, {
      lastActive: timestamp,
      lastPage: page || '',
      totalEvents: await redis.hincrby(sessionKey, 'totalEvents', 1),
    });
    await redis.expire(sessionKey, ANALYTICS_TTL);

    const metricsPage = (page || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');

    incrementMetric(`analytics:metrics:events:${eventName}:${metricsPage}`);

    if (eventName === 'page_view') {
      incrementMetric(`analytics:metrics:pageviews:${metricsPage}`);
    }

    if (eventName.startsWith('calculator_')) {
      const action = eventName.replace('calculator_', '');
      incrementMetric(`analytics:metrics:calculator:${action}`);
    }

    const funnelSteps = [
      'page_view',
      'calculator_open',
      'calculator_configure',
      'calculator_calculate',
      'contact_form_submit',
    ];

    if (funnelSteps.includes(eventName)) {
      incrementMetric(`analytics:metrics:funnel:${eventName}`);
    }

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
