import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { usersService } from '@/services/admin/usersService';
import { safeParseInt } from '@/lib/parse-params';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createUserSchema = z.object({
  email: z.string().email('Некорректный email'),
  name: z.string().min(2, 'Имя минимум 2 символа').max(100, 'Имя максимум 100 символов'),
  password: z.string().min(8, 'Пароль минимум 8 символов'),
  role: z.enum(['ADMIN', 'MANAGER', 'CONTENT_MANAGER']).optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'users');
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const params = {
      role: searchParams.get('role') as any || undefined,
      active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      page: safeParseInt(searchParams.get('page'), 1),
      pageSize: safeParseInt(searchParams.get('pageSize'), 20),
    };

    const result = await usersService.getUsers(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'users');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const validated = createUserSchema.parse(body);
    const user = await usersService.createUser(validated);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
