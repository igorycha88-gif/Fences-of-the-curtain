import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { postTypeService } from '@/services/admin/postTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { postTypeSchema } from '@/lib/validators/postType';

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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await postTypeService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      minThickness: minThickness ? parseFloat(minThickness) : undefined,
      maxThickness: maxThickness ? parseFloat(maxThickness) : undefined,
      page,
      pageSize,
    });

    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin && result.posts) {
      result.posts = result.posts.map((post: any) => {
        const { purchasePrices, ...postWithoutPurchasePrices } = post;
        return postWithoutPurchasePrices;
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

    const post = await postTypeService.create(validatedData, session.user.id);

    return NextResponse.json({ id: post.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating post type:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    if (error.message.includes('уже существует')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
