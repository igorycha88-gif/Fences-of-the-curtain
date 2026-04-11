import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ImageOff, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { getThumbnailUrl, normalizeImageUrl } from '@/lib/utils/imageUrl';
import PortfolioGalleryClient from './PortfolioGalleryClient';
import { metrikaEvents } from '@/lib/seo/metrika';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  try {
    const items = await prisma.portfolioItem.findMany({
      where: { active: true },
      select: { id: true },
    });
    return items.map((item) => ({ id: item.id }));
  } catch {
    return [];
  }
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.portfolioItem.findUnique({
    where: { id },
  });

  if (!item || !item.active) {
    notFound();
  }

  const images = (item.images as string[]) || [];
  const categoryLabel = item.category === 'fence' ? 'Забор' : 'Навес';
  const categoryHref = item.category === 'fence' ? 'fence' : 'canopy';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <Breadcrumbs
          items={[
            { label: 'Портфолио', href: '/portfolio' },
            { label: item.title },
          ]}
        />

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10">
            <PortfolioGalleryClient images={images} title={item.title} />

            <div>
              <div className="mb-4">
                <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {item.type || categoryLabel}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {item.title}
              </h1>

              {item.description && (
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {item.description}
                </p>
              )}

              {item.showCost && item.cost != null && (
                <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                  <p className="text-sm text-gray-500 mb-1">Стоимость проекта</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    }).format(item.cost)}
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Хотите подобный проект?
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  Рассчитайте стоимость с учётом ваших размеров и материалов
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/calculator/${categoryHref}`}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Рассчитать подобный проект
                  </Link>
                  <a
                    href="tel:+74993901595"
                    className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    onClick={() => metrikaEvents.phoneClick()}
                  >
                    <Phone className="w-4 h-4" />
                    Позвонить
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
