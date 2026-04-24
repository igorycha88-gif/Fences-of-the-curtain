import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockRedisHgetall = jest.fn() as any;
const mockRedisGet = jest.fn() as any;

jest.mock('@/lib/redis', () => ({
  redis: {
    hgetall: mockRedisHgetall,
    get: mockRedisGet,
  },
}));

const mockFetch = jest.fn() as any;
global.fetch = mockFetch;

describe('telegram/bot-commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    mockFetch.mockResolvedValue({ ok: true } as any);
  });

  describe('handleHelp', () => {
    it('should send help message with command list', async () => {
      const { handleHelp } = await import('@/services/telegram/bot-commands');
      await handleHelp(12345);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-token/sendMessage',
        expect.objectContaining({
          method: 'POST',
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.chat_id).toBe(12345);
      expect(body.text).toContain('/stats');
      expect(body.text).toContain('/events');
      expect(body.text).toContain('/help');
      expect(body.parse_mode).toBe('HTML');
    });
  });

  describe('handleStats', () => {
    it('should send stats message with all metrics', async () => {
      const { handleStats } = await import('@/services/telegram/bot-commands');

      mockRedisHgetall.mockResolvedValue({
        page_view: '156',
        calculator_calculate: '18',
        calculator_export: '5',
        contact_form_submit: '3',
        phone_click: '7',
        lead_submit: '2',
      });
      mockRedisGet.mockImplementation((key: string) => {
        if (key === 'analytics:metrics:unique_users_today') return Promise.resolve('42');
        if (key === 'analytics:metrics:avg_session_duration') return Promise.resolve('204');
        if (key === 'analytics:metrics:rates:funnel_completion') return Promise.resolve('0.019');
        return Promise.resolve(null);
      });

      await handleStats(12345);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('42');
      expect(body.text).toContain('156');
      expect(body.text).toContain('18');
      expect(body.text).toContain('3');
      expect(body.text).toContain('7');
      expect(body.text).toContain('2');
      expect(body.text).toContain('1.9%');
    });

    it('should handle empty data gracefully', async () => {
      const { handleStats } = await import('@/services/telegram/bot-commands');

      mockRedisHgetall.mockResolvedValue({});
      mockRedisGet.mockResolvedValue(null);

      await handleStats(12345);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('Статистика за сегодня');
      expect(body.text).toContain('—');
    });
  });

  describe('handleEvents', () => {
    it('should send only key events', async () => {
      const { handleEvents } = await import('@/services/telegram/bot-commands');

      mockRedisHgetall.mockResolvedValue({
        page_view: '100',
        calculator_calculate: '10',
        calculator_export: '3',
        contact_form_submit: '2',
        phone_click: '5',
        lead_submit: '1',
        some_other_event: '999',
      });

      await handleEvents(12345);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('Ключевые события за сегодня');
      expect(body.text).toContain('10');
      expect(body.text).toContain('3');
      expect(body.text).toContain('2');
      expect(body.text).toContain('5');
      expect(body.text).toContain('1');
      expect(body.text).not.toContain('some_other_event');
    });
  });

  describe('handleCommand', () => {
    it('should route /start to help', async () => {
      const { handleCommand } = await import('@/services/telegram/bot-commands');
      await handleCommand('/start', 12345);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('/stats');
    });

    it('should route /help to help', async () => {
      const { handleCommand } = await import('@/services/telegram/bot-commands');
      await handleCommand('/help', 12345);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('/stats');
    });

    it('should route /stats to stats handler', async () => {
      const { handleCommand } = await import('@/services/telegram/bot-commands');

      mockRedisHgetall.mockResolvedValue({});
      mockRedisGet.mockResolvedValue(null);

      await handleCommand('/stats', 12345);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('Статистика за сегодня');
    });

    it('should route /events to events handler', async () => {
      const { handleCommand } = await import('@/services/telegram/bot-commands');

      mockRedisHgetall.mockResolvedValue({});

      await handleCommand('/events', 12345);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('Ключевые события');
    });

    it('should respond with help hint for unknown command', async () => {
      const { handleCommand } = await import('@/services/telegram/bot-commands');
      await handleCommand('/unknown', 12345);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('/help');
    });

    it('should handle command with extra text', async () => {
      const { handleCommand } = await import('@/services/telegram/bot-commands');
      await handleCommand('/stats today', 12345);

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
