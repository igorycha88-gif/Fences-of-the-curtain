import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

const ABOUT_KEYS = [
  'about_hero_title',
  'about_hero_subtitle',
  'about_hero_image',
  'about_text',
  'about_advantages',
  'about_steps',
  'about_photos',
] as const;

const CACHE_KEY = 'about:content';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request, 'content');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: [...ABOUT_KEYS] } },
    });

    const result: Record<string, string> = {};
    for (const key of ABOUT_KEYS) {
      const setting = settings.find((s) => s.key === key);
      result[key] = setting?.value ?? '';
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Admin About API] Error fetching:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request, 'content');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();

    const upserts: Promise<unknown>[] = [];

    for (const key of ABOUT_KEYS) {
      if (body[key] !== undefined) {
        upserts.push(
          prisma.setting.upsert({
            where: { key },
            update: { value: String(body[key]) },
            create: { key, value: String(body[key]) },
          })
        );
      }
    }

    await Promise.all(upserts);

    await cache.del(CACHE_KEY);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin About API] Error updating:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
