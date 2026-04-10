import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { prisma } from '@/lib/prisma';

interface BlogPostMetadataProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostMetadataProps): Promise<Metadata> {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    select: { title: true, seoTitle: true, seoDescription: true, seoKeywords: true, coverImage: true },
  });

  if (!post) {
    return generatePageMetadata({
      title: 'Статья не найдена',
      description: 'Статья не найдена',
      path: `/blog/${slug}`,
    });
  }

  return generatePageMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || '',
    keywords: post.seoKeywords ? post.seoKeywords.split(',') : [],
    path: `/blog/${slug}`,
    ogImage: post.coverImage || '/og/og-main.jpg',
  });
}
