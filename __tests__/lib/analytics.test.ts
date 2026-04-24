import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const mockSendBeacon = jest.fn();
const mockSessionStorage = {
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
};

const originalWindow = global.window;
const originalDocument = global.document;
const originalNavigator = global.navigator;

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockSendBeacon.mockReturnValue(true);
    mockSessionStorage.getItem.mockReturnValue(null);

    (global as any).window = { location: { pathname: '/test' } };
    (global as any).document = {
      cookie: '',
      referrer: 'https://example.com',
    };
    (global as any).navigator = { sendBeacon: mockSendBeacon };
    (global as any).sessionStorage = mockSessionStorage;
    (global as any).crypto = { randomUUID: () => 'test-uuid-1234' };
  });

  afterEach(() => {
    if (originalWindow === undefined) delete (global as any).window;
    else (global as any).window = originalWindow;
    if (originalDocument === undefined) delete (global as any).document;
    else (global as any).document = originalDocument;
    if (originalNavigator === undefined) delete (global as any).navigator;
    else (global as any).navigator = originalNavigator;
    delete (global as any).sessionStorage;
  });

  describe('trackEvent', () => {
    it('should send beacon with event data', async () => {
      const { trackEvent } = await import('@/lib/analytics');

      trackEvent('page_view', { path: '/calculator' });

      expect(mockSendBeacon).toHaveBeenCalledWith(
        '/api/analytics/events',
        expect.any(String)
      );

      const sentData = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(sentData.eventName).toBe('page_view');
      expect(sentData.properties).toEqual({ path: '/calculator' });
      expect(sentData.sessionId).toBe('test-uuid-1234');
      expect(sentData.page).toBe('/test');
      expect(sentData.referrer).toBe('https://example.com');
      expect(sentData.timestamp).toBeDefined();
    });

    it('should send event without properties', async () => {
      const { trackEvent } = await import('@/lib/analytics');

      trackEvent('calculator_open');

      const sentData = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(sentData.eventName).toBe('calculator_open');
      expect(sentData.properties).toBeUndefined();
    });

    it('should use existing session ID from sessionStorage', async () => {
      mockSessionStorage.getItem.mockReturnValue('existing-session-id');

      const { trackEvent } = await import('@/lib/analytics');

      trackEvent('test_event');

      const sentData = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(sentData.sessionId).toBe('existing-session-id');
    });

    it('should use existing session ID from cookie', async () => {
      (global as any).document.cookie = 'analytics_session_id=cookie-session-id; other=value';

      const { trackEvent } = await import('@/lib/analytics');

      trackEvent('test_event');

      const sentData = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(sentData.sessionId).toBe('cookie-session-id');
    });
  });

  describe('trackPageView', () => {
    it('should call trackEvent with page_view and path', async () => {
      const { trackPageView } = await import('@/lib/analytics');

      trackPageView('/calculator');

      const sentData = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(sentData.eventName).toBe('page_view');
      expect(sentData.properties).toEqual({ path: '/calculator' });
    });
  });

  describe('trackUserJourney', () => {
    it('should call trackEvent with journey_step property', async () => {
      const { trackUserJourney } = await import('@/lib/analytics');

      trackUserJourney('calculator_open', { fenceType: 'profnastil' });

      const sentData = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(sentData.eventName).toBe('calculator_open');
      expect(sentData.properties).toEqual({
        journey_step: 'calculator_open',
        fenceType: 'profnastil',
      });
    });

    it('should work without extra properties', async () => {
      const { trackUserJourney } = await import('@/lib/analytics');

      trackUserJourney('page_view');

      const sentData = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(sentData.properties).toEqual({ journey_step: 'page_view' });
    });
  });

  describe('development mode', () => {
    it('should log to console when analytics disabled in dev', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalDisable = process.env.NEXT_PUBLIC_DISABLE_ANALYTICS;
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_DISABLE_ANALYTICS = 'true';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const { trackEvent } = await import('@/lib/analytics');

      trackEvent('test_event');

      expect(consoleSpy).toHaveBeenCalledWith('[Analytics]', expect.any(Object));
      expect(mockSendBeacon).not.toHaveBeenCalled();

      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      process.env.NEXT_PUBLIC_DISABLE_ANALYTICS = originalDisable;
      consoleSpy.mockRestore();
    });
  });
});
