/**
 * ЧТЗ SEO P2 3.1: описательные alt-тексты изображений портфолио.
 * Шаблон из ЧТЗ: «{title} — {тип_ограждения} в {город} | Заборы и Навесы»
 */

export interface PortfolioAltInput {
  title: string;
  category: string;
  type?: string | null;
  fenceType?: string | null;
  city?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  fence: 'забор',
  canopy: 'навес',
  garage: 'гараж',
};

const DEFAULT_PLACE = 'в Москве и МО';

export function buildPortfolioImageAlt(item: PortfolioAltInput, photoIndex?: number): string {
  const fenceType = item.fenceType || item.type || CATEGORY_LABELS[item.category] || 'ограждение';
  const place = item.city ? `в ${item.city}` : DEFAULT_PLACE;
  const base = `${item.title} — ${fenceType} ${place} | Заборы и Навесы`;
  return typeof photoIndex === 'number' && photoIndex > 0 ? `${base}, фото ${photoIndex + 1}` : base;
}
