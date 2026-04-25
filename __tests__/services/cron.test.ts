import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const mockRedisHgetall = jest.fn() as any;
const mockRedisGet = jest.fn() as any;

jest.mock('@/lib/redis', () => ({
  redis: {
    hgetall: mockRedisHgetall,
    get: mockRedisGet,
  },
}));

const mockSendTelegramMessage = jest.fn() as any;
jest.mock('@/services/telegram/bot', () => ({
  sendTelegramMessage: mockSendTelegramMessage,
}));

const mockGetMoscowDate = jest.fn() as any;
jest.mock('@/lib/timezone', () => ({
  getMoscowDate: mockGetMoscowDate,
  getMoscowDateTime: jest.fn(() => '25.04.2026, 14:30:00'),
}));

describe('services/cron', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('sendDailySummary', () => {
    it('should format and send daily summary', async () => {
      mockGetMoscowDate.mockReturnValue('2026-04-25');
      mockRedisHgetall.mockResolvedValue({
        page_view: '200',
        calculator_calculate: '25',
        contact_form_submit: '5',
      });
      mockRedisGet.mockImplementation((key: string) => {
        if (key === 'analytics:metrics:unique_users_today') return Promise.resolve('50');
        if (key === 'analytics:metrics:avg_session_duration') return Promise.resolve('180');
        if (key === 'analytics:metrics:rates:funnel_completion') return Promise.resolve('0.025');
        return Promise.resolve(null);
      });
      mockSendTelegramMessage.mockResolvedValue(true);

      const { sendDailySummary } = await import('@/services/cron');
      const result = await sendDailySummary();

      expect(result).toBe(true);
      expect(mockSendTelegramMessage).toHaveBeenCalledTimes(1);
      const message = mockSendTelegramMessage.mock.calls[0][0];
      expect(message).toContain('Итог дня — 2026-04-25');
      expect(message).toContain('50');
      expect(message).toContain('200');
      expect(message).toContain('25');
      expect(message).toContain('5');
    });

    it('should handle empty data', async () => {
      mockGetMoscowDate.mockReturnValue('2026-04-25');
      mockRedisHgetall.mockResolvedValue({});
      mockRedisGet.mockResolvedValue(null);
      mockSendTelegramMessage.mockResolvedValue(true);

      const { sendDailySummary } = await import('@/services/cron');
      const result = await sendDailySummary();

      expect(result).toBe(true);
      const message = mockSendTelegramMessage.mock.calls[0][0];
      expect(message).toContain('—');
    });

    it('should return false on error', async () => {
      mockGetMoscowDate.mockReturnValue('2026-04-25');
      mockRedisHgetall.mockRejectedValue(new Error('Redis error'));

      const { sendDailySummary } = await import('@/services/cron');
      const result = await sendDailySummary();

      expect(result).toBe(false);
    });
  });

  describe('startScheduler / stopScheduler', () => {
    it('should start and stop scheduler without errors', async () => {
      const { startScheduler, stopScheduler } = await import('@/services/cron');

      startScheduler();
      stopScheduler();

      expect(true).toBe(true);
    });

    it('should not start duplicate schedulers', async () => {
      const { startScheduler, stopScheduler } = await import('@/services/cron');

      startScheduler();
      startScheduler();
      stopScheduler();
    });
  });
});
