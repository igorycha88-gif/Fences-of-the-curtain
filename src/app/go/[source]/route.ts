import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const REDIRECT_TARGETS: Record<string, string> = {
  avito: '/calculator/fence?utm_source=avito&utm_medium=referral&utm_campaign=zabory_calc',
  yula: '/calculator/fence?utm_source=yula&utm_medium=referral&utm_campaign=zabory_calc',
  profi: '/calculator/fence?utm_source=profi&utm_medium=referral&utm_campaign=zabory_calc',
  'yandex-uslugi': '/calculator/fence?utm_source=yandex-uslugi&utm_medium=referral&utm_campaign=zabory_calc',
  '2gis': '/calculator/fence?utm_source=2gis&utm_medium=referral&utm_campaign=zabory_calc',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;

  try {
    const pipeline = redis.pipeline();
    const dailyKey = `analytics:daily:${new Date().toISOString().split('T')[0]}`;
    pipeline.hincrby(dailyKey, 'external_redirect', 1);
    pipeline.expire(dailyKey, 86400 * 30);

    pipeline.hincrby(`analytics:metrics:external_source:${source}`, 'count', 1);

    const dailySourceKey = `analytics:metrics:external_source_daily:${new Date().toISOString().split('T')[0]}`;
    pipeline.hincrby(dailySourceKey, source, 1);
    pipeline.expire(dailySourceKey, 86400 * 30);

    await pipeline.exec();
  } catch {
    // analytics failure should not block redirect
  }

  const target = REDIRECT_TARGETS[source];
  if (target) {
    return NextResponse.redirect(new URL(target, request.url), 302);
  }

  return NextResponse.redirect(new URL('/', request.url), 302);
}
