import { TrussGeometryResult, CanopyRoofType, TrussNode, TrussMember } from './types';

const SVG_WIDTH = 900;
const SVG_HEIGHT = 500;
const PADDING = 100;

interface TextLabel {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  anchor: string;
  fill: string;
  fontWeight?: string;
}

function toSvgCoord(x: number, y: number, scale: number, maxY: number): { sx: number; sy: number } {
  return {
    sx: PADDING + x * scale,
    sy: SVG_HEIGHT - PADDING - y * scale,
  };
}

function rectsOverlap(a: TextLabel, b: TextLabel, margin: number): boolean {
  return !(a.x + a.width / 2 + margin < b.x - b.width / 2 - margin ||
           a.x - a.width / 2 - margin > b.x + b.width / 2 + margin ||
           a.y + a.height / 2 + margin < b.y - b.height / 2 - margin ||
           a.y - a.height / 2 - margin > b.y + b.height / 2 + margin);
}

function resolveOverlaps(labels: TextLabel[], obstacles: TextLabel[] = [], maxIterations: number = 50): void {
  const step = 10;
  const margin = 3;

  const collides = (label: TextLabel, excludeIdx: number): boolean => {
    for (let k = 0; k < labels.length; k++) {
      if (k !== excludeIdx && rectsOverlap(label, labels[k], margin)) return true;
    }
    for (const obs of obstacles) {
      if (rectsOverlap(label, obs, margin)) return true;
    }
    return false;
  };

  const pushDirections = [
    { dx: 0, dy: -step },
    { dx: 0, dy: step },
    { dx: -step, dy: 0 },
    { dx: step, dy: 0 },
    { dx: -step * 0.7, dy: -step * 0.7 },
    { dx: step * 0.7, dy: -step * 0.7 },
    { dx: -step * 0.7, dy: step * 0.7 },
    { dx: step * 0.7, dy: step * 0.7 },
  ];

  const tryMove = (idx: number) => {
    for (const dir of pushDirections) {
      const origX = labels[idx].x;
      const origY = labels[idx].y;
      labels[idx].x += dir.dx;
      labels[idx].y += dir.dy;
      if (!collides(labels[idx], idx)) return;
      labels[idx].x = origX;
      labels[idx].y = origY;
    }
  };

  for (let iter = 0; iter < maxIterations; iter++) {
    let hasOverlap = false;

    for (let j = 0; j < labels.length; j++) {
      for (const obs of obstacles) {
        if (rectsOverlap(labels[j], obs, margin)) {
          hasOverlap = true;
          tryMove(j);
        }
      }
    }

    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        if (rectsOverlap(labels[i], labels[j], margin)) {
          hasOverlap = true;
          tryMove(j);
        }
      }
    }

    if (!hasOverlap) break;
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function generateTrussSvg(geometry: TrussGeometryResult, canopyType: CanopyRoofType): string {
  const { nodes, members, span, ridgeHeight, wallHeight, panelLength, panelCount, edgeAngles } = geometry;

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
  const labels: TextLabel[] = [];

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

  if (firstTop && firstBottom) {
    const dimX = Math.min(firstTop.sx, lastTop ? lastTop.sx : firstTop.sx) - 55;
    lines.push(drawDimensionLine(dimX, firstTop.sy, dimX, firstBottom.sy, `${Math.round(firstTop.y)} мм`, true));
  }

  if (ridgeNode && firstBottom) {
    const dimX = ridgeNode.sx + 55;
    const corrBottom = svgNodes.find(n => n.type === 'bottom' && Math.abs(n.x - ridgeNode.x) < panelLength * 0.5);
    if (corrBottom) {
      lines.push(drawDimensionLine(dimX, ridgeNode.sy, dimX, corrBottom.sy, `${Math.round(ridgeNode.y)} мм`, true));
    }
  }

  if (edgeAngles) {
    const leftTopNode = svgNodes.find(n => n.type === 'top');
    const leftBottomNode = svgNodes.find(n => n.type === 'bottom');
    if (leftTopNode && leftBottomNode && edgeAngles.leftAngle > 0) {
      addLabel(labels, leftTopNode.sx + 10, leftTopNode.sy - 14, `α=${edgeAngles.leftAngle}°`, 11, 'start', '#1e40af', 'bold');
    }

    const rightTopNode = svgNodes.filter(n => n.type === 'top' || n.type === 'ridge').slice(-1)[0];
    const rightBottomNode = svgNodes.filter(n => n.type === 'bottom').slice(-1)[0];
    if (rightTopNode && rightBottomNode && edgeAngles.rightAngle !== undefined && edgeAngles.rightAngle > 0) {
      addLabel(labels, rightTopNode.sx - 10, rightTopNode.sy - 14, `α=${edgeAngles.rightAngle}°`, 11, 'end', '#1e40af', 'bold');
    }
  }

  if (canopyType === 'SINGLE_SLOPE' || canopyType === 'SINGLE_SLOPE_CURVED') {
    const leftTop = svgNodes.find(n => n.type === 'top');
    const rightTop = svgNodes.filter(n => n.type === 'top' || n.type === 'ridge').slice(-1)[0];
    if (leftTop && rightTop) {
      const angle = geometry.slopeAngle;
      const midX = (leftTop.sx + rightTop.sx) / 2;
      const midY = (leftTop.sy + rightTop.sy) / 2 - 15;
      addLabel(labels, midX, midY, `уклон=${angle}°`, 11, 'middle', '#1e40af');
    }
  }

  if (canopyType === 'DOUBLE_SLOPE') {
    if (ridgeNode) {
      const leftTop = svgNodes.filter(n => n.type === 'top').slice(-1)[0];
      if (leftTop) {
        addLabel(labels, (leftTop.sx + ridgeNode.sx) / 2, (leftTop.sy + ridgeNode.sy) / 2 - 14, `уклон=${geometry.slopeAngle}°`, 11, 'middle', '#1e40af');
      }
    }
  }

  for (const member of members) {
    if (member.type === 'diagonal' && member.diagonalAngles) {
      const start = svgNodes.find(n => n.id === member.startNodeId);
      const end = svgNodes.find(n => n.id === member.endNodeId);
      if (!start || !end) continue;

      const midX = (start.sx + end.sx) / 2;
      const midY = (start.sy + end.sy) / 2;
      const offsetY = start.sy > end.sy ? -12 : 12;
      const offsetX = start.sx < end.sx ? 8 : -8;

      const txt = `β₁=${member.diagonalAngles.angleToBottomChord}° β₂=${member.diagonalAngles.angleToTopChord}°`;
      addLabel(labels, midX + offsetX, midY + offsetY, txt, 7, 'middle', '#dc2626');
    }
  }

  for (const member of members) {
    if (member.type === 'vertical' && member.cutAngles) {
      const start = svgNodes.find(n => n.id === member.startNodeId);
      const end = svgNodes.find(n => n.id === member.endNodeId);
      if (!start || !end) continue;

      const midX = (start.sx + end.sx) / 2;
      const midY = (start.sy + end.sy) / 2;
      const offsetX = 20;

      const txt = `γ₁=${member.cutAngles.bottomCutAngle}° γ₂=${member.cutAngles.topCutAngle}°`;
      addLabel(labels, midX + offsetX, midY + 3, txt, 7, 'start', '#059669');
    }
  }

  const bottomNodes = svgNodes.filter(n => n.type === 'bottom');
  if (bottomNodes.length >= 2) {
    const first = bottomNodes[0];
    const last = bottomNodes[bottomNodes.length - 1];
    addLabel(labels, (first.sx + last.sx) / 2, first.sy + 18, 'НП-1', 8, 'middle', '#1e40af', 'bold');
  }

  const topNodes = svgNodes.filter(n => n.type === 'top' || n.type === 'ridge');
  if (canopyType === 'DOUBLE_SLOPE') {
    const rn = svgNodes.find(n => n.type === 'ridge');
    if (rn) {
      const leftTopNodes = topNodes.filter(n => n.sx <= rn.sx);
      const rightTopNodes = topNodes.filter(n => n.sx > rn.sx);
      if (leftTopNodes.length >= 2) {
        const minX = Math.min(...leftTopNodes.map(n => n.sx));
        const maxX = Math.max(...leftTopNodes.map(n => n.sx));
        const minY = Math.min(...leftTopNodes.map(n => n.sy));
        addLabel(labels, (minX + maxX) / 2, minY - 12, 'ВП-1', 8, 'middle', '#1e40af', 'bold');
      }
      if (rightTopNodes.length >= 2) {
        const minX = Math.min(...rightTopNodes.map(n => n.sx));
        const maxX = Math.max(...rightTopNodes.map(n => n.sx));
        const minY = Math.min(...rightTopNodes.map(n => n.sy));
        addLabel(labels, (minX + maxX) / 2, minY - 12, 'ВП-2', 8, 'middle', '#1e40af', 'bold');
      }
    }
  } else {
    if (topNodes.length >= 2) {
      const minX = Math.min(...topNodes.map(n => n.sx));
      const maxX = Math.max(...topNodes.map(n => n.sx));
      const minY = Math.min(...topNodes.map(n => n.sy));
      addLabel(labels, (minX + maxX) / 2, minY - 12, 'ВП-1', 8, 'middle', '#1e40af', 'bold');
    }
  }

  const verticalMembers = members.filter(m => m.type === 'vertical').sort((a, b) => a.id - b.id);
  let vIdx = 0;
  for (const member of verticalMembers) {
    const start = svgNodes.find(n => n.id === member.startNodeId);
    const end = svgNodes.find(n => n.id === member.endNodeId);
    if (!start || !end) continue;
    const midX = (start.sx + end.sx) / 2;
    const midY = (start.sy + end.sy) / 2;
    addLabel(labels, midX - 28, midY + 3, `С${++vIdx}`, 7, 'end', '#059669', 'bold');
  }

  const diagonalMembers = members.filter(m => m.type === 'diagonal').sort((a, b) => a.id - b.id);
  let dIdx = 0;
  for (const member of diagonalMembers) {
    const start = svgNodes.find(n => n.id === member.startNodeId);
    const end = svgNodes.find(n => n.id === member.endNodeId);
    if (!start || !end) continue;
    const midX = (start.sx + end.sx) / 2;
    const midY = (start.sy + end.sy) / 2;
    const offsetY = start.sy < end.sy ? 10 : -6;
    addLabel(labels, midX, midY + offsetY, `Р${++dIdx}`, 7, 'middle', '#dc2626', 'bold');
  }

  for (const label of labels) {
    label.width = label.text.length * label.fontSize * 0.52;
    label.height = label.fontSize + 4;
  }

  const obstacles: TextLabel[] = [];
  const segPad = 6;
  for (const member of members) {
    const start = svgNodes.find(n => n.id === member.startNodeId);
    const end = svgNodes.find(n => n.id === member.endNodeId);
    if (!start || !end) continue;
    const left = Math.min(start.sx, end.sx) - segPad;
    const right = Math.max(start.sx, end.sx) + segPad;
    const top = Math.min(start.sy, end.sy) - segPad;
    const bottom = Math.max(start.sy, end.sy) + segPad;
    obstacles.push({
      x: (left + right) / 2, y: (top + bottom) / 2,
      width: right - left, height: bottom - top,
      text: '', fontSize: 0, anchor: 'middle', fill: '',
    });
  }

  for (const node of svgNodes) {
    const r = node.type === 'ridge' ? 8 : 6;
    obstacles.push({
      x: node.sx, y: node.sy, width: r * 2, height: r * 2,
      text: '', fontSize: 0, anchor: 'middle', fill: '',
    });
  }

  const legendTop = SVG_HEIGHT - 55;
  obstacles.push({
    x: SVG_WIDTH / 2, y: (legendTop + SVG_HEIGHT) / 2,
    width: SVG_WIDTH, height: SVG_HEIGHT - legendTop,
    text: '', fontSize: 0, anchor: 'middle', fill: '',
  });

  resolveOverlaps(labels, obstacles);

  for (const label of labels) {
    const weight = label.fontWeight ? ` font-weight="${label.fontWeight}"` : '';
    lines.push(`<text x="${label.x}" y="${label.y}" text-anchor="${label.anchor}" font-size="${label.fontSize}"${weight} fill="${label.fill}">${escapeXml(label.text)}</text>`);
  }

  const legendY = SVG_HEIGHT - 30;
  const legendItems = [
    { color: '#1e40af', label: 'НП/ВП — пояса' },
    { color: '#059669', label: 'С — стойки' },
    { color: '#dc2626', label: 'Р — раскосы' },
    { color: '#f59e0b', label: 'Коньковый узел' },
    { color: '#7c3aed', label: 'Углы раскосов' },
  ];
  const scaleMm = 1000;
  const scalePx = scaleMm * scale;
  lines.push(`<text x="${SVG_WIDTH - 10}" y="${legendY - 14}" text-anchor="end" font-size="10" fill="#6b7280">Масштаб: ${scalePx.toFixed(0)}px = 1м</text>`);
  const legendSpacing = Math.min(170, (SVG_WIDTH - 200) / legendItems.length);
  legendItems.forEach((item, i) => {
    const lx = 20 + i * legendSpacing;
    lines.push(`<rect x="${lx}" y="${legendY - 10}" width="16" height="16" fill="${item.color}" rx="2"/>`);
    lines.push(`<text x="${lx + 22}" y="${legendY + 3}" font-size="10" fill="#374151">${item.label}</text>`);
  });

  lines.push(`<text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - 5}" text-anchor="middle" font-size="10" fill="#94a3b8">Шаг перемычек: ${Math.round(panelLength)} мм | Количество панелей: ${panelCount}</text>`);

  lines.push('</svg>');
  return lines.join('\n');
}

function addLabel(
  labels: TextLabel[],
  x: number, y: number,
  text: string, fontSize: number,
  anchor: string, fill: string,
  fontWeight?: string,
): void {
  labels.push({ x, y, width: text.length * fontSize * 0.52, height: fontSize + 4, text, fontSize, anchor, fill, fontWeight });
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
