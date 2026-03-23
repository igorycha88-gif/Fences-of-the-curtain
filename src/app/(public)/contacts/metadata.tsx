import { Metadata } from 'next';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.contacts.title,
  description: PAGE_METADATA.contacts.description,
  keywords: PAGE_METADATA.contacts.keywords,
  ogImage: PAGE_METADATA.contacts.ogImage,
});
