import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { materialsService } from '@/services/admin/materialsService';
import { hasPermission } from '@/lib/permissions/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const params = {
      category: searchParams.get('category') || undefined,
      active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    };

    const result = await materialsService.getCanopyMaterials(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching canopy materials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'materials')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const material = await materialsService.createCanopyMaterial(body, session.user.id);

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error('Error creating canopy material:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
