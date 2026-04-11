import { GET, PUT } from '@/app/api/admin/about/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    setting: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock('@/lib/cache', () => ({
  cache: {
    del: jest.fn(),
  },
}));

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn(),
}));

import { requireAdmin } from '@/lib/admin-auth';

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;
const mockFindMany = prisma.setting.findMany as jest.MockedFunction<
  typeof prisma.setting.findMany
>;
const mockUpsert = prisma.setting.upsert as jest.MockedFunction<typeof prisma.setting.upsert>;
const mockCacheDel = cache.del as jest.MockedFunction<typeof cache.del>;

function createRequest(body?: unknown, method = 'GET') {
  return new Request('http://localhost/api/admin/about', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }) as any;
}

describe('Admin About API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({
      session: {
        userId: 'admin-id',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'ADMIN',
      },
    });
  });

  describe('GET /api/admin/about', () => {
    it('should return 401 if not authenticated', async () => {
      mockRequireAdmin.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const response = await GET(createRequest());
      expect(response.status).toBe(401);
    });

    it('should return settings from DB', async () => {
      mockFindMany.mockResolvedValue([
        { key: 'about_hero_title', value: 'Test Title', id: '1', updatedAt: new Date() },
      ] as any);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(data.about_hero_title).toBe('Test Title');
    });
  });

  describe('PUT /api/admin/about', () => {
    it('should save settings and clear cache', async () => {
      mockUpsert.mockResolvedValue({ key: 'test', value: 'test' } as any);

      const response = await PUT(
        createRequest(
          {
            about_hero_title: 'New Title',
            about_hero_subtitle: 'New Subtitle',
            about_text: 'New text',
            about_advantages: '[]',
            about_steps: '[]',
            about_photos: '[]',
            about_hero_image: '/test.jpg',
          },
          'PUT'
        )
      );

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalled();
      expect(mockCacheDel).toHaveBeenCalledWith('about:content');
    });

    it('should only update provided fields', async () => {
      mockUpsert.mockResolvedValue({ key: 'test', value: 'test' } as any);

      await PUT(
        createRequest(
          { about_hero_title: 'Only Title' },
          'PUT'
        )
      );

      expect(mockUpsert).toHaveBeenCalledTimes(1);
    });
  });
});
