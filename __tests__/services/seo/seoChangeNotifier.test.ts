import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockFindManyKeywords = jest.fn() as any;
const mockFindManyPositions = jest.fn() as any;

jest.mock('@/lib/prisma', () => ({
  prisma: {
    seoKeyword: {
      findMany: mockFindManyKeywords,
    },
    seoPosition: {
      findMany: mockFindManyPositions,
    },
  },
}));

const mockSendTelegramMessage = jest.fn() as any;
jest.mock('@/services/telegram/bot', () => ({
  sendTelegramMessage: mockSendTelegramMessage,
}));

jest.mock('@/lib/timezone', () => ({
  getMoscowDateTime: jest.fn(() => '18.05.2026, 09:00:00'),
}));

describe('SeoChangeNotifier', () => {
  let notifier: InstanceType<typeof import('@/services/seo/seoChangeNotifier').SeoChangeNotifier>;

  const makeResult = (overrides = {}) => ({
    checked: 130,
    errors: 0,
    skipped: 0,
    blocked: 0,
    totalBatches: 4,
    completedBatches: 4,
    currentBatch: 4,
    totalKeywords: 138,
    duration: 28800000,
    batchResults: [],
    ...overrides,
  });

  const makeKeyword = (id: string, keyword: string, engine = 'google') => ({
    id,
    keyword,
    searchEngine: engine,
    pagePath: '/',
    group: 'home',
    active: true,
  });

  const makePosition = (
    keywordId: string,
    position: number,
    found: boolean,
    checkedAt: Date
  ) => ({
    id: `pos-${keywordId}-${position}`,
    keywordId,
    position,
    found,
    checkedAt,
    url: 'https://zabor-i-naves.ru',
    title: 'Test',
    snippet: null,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const { SeoChangeNotifier } = jest.requireActual(
      '@/services/seo/seoChangeNotifier'
    ) as any;
    notifier = new SeoChangeNotifier();
  });

  describe('buildReport', () => {
    it('should detect improvements', async () => {
      const now = new Date();
      const prev = new Date(now.getTime() - 86400000);

      mockFindManyKeywords.mockResolvedValue([
        makeKeyword('kw1', 'забор из профнастила'),
      ]);
      mockFindManyPositions.mockResolvedValue([
        makePosition('kw1', 4, true, now),
        makePosition('kw1', 7, true, prev),
      ]);

      const report = await notifier.buildReport(makeResult());

      expect(report).toContain('забор из профнастила');
      expect(report).toContain('7→4');
      expect(report).toContain('+3');
      expect(report).toContain('📈');
    });

    it('should detect declines', async () => {
      const now = new Date();
      const prev = new Date(now.getTime() - 86400000);

      mockFindManyKeywords.mockResolvedValue([
        makeKeyword('kw1', 'установка забора москва'),
      ]);
      mockFindManyPositions.mockResolvedValue([
        makePosition('kw1', 12, true, now),
        makePosition('kw1', 5, true, prev),
      ]);

      const report = await notifier.buildReport(makeResult());

      expect(report).toContain('установка забора москва');
      expect(report).toContain('5→12');
      expect(report).toContain('-7');
      expect(report).toContain('📉');
    });

    it('should detect first found keywords', async () => {
      const now = new Date();

      mockFindManyKeywords.mockResolvedValue([
        makeKeyword('kw1', 'навес для машины'),
      ]);
      mockFindManyPositions.mockResolvedValue([
        makePosition('kw1', 8, true, now),
      ]);

      const report = await notifier.buildReport(makeResult());

      expect(report).toContain('🆕');
      expect(report).toContain('навес для машины');
      expect(report).toContain('позиция 8');
    });

    it('should detect not found keywords', async () => {
      const now = new Date();

      mockFindManyKeywords.mockResolvedValue([
        makeKeyword('kw1', 'забор на дачу'),
      ]);
      mockFindManyPositions.mockResolvedValue([
        makePosition('kw1', 0, false, now),
      ]);

      const report = await notifier.buildReport(makeResult({ checked: 1 }));

      expect(report).toContain('Не найдено: 1');
    });

    it('should detect dropped out keywords', async () => {
      const now = new Date();
      const prev = new Date(now.getTime() - 86400000);

      mockFindManyKeywords.mockResolvedValue([
        makeKeyword('kw1', 'калькулятор забора'),
      ]);
      mockFindManyPositions.mockResolvedValue([
        makePosition('kw1', 0, false, now),
        makePosition('kw1', 5, true, prev),
      ]);

      const report = await notifier.buildReport(makeResult({ checked: 0 }));

      expect(report).toContain('Выпали из выдачи');
      expect(report).toContain('калькулятор забора');
    });

    it('should show current positions when positions are stable', async () => {
      const now = new Date();
      const prev = new Date(now.getTime() - 86400000);

      mockFindManyKeywords.mockResolvedValue([
        makeKeyword('kw1', 'забор под ключ'),
      ]);
      mockFindManyPositions.mockResolvedValue([
        makePosition('kw1', 5, true, now),
        makePosition('kw1', 5, true, prev),
      ]);

      const report = await notifier.buildReport(makeResult());

      expect(report).toContain('📍');
      expect(report).toContain('Текущие позиции');
      expect(report).toContain('забор под ключ');
      expect(report).toContain('позиция 5');
    });

    it('should show no changes message when no positions exist at all', async () => {
      mockFindManyKeywords.mockResolvedValue([
        makeKeyword('kw1', 'забор под ключ'),
      ]);
      mockFindManyPositions.mockResolvedValue([]);

      const report = await notifier.buildReport(makeResult());

      expect(report).toContain('Изменений позиций не обнаружено');
    });

    it('should handle mixed scenario', async () => {
      const now = new Date();
      const prev = new Date(now.getTime() - 86400000);

      mockFindManyKeywords.mockResolvedValue([
        makeKeyword('kw1', 'забор из профнастила'),
        makeKeyword('kw2', 'навес для машины', 'yandex'),
        makeKeyword('kw3', 'калькулятор забора'),
        makeKeyword('kw4', 'забор недорого'),
        makeKeyword('kw5', 'забор дешево', 'yandex'),
      ]);
      mockFindManyPositions.mockResolvedValue([
        makePosition('kw1', 4, true, now),
        makePosition('kw1', 7, true, prev),
        makePosition('kw2', 8, true, now),
        makePosition('kw3', 5, true, now),
        makePosition('kw3', 3, true, prev),
        makePosition('kw4', 0, false, now),
        makePosition('kw5', 3, true, now),
        makePosition('kw5', 3, true, prev),
      ]);

      const report = await notifier.buildReport(makeResult());

      expect(report).toContain('забор из профнастила');
      expect(report).toContain('+3');
      expect(report).toContain('навес для машины');
      expect(report).toContain('позиция 8');
      expect(report).toContain('калькулятор забора');
      expect(report).toContain('-2');
      expect(report).toContain('📍');
      expect(report).toContain('забор дешево');
    });
  });

  describe('sendReport', () => {
    it('should send telegram message', async () => {
      mockFindManyKeywords.mockResolvedValue([]);
      mockFindManyPositions.mockResolvedValue([]);
      mockSendTelegramMessage.mockResolvedValue(true);

      const sent = await notifier.sendReport(makeResult());

      expect(sent).toBe(true);
      expect(mockSendTelegramMessage).toHaveBeenCalledTimes(1);
    });

    it('should split long messages', async () => {
      const manyKeywords = Array.from({ length: 100 }, (_, i) =>
        makeKeyword(`kw${i}`, `ключевое слово ${i} очень длинное название запроса`)
      );
      const now = new Date();
      const prev = new Date(now.getTime() - 86400000);
      const manyPositions = manyKeywords.flatMap((kw) => [
        makePosition(kw.id, Math.floor(Math.random() * 100) + 1, true, now),
        makePosition(kw.id, Math.floor(Math.random() * 100) + 1, true, prev),
      ]);

      mockFindManyKeywords.mockResolvedValue(manyKeywords);
      mockFindManyPositions.mockResolvedValue(manyPositions);
      mockSendTelegramMessage.mockResolvedValue(true);

      const sent = await notifier.sendReport(makeResult());

      expect(sent).toBe(true);
    });
  });
});
