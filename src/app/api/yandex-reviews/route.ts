import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

interface ReviewsResponse {
  rating: number;
  reviewsCount: number;
  reviews: Review[];
  yandexUrl: string;
  source: 'database';
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbReviews = await prisma.review.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    const yandexOrgUrl = process.env.NEXT_PUBLIC_YANDEX_ORG_URL ||
      'https://yandex.ru/maps/org/154197841574/';

    if (dbReviews.length === 0) {
      const emptyResponse: ReviewsResponse = {
        rating: 0,
        reviewsCount: 0,
        reviews: [],
        yandexUrl: yandexOrgUrl,
        source: 'database',
      };
      return NextResponse.json(emptyResponse);
    }

    const avgRating = dbReviews.reduce((sum, r) => sum + r.rating, 0) / dbReviews.length;

    const response: ReviewsResponse = {
      rating: Math.round(avgRating * 10) / 10,
      reviewsCount: dbReviews.length,
      reviews: dbReviews.map((r) => ({
        id: r.id,
        author: r.name,
        rating: r.rating,
        text: r.text,
        date: r.createdAt.toISOString(),
      })),
      yandexUrl: yandexOrgUrl,
      source: 'database',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Reviews fetch error:', error);

    return NextResponse.json({
      rating: 0,
      reviewsCount: 0,
      reviews: [],
      yandexUrl: process.env.NEXT_PUBLIC_YANDEX_ORG_URL ||
        'https://yandex.ru/maps/org/154197841574/',
      source: 'database',
    });
  }
}
