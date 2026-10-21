import { describe, it, expect } from '@jest/globals';
import { slugify, isSlugUniqueCandidate } from '../src/lib/utils/slugify';
import { portfolioHref, isLegacyPortfolioId } from '../src/lib/seo/portfolioUrl';
import { buildPortfolioImageAlt } from '../src/lib/seo/portfolioAlt';

describe('slugify (ЧТЗ SEO P1 2.5)', () => {
  it('should transliterate russian title to slug', () => {
    expect(slugify('Забор из профнастила')).toBe('zabor-iz-profnastila');
  });

  it('should handle punctuation and spaces', () => {
    expect(slugify('Навес 6×4 — Жуковский!')).toBe('naves-6-4-zhukovskij');
  });

  it('should collapse multiple dashes and trim edges', () => {
    expect(slugify('  --Забор--из--штакетника--  ')).toBe('zabor-iz-shtaketnika');
  });

  it('should fallback when nothing left after translit', () => {
    expect(slugify('!!!')).toBe('portfolio-item');
    expect(slugify('')).toBe('portfolio-item');
  });

  it('should be deterministic (no Math.random)', () => {
    expect(slugify('Забор под ключ')).toBe(slugify('Забор под ключ'));
  });

  it('should limit length to 80 chars', () => {
    const long = slugify('а'.repeat(200));
    expect(long.length).toBeLessThanOrEqual(80);
  });
});

describe('isSlugUniqueCandidate', () => {
  it('should accept valid slug', () => {
    expect(isSlugUniqueCandidate('zabor-iz-profnastila')).toBe(true);
  });

  it('should reject uppercase, underscores, leading dash', () => {
    expect(isSlugUniqueCandidate('Zabor')).toBe(false);
    expect(isSlugUniqueCandidate('zabor_iz')).toBe(false);
    expect(isSlugUniqueCandidate('-zabor')).toBe(false);
  });
});

describe('portfolioHref (ЧТЗ SEO P1 2.5)', () => {
  it('should prefer slug URL', () => {
    expect(portfolioHref({ id: 'cmc123', slug: 'zabor-v-zhukovskom' })).toBe('/portfolio/zabor-v-zhukovskom');
  });

  it('should fall back to id when slug is null (before backfill)', () => {
    expect(portfolioHref({ id: 'cmc123', slug: null })).toBe('/portfolio/cmc123');
    expect(portfolioHref({ id: 'cmc123', slug: undefined })).toBe('/portfolio/cmc123');
  });
});

describe('isLegacyPortfolioId', () => {
  it('should detect cuid', () => {
    expect(isLegacyPortfolioId('cmob5y454000cd1ofoowairl2')).toBe(true);
  });

  it('should detect UUID', () => {
    expect(isLegacyPortfolioId('05c85312-227b-400f-b6fd-3b2a245cd87d')).toBe(true);
    expect(isLegacyPortfolioId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('should NOT treat slugs as legacy ids', () => {
    expect(isLegacyPortfolioId('zabor-iz-evroshtaketnika-pod-klyuch')).toBe(false);
    expect(isLegacyPortfolioId('naves-6-na-4')).toBe(false);
  });
});

describe('buildPortfolioImageAlt (ЧТЗ SEO P2 3.1)', () => {
  const item = {
    title: 'Забор из профнастила на 15 соток',
    category: 'fence',
    fenceType: 'забор из профнастила',
    city: 'Жуковском',
  };

  it('should follow ЧТЗ template', () => {
    expect(buildPortfolioImageAlt(item)).toBe(
      'Забор из профнастила на 15 соток — забор из профнастила в Жуковском | Заборы и Навесы'
    );
  });

  it('should fall back to type when fenceType missing', () => {
    expect(buildPortfolioImageAlt({ ...item, fenceType: null, type: 'евроштакетник' })).toContain('евроштакетник');
  });

  it('should fall back to category label when both missing', () => {
    const alt = buildPortfolioImageAlt({ title: 'T', category: 'canopy' });
    expect(alt).toContain('навес');
  });

  it('should use default place when city missing', () => {
    const alt = buildPortfolioImageAlt({ title: 'T', category: 'fence', fenceType: 'забор' });
    expect(alt).toContain('в Москве и МО');
  });

  it('should append photo number for index > 0', () => {
    expect(buildPortfolioImageAlt(item, 1)).toContain('фото 2');
    expect(buildPortfolioImageAlt(item, 0)).not.toContain('фото');
  });
});
