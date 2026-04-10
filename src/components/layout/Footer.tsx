'use client';

import { useState, useEffect, useContext } from 'react';
import { CookieConsentContext } from '@/components/cookie-consent/CookieConsentProvider';

interface ContactInfoData {
  address: string;
  phone: string;
  email: string;
  hasData: boolean;
}

export default function Footer() {
  const [contactInfo, setContactInfo] = useState<ContactInfoData | null>(null);
  const cookieConsent = useContext(CookieConsentContext);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch('/api/contact-info');
        const data = await response.json();
        if (response.ok && data.hasData) {
          setContactInfo(data);
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
      }
    };

    fetchContactInfo();
  }, []);

  return (
    <footer className="bg-gray-900 text-white py-10">
      <div className="container mx-auto px-4 text-center">
        <p className="mb-2">© 2026 Заборы и Навесы. Все права защищены.</p>
        <p className="text-gray-400">
          {contactInfo?.phone || '+74993901595'} {contactInfo?.email ? `| ${contactInfo.email}` : ''}
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
