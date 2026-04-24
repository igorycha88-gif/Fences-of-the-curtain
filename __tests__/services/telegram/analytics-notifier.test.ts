import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockRedisSet = jest.fn() as any;
const mockRedisGet = jest.fn() as any;

jest.mock('@/lib/redis', () => ({
  redis: {
    set: mockRedisSet,
    get: mockRedisGet,
  },
}));

const mockGetCityByIP = jest.fn() as any;
mockGetCityByIP.mockResolvedValue('Москва, Московская обл.');

jest.mock('@/services/admin/ipLookupService', () => ({
  getCityByIP: mockGetCityByIP,
}));

const mockFetch = jest.fn() as any;
global.fetch = mockFetch;

describe('telegram/analytics-notifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('isNotifiableEvent', () => {
    it('should return true for all 7 notifiable events', async () => {
      const { isNotifiableEvent } = await import('@/services/telegram/analytics-notifier');
      expect(isNotifiableEvent('contact_form_submit')).toBe(true);
      expect(isNotifiableEvent('phone_click')).toBe(true);
      expect(isNotifiableEvent('lead_submit')).toBe(true);
      expect(isNotifiableEvent('calculator_calculate')).toBe(true);
      expect(isNotifiableEvent('calculator_export')).toBe(true);
      expect(isNotifiableEvent('portfolio_view')).toBe(true);
      expect(isNotifiableEvent('contacts_view')).toBe(true);
    });

    it('should return false for non-notifiable events', async () => {
      const { isNotifiableEvent } = await import('@/services/telegram/analytics-notifier');
      expect(isNotifiableEvent('page_view')).toBe(false);
      expect(isNotifiableEvent('calculator_open')).toBe(false);
      expect(isNotifiableEvent('session_end')).toBe(false);
    });
  });

  describe('shouldDedup', () => {
    it('should return false and set dedup key for first event', async () => {
      mockRedisSet.mockResolvedValue('OK');

      const { shouldDedup } = await import('@/services/telegram/analytics-notifier');
      const result = await shouldDedup('calculator_calculate', 'session-1');

      expect(result).toBe(false);
      expect(mockRedisSet).toHaveBeenCalledWith(
        'telegram:dedup:calculator_calculate:session-1',
        '1',
        'EX',
        10,
        'NX'
      );
    });

    it('should return true for duplicate event within TTL', async () => {
      mockRedisSet.mockResolvedValue(null);

      const { shouldDedup } = await import('@/services/telegram/analytics-notifier');
      const result = await shouldDedup('calculator_calculate', 'session-1');

      expect(result).toBe(true);
    });
  });

  describe('formatNotificationMessage', () => {
    it('should include location when provided', async () => {
      const { formatNotificationMessage } = await import('@/services/telegram/analytics-notifier');
      const msg = formatNotificationMessage(
        'calculator_calculate',
        '/calculator',
        '2026-04-24T14:30:05.000Z',
        'Москва, Московская обл.'
      );

      expect(msg).toContain('📍 Локация: Москва, Московская обл.');
    });

    it('should not include location when null', async () => {
      const { formatNotificationMessage } = await import('@/services/telegram/analytics-notifier');
      const msg = formatNotificationMessage(
        'phone_click',
        '/contacts',
        '2026-04-24T14:30:05.000Z',
        null
      );

      expect(msg).not.toContain('📍');
    });

    it('should format portfolio_view event', async () => {
      const { formatNotificationMessage } = await import('@/services/telegram/analytics-notifier');
      const msg = formatNotificationMessage(
        'portfolio_view',
        '/portfolio',
        '2026-04-24T14:30:05.000Z',
        null
      );

      expect(msg).toContain('🏗️');
      expect(msg).toContain('Просмотр портфолио');
    });

    it('should format contacts_view event', async () => {
      const { formatNotificationMessage } = await import('@/services/telegram/analytics-notifier');
      const msg = formatNotificationMessage(
        'contacts_view',
        '/contacts',
        '2026-04-24T14:30:05.000Z',
        null
      );

      expect(msg).toContain('📋');
      expect(msg).toContain('Просмотр контактов');
    });

    it('should escape HTML in location', async () => {
      const { formatNotificationMessage } = await import('@/services/telegram/analytics-notifier');
      const msg = formatNotificationMessage(
        'phone_click',
        '/',
        '2026-04-24T14:30:05.000Z',
        '<script>alert(1)</script>'
      );

      expect(msg).not.toContain('<script>');
      expect(msg).toContain('&lt;script&gt;');
    });
  });

  describe('sendAnalyticsNotification', () => {
    it('should not send when deduped', async () => {
      mockRedisSet.mockResolvedValue(null);

      const { sendAnalyticsNotification } = await import('@/services/telegram/analytics-notifier');

      await sendAnalyticsNotification({
        eventName: 'calculator_calculate',
        page: '/calculator',
        sessionId: 'session-1',
        timestamp: '2026-04-24T14:30:05.000Z',
        ip: '192.168.1.1',
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should send notification with location from IP', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat';

      mockRedisSet.mockResolvedValue('OK');
      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('OK') } as any);

      const { sendAnalyticsNotification } = await import('@/services/telegram/analytics-notifier');

      await sendAnalyticsNotification({
        eventName: 'contact_form_submit',
        page: '/contacts',
        sessionId: 'session-1',
        timestamp: '2026-04-24T14:30:05.000Z',
        ip: '95.173.136.50',
      });

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('📍 Локация: Москва, Московская обл.');

      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    });

    it('should work without IP (no location)', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat';

      mockRedisSet.mockResolvedValue('OK');
      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('OK') } as any);

      const { sendAnalyticsNotification } = await import('@/services/telegram/analytics-notifier');

      await sendAnalyticsNotification({
        eventName: 'portfolio_view',
        page: '/portfolio',
        sessionId: 'session-1',
        timestamp: '2026-04-24T14:30:05.000Z',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).not.toContain('📍');

      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    });

    it('should handle fetch error gracefully', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat';

      mockRedisSet.mockResolvedValue('OK');
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { sendAnalyticsNotification } = await import('@/services/telegram/analytics-notifier');

      await expect(
        sendAnalyticsNotification({
          eventName: 'calculator_calculate',
          page: '/calculator',
          sessionId: 'session-1',
          timestamp: '2026-04-24T14:30:05.000Z',
        })
      ).resolves.toBeUndefined();

      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    });
  });
});
