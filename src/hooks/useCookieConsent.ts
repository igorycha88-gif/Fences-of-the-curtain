'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CookieConsentState,
  COOKIE_CONSENT_KEY,
  DEFAULT_CONSENT_STATE,
} from '@/types/cookie-consent';

function readStoredConsent(): CookieConsentState {
  if (typeof window === 'undefined') return DEFAULT_CONSENT_STATE;
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      return JSON.parse(stored) as CookieConsentState;
    }
  } catch {
    // localStorage unavailable or corrupted
  }
  return DEFAULT_CONSENT_STATE;
}

function writeStoredConsent(state: CookieConsentState) {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

async function sendConsentToServer(
  consentGiven: boolean,
  analytics: boolean
): Promise<void> {
  try {
    await fetch('/api/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentGiven, analytics }),
    });
  } catch {
    // Silent fail — consent still saved locally
  }
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentState>(DEFAULT_CONSENT_STATE);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    setConsent(stored);
    setIsBannerVisible(stored.accepted === null);
    setMounted(true);
  }, []);

  const acceptAll = useCallback(async () => {
    const newState: CookieConsentState = {
      accepted: true,
      analytics: true,
      timestamp: new Date().toISOString(),
    };
    writeStoredConsent(newState);
    setConsent(newState);
    setIsBannerVisible(false);
    setIsSettingsOpen(false);
    await sendConsentToServer(true, true);
  }, []);

  const declineAll = useCallback(async () => {
    const newState: CookieConsentState = {
      accepted: false,
      analytics: false,
      timestamp: new Date().toISOString(),
    };
    writeStoredConsent(newState);
    setConsent(newState);
    setIsBannerVisible(false);
    setIsSettingsOpen(false);
    await sendConsentToServer(false, false);
  }, []);

  const saveSettings = useCallback(async (analytics: boolean) => {
    const newState: CookieConsentState = {
      accepted: true,
      analytics,
      timestamp: new Date().toISOString(),
    };
    writeStoredConsent(newState);
    setConsent(newState);
    setIsBannerVisible(false);
    setIsSettingsOpen(false);
    await sendConsentToServer(true, analytics);
  }, []);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
    setIsBannerVisible(false);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
    if (consent.accepted === null) {
      setIsBannerVisible(true);
    }
  }, [consent.accepted]);

  return {
    consent,
    isBannerVisible,
    isSettingsOpen,
    mounted,
    acceptAll,
    declineAll,
    saveSettings,
    openSettings,
    closeSettings,
  };
}
