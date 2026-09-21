import { Metadata } from 'next';
import { FileText, Building2, Landmark } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { LEGAL_REQUISITES, PAGE_METADATA, SEO_CONFIG } from '@/lib/seo/constants';
import { AnimatedSection } from '@/hooks/useScrollReveal';

export const metadata: Metadata = generatePageMetadata({
  title: PAGE_METADATA.rekvizity.title,
  description: PAGE_METADATA.rekvizity.description,
  keywords: [...PAGE_METADATA.rekvizity.keywords],
  ogImage: PAGE_METADATA.rekvizity.ogImage,
});

const GENERAL_REQUISITES: { label: string; value: string }[] = [
  { label: 'Полное наименование', value: LEGAL_REQUISITES.fullName },
  { label: 'Краткое наименование', value: LEGAL_REQUISITES.shortName },
  { label: 'Юридический адрес', value: LEGAL_REQUISITES.legalAddress },
  { label: 'Фактический адрес производства', value: LEGAL_REQUISITES.productionAddress },
  { label: 'ИНН', value: LEGAL_REQUISITES.inn },
  { label: 'ОГРНИП', value: LEGAL_REQUISITES.ogrnip },
];

const BANK_REQUISITES: { label: string; value: string }[] = [
  { label: 'Наименование банка', value: LEGAL_REQUISITES.bank.name },
  { label: 'БИК', value: LEGAL_REQUISITES.bank.bik },
  { label: 'Корреспондентский счёт', value: LEGAL_REQUISITES.bank.correspondentAccount },
  { label: 'Расчётный счёт', value: LEGAL_REQUISITES.bank.checkingAccount },
];

function RequisiteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3 border-b border-border/50 last:border-b-0">
      <dt className="sm:w-72 flex-shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{value}</dd>
    </div>
  );
}

export default function RekvizityPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Реквизиты', url: `${SEO_CONFIG.BASE_URL}/rekvizity` },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd]} />
      <Header />

      <main className="pt-24 pb-16">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Реквизиты' }]} />
            <AnimatedSection animation="fade-in-up" className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <FileText className="w-4 h-4" />
                Документы и оплата
              </div>
              <h1 className="section-title mb-4">Реквизиты</h1>
              <p className="section-subtitle">
                Юридические и банковские реквизиты для заключения договора и оплаты по счёту
              </p>
            </AnimatedSection>
          </div>
        </section>

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <AnimatedSection animation="fade-in-left">
              <div className="card-modern p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Общие реквизиты</h2>
                </div>
                <dl>
                  {GENERAL_REQUISITES.map((item) => (
                    <RequisiteRow key={item.label} label={item.label} value={item.value} />
                  ))}
                </dl>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-in-right" delay={100}>
              <div className="card-modern p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Landmark className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Банковские реквизиты</h2>
                </div>
                <dl>
                  {BANK_REQUISITES.map((item) => (
                    <RequisiteRow key={item.label} label={item.label} value={item.value} />
                  ))}
                </dl>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-in-up" delay={200}>
              <p className="text-sm text-muted-foreground text-center">
                Для выставления счёта на оплату безналичным расчётом свяжитесь с нами по телефону
                или через форму заявки — подготовим договор и счёт в течение рабочего дня.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
