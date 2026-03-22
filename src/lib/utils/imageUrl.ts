export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  return url.startsWith('/') ? url : '/' + url;
}

export function getThumbnailUrl(url: string): string {
  if (!url) return '';
  const normalizedUrl = normalizeImageUrl(url);
  return normalizedUrl.replace(/(\.\w+)$/, '_thumb$1');
}