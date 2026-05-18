import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockFindMany = jest.fn() as any;
const mockFindUnique = jest.fn() as any;
const mockCreate = jest.fn() as any;
const mockUpdate = jest.fn() as any;
const mockDelete = jest.fn() as any;
const mockCount = jest.fn() as any;

jest.mock('@/lib/prisma', () => ({
  prisma: {
    seoKeyword: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
      count: mockCount,
    },
    seoPosition: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/seo/constants', () => ({
  PAGE_METADATA: {
    home: {
      keywords: ['забор из профнастила', 'забор из евроштакетника'],
      path: '/',
    },
    services: {
      keywords: ['установка забора москва'],
      path: '/services',
    },
  },
  SEO_CONFIG: {
    DEFAULT_KEYWORDS: ['забор под ключ', 'навес для машины'],
  },
}));

describe('SeoMonitoringService', () => {
  let service: InstanceType<typeof import('@/services/admin/seoMonitoringService').SeoMonitoringService>;

  beforeEach(() => {
    jest.clearAllMocks();
    const { SeoMonitoringService } = jest.requireActual(
      '@/services/admin/seoMonitoringService'
    ) as { SeoMonitoringService: new () => InstanceType<typeof import('@/services/admin/seoMonitoringService').SeoMonitoringService> };
    service = new SeoMonitoringService();
  });

  describe('getKeywords', () => {
    it('should return keywords with current and previous positions', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: '1',
          keyword: 'забор из профнастила',
          searchEngine: 'google',
          pagePath: '/',
          group: 'home',
          active: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          positions: [
            { position: 5, checkedAt: new Date('2026-05-18') },
            { position: 7, checkedAt: new Date('2026-05-17') },
          ],
        },
      ]);
      mockCount.mockResolvedValue(1);

      const result = await service.getKeywords({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].currentPosition).toBe(5);
      expect(result.items[0].previousPosition).toBe(7);
      expect(result.items[0].change).toBe(2);
      expect(result.total).toBe(1);
    });

    it('should handle keywords without positions', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: '2',
          keyword: 'новое слово',
          searchEngine: 'yandex',
          pagePath: null,
          group: null,
          active: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          positions: [],
        },
      ]);
      mockCount.mockResolvedValue(1);

      const result = await service.getKeywords({});

      expect(result.items[0].currentPosition).toBeNull();
      expect(result.items[0].change).toBeNull();
    });

    it('should apply filters correctly', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await service.getKeywords({
        searchEngine: 'google',
        group: 'home',
        active: true,
        search: 'профнастил',
      });

      const findManyCall = mockFindMany.mock.calls[0][0];
      expect(findManyCall.where.searchEngine).toBe('google');
      expect(findManyCall.where.group).toBe('home');
      expect(findManyCall.where.active).toBe(true);
      expect(findManyCall.where.keyword.contains).toBe('профнастил');
    });
  });

  describe('createKeyword', () => {
    it('should create a new keyword', async () => {
      const newKw = {
        id: '3',
        keyword: 'забор недорого',
        searchEngine: 'google',
        group: 'home',
        pagePath: '/',
        active: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCreate.mockResolvedValue(newKw);

      const result = await service.createKeyword({
        keyword: 'забор недорого',
        searchEngine: 'google',
        group: 'home',
        pagePath: '/',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          keyword: 'забор недорого',
          searchEngine: 'google',
          group: 'home',
          pagePath: '/',
        },
      });
      expect(result).toEqual(newKw);
    });
  });

  describe('deleteKeyword', () => {
    it('should delete existing keyword', async () => {
      mockFindUnique.mockResolvedValue({ id: '1' });
      mockDelete.mockResolvedValue({ id: '1' });

      await service.deleteKeyword('1');

      expect(mockDelete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw if not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(service.deleteKeyword('999')).rejects.toThrow(
        'Ключевое слово не найдено'
      );
    });
  });

  describe('updateKeyword', () => {
    it('should update active status', async () => {
      mockFindUnique.mockResolvedValue({ id: '1' });
      mockUpdate.mockResolvedValue({ id: '1', active: false });

      const result = await service.updateKeyword('1', { active: false });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { active: false },
      });
    });
  });

  describe('getSummary', () => {
    it('should calculate summary correctly', async () => {
      mockFindMany.mockResolvedValue([
        {
          active: true,
          positions: [
            { position: 2, found: true, checkedAt: new Date() },
            { position: 3, found: true, checkedAt: new Date() },
          ],
        },
        {
          active: true,
          positions: [
            { position: 7, found: true, checkedAt: new Date() },
            { position: 5, found: true, checkedAt: new Date() },
          ],
        },
        {
          active: true,
          positions: [
            { position: 0, found: false, checkedAt: new Date() },
          ],
        },
      ]);

      const result = await service.getSummary();

      expect(result.totalKeywords).toBe(3);
      expect(result.top3).toBe(1);
      expect(result.top5).toBe(1);
      expect(result.top10).toBe(2);
      expect(result.notFound).toBe(1);
      expect(result.avgPosition).toBe(4.5);
      expect(result.improved).toBe(1);
      expect(result.declined).toBe(1);
    });
  });
});
