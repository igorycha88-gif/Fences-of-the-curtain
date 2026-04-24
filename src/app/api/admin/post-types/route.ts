import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { postTypeService } from '@/services/admin/postTypeService';
import { postTypeSchema } from '@/lib/validators/postType';
import { safeParseInt } from '@/lib/parse-params';
import { ZodError } from 'zod';
import { validationError, safeErrorResponse } from '@/lib/api-error';
import { apiCache } from '@/lib/apiCache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const search = searchParams.get('search') || undefined;
    const minThickness = searchParams.get('minThickness');
    const maxThickness = searchParams.get('maxThickness');
    const page = safeParseInt(searchParams.get('page'), 1);
    const pageSize = safeParseInt(searchParams.get('pageSize'), 20);
    const validityFilter = searchParams.get('validityFilter') as 'all' | 'active' | 'expired' | 'expiring_soon' || 'all';

    console.log(`[POST-TYPES GET] Starting fetch, params: ${JSON.stringify({ active, search, minThickness, maxThickness, page, pageSize, validityFilter })}`);

    const cacheKey = apiCache.generateKey('post-types', { active, search, minThickness, maxThickness, page, pageSize, validityFilter });
    const result = await apiCache.getOrSet(cacheKey, () => postTypeService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      minThickness: minThickness ? parseFloat(minThickness) : undefined,
      maxThickness: maxThickness ? parseFloat(maxThickness) : undefined,
      page,
      pageSize,
      validityFilter,
    }));

    const isAdmin = session.role === 'ADMIN';

    if (!isAdmin && result.posts) {
      result.posts = result.posts.map((post: any) => {
        const { purchasePricePerUnit, ...postWithoutPurchasePrice } = post;
        return postWithoutPurchasePrice;
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[POST-TYPES GET] Completed in ${duration}ms, returned ${result.posts?.length || 0} posts, total: ${result.total}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST-TYPES GET] Error:', error);
    return safeErrorResponse(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = postTypeSchema.parse(body);

    const result = await postTypeService.create(validatedData, session.userId);

    await apiCache.deletePattern('post-types:*');

    if (result && 'warning' in result) {
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json({ id: (result as any).id }, { status: 201 });
  } catch (error: any) {
    console.error('[POST-TYPES POST] Error creating post type:', error);

    if (error instanceof ZodError) {
      return validationError(error);
    }

    if (error.message.includes('уже существует') || error.message.includes('должна отличаться')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return safeErrorResponse(error, 500);
  }
}
