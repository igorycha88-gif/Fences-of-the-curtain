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

const mockLaunch = jest.fn() as any;
const mockNewPage = jest.fn() as any;
const mockClose = jest.fn() as any;
const mockPageClose = jest.fn() as any;
const mockGoto = jest.fn() as any;
const mockWaitForSelector = jest.fn() as any;
const mockLocator = jest.fn() as any;
const mockEvaluate = jest.fn() as any;

const mockBrowser = {
  newPage: mockNewPage,
  close: mockClose,
};

const mockPage = {
  goto: mockGoto,
  waitForSelector: mockWaitForSelector,
  locator: mockLocator,
  evaluate: mockEvaluate,
  close: mockPageClose,
};

mockLaunch.mockResolvedValue(mockBrowser);
mockNewPage.mockResolvedValue(mockPage);
mockPageClose.mockResolvedValue(undefined);
mockClose.mockResolvedValue(undefined);
mockGoto.mockResolvedValue(undefined);
mockWaitForSelector.mockResolvedValue(undefined);

jest.mock('cloakbrowser', () => ({
  launch: mockLaunch,
}));

const mockParseGoogleSerp = jest.fn() as any;
const mockParseYandexSerp = jest.fn() as any;

jest.mock('@/services/seo/serpParser', () => ({
  parseGoogleSerp: mockParseGoogleSerp,
  parseYandexSerp: mockParseYandexSerp,
  findSiteInResults: jest.fn((results: any[], domain: string) =>
    results.find((r: any) => r.url.includes(domain))
  ),
}));

describe('PositionCollector', () => {
  let PositionCollector: typeof import('@/services/seo/positionCollector').PositionCollector;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLaunch.mockResolvedValue(mockBrowser);
    mockNewPage.mockResolvedValue(mockPage);
    mockPageClose.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    mockGoto.mockResolvedValue(undefined);
    mockWaitForSelector.mockResolvedValue(undefined);

    const mod = jest.requireActual('@/services/seo/positionCollector') as {
      PositionCollector: typeof import('@/services/seo/positionCollector').PositionCollector;
    };
    PositionCollector = mod.PositionCollector;
  });

  describe('collectForKeyword', () => {
    it('should find site position in Google results', async () => {
      const collector = new PositionCollector();

      mockParseGoogleSerp.mockResolvedValue({
        results: [
          { position: 1, title: 'Other site', url: 'https://other-site.ru' },
          {
            position: 2,
            title: 'Заборы и Навесы',
            url: 'https://zabor-i-naves.ru/zabory',
            snippet: 'Заборы под ключ',
          },
        ],
        captcha: false,
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

      mockParseGoogleSerp.mockResolvedValue({
        results: [
          { position: 1, title: 'Other', url: 'https://other.ru' },
        ],
        captcha: false,
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

      mockParseGoogleSerp.mockResolvedValue({
        results: [],
        captcha: false,
      });

      const result = await collector.collectForKeyword('тест', 'google');

      expect(result.found).toBe(false);
      expect(result.position).toBe(0);
    });

    it('should return not found on CAPTCHA', async () => {
      const collector = new PositionCollector();

      mockParseGoogleSerp.mockResolvedValue({
        results: [],
        captcha: true,
      });

      const result = await collector.collectForKeyword('тест', 'google');

      expect(result.found).toBe(false);
      expect(result.position).toBe(0);
    });

    it('should use yandex parser for yandex engine', async () => {
      const collector = new PositionCollector();

      mockParseYandexSerp.mockResolvedValue({
        results: [],
        captcha: false,
      });

      await collector.collectForKeyword('забор', 'yandex');

      expect(mockParseYandexSerp).toHaveBeenCalledWith(mockPage);
    });

    it('should use google parser for google engine', async () => {
      const collector = new PositionCollector();

      mockParseGoogleSerp.mockResolvedValue({
        results: [],
        captcha: false,
      });

      await collector.collectForKeyword('забор', 'google');

      expect(mockParseGoogleSerp).toHaveBeenCalledWith(mockPage);
    });

    it('should navigate to google.ru for google engine', async () => {
      const collector = new PositionCollector();

      mockParseGoogleSerp.mockResolvedValue({
        results: [],
        captcha: false,
      });

      await collector.collectForKeyword('забор', 'google');

      expect(mockGoto).toHaveBeenCalledWith(
        expect.stringContaining('google.ru/search'),
        expect.any(Object)
      );
    });

    it('should navigate to yandex.ru for yandex engine', async () => {
      const collector = new PositionCollector();

      mockParseYandexSerp.mockResolvedValue({
        results: [],
        captcha: false,
      });

      await collector.collectForKeyword('забор', 'yandex');

      expect(mockGoto).toHaveBeenCalledWith(
        expect.stringContaining('yandex.ru/search'),
        expect.any(Object)
      );
    });

    it('should close browser after single keyword collection', async () => {
      const collector = new PositionCollector();

      mockParseGoogleSerp.mockResolvedValue({
        results: [],
        captcha: false,
      });

      await collector.collectForKeyword('тест', 'google');

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('collectAll', () => {
    it('should skip when no active keywords', async () => {
      const collector = new PositionCollector();

      mockSeoKeywordFindMany.mockResolvedValue([]);

      const result = await collector.collectAll();

      expect(result).toEqual({ checked: 0, errors: 0, skipped: 0 });
      expect(mockLaunch).not.toHaveBeenCalled();
    });

    it('should collect positions for all active keywords', async () => {
      const collector = new PositionCollector();

      mockSeoKeywordFindMany.mockResolvedValue([
        { id: '1', keyword: 'забор', searchEngine: 'google' },
        { id: '2', keyword: 'навес', searchEngine: 'yandex' },
      ]);

      mockParseGoogleSerp.mockResolvedValue({
        results: [
          {
            position: 3,
            title: 'Заборы',
            url: 'https://zabor-i-naves.ru',
            snippet: 'Test',
          },
        ],
        captcha: false,
      });

      mockParseYandexSerp.mockResolvedValue({
        results: [
          {
            position: 5,
            title: 'Навесы',
            url: 'https://zabor-i-naves.ru/canopy',
            snippet: 'Test',
          },
        ],
        captcha: false,
      });

      mockSeoPositionCreate.mockResolvedValue({ id: 'p1' });

      const result = await collector.collectAll();

      expect(result.checked).toBe(2);
      expect(result.errors).toBe(0);
      expect(mockSeoPositionCreate).toHaveBeenCalledTimes(2);
    });

    it('should handle errors for individual keywords', async () => {
      const collector = new PositionCollector();

      mockSeoKeywordFindMany.mockResolvedValue([
        { id: '1', keyword: 'забор', searchEngine: 'google' },
        { id: '2', keyword: 'навес', searchEngine: 'google' },
      ]);

      mockParseGoogleSerp
        .mockResolvedValueOnce({
          results: [
            { position: 1, url: 'https://zabor-i-naves.ru', title: 'T' },
          ],
          captcha: false,
        })
        .mockRejectedValueOnce(new Error('Page timeout'));

      mockSeoPositionCreate.mockResolvedValue({ id: 'p1' });

      const result = await collector.collectAll();

      expect(result.checked).toBe(1);
      expect(result.errors).toBe(1);
    });

    it('should handle browser launch failure', async () => {
      const collector = new PositionCollector();

      mockSeoKeywordFindMany.mockResolvedValue([
        { id: '1', keyword: 'забор', searchEngine: 'google' },
      ]);

      mockLaunch.mockRejectedValue(new Error('No binary'));

      const result = await collector.collectAll();

      expect(result.checked).toBe(0);
      expect(result.errors).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should close browser after all keywords processed', async () => {
      const collector = new PositionCollector();

      mockSeoKeywordFindMany.mockResolvedValue([
        { id: '1', keyword: 'забор', searchEngine: 'google' },
      ]);

      mockParseGoogleSerp.mockResolvedValue({
        results: [],
        captcha: false,
      });

      await collector.collectAll();

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close browser even if errors occur', async () => {
      const collector = new PositionCollector();

      mockSeoKeywordFindMany.mockResolvedValue([
        { id: '1', keyword: 'забор', searchEngine: 'google' },
      ]);

      mockParseGoogleSerp.mockRejectedValue(new Error('fail'));

      await collector.collectAll();

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
