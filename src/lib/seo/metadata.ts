import { Metadata } from 'next';
import { SEO_CONFIG } from './constants';

interface PageMetadataOptions {
  title: string;
  description: string;
  keywords?: readonly string[];
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function generatePageMetadata(options: PageMetadataOptions): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    ogImage = SEO_CONFIG.DEFAULT_OG_IMAGE,
    noIndex = false,
  } = options;

  const fullTitle = `${title} | ${SEO_CONFIG.SITE_NAME}`;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${SEO_CONFIG.BASE_URL}${ogImage}`;
  const canonicalUrl = canonical ? `${SEO_CONFIG.BASE_URL}${canonical}` : SEO_CONFIG.BASE_URL;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: SEO_CONFIG.SITE_NAME }],
    creator: SEO_CONFIG.SITE_NAME,
    publisher: SEO_CONFIG.SITE_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: SEO_CONFIG.LOCALE,
      url: canonicalUrl,
      siteName: SEO_CONFIG.SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SEO_CONFIG.TWITTER_SITE,
      title: fullTitle,
      description,
      images: [fullOgImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };

  return metadata;
}

export function generateStaticPageMetadata(
  pageTitle: string,
  pageDescription: string,
  pageKeywords: readonly string[],
  ogImage?: string
): Metadata {
  return generatePageMetadata({
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    ogImage,
  });
}
