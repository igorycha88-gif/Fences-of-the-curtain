import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const cookieConsentSchema = z.object({
  consentGiven: z.boolean(),
  analytics: z.boolean(),
});

const CONSENT_COOKIE_NAME = 'cookie_consent_session_id';
const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = cookieConsentSchema.parse(body);

    const cookieStore = await cookies();
    let sessionId = cookieStore.get(CONSENT_COOKIE_NAME)?.value;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;

    const consent = await prisma.cookieConsent.upsert({
      where: { sessionId },
      update: {
        consentGiven: validated.consentGiven,
        analytics: validated.analytics,
        ipAddress,
        userAgent,
      },
      create: {
        sessionId,
        consentGiven: validated.consentGiven,
        analytics: validated.analytics,
        ipAddress,
        userAgent,
      },
    });

    const response = NextResponse.json(
      {
        id: consent.id,
        consentGiven: consent.consentGiven,
        analytics: consent.analytics,
        createdAt: consent.createdAt,
      },
      { status: 201 }
    );

    response.cookies.set(CONSENT_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: CONSENT_COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Cookie consent error:', error);
    return NextResponse.json(
      { error: 'Ошибка сохранения согласия' },
      { status: 500 }
    );
  }
}
