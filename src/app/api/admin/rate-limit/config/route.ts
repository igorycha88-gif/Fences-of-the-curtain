import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getConfig, updateConfig } from '@/lib/rate-limit';
import { z } from 'zod';

const updateConfigSchema = z.object({
  maxAttempts: z.number().int().min(1).max(100),
  windowMs: z.number().int().min(60000).max(3600000),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateConfigSchema.parse(body);

    await updateConfig(validatedData.maxAttempts, validatedData.windowMs);

    console.log(
      `[RATE LIMIT API] Config updated by ${session.user.email}: maxAttempts=${validatedData.maxAttempts}, windowMs=${validatedData.windowMs}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[RATE LIMIT API] Error updating config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
