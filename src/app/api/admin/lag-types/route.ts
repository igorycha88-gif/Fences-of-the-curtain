import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { lagTypeService } from '@/services/admin/lagTypeService';
import { hasPermission } from '@/lib/permissions/rbac';
import { lagTypeSchema } from '@/lib/validators/lagType';

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

    const result = await lagTypeService.getAll({
      active: active ? active === 'true' : undefined,
      search,
      minThickness: minThickness ? parseFloat(minThickness) : undefined,
      maxThickness: maxThickness ? parseFloat(maxThickness) : undefined,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching lag types:', error);
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
    const validatedData = lagTypeSchema.parse(body);

    const lag = await lagTypeService.create(validatedData, session.user.id);

    return NextResponse.json({ id: lag.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lag type:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    if (error.message.includes('уже существует')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
