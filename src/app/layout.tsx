import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateOrganizationJsonLd, generateWebSiteJsonLd } from '@/lib/seo/jsonld';
import { SEO_CONFIG } from '@/lib/seo/constants';
import { headers } from 'next/headers';
import './globals.css';

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
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = generateOrganizationJsonLd();
  const websiteJsonLd = generateWebSiteJsonLd();
  const nonce = headers().get('x-nonce') || '';

  return (
    <html lang="ru">
      <head>
        <JsonLdScript data={[organizationJsonLd, websiteJsonLd]} />
      </head>
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
