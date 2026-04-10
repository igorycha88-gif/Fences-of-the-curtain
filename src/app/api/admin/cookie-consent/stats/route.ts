import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'cookie-consent-stats');
    if (authResult instanceof NextResponse) return authResult;

    const [total, accepted, rejected, analyticsAccepted, last30Days] = await Promise.all([
      prisma.cookieConsent.count(),
      prisma.cookieConsent.count({ where: { consentGiven: true } }),
      prisma.cookieConsent.count({ where: { consentGiven: false } }),
      prisma.cookieConsent.count({ where: { analytics: true } }),
      prisma.cookieConsent.aggregate({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
      }),
    ]);

    const last30Accepted = await prisma.cookieConsent.count({
      where: {
        consentGiven: true,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const last30Rejected = await prisma.cookieConsent.count({
      where: {
        consentGiven: false,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    return NextResponse.json({
      total,
      accepted,
      rejected,
      analyticsAccepted,
      last30Days: {
        total: last30Days._count.id,
        accepted: last30Accepted,
        rejected: last30Rejected,
      },
    });
  } catch (error) {
    console.error('Cookie consent stats error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения статистики' },
      { status: 500 }
    );
  }
}
