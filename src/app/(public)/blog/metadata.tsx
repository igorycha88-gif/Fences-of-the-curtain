import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.blog.title,
  description: PAGE_METADATA.blog.description,
  keywords: PAGE_METADATA.blog.keywords,
  path: PAGE_METADATA.blog.path,
  ogImage: PAGE_METADATA.blog.ogImage,
});
