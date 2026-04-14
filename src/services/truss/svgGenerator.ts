import { TrussGeometryResult, CanopyRoofType } from './types';

const SVG_WIDTH = 900;
const SVG_HEIGHT = 500;
const PADDING = 100;

function toSvgCoord(x: number, y: number, scale: number, maxY: number): { sx: number; sy: number } {
  return {
    sx: PADDING + x * scale,
    sy: SVG_HEIGHT - PADDING - y * scale,
  };
}

export function generateTrussSvg(geometry: TrussGeometryResult, canopyType: CanopyRoofType): string {
  const { nodes, members, span, ridgeHeight, wallHeight, panelLength, panelCount } = geometry;

  const maxX = span;
  const maxY = Math.max(ridgeHeight, wallHeight);
  const availW = SVG_WIDTH - 2 * PADDING;
  const availH = SVG_HEIGHT - 2 * PADDING;
  const scaleX = availW / maxX;
  const scaleY = availH / maxY;
  const scale = Math.min(scaleX, scaleY);

  const svgNodes = nodes.map(n => ({
    ...n,
    ...toSvgCoord(n.x, n.y, scale, maxY),
  }));

  const lines: string[] = [];

  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" style="background:#fff;font-family:'DejaVu Sans',Arial,Helvetica,sans-serif">`);

  lines.push(`<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="white"/>`);

  lines.push(`<text x="${SVG_WIDTH / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e293b">Схема фермы — ${getCanopyTypeName(canopyType)}</text>`);

  const memberColors: Record<string, string> = {
    bottom_chord: '#1e40af',
    top_chord: '#1e40af',
    vertical: '#059669',
    diagonal: '#dc2626',
  };
  const memberWidths: Record<string, number> = {
    bottom_chord: 3,
    top_chord: 3,
    vertical: 2,
    diagonal: 2,
  };

  for (const member of members) {
    const start = svgNodes.find(n => n.id === member.startNodeId);
    const end = svgNodes.find(n => n.id === member.endNodeId);
    if (!start || !end) continue;

    const color = memberColors[member.type] || '#6b7280';
    const width = memberWidths[member.type] || 2;

    lines.push(`<line x1="${start.sx}" y1="${start.sy}" x2="${end.sx}" y2="${end.sy}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`);
  }

  for (const node of svgNodes) {
    const color = node.type === 'ridge' ? '#f59e0b' : '#1e40af';
    const r = node.type === 'ridge' ? 5 : 3;
    lines.push(`<circle cx="${node.sx}" cy="${node.sy}" r="${r}" fill="${color}"/>`);
  }

  const firstBottom = svgNodes.find(n => n.type === 'bottom');
  const lastBottom = svgNodes.filter(n => n.type === 'bottom').slice(-1)[0];
  if (firstBottom && lastBottom) {
    const dimY = Math.max(firstBottom.sy, lastBottom.sy) + 40;
    lines.push(drawDimensionLine(firstBottom.sx, dimY, lastBottom.sx, dimY, `${span} мм`));
  }

  const firstTop = svgNodes.find(n => n.type === 'top');
  const ridgeNode = svgNodes.find(n => n.type === 'ridge');
  const lastTop = svgNodes.filter(n => n.type === 'top' || n.type === 'ridge').slice(-1)[0];

  if (firstTop) {
    const dimX = Math.min(firstTop.sx, lastTop ? lastTop.sx : firstTop.sx) - 50;
    lines.push(drawDimensionLine(dimX, firstTop.sy, dimX, firstBottom ? firstBottom.sy : firstTop.sy + 100, `${Math.round(firstTop.y)} мм`, true));
  }

  if (ridgeNode && firstBottom) {
    const dimX = ridgeNode.sx + 50;
    const corrBottom = svgNodes.find(n => n.type === 'bottom' && Math.abs(n.x - ridgeNode.x) < panelLength * 0.5);
    if (corrBottom) {
      lines.push(drawDimensionLine(dimX, ridgeNode.sy, dimX, corrBottom.sy, `${Math.round(ridgeNode.y)} мм`, true));
    }
  }

  if (canopyType === 'SINGLE_SLOPE' || canopyType === 'SINGLE_SLOPE_CURVED') {
    const leftTop = svgNodes.find(n => n.type === 'top');
    const rightTop = svgNodes.filter(n => n.type === 'top' || n.type === 'ridge').slice(-1)[0];
    if (leftTop && rightTop) {
      const angle = geometry.slopeAngle;
      const midX = (leftTop.sx + rightTop.sx) / 2;
      const midY = (leftTop.sy + rightTop.sy) / 2 - 15;
      lines.push(`<text x="${midX}" y="${midY}" text-anchor="middle" font-size="11" fill="#6b7280">α=${angle}°</text>`);
    }
  }

  if (canopyType === 'DOUBLE_SLOPE') {
    if (ridgeNode) {
      const leftTop = svgNodes.filter(n => n.type === 'top').slice(-1)[0];
      if (leftTop) {
        lines.push(`<text x="${(leftTop.sx + ridgeNode.sx) / 2}" y="${(leftTop.sy + ridgeNode.sy) / 2 - 12}" text-anchor="middle" font-size="11" fill="#6b7280">α=${geometry.slopeAngle}°</text>`);
      }
    }
  }

  const legendY = SVG_HEIGHT - 30;
  const legendItems = [
    { color: '#1e40af', label: 'Пояса фермы' },
    { color: '#059669', label: 'Вертикальные стойки' },
    { color: '#dc2626', label: 'Диагональные раскосы' },
    { color: '#f59e0b', label: 'Коньковый узел' },
  ];
  legendItems.forEach((item, i) => {
    const lx = 30 + i * 200;
    lines.push(`<rect x="${lx}" y="${legendY - 10}" width="16" height="16" fill="${item.color}" rx="2"/>`);
    lines.push(`<text x="${lx + 22}" y="${legendY + 3}" font-size="11" fill="#374151">${item.label}</text>`);
  });

  const scaleMm = 1000;
  const scalePx = scaleMm * scale;
  lines.push(`<text x="${SVG_WIDTH - PADDING}" y="${legendY + 3}" text-anchor="end" font-size="11" fill="#6b7280">Масштаб: ${scalePx.toFixed(0)}px = 1м</text>`);

  lines.push(`<text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - 5}" text-anchor="middle" font-size="10" fill="#94a3b8">Шаг перемычек: ${Math.round(panelLength)} мм | Количество панелей: ${panelCount}</text>`);

  lines.push('</svg>');
  return lines.join('\n');
}

function drawDimensionLine(x1: number, y1: number, x2: number, y2: number, label: string, vertical = false): string {
  const parts: string[] = [];
  const arrowSize = 6;

  parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6b7280" stroke-width="1"/>`);

  if (vertical) {
    parts.push(`<polygon points="${x1},${y1} ${x1 - arrowSize / 2},${y1 + arrowSize} ${x1 + arrowSize / 2},${y1 + arrowSize}" fill="#6b7280"/>`);
    parts.push(`<polygon points="${x2},${y2} ${x2 - arrowSize / 2},${y2 - arrowSize} ${x2 + arrowSize / 2},${y2 - arrowSize}" fill="#6b7280"/>`);
    const midY = (y1 + y2) / 2;
    parts.push(`<text x="${x1 + 8}" y="${midY}" font-size="11" fill="#374151" transform="rotate(-90,${x1 + 8},${midY})" text-anchor="middle">${label}</text>`);
  } else {
    parts.push(`<polygon points="${x1},${y1} ${x1 + arrowSize},${y1 - arrowSize / 2} ${x1 + arrowSize},${y1 + arrowSize / 2}" fill="#6b7280"/>`);
    parts.push(`<polygon points="${x2},${y2} ${x2 - arrowSize},${y2 - arrowSize / 2} ${x2 - arrowSize},${y2 + arrowSize / 2}" fill="#6b7280"/>`);
    const midX = (x1 + x2) / 2;
    parts.push(`<text x="${midX}" y="${y1 - 8}" text-anchor="middle" font-size="11" fill="#374151">${label}</text>`);
  }

  return parts.join('\n');
}

function getCanopyTypeName(type: CanopyRoofType): string {
  switch (type) {
    case 'SINGLE_SLOPE': return 'Односкатная';
    case 'DOUBLE_SLOPE': return 'Двухскатная';
    case 'ARCH': return 'Арочная';
    case 'SINGLE_SLOPE_CURVED': return 'Односкатная в дуге';
  }
}
