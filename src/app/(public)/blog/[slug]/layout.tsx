import React from 'react';
import JsonLdScript from '@/components/seo/JsonLdScript';
import { generateBreadcrumbJsonLd, generateArticleJsonLd } from '@/lib/seo/jsonld';
import { prisma } from '@/lib/prisma';

interface BlogSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function BlogSlugLayout({
  children,
  params,
}: BlogSlugLayoutProps) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    select: { title: true, excerpt: true, coverImage: true, createdAt: true },
  });

  const postTitle = post?.title || 'Статья';

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Главная', url: '/' },
    { name: 'Блог', url: '/blog' },
    { name: postTitle },
  ]);

  const articleJsonLd = generateArticleJsonLd(
    postTitle,
    post?.excerpt || '',
    `/blog/${slug}`,
    post?.coverImage || undefined,
    post?.createdAt?.toISOString()
  );

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, articleJsonLd]} />
      {children}
    </>
  );
}
