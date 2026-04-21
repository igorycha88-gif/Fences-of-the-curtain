import { SEO_CONFIG, BUSINESS_INFO } from './constants';
import {
  JsonLdOrganization,
  JsonLdWebSite,
  JsonLdService,
  JsonLdWebApplication,
  JsonLdBreadcrumbList,
  JsonLdContactPage,
  JsonLdItemList,
  JsonLdFaqPage,
  JsonLdSiteNavigation,
} from './types';

export function generateOrganizationJsonLd(): JsonLdOrganization {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SEO_CONFIG.BASE_URL}/#organization`,
    name: BUSINESS_INFO.name,
    url: SEO_CONFIG.BASE_URL,
    logo: `${SEO_CONFIG.BASE_URL}/logo.png`,
    description: SEO_CONFIG.DEFAULT_DESCRIPTION,
    telephone: BUSINESS_INFO.telephone,
    email: BUSINESS_INFO.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: BUSINESS_INFO.address.locality,
      addressRegion: BUSINESS_INFO.address.region,
      addressCountry: BUSINESS_INFO.address.country,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: BUSINESS_INFO.openingHours.opens,
        closes: BUSINESS_INFO.openingHours.closes,
      },
    ],
    priceRange: BUSINESS_INFO.priceRange,
    areaServed: [BUSINESS_INFO.address.locality, BUSINESS_INFO.address.region],
  };
}

export function generateSiteNavigationJsonLd(): JsonLdSiteNavigation {
  const navItems = [
    { name: 'Калькулятор', url: '/calculator' },
    { name: 'Портфолио', url: '/portfolio' },
    { name: 'Услуги', url: '/services' },
    { name: 'О нас', url: '/about' },
    { name: 'Контакты', url: '/contacts' },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: navItems.map((item, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: item.name,
      url: `${SEO_CONFIG.BASE_URL}${item.url}`,
    })),
  };
}

export function generateWebSiteJsonLd(): JsonLdWebSite {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_CONFIG.SITE_NAME,
    url: SEO_CONFIG.BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SEO_CONFIG.BASE_URL}/services?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateServiceJsonLd(
  name: string,
  description: string,
  priceRange?: string
): JsonLdService {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'LocalBusiness',
      '@id': `${SEO_CONFIG.BASE_URL}/#organization`,
      name: BUSINESS_INFO.name,
    },
    areaServed: BUSINESS_INFO.address.country,
    offers: {
      '@type': 'Offer',
      priceRange: priceRange || BUSINESS_INFO.priceRange,
    },
  };
}

export function generateWebApplicationJsonLd(
  name: string,
  description: string,
  url: string
): JsonLdWebApplication {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: `${SEO_CONFIG.BASE_URL}${url}`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'RUB',
    },
  };
}

export function generateBreadcrumbJsonLd(
  items: { name: string; url?: string }[]
): JsonLdBreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${SEO_CONFIG.BASE_URL}${item.url}` : undefined,
    })),
  };
}

export function generateContactPageJsonLd(): JsonLdContactPage {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Контакты',
    description: 'Свяжитесь с нами для консультации и расчёта стоимости',
    url: `${SEO_CONFIG.BASE_URL}/contacts`,
    mainEntity: {
      '@type': 'LocalBusiness',
      '@id': `${SEO_CONFIG.BASE_URL}/#organization`,
    },
  };
}

export function generateItemListJsonLd(
  name: string,
  items: { name: string; url?: string; image?: string; description?: string }[]
): JsonLdItemList {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        url: item.url ? `${SEO_CONFIG.BASE_URL}${item.url}` : undefined,
        image: item.image ? `${SEO_CONFIG.BASE_URL}${item.image}` : undefined,
        description: item.description,
      },
    })),
  };
}

export function generateFaqPageJsonLd(items: { question: string; answer: string }[]): JsonLdFaqPage {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function generateArticleJsonLd(title: string, description: string, url: string, image?: string, datePublished?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: `${SEO_CONFIG.BASE_URL}${url}`,
    image: image ? `${SEO_CONFIG.BASE_URL}${image}` : undefined,
    datePublished: datePublished || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: SEO_CONFIG.SITE_NAME,
      url: SEO_CONFIG.BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SEO_CONFIG.SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SEO_CONFIG.BASE_URL}/logo.png`,
      },
    },
  };
}

export function generateAggregateRatingJsonLd(averageRating: number, reviewCount: number) {
  return {
    '@type': 'AggregateRating',
    ratingValue: averageRating,
    bestRating: 5,
    worstRating: 1,
    reviewCount,
  };
}

export function generateReviewJsonLd(author: string, text: string, rating: number) {
  return {
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: author,
    },
    reviewBody: text,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating,
      bestRating: 5,
    },
  };
}

export const SERVICES_JSON_LD: JsonLdService[] = [
  generateServiceJsonLd(
    'Установка забора из профнастила',
    'Профессиональный монтаж заборов из профнастила с гарантией качества'
  ),
  generateServiceJsonLd(
    'Установка евроштакетника',
    'Монтаж заборов из евроштакетника — стильное и надёжное решение'
  ),
  generateServiceJsonLd(
    'Установка 3D-панелей',
    'Современные заборы из 3D-панелей — прочность и дизайн'
  ),
  generateServiceJsonLd(
    'Установка навеса для автомобиля',
    'Навесы из поликарбоната и профнастила для авто'
  ),
];
