import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getConfig, updateConfig } from '@/lib/rate-limit';
import { z, ZodError } from 'zod';
import { validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

const updateConfigSchema = z.object({
  maxAttempts: z.number().int().min(1).max(100),
  windowMs: z.number().int().min(60000).max(3600000),
});

export async function GET() {
  try {
    const authResult = await requireAdmin(new Request(new URL('/api/admin/rate-limit/config', process.env.NEXTAUTH_URL || 'http://localhost:3000')) as any, 'users');
    if (authResult instanceof NextResponse) return authResult;

    const config = await getConfig();

    return NextResponse.json({
      maxAttempts: config.maxAttempts,
      windowMs: config.windowMs,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[RATE LIMIT API] Error getting config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req, 'users');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await req.json();
    const validatedData = updateConfigSchema.parse(body);

    await updateConfig(validatedData.maxAttempts, validatedData.windowMs);

    console.log(
      `[RATE LIMIT API] Config updated by ${session.email}: maxAttempts=${validatedData.maxAttempts}, windowMs=${validatedData.windowMs}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    console.error('[RATE LIMIT API] Error updating config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
