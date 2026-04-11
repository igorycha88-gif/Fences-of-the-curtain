import { GET } from '@/app/api/about/route';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    setting: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

const mockFindMany = prisma.setting.findMany as jest.MockedFunction<
  typeof prisma.setting.findMany
>;
const mockCacheGet = cache.get as jest.MockedFunction<typeof cache.get>;
const mockCacheSet = cache.set as jest.MockedFunction<typeof cache.set>;

describe('GET /api/about', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cached data if available', async () => {
    const cachedData = {
      about_hero_title: 'О компании',
      about_hero_subtitle: 'Подзаголовок',
      about_hero_image: '/images/about/production.jpg',
      about_text: 'Текст о компании',
      about_advantages: '[]',
      about_steps: '[]',
      about_photos: '[]',
    };
    mockCacheGet.mockResolvedValue(cachedData);

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual(cachedData);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('should fetch from DB and cache when no cache', async () => {
    mockCacheGet.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([
      { key: 'about_hero_title', value: 'Test Title', id: '1', updatedAt: new Date() },
      { key: 'about_hero_subtitle', value: 'Test Subtitle', id: '2', updatedAt: new Date() },
    ] as any);

    const response = await GET();
    const data = await response.json();

    expect(data.about_hero_title).toBe('Test Title');
    expect(data.about_hero_subtitle).toBe('Test Subtitle');
    expect(mockCacheSet).toHaveBeenCalled();
  });

  it('should return default values when DB is empty', async () => {
    mockCacheGet.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data.about_hero_title).toBe('О компании');
    expect(data.about_photos).toBeDefined();
    const photos = JSON.parse(data.about_photos);
    expect(photos).toHaveLength(5);
  });

  it('should return default values on error', async () => {
    mockCacheGet.mockRejectedValue(new Error('Redis error'));
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET();
    const data = await response.json();

    expect(data.about_hero_title).toBeDefined();
  });
});
