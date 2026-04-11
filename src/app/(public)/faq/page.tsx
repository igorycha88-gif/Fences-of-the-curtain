import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd, generateFaqPageJsonLd } from '@/lib/seo/jsonld';
import FaqClient from '@/components/faq/FaqClient';

export const dynamic = 'force-dynamic';

export default async function FaqPage() {
  const faqItems = await prisma.faqItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'FAQ', url: '/faq' },
  ]);

  const faqPageJsonLd = faqItems.length > 0
    ? generateFaqPageJsonLd(faqItems.map(i => ({ question: i.question, answer: i.answer })))
    : null;

  const jsonLdData = faqPageJsonLd
    ? [breadcrumbJsonLd, faqPageJsonLd]
    : [breadcrumbJsonLd];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <JsonLdScript data={jsonLdData} />
      <Header />

      <main className="pt-24 pb-16 flex-1">
        <Breadcrumbs items={[{ label: 'FAQ' }]} />
        <FaqClient items={faqItems} />
      </main>

      <Footer />
    </div>
  );
}
