import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import PortfolioClient from '@/components/portfolio/PortfolioClient';

export const revalidate = 300;

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  type?: string;
  description?: string;
  images: string[];
}

async function getPortfolioItems(): Promise<PortfolioItem[]> {
  try {
    const items = await prisma.portfolioItem.findMany({
      where: { active: true },
      select: {
        id: true,
        title: true,
        category: true,
        type: true,
        description: true,
        images: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
    return items.map((item) => ({
      ...item,
      type: item.type ?? undefined,
      description: item.description ?? undefined,
      images: item.images as string[],
    }));
  } catch {
    return [];
  }
}

export default async function PortfolioPage() {
  const items = await getPortfolioItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <Breadcrumbs items={[{ label: 'Портфолио' }]} />
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-900">Портфолио</h1>
        <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Примеры наших работ выполненных с высоким качеством
        </p>

        <PortfolioClient items={items} />
      </main>

      <Footer />
    </div>
  );
}
