import { Metadata } from 'next';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.portfolio.title,
  description: PAGE_METADATA.portfolio.description,
  keywords: PAGE_METADATA.portfolio.keywords,
  ogImage: PAGE_METADATA.portfolio.ogImage,
});
