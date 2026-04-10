import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { SEO_CONFIG } from '@/lib/seo/constants';
import { Calculator, ArrowRight } from 'lucide-react';

export const revalidate = 3600;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    select: { title: true, seoTitle: true, seoDescription: true, seoKeywords: true, coverImage: true },
  });

  if (!post) return {};

  return generatePageMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || SEO_CONFIG.DEFAULT_DESCRIPTION,
    keywords: post.seoKeywords ? post.seoKeywords.split(',').map(k => k.trim()) : [],
    path: `/blog/${slug}`,
    ogImage: post.coverImage || undefined,
  });
}

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true },
  });

  return posts.map((post) => ({ slug: post.slug }));
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
  });

  if (!post) {
    notFound();
  }

  const content =
    typeof post.content === 'string'
      ? JSON.parse(post.content)
      : post.content;

  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      published: true,
      slug: { not: slug },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      createdAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs
              items={[
                { label: 'Блог', href: '/blog' },
                { label: post.title },
              ]}
            />
          </div>
        </section>

        <article className="py-8 px-4">
          <div className="container mx-auto max-w-4xl">
            {post.coverImage && (
              <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {post.title}
            </h1>

            <time className="text-sm text-muted-foreground block mb-8">
              {new Date(post.createdAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>

            <div className="prose prose-lg max-w-none mb-12">
              {Array.isArray(content) &&
                content.map(
                  (block: { type: string; text: string }, index: number) => {
                    if (block.type === 'heading') {
                      return (
                        <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
                          {block.text}
                        </h2>
                      );
                    }
                    return (
                      <p key={index} className="text-muted-foreground leading-relaxed mb-4">
                        {block.text}
                      </p>
                    );
                  }
                )}
            </div>
          </div>
        </article>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Рассчитать стоимость забора
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Онлайн-калькулятор — точный расчёт за несколько секунд
            </p>
            <Link
              href="/calculator"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
            >
              <Calculator className="w-5 h-5" />
              Рассчитать стоимость
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {relatedPosts.length > 0 && (
          <section className="py-16 px-4">
            <div className="container mx-auto">
              <h2 className="text-2xl font-bold mb-8">Читайте также</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/blog/${related.slug}`}
                    className="group block rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    {related.coverImage && (
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={related.coverImage}
                          alt={related.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      {related.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {related.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
