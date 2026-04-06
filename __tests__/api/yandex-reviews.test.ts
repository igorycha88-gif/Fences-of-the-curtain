import { NextResponse } from 'next/server';
import { GET } from '@/app/api/yandex-reviews/route';

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn()
  }
}));

describe('Yandex Reviews API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty reviews when no cache and no API configured', async () => {
    const { redis } = require('@/lib/redis');
    (redis.get as jest.Mock).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('rating');
    expect(data).toHaveProperty('reviewsCount');
    expect(data).toHaveProperty('reviews');
    expect(data).toHaveProperty('yandexUrl');
    expect(data.source).toBe('empty');
    expect(Array.isArray(data.reviews)).toBe(true);
    expect(data.reviews.length).toBe(0);
    expect(data.rating).toBe(0);
    expect(data.reviewsCount).toBe(0);
  });

  it('returns cached data when available', async () => {
    const { redis } = require('@/lib/redis');
    const cachedData = {
      rating: 4.8,
      reviewsCount: 100,
      reviews: [],
      yandexUrl: 'https://yandex.ru/maps/org/test/'
    };
    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

    const response = await GET();
    const data = await response.json();

    expect(data.source).toBe('cache');
    expect(data.rating).toBe(4.8);
    expect(data.reviewsCount).toBe(100);
  });

  it('includes required fields structure', async () => {
    const { redis } = require('@/lib/redis');
    (redis.get as jest.Mock).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(Array.isArray(data.reviews)).toBe(true);
    
    if (data.reviews.length > 0) {
      data.reviews.forEach((review: any) => {
        expect(review).toHaveProperty('id');
        expect(review).toHaveProperty('author');
        expect(review).toHaveProperty('rating');
        expect(review).toHaveProperty('text');
        expect(review).toHaveProperty('date');
      });
    }
  });
});
