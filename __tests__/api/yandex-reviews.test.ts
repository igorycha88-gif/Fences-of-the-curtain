import { GET } from '@/app/api/yandex-reviews/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    review: {
      findMany: jest.fn(),
    },
  },
}));

describe('Reviews API (database)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty reviews when database has no active reviews', async () => {
    const { prisma } = require('@/lib/prisma');
    (prisma.review.findMany as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('rating');
    expect(data).toHaveProperty('reviewsCount');
    expect(data).toHaveProperty('reviews');
    expect(data).toHaveProperty('yandexUrl');
    expect(data.source).toBe('database');
    expect(Array.isArray(data.reviews)).toBe(true);
    expect(data.reviews.length).toBe(0);
    expect(data.rating).toBe(0);
    expect(data.reviewsCount).toBe(0);
  });

  it('returns reviews from database with calculated average rating', async () => {
    const { prisma } = require('@/lib/prisma');
    const mockReviews = [
      {
        id: '1',
        name: 'Иван Иванов',
        text: 'Отлично!',
        rating: 5,
        image: null,
        sortOrder: 1,
        active: true,
        createdAt: new Date('2026-04-13'),
        updatedAt: new Date('2026-04-13'),
      },
      {
        id: '2',
        name: 'Пётр Петров',
        text: 'Хорошо',
        rating: 4,
        image: null,
        sortOrder: 2,
        active: true,
        createdAt: new Date('2026-04-14'),
        updatedAt: new Date('2026-04-14'),
      },
    ];
    (prisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);

    const response = await GET();
    const data = await response.json();

    expect(data.source).toBe('database');
    expect(data.rating).toBe(4.5);
    expect(data.reviewsCount).toBe(2);
    expect(data.reviews.length).toBe(2);
    expect(data.reviews[0].author).toBe('Иван Иванов');
    expect(data.reviews[0].rating).toBe(5);
  });

  it('includes required fields structure for each review', async () => {
    const { prisma } = require('@/lib/prisma');
    (prisma.review.findMany as jest.Mock).mockResolvedValue([]);

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
