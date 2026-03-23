import { Metadata } from 'next';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.calculatorFence.title,
  description: PAGE_METADATA.calculatorFence.description,
  keywords: PAGE_METADATA.calculatorFence.keywords,
  ogImage: PAGE_METADATA.calculatorFence.ogImage,
  canonical: '/calculator/fence',
});
