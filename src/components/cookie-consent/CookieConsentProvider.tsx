'use client';

import { createContext } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import CookieConsentBanner from './CookieConsentBanner';
import CookieConsentSettings from './CookieConsentSettings';
import GoogleAnalytics from '@/components/seo/GoogleAnalytics';

const YANDEX_METRIKA_ID = parseInt(
  process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || '0',
  10
);

const GOOGLE_ANALYTICS_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '';

interface CookieConsentContextValue {
  openSettings: () => void;
}

export const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export default function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  const {
    consent,
    isBannerVisible,
    isSettingsOpen,
    mounted,
    acceptAll,
    saveSettings,
    openSettings,
    closeSettings,
  } = useCookieConsent();

  const shouldLoadAnalytics = mounted && consent.analytics === true && !isAdmin;

  return (
    <CookieConsentContext.Provider value={{ openSettings }}>
      {children}

      {!isAdmin && mounted && isBannerVisible && (
        <CookieConsentBanner
          onAccept={acceptAll}
          onSettings={openSettings}
        />
      )}

      {!isAdmin && isSettingsOpen && (
        <CookieConsentSettings
          initialAnalytics={consent.analytics}
          onSave={saveSettings}
          onAcceptAll={acceptAll}
          onClose={closeSettings}
        />
      )}

      {shouldLoadAnalytics && YANDEX_METRIKA_ID > 0 && (
        <Script
          id="yandex-metrika-consented"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}", "ym");

              ym(${YANDEX_METRIKA_ID}, "init", {
                ssr:true,
                webvisor:true,
                clickmap:true,
                ecommerce:"dataLayer",
                referrer: document.referrer,
                url: location.href,
                accurateTrackBounce:true,
                trackLinks:true
              });
            `,
          }}
        />
      )}

      {shouldLoadAnalytics && GOOGLE_ANALYTICS_ID && GOOGLE_ANALYTICS_ID !== 'your-id' && !GOOGLE_ANALYTICS_ID.startsWith('G-XXXX') && (
        <GoogleAnalytics gaId={GOOGLE_ANALYTICS_ID} />
      )}
    </CookieConsentContext.Provider>
  );
}
