import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import ContactInfoProvider from '@/components/providers/ContactInfoProvider';
import JsonLdScript from '@/components/seo/JsonLdScript';
import YandexMetrika from '@/components/seo/YandexMetrika';
import CookieConsentProvider from '@/components/cookie-consent/CookieConsentProvider';
import MessengerWidget from '@/components/layout/MessengerWidget';
import { generateOrganizationJsonLd, generateWebSiteJsonLd, generateSiteNavigationJsonLd } from '@/lib/seo/jsonld';
import { SEO_CONFIG } from '@/lib/seo/constants';
import { recordTiming } from '@/lib/http-metrics';
import './globals.css';

const GTAG_ID = 'G-N4KVS3N0B1';
const YANDEX_METRIKA_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID) || 0;

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: {
    default: SEO_CONFIG.DEFAULT_TITLE,
    template: `%s | ${SEO_CONFIG.SITE_NAME}`,
  },
  description: SEO_CONFIG.DEFAULT_DESCRIPTION,
  keywords: SEO_CONFIG.DEFAULT_KEYWORDS.join(', '),
  authors: [{ name: SEO_CONFIG.SITE_NAME }],
  creator: SEO_CONFIG.SITE_NAME,
  publisher: SEO_CONFIG.SITE_NAME,
  metadataBase: new URL(SEO_CONFIG.BASE_URL),
  alternates: {
    canonical: SEO_CONFIG.BASE_URL,
  },
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.LOCALE,
    url: SEO_CONFIG.BASE_URL,
    siteName: SEO_CONFIG.SITE_NAME,
    title: SEO_CONFIG.DEFAULT_TITLE,
    description: SEO_CONFIG.DEFAULT_DESCRIPTION,
    images: [
      {
        url: `${SEO_CONFIG.BASE_URL}${SEO_CONFIG.DEFAULT_OG_IMAGE}`,
        width: 1200,
        height: 630,
        alt: SEO_CONFIG.SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SEO_CONFIG.TWITTER_SITE,
    title: SEO_CONFIG.DEFAULT_TITLE,
    description: SEO_CONFIG.DEFAULT_DESCRIPTION,
    images: [`${SEO_CONFIG.BASE_URL}${SEO_CONFIG.DEFAULT_OG_IMAGE}`],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  verification: {
    yandex: 'b82b0cfe086d3936',
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const requestStart = headersList.get('x-request-start');
  const requestPath = headersList.get('x-request-path');

  if (requestStart && requestPath) {
    const duration = Date.now() - parseInt(requestStart, 10);
    recordTiming(requestPath, duration);
  }

  const organizationJsonLd = generateOrganizationJsonLd();
  const websiteJsonLd = generateWebSiteJsonLd();
  const siteNavigationJsonLd = generateSiteNavigationJsonLd();

  return (
    <html lang="ru">
      <head>
        <JsonLdScript data={[organizationJsonLd, websiteJsonLd, siteNavigationJsonLd]} />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GTAG_ID}');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ContactInfoProvider>
            <CookieConsentProvider>
              {children}
              <MessengerWidget />
            </CookieConsentProvider>
          </ContactInfoProvider>
        </SessionProvider>
        {YANDEX_METRIKA_ID > 0 && <YandexMetrika metrikaId={YANDEX_METRIKA_ID} />}
      </body>
    </html>
  );
}
