import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { PAGE_METADATA, SEO_CONFIG } from '@/lib/seo/constants';
import { generateOrganizationJsonLd, generateWebSiteJsonLd } from '@/lib/seo/jsonld';
import JsonLdScript from '@/components/seo/JsonLdScript';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.home.title,
  description: PAGE_METADATA.home.description,
  keywords: PAGE_METADATA.home.keywords,
  ogImage: PAGE_METADATA.home.ogImage,
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const organizationJsonLd = generateOrganizationJsonLd();
  const websiteJsonLd = generateWebSiteJsonLd();

  return (
    <>
      <JsonLdScript data={[organizationJsonLd, websiteJsonLd]} />
      {children}
    </>
  );
}
