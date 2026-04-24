import '@testing-library/jest-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('next/image', () => {
  return function MockImage(props: any) {
    return <img {...props} />;
  };
});

import { useCookieConsent } from '@/hooks/useCookieConsent';

describe('useCookieConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('starts with correct consent defaults', () => {
    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.consent.accepted).toBe(null);
    expect(result.current.consent.analytics).toBe(false);
    expect(result.current.consent.timestamp).toBe(null);
  });

  it('sets mounted=true and shows banner after initial load', async () => {
    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    expect(result.current.isBannerVisible).toBe(true);
  });

  it('acceptAll hides banner and saves consent', async () => {
    global.fetch = jest.fn<(...args: any[]) => any>().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;

    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => expect(result.current.mounted).toBe(true));

    await act(async () => {
      await result.current.acceptAll();
    });

    expect(result.current.isBannerVisible).toBe(false);
    expect(result.current.consent.accepted).toBe(true);
    expect(result.current.consent.analytics).toBe(true);
    expect(result.current.isSettingsOpen).toBe(false);

    const stored = JSON.parse(localStorage.getItem('cookie_consent')!);
    expect(stored.accepted).toBe(true);
    expect(stored.analytics).toBe(true);
  });

  it('saveSettings saves analytics=false', async () => {
    global.fetch = jest.fn<(...args: any[]) => any>().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;

    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => expect(result.current.mounted).toBe(true));

    await act(async () => {
      await result.current.saveSettings(false);
    });

    expect(result.current.consent.accepted).toBe(true);
    expect(result.current.consent.analytics).toBe(false);

    const stored = JSON.parse(localStorage.getItem('cookie_consent')!);
    expect(stored.analytics).toBe(false);
  });

  it('openSettings hides banner and opens settings', async () => {
    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => expect(result.current.mounted).toBe(true));

    act(() => {
      result.current.openSettings();
    });

    expect(result.current.isSettingsOpen).toBe(true);
    expect(result.current.isBannerVisible).toBe(false);
  });

  it('closeSettings re-shows banner if consent is null', async () => {
    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => expect(result.current.mounted).toBe(true));

    act(() => {
      result.current.openSettings();
    });

    act(() => {
      result.current.closeSettings();
    });

    expect(result.current.isSettingsOpen).toBe(false);
    expect(result.current.isBannerVisible).toBe(true);
  });

  it('closeSettings does not re-show banner if consent was given', async () => {
    global.fetch = jest.fn<(...args: any[]) => any>().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;

    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => expect(result.current.mounted).toBe(true));

    await act(async () => {
      await result.current.acceptAll();
    });

    act(() => {
      result.current.openSettings();
    });

    act(() => {
      result.current.closeSettings();
    });

    expect(result.current.isBannerVisible).toBe(false);
  });

  it('declineAll hides banner with analytics=false', async () => {
    global.fetch = jest.fn<(...args: any[]) => any>().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;

    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => expect(result.current.mounted).toBe(true));

    await act(async () => {
      await result.current.declineAll();
    });

    expect(result.current.consent.accepted).toBe(false);
    expect(result.current.consent.analytics).toBe(false);
    expect(result.current.isBannerVisible).toBe(false);
  });

  it('restores consent from localStorage on mount', async () => {
    const stored = {
      accepted: true,
      analytics: true,
      timestamp: '2026-01-01T00:00:00Z',
    };
    localStorage.setItem('cookie_consent', JSON.stringify(stored));

    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => expect(result.current.mounted).toBe(true));

    expect(result.current.consent.accepted).toBe(true);
    expect(result.current.consent.analytics).toBe(true);
    expect(result.current.isBannerVisible).toBe(false);
  });
});
