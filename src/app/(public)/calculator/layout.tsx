import { Metadata } from 'next';
import { PAGE_METADATA } from '@/lib/seo/constants';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateStaticPageMetadata(
  PAGE_METADATA.calculator.title,
  PAGE_METADATA.calculator.description,
  PAGE_METADATA.calculator.keywords,
  PAGE_METADATA.calculator.ogImage,
  PAGE_METADATA.calculator.path
);

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
