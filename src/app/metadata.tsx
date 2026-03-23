import { Metadata } from 'next';
import { PAGE_METADATA, SEO_CONFIG } from '@/lib/seo/constants';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.home.title,
  description: PAGE_METADATA.home.description,
  keywords: PAGE_METADATA.home.keywords,
  ogImage: PAGE_METADATA.home.ogImage,
});
