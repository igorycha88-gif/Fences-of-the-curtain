import { cookieConsentSchema } from '@/lib/validators/cookieConsent';

describe('cookieConsentSchema', () => {
  it('should validate a valid accept request', () => {
    const result = cookieConsentSchema.safeParse({
      consentGiven: true,
      analytics: true,
    });
    expect(result.success).toBe(true);
  });

  it('should validate a valid decline request', () => {
    const result = cookieConsentSchema.safeParse({
      consentGiven: false,
      analytics: false,
    });
    expect(result.success).toBe(true);
  });

  it('should reject non-boolean consentGiven', () => {
    const result = cookieConsentSchema.safeParse({
      consentGiven: 'yes',
      analytics: true,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing fields', () => {
    const result = cookieConsentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject extra fields', () => {
    const result = cookieConsentSchema.safeParse({
      consentGiven: true,
      analytics: true,
      extra: 'field',
    });
    expect(result.success).toBe(true);
  });
});
