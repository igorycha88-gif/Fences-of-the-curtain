import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import { postTypeService } from '@/services/admin/postTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { postTypeSchema } from '@/lib/validators/postType';
import { safeParseInt } from '@/lib/parse-params';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const search = searchParams.get('search') || undefined;
    const minThickness = searchParams.get('minThickness');
    const maxThickness = searchParams.get('maxThickness');
    const page = safeParseInt(searchParams.get('page'), 1);
    const pageSize = safeParseInt(searchParams.get('pageSize'), 20);
    const validityFilter = searchParams.get('validityFilter') as 'all' | 'active' | 'expired' | 'expiring_soon' || 'all';

    const result = await postTypeService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      minThickness: minThickness ? parseFloat(minThickness) : undefined,
      maxThickness: maxThickness ? parseFloat(maxThickness) : undefined,
      page,
      pageSize,
      validityFilter,
    });

    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin && result.posts) {
      result.posts = result.posts.map((post: any) => {
        const { purchasePricePerUnit, ...postWithoutPurchasePrice } = post;
        return postWithoutPurchasePrice;
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching post types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = postTypeSchema.parse(body);

    const result = await postTypeService.create(validatedData, session.user.id);
    
    if (result && 'warning' in result) {
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json({ id: (result as any).id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating post type:', error);
    
    if (error instanceof ZodError) {
      return validationError(error);
    }
    
    if (error.message.includes('уже существует') || error.message.includes('должна отличаться')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
