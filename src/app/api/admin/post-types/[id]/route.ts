import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { postTypeService } from '@/services/admin/postTypeService';
import { postTypeUpdateSchema } from '@/lib/validators/postType';
import { ZodError } from 'zod';
import { validationError, safeErrorResponse } from '@/lib/api-error';
import { apiCache } from '@/lib/apiCache';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const post = await postTypeService.getById(params.id);

    if (!post) {
      return NextResponse.json({ error: 'Столб не найден' }, { status: 404 });
    }

    const isAdmin = session.role === 'ADMIN';
    
    if (!isAdmin) {
      const { purchasePricePerUnit, ...postWithoutPurchasePrice } = post;
      return NextResponse.json(postWithoutPurchasePrice);
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post type:', error);
    return safeErrorResponse(error, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[POST-TYPES PUT] Starting update post type, id:', params.id);

    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();

    const isAdmin = session.role === 'ADMIN';

    if (!isAdmin && body.purchasePricePerUnit !== undefined) {
      console.log('[POST-TYPES PUT] Forbidden - non-admin trying to modify purchase prices');
      return NextResponse.json(
        { error: 'Only ADMIN can modify purchase prices' },
        { status: 403 }
      );
    }

    const validatedData = postTypeUpdateSchema.parse(body);
    console.log('[POST-TYPES PUT] Validated data:', JSON.stringify(validatedData, null, 2));

    await postTypeService.update(params.id, validatedData, session.userId);
    console.log('[POST-TYPES PUT] Updated successfully');

    await apiCache.deletePattern('post-types:*');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[POST-TYPES PUT] Error updating post type:', error);

    if (error instanceof ZodError) {
      console.error('[POST-TYPES PUT] Validation errors:', JSON.stringify(error.errors, null, 2));
      return validationError(error);
    }

    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.message.includes('уже существует')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return safeErrorResponse(error, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await postTypeService.delete(params.id, session.userId);
    await apiCache.deletePattern('post-types:*');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[POST-TYPES DELETE] Error deleting post type:', error);

    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return safeErrorResponse(error, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const post = await postTypeService.toggleActive(params.id, session.userId);
    await apiCache.deletePattern('post-types:*');

    return NextResponse.json(post);
  } catch (error: any) {
    console.error('[POST-TYPES PATCH] Error toggling post type active status:', error);

    if (error.message.includes('не найден')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return safeErrorResponse(error, 500);
  }
}
