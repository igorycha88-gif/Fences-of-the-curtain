import { describe, it, expect } from '@jest/globals';

/**
 * Тест данных seed SEO-статей блога (ЧТЗ_SEO_расширение_Wordstat, TASK-BCK-001).
 * Проверяем структуру и контент до запуска против БД (идемпотентность обеспечивает upsert по slug).
 */
describe('seoBlogPosts seed — статьи блога по кластерам Wordstat', () => {
  it('модуль экспортирует seedSeoBlogPosts', async () => {
    const mod = await import('../prisma/seeds/seoBlogPosts');
    expect(typeof mod.seedSeoBlogPosts).toBe('function');
  });

  it('3 статьи с корректными slug, SEO-полями и контентом формата blocks[]', async () => {
    const { POSTS } = (await import('../prisma/seeds/seoBlogPosts')) as unknown as {
      POSTS: {
        slug: string;
        title: string;
        seoTitle: string;
        seoDescription: string;
        seoKeywords: string;
        excerpt: string;
        published?: boolean;
        content: { type: string; text: string }[];
      }[];
    };

    expect(POSTS.length).toBe(3);

    const slugs = POSTS.map((post) => post.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        'otkatnye-vorota-svoimi-rukami',
        'zabor-iz-proflista-svoimi-rukami',
        'kakoy-zabor-vybrat',
      ])
    );
    expect(new Set(slugs).size).toBe(3);

    for (const post of POSTS) {
      expect(post.title.length).toBeGreaterThan(10);
      expect(post.seoTitle.length).toBeGreaterThan(20);
      expect(post.seoDescription.length).toBeGreaterThan(50);
      expect(post.seoKeywords).toContain(',');
      expect(post.excerpt.length).toBeGreaterThan(50);
      expect(Array.isArray(post.content)).toBe(true);
      expect(post.content.length).toBeGreaterThan(5);

      const headings = post.content.filter((block) => block.type === 'heading');
      expect(headings.length).toBeGreaterThanOrEqual(3);

      for (const block of post.content) {
        expect(['heading', 'paragraph']).toContain(block.type);
        expect(block.text.length).toBeGreaterThan(0);
      }
    }
  });

  it('статья «откатные ворота своими руками» покрывает кластер: инструкция, чертежи, калитка, ошибки', async () => {
    const { POSTS } = (await import('../prisma/seeds/seoBlogPosts')) as unknown as {
      POSTS: { slug: string; content: { text: string }[] }[];
    };
    const post = POSTS.find((p) => p.slug === 'otkatnye-vorota-svoimi-rukami');
    expect(post).toBeDefined();

    const text = post!.content.map((b) => b.text).join(' ');
    expect(text).toMatch(/чертёж|чертеж/i);
    expect(text).toMatch(/противовес/);
    expect(text).toMatch(/калитк/);
    expect(text).toMatch(/ошибк/);
    expect(text).toMatch(/фундамент/);
  });

  it('статьи содержат перелинковку на посадочные (CTA-текст)', async () => {
    const { POSTS } = (await import('../prisma/seeds/seoBlogPosts')) as unknown as {
      POSTS: { slug: string; content: { text: string }[] }[];
    };

    const vorota = POSTS.find((p) => p.slug === 'otkatnye-vorota-svoimi-rukami')!;
    expect(vorota.content.map((b) => b.text).join(' ')).toMatch(/калькулятор/);

    const zabor = POSTS.find((p) => p.slug === 'zabor-iz-proflista-svoimi-rukami')!;
    expect(zabor.content.map((b) => b.text).join(' ')).toMatch(/калькулятор/);

    const kakoy = POSTS.find((p) => p.slug === 'kakoy-zabor-vybrat')!;
    expect(kakoy.content.map((b) => b.text).join(' ')).toMatch(/калькулятор/);
  });
});
