import { Metadata } from 'next';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.calculatorCanopy.title,
  description: PAGE_METADATA.calculatorCanopy.description,
  keywords: PAGE_METADATA.calculatorCanopy.keywords,
  ogImage: PAGE_METADATA.calculatorCanopy.ogImage,
  canonical: '/calculator/canopy',
});
