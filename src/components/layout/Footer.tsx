'use client';

import { useContext } from 'react';
import { CookieConsentContext } from '@/components/cookie-consent/CookieConsentProvider';
import { useContactInfo } from '@/components/providers/ContactInfoProvider';
import { ExternalLink } from 'lucide-react';

const PLATFORMS = [
  { name: 'Авито', slug: 'avito', url: 'https://avito.ru', color: '#00AAFF' },
  { name: 'Юла', slug: 'yula', url: 'https://youla.ru', color: '#7B61FF' },
  { name: 'Профи.ру', slug: 'profi', url: 'https://profi.ru', color: '#FF6B00' },
  { name: 'Яндекс.Услуги', slug: 'yandex-uslugi', url: 'https://yandex.ru/uslugi', color: '#FFCC00' },
  { name: '2ГИС', slug: '2gis', url: 'https://2gis.ru', color: '#00B956' },
];

export default function Footer() {
  const contactInfo = useContactInfo();
  const cookieConsent = useContext(CookieConsentContext);

  return (
    <footer className="bg-gray-900 text-white py-10">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="mb-2">© 2026 Заборы и Навесы. Все права защищены.</p>
          <p className="text-gray-400">
            {contactInfo.phone || '+74993901595'} {contactInfo.email ? `| ${contactInfo.email}` : ''}
          </p>

          <div className="mt-6 mb-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Мы на площадках</h4>
            <div className="flex flex-wrap justify-center gap-3">
              {PLATFORMS.map((platform) => (
                <a
                  key={platform.slug}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  style={{ borderLeft: `3px solid ${platform.color}` }}
                >
                  {platform.name}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              ))}
            </div>
          </div>

          <button
            onClick={() => cookieConsent?.openSettings()}
            className="mt-2 text-xs text-gray-500 underline hover:text-gray-300 transition-colors"
          >
            Настройка cookies
          </button>
        </div>
      </div>
    </footer>
  );
}
