import { z } from 'zod';

export const cookieConsentSchema = z.object({
  consentGiven: z.boolean(),
  analytics: z.boolean(),
});

export type CookieConsentRequest = z.infer<typeof cookieConsentSchema>;
