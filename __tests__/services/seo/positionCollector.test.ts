import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockSeoKeywordFindMany = jest.fn() as any;
const mockSeoPositionCreate = jest.fn() as any;

jest.mock('@/lib/prisma', () => ({
  prisma: {
    seoKeyword: {
      findMany: mockSeoKeywordFindMany,
    },
    seoPosition: {
      create: mockSeoPositionCreate,
    },
  },
}));

const mockFetch = jest.fn() as any;
global.fetch = mockFetch;

describe('PositionCollector', () => {
  let PositionCollector: typeof import('@/services/seo/positionCollector').PositionCollector;

  beforeEach(() => {
    jest.clearAllMocks();
    const mod = jest.requireActual('@/services/seo/positionCollector') as {
      PositionCollector: typeof import('@/services/seo/positionCollector').PositionCollector;
    };
    PositionCollector = mod.PositionCollector;
  });

  describe('collectForKeyword', () => {
    it('should find site position in Google results', async () => {
      const collector = new PositionCollector();
      (collector as any).apiKey = 'test-key';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          organic_results: [
            {
              position: 1,
              title: 'Other site',
              link: 'https://other-site.ru',
            },
            {
              position: 2,
              title: 'Заборы и Навесы',
              link: 'https://zabor-i-naves.ru/zabory',
              snippet: 'Заборы под ключ',
            },
          ],
        }),
      });

      const result = await collector.collectForKeyword(
        'забор из профнастила',
        'google'
      );

      expect(result.found).toBe(true);
      expect(result.position).toBe(2);
      expect(result.title).toBe('Заборы и Навесы');
      expect(result.url).toBe('https://zabor-i-naves.ru/zabory');
    });

    it('should return not found when site is absent', async () => {
      const collector = new PositionCollector();
      (collector as any).apiKey = 'test-key';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          organic_results: [
            {
              position: 1,
              title: 'Other',
              link: 'https://other.ru',
            },
          ],
        }),
      });

      const result = await collector.collectForKeyword(
        'редкий запрос',
        'google'
      );

      expect(result.found).toBe(false);
      expect(result.position).toBe(0);
    });

    it('should return not found when no organic results', async () => {
      const collector = new PositionCollector();
      (collector as any).apiKey = 'test-key';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ organic_results: [] }),
      });

      const result = await collector.collectForKeyword('тест', 'google');

      expect(result.found).toBe(false);
      expect(result.position).toBe(0);
    });

    it('should throw on API error', async () => {
      const collector = new PositionCollector();
      (collector as any).apiKey = 'test-key';

      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limited',
      });

      await expect(
        collector.collectForKeyword('тест', 'google')
      ).rejects.toThrow('ValueSERP API error: 429');
    });

    it('should throw when request_info.success is false', async () => {
      const collector = new PositionCollector();
      (collector as any).apiKey = 'test-key';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          request_info: {
            success: false,
            message: 'You have used all of your Top Up credits.',
          },
        }),
      });

      await expect(
        collector.collectForKeyword('тест', 'google')
      ).rejects.toThrow('ValueSERP API error: You have used all of your Top Up credits.');
    });

    it('should throw generic error when request_info.success is false without message', async () => {
      const collector = new PositionCollector();
      (collector as any).apiKey = 'test-key';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          request_info: {
            success: false,
          },
        }),
      });

      await expect(
        collector.collectForKeyword('тест', 'google')
      ).rejects.toThrow('ValueSERP API error: Unknown ValueSERP error');
    });

    it('should use yandex params for yandex engine', async () => {
      const collector = new PositionCollector();
      (collector as any).apiKey = 'test-key';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ organic_results: [] }),
      });

      await collector.collectForKeyword('забор', 'yandex');

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('engine=yandex');
      expect(fetchUrl).toContain('yandex_domain=yandex.ru');
    });

    it('should use google params for google engine', async () => {
      const collector = new PositionCollector();
      (collector as any).apiKey = 'test-key';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ organic_results: [] }),
      });

      await collector.collectForKeyword('забор', 'google');

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('google_domain=google.ru');
    });
  });

  describe('collectAll', () => {
    it('should skip when API key is not set', async () => {
      const collector = new PositionCollector();
      (collector as any).apiKey = '';

      const result = await collector.collectAll();

      expect(result).toEqual({ checked: 0, errors: 0, skipped: 0 });
    });

    it('should collect positions for all active keywords', async () => {
      const collector = new PositionCollector();
      (collector as any).apiKey = 'test-key';

      mockSeoKeywordFindMany.mockResolvedValue([
        { id: '1', keyword: 'забор', searchEngine: 'google' },
        { id: '2', keyword: 'навес', searchEngine: 'yandex' },
      ]);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          organic_results: [
            {
              position: 3,
              title: 'Заборы',
              link: 'https://zabor-i-naves.ru',
              snippet: 'Test',
            },
          ],
        }),
      });

      mockSeoPositionCreate.mockResolvedValue({ id: 'p1' });

      const result = await collector.collectAll();

      expect(result.checked).toBe(2);
      expect(result.errors).toBe(0);
      expect(mockSeoPositionCreate).toHaveBeenCalledTimes(2);
    });

    it('should handle errors for individual keywords', async () => {
      const collector = new PositionCollector();
      (collector as any).apiKey = 'test-key';

      mockSeoKeywordFindMany.mockResolvedValue([
        { id: '1', keyword: 'забор', searchEngine: 'google' },
        { id: '2', keyword: 'навес', searchEngine: 'google' },
      ]);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            organic_results: [
              { position: 1, link: 'https://zabor-i-naves.ru' },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Error',
        });

      mockSeoPositionCreate.mockResolvedValue({ id: 'p1' });

      const result = await collector.collectAll();

      expect(result.checked).toBe(1);
      expect(result.errors).toBe(1);
    });
  });
});
