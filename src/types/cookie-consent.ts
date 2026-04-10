export interface CookieConsentState {
  accepted: boolean | null;
  analytics: boolean;
  timestamp: string | null;
}

export interface CookieConsentApiResponse {
  id: string;
  consentGiven: boolean;
  analytics: boolean;
  createdAt: string;
}

export const COOKIE_CONSENT_KEY = 'cookie_consent';

export const DEFAULT_CONSENT_STATE: CookieConsentState = {
  accepted: null,
  analytics: false,
  timestamp: null,
};
