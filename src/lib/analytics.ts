import type { AnalyticsEvent, EventName } from '@/types/analytics';

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId: string | undefined = document.cookie
    .split('; ')
    .find(row => row.startsWith('analytics_session_id='))
    ?.split('=')[1] ?? undefined;
  
  if (!sessionId) {
    sessionId = sessionStorage.getItem('analytics_session_id') ?? undefined;
  }
  
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

function sendEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_ANALYTICS === 'true') {
    console.log('[Analytics]', event);
    return;
  }

  navigator.sendBeacon(
    '/api/analytics/events',
    JSON.stringify(event)
  );
}

export function trackEvent(
  eventName: EventName | string,
  properties?: Record<string, unknown>
): void {
  const event: AnalyticsEvent = {
    eventName,
    sessionId: getSessionId(),
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    properties,
    timestamp: new Date().toISOString(),
  };

  sendEvent(event);
}

export function trackPageView(path: string): void {
  trackEvent('page_view', { path });
}

export function trackUserJourney(
  step: string,
  properties?: Record<string, unknown>
): void {
  trackEvent(step, { journey_step: step, ...properties });
}
