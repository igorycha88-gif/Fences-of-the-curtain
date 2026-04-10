import { Metadata } from 'next';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.calculator.title,
  description: PAGE_METADATA.calculator.description,
  keywords: PAGE_METADATA.calculator.keywords,
  path: PAGE_METADATA.calculator.path,
  ogImage: PAGE_METADATA.calculator.ogImage,
});
