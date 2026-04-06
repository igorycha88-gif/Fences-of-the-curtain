import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

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
  source: 'cache' | 'api' | 'empty';
}



const CACHE_KEY = 'yandex_reviews';
const CACHE_TTL = 3600;

export async function GET() {
  try {
    const cachedData = await redis?.get(CACHE_KEY);
    
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return NextResponse.json({
        ...parsed,
        source: 'cache'
      });
    }

    const yandexOrgId = process.env.YANDEX_ORG_ID;
    const yandexApiKey = process.env.YANDEX_API_KEY;

    if (yandexOrgId && yandexApiKey) {
      try {
        const yandexData = await fetchYandexReviews(yandexOrgId, yandexApiKey);
        
        const response: ReviewsResponse = {
          ...yandexData,
          source: 'api'
        };

        await redis?.setex(
          CACHE_KEY,
          CACHE_TTL,
          JSON.stringify(response)
        );

        return NextResponse.json(response);
      } catch (apiError) {
        console.error('Yandex API error:', apiError);
      }
    }

    const emptyResponse: ReviewsResponse = {
      rating: 0,
      reviewsCount: 0,
      reviews: [],
      yandexUrl: process.env.NEXT_PUBLIC_YANDEX_ORG_URL || 
        'https://yandex.ru/maps/org/zabor_i_navesy/',
      source: 'empty'
    };

    return NextResponse.json(emptyResponse);

  } catch (error) {
    console.error('Reviews fetch error:', error);
    
    return NextResponse.json({
      rating: 0,
      reviewsCount: 0,
      reviews: [],
      yandexUrl: process.env.NEXT_PUBLIC_YANDEX_ORG_URL || 
        'https://yandex.ru/maps/org/zabor_i_navesy/',
      source: 'empty'
    });
  }
}

async function fetchYandexReviews(orgId: string, apiKey: string): Promise<Omit<ReviewsResponse, 'source'>> {
  const response = await fetch(
    `https://business-api.yandex.ru/v1/reviews?org_id=${orgId}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Yandex API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    rating: data.rating || 0,
    reviewsCount: data.total_reviews || 0,
    reviews: (data.reviews || []).slice(0, 5).map((review: any) => ({
      id: review.id,
      author: review.author?.name || 'Клиент',
      rating: review.rating,
      text: review.text,
      date: review.created_at
    })),
    yandexUrl: `https://yandex.ru/maps/org/${orgId}/`
  };
}
