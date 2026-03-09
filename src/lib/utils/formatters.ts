export function formatDimension(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toFixed(1);
}

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
}

export function formatSection(width: number | null | undefined, height: number | null | undefined): string {
  if (width === null || width === undefined || height === null || height === undefined) return '-';
  return `${width.toFixed(0)}x${height.toFixed(0)}`;
}

export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toFixed(0);
}
