import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLdScript from '@/components/seo/JsonLdScript';
import CityGrid from '@/components/geo/CityGrid';
import { generateBreadcrumbJsonLd, generateItemListJsonLd } from '@/lib/seo/jsonld';
import { GEO_CITIES, GEO_HUBS } from '@/lib/geo/cities';
import { Calculator, ArrowRight } from 'lucide-react';

export const revalidate = 86400;

export default function ZaboryNavesyIndexPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Заборы и навесы в Подмосковье', url: '/zabory-navesy' },
  ]);

  const citiesItemList = generateItemListJsonLd(
    'Города работы — Заборы и Навесы',
    GEO_CITIES.map((c) => ({
      name: `Заборы и навесы ${c.nameIn}`,
      url: `/zabory-navesy/${c.slug}`,
    }))
  );

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScript data={[breadcrumbJsonLd, citiesItemList]} />
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Заборы и навесы в Подмосковье' }]} />
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Заборы и навесы в Подмосковье
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Устанавливаем заборы из профнастила, евроштакетника и 3D-панелей, навесы
                для автомобилей из поликарбоната и профлиста в городах востока, юго-востока
                и юга Московской области. Под ключ от 2 600 ₽ за метр, монтаж от 1 дня,
                гарантия по договору.
              </p>
              <Link
                href="/calculator/fence"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                <Calculator className="w-5 h-5" />
                Рассчитать стоимость
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl space-y-12">
            {GEO_HUBS.map((hub) => (
              <div key={hub.slug}>
                <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{hub.name}</h2>
                  <Link
                    href={`/zabory-navesy/${hub.slug}`}
                    className="text-primary hover:underline text-sm inline-flex items-center gap-1"
                  >
                    О направлении <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  {hub.highways.join(' · ')}
                </p>
                <CityGrid cities={GEO_CITIES.filter((c) => c.direction === hub.direction)} />
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Не нашли свой город?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Работаем по всей Московской области. Позвоните — уточним логистику и
              рассчитаем стоимость: +7 (499) 390-15-95
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/calculator/fence"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                <Calculator className="w-5 h-5" />
                Калькулятор забора
              </Link>
              <Link
                href="/calculator/canopy"
                className="inline-flex items-center gap-2 border border-white/40 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                <Calculator className="w-5 h-5" />
                Калькулятор навеса
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
