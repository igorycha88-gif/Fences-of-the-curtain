import DOMPurify from 'isomorphic-dompurify';

const SVG_ALLOWED_TAGS = [
  'svg', 'path', 'line', 'circle', 'rect', 'text', 'g', 'polyline', 'polygon',
  'defs', 'marker', 'title', 'desc', 'tspan', 'linearGradient', 'stop',
  'ellipse', 'clippath', 'image', 'use', 'symbol', 'foreignobject',
];

const SVG_ALLOWED_ATTR = [
  'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'width', 'height', 'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width',
  'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'transform',
  'id', 'class', 'style', 'marker-start', 'marker-end', 'marker-mid',
  'markerWidth', 'markerHeight', 'refX', 'refY', 'orient', 'offset',
  'stop-color', 'stop-opacity', 'font-size', 'font-family', 'text-anchor',
  'dominant-baseline', 'fill-opacity', 'stroke-opacity', 'opacity',
  'points', 'preserveAspectRatio', 'href', 'gradientUnits',
  'color', 'font-weight', 'letter-spacing',
];

export function sanitizeSvg(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: SVG_ALLOWED_TAGS,
    ALLOWED_ATTR: SVG_ALLOWED_ATTR,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onload', 'onclick', 'onerror', 'onmouseover', 'onfocus', 'onblur'],
  });
}

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeHtml(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) => 
        typeof item === 'string' ? sanitizeHtml(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item) : item
      );
    }
  }
  
  return sanitized;
}
