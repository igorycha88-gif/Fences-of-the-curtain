import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { prisma } from '@/lib/prisma';

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;

  const page = await prisma.pageContent.findFirst({
    where: {
      slug,
      category: { not: null },
      isActive: true,
    },
  });

  if (!page) {
    return generatePageMetadata({
      title: 'Страница не найдена',
      description: 'Страница не найдена',
      path: `/services/${slug}`,
      noIndex: true,
    });
  }

  return generatePageMetadata({
    title: page.seoTitle || page.title,
    description: page.seoDescription || '',
    keywords: page.seoKeywords ? page.seoKeywords.split(',') : [],
    path: `/services/${slug}`,
    ogImage: page.coverImage || undefined,
  });
}
