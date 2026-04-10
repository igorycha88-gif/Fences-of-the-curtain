import { Metadata } from 'next';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.services.title,
  description: PAGE_METADATA.services.description,
  keywords: PAGE_METADATA.services.keywords,
  path: PAGE_METADATA.services.path,
  ogImage: PAGE_METADATA.services.ogImage,
});
