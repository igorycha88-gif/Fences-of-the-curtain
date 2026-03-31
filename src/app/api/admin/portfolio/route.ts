import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { portfolioService } from '@/services/admin/portfolioService';
import { portfolioInputSchema, portfolioListParamsSchema } from '@/lib/validators/portfolio';
import { ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const params = portfolioListParamsSchema.parse({
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      active: searchParams.get('active') || undefined,
    });

    const result = await portfolioService.getAll(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'content');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();
    const validatedData = portfolioInputSchema.parse(body);

    const result = await portfolioService.create(validatedData, session.userId);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating portfolio item:', error);
    
    if (error instanceof ZodError) {
      return validationError(error);
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
