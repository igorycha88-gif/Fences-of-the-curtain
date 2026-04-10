'use client';

import { useContext } from 'react';
import { CookieConsentContext } from '@/components/cookie-consent/CookieConsentProvider';
import { useContactInfo } from '@/components/providers/ContactInfoProvider';

export default function Footer() {
  const contactInfo = useContactInfo();
  const cookieConsent = useContext(CookieConsentContext);

  return (
    <footer className="bg-gray-900 text-white py-10">
      <div className="container mx-auto px-4 text-center">
        <p className="mb-2">© 2026 Заборы и Навесы. Все права защищены.</p>
        <p className="text-gray-400">
          {contactInfo.phone || '+74993901595'} {contactInfo.email ? `| ${contactInfo.email}` : ''}
        </p>
        <button
          onClick={() => cookieConsent?.openSettings()}
          className="mt-2 text-xs text-gray-500 underline hover:text-gray-300 transition-colors"
        >
          Настройка cookies
        </button>
      </div>
    </footer>
  );
}
