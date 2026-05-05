import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA } from '@/lib/seo/constants';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.about.title,
  description: PAGE_METADATA.about.description,
  keywords: PAGE_METADATA.about.keywords,
  path: PAGE_METADATA.about.path,
  ogImage: PAGE_METADATA.about.ogImage,
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
