/**
 * ЧТЗ SEO P1 2.5: генерация ЧПУ-slug из русского заголовка (транслитерация).
 * Детерминированная (без Math.random) — безопасно для ISR.
 */

const TRANSLIT_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
};

const MAX_SLUG_LENGTH = 80;
const FALLBACK_SLUG = 'portfolio-item';

export function slugify(input: string): string {
  const translit = input
    .toLowerCase()
    .split('')
    .map((char) => TRANSLIT_MAP[char] ?? char)
    .join('');

  const slug = translit
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');

  return slug || FALLBACK_SLUG;
}

export function isSlugUniqueCandidate(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= MAX_SLUG_LENGTH;
}
