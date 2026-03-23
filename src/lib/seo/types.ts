export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface JsonLdOrganization {
  '@context': 'https://schema.org';
  '@type': 'Organization' | 'LocalBusiness';
  '@id'?: string;
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: {
    '@type': 'PostalAddress';
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    streetAddress?: string;
    addressCountry?: string;
  };
  telephone?: string;
  email?: string;
  geo?: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification?: {
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }[];
  priceRange?: string;
  areaServed?: string[];
}

export interface JsonLdWebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface JsonLdService {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  description: string;
  provider: {
    '@type': 'Organization' | 'LocalBusiness';
    '@id'?: string;
    name: string;
  };
  areaServed?: string | string[];
  offers?: {
    '@type': 'Offer';
    priceRange?: string;
    price?: string;
    priceCurrency?: string;
  };
}

export interface JsonLdWebApplication {
  '@context': 'https://schema.org';
  '@type': 'WebApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
}

export interface JsonLdBreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }[];
}

export interface JsonLdContactPage {
  '@context': 'https://schema.org';
  '@type': 'ContactPage';
  name: string;
  description?: string;
  url: string;
  mainEntity?: {
    '@type': 'Organization' | 'LocalBusiness';
    '@id': string;
  };
}

export interface JsonLdItemList {
  '@context': 'https://schema.org';
  '@type': 'ItemList';
  name: string;
  description?: string;
  numberOfItems: number;
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    item: {
      '@type': string;
      name: string;
      url?: string;
      image?: string;
      description?: string;
    };
  }[];
}

export type JsonLdData =
  | JsonLdOrganization
  | JsonLdWebSite
  | JsonLdService
  | JsonLdWebApplication
  | JsonLdBreadcrumbList
  | JsonLdContactPage
  | JsonLdItemList;
