import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

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
