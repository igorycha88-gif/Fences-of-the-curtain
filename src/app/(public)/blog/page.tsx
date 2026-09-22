import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default async function BlogListPage() {
  const [posts] = await Promise.all([
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24">
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
          <div className="container mx-auto relative z-10">
            <Breadcrumbs items={[{ label: 'Блог' }]} />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Статьи о заборах и навесах
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Полезные советы по выбору материалов, установке и уходу за заборами и навесами
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            {/* Статичная статья-хаб (ЧТЗ v5 TASK-ZN-05) — карточка выше DB-постов */}
            <div className="mb-8" data-testid="featured-hub-card">
              <Link
                href="/blog/zabor-na-6-sotkah"
                className="group block rounded-2xl border-2 border-primary/30 bg-card overflow-hidden hover:shadow-lg hover:border-primary/60 transition-all duration-300"
              >
                <div className="p-6">
                  <span className="inline-block text-xs font-semibold text-primary mb-2">
                    Полный гид · 6 соток
                  </span>
                  <h2 className="text-xl md:text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    Забор на 6 сотках: сколько метров, сколько стоит, материалы — полный гид 2026
                  </h2>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    Периметр при разных пропорциях участка, цены под ключ по материалам,
                    поэтапный монтаж за 1 день и частые вопросы дачников.
                  </p>
                  <time className="text-xs text-muted-foreground">15 сентября 2026</time>
                </div>
              </Link>
            </div>
            {posts.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                Статей пока нет
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group block rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    {post.coverImage && (
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                          {post.excerpt}
                        </p>
                      )}
                      <time className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
