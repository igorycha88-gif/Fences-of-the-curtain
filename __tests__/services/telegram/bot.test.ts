import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockFetch = jest.fn() as any;
global.fetch = mockFetch;

describe('telegram/bot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('sendTelegramMessage', () => {
    it('should return false when bot token is not configured', async () => {
      const origToken = process.env.TELEGRAM_BOT_TOKEN;
      const origChatId = process.env.TELEGRAM_CHAT_ID;
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;

      const { sendTelegramMessage } = await import('@/services/telegram/bot');
      const result = await sendTelegramMessage('test');

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();

      process.env.TELEGRAM_BOT_TOKEN = origToken;
      process.env.TELEGRAM_CHAT_ID = origChatId;
    });

    it('should return false when bot token is placeholder', async () => {
      const origToken = process.env.TELEGRAM_BOT_TOKEN;
      const origChatId = process.env.TELEGRAM_CHAT_ID;
      process.env.TELEGRAM_BOT_TOKEN = 'your-bot-token';
      process.env.TELEGRAM_CHAT_ID = 'your-chat-id';

      const { sendTelegramMessage } = await import('@/services/telegram/bot');
      const result = await sendTelegramMessage('test');

      expect(result).toBe(false);

      process.env.TELEGRAM_BOT_TOKEN = origToken;
      process.env.TELEGRAM_CHAT_ID = origChatId;
    });

    it('should send message and return true on success', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('OK') } as any);

      const { sendTelegramMessage } = await import('@/services/telegram/bot');
      const result = await sendTelegramMessage('Hello <b>World</b>');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-token/sendMessage',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Hello'),
        })
      );

      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    });

    it('should return false on API error', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      mockFetch.mockResolvedValue({ ok: false, text: () => Promise.resolve('Bad Request') });

      const { sendTelegramMessage } = await import('@/services/telegram/bot');
      const result = await sendTelegramMessage('test');

      expect(result).toBe(false);

      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    });

    it('should return false on fetch exception', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      mockFetch.mockRejectedValue(new Error('Network error'));

      const { sendTelegramMessage } = await import('@/services/telegram/bot');
      const result = await sendTelegramMessage('test');

      expect(result).toBe(false);

      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    });
  });

  describe('sendOrderNotification', () => {
    it('should format order notification message', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('OK') } as any);

      const { sendOrderNotification } = await import('@/services/telegram/bot');
      await sendOrderNotification({
        id: 'order-123456',
        clientName: 'Иван',
        phone: '+79001234567',
        email: 'ivan@test.com',
        serviceType: 'fence',
        calculatedCost: 150000,
        createdAt: new Date('2026-01-15'),
      });

      const body = JSON.parse((mockFetch.mock.calls[0] as any[])[1].body);
      expect(body.text).toContain('Новая заявка');
      expect(body.text).toContain('Иван');
      expect(body.text).toContain('Забор');
      expect(body.text).toContain('150');
      expect(body.text).toContain('ivan@test.com');
      expect(body.parse_mode).toBe('HTML');

      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    });

    it('should escape HTML in user input', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('OK') } as any);

      const { sendOrderNotification } = await import('@/services/telegram/bot');
      await sendOrderNotification({
        id: 'order-1',
        clientName: 'Test<script>alert(1)</script>',
        phone: '+79001234567',
        email: '',
        serviceType: 'canopy',
        calculatedCost: 0,
        createdAt: new Date(),
      });

      const body = JSON.parse((mockFetch.mock.calls[0] as any[])[1].body);
      expect(body.text).not.toContain('<script>');
      expect(body.text).toContain('&lt;script&gt;');

      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    });

    it('should handle canopy service type', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('OK') } as any);

      const { sendOrderNotification } = await import('@/services/telegram/bot');
      await sendOrderNotification({
        id: 'order-1',
        clientName: 'Test',
        phone: '+79001234567',
        email: '',
        serviceType: 'canopy',
        calculatedCost: 50000,
        createdAt: new Date(),
      });

      const body = JSON.parse((mockFetch.mock.calls[0] as any[])[1].body);
      expect(body.text).toContain('Навес');

      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    });
  });

  describe('sendContactForm', () => {
    it('should format contact form message', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('OK') } as any);

      const { sendContactForm } = await import('@/services/telegram/bot');
      await sendContactForm({
        name: 'Мария',
        phone: '+79001234567',
        email: 'maria@test.com',
        message: 'Хочу заказать забор',
      });

      const body = JSON.parse((mockFetch.mock.calls[0] as any[])[1].body);
      expect(body.text).toContain('Форма обратной связи');
      expect(body.text).toContain('Мария');
      expect(body.text).toContain('Хочу заказать забор');
      expect(body.text).toContain('maria@test.com');

      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    });

    it('should escape HTML in contact form', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('OK') } as any);

      const { sendContactForm } = await import('@/services/telegram/bot');
      await sendContactForm({
        name: 'Test&<>',
        phone: '+79001234567',
        email: '',
        message: '<b>bold</b>',
      });

      const body = JSON.parse((mockFetch.mock.calls[0] as any[])[1].body);
      expect(body.text).toContain('Test&amp;&lt;&gt;');
      expect(body.text).toContain('&lt;b&gt;bold&lt;/b&gt;');

      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    });
  });
});
