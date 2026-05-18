import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { seoMonitoringService } from '@/services/admin/seoMonitoringService';
import { safeErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const result = await seoMonitoringService.getKeywords({
      search: searchParams.get('search') || undefined,
      group: searchParams.get('group') || undefined,
      searchEngine: searchParams.get('searchEngine') || undefined,
      active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '50', 10),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching SEO keywords:', error);
    return safeErrorResponse(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { keyword, searchEngine, group, pagePath } = body;

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: 'Ключевое слово обязательно' },
        { status: 400 }
      );
    }

    if (!searchEngine || !['google', 'yandex'].includes(searchEngine)) {
      return NextResponse.json(
        { error: 'Поисковик должен быть google или yandex' },
        { status: 400 }
      );
    }

    const result = await seoMonitoringService.createKeyword({
      keyword: keyword.trim(),
      searchEngine,
      group,
      pagePath,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating SEO keyword:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Такое ключевое слово уже существует для этого поисковика' },
        { status: 409 }
      );
    }
    return safeErrorResponse(error, 500);
  }
}
