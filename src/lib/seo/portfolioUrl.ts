export { buildPortfolioImageAlt } from './portfolioAlt';

/**
 * ЧТЗ SEO P1 2.5: ссылки портфолио ведут на slug-URL;
 * пока элемент не прошел бэкфилл (slug === null) — безопасный фолбэк на id.
 */
export function portfolioHref(item: { id: string; slug?: string | null }): string {
  return item.slug ? `/portfolio/${item.slug}` : `/portfolio/${item.id}`;
}

/**
 * Старые проиндексированные URL — это cuid (cmc7x2z1q0001...) или UUID
 * (550e8400-e29b-41d4-...). Если роут [slug] получил такой параметр —
 * ищем по id и делаем 308-редирект на slug.
 */
const CUID_PATTERN = /^c[a-z0-9]{20,30}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isLegacyPortfolioId(param: string): boolean {
  return CUID_PATTERN.test(param) || UUID_PATTERN.test(param);
}
