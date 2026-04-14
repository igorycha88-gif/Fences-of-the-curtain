import { TrussGeometryResult, TrussNode, TrussMember, CanopyRoofType } from './types';

const TARGET_PANEL_LENGTH = 1000;

function calcPanelCount(span: number): number {
  return Math.max(3, Math.round(span / TARGET_PANEL_LENGTH));
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function angleDeg(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

function buildSingleSlope(width: number, ridgeHeight: number, wallHeight: number): TrussGeometryResult {
  const n = calcPanelCount(width);
  const panelLen = width / n;
  const slopeAngle = Math.atan2(ridgeHeight - wallHeight, width) * (180 / Math.PI);

  const nodes: TrussNode[] = [];
  const members: TrussMember[] = [];
  let nodeId = 0;
  let memberId = 0;

  for (let i = 0; i <= n; i++) {
    const x = i * panelLen;
    nodes.push({ id: nodeId++, x, y: 0, type: 'bottom' });
    const y = wallHeight + (ridgeHeight - wallHeight) * (i / n);
    nodes.push({ id: nodeId++, x, y, type: 'top' });
  }

  for (let i = 0; i < n; i++) {
    const b1 = i * 2;
    const t1 = i * 2 + 1;
    const b2 = (i + 1) * 2;
    const t2 = (i + 1) * 2 + 1;

    members.push({
      id: memberId++, startNodeId: b1, endNodeId: b2, type: 'bottom_chord',
      length: distance(nodes[b1].x, nodes[b1].y, nodes[b2].x, nodes[b2].y),
      angle: angleDeg(nodes[b1].x, nodes[b1].y, nodes[b2].x, nodes[b2].y),
    });
    members.push({
      id: memberId++, startNodeId: t1, endNodeId: t2, type: 'top_chord',
      length: distance(nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y),
      angle: angleDeg(nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y),
    });
    members.push({
      id: memberId++, startNodeId: b1, endNodeId: t1, type: 'vertical',
      length: distance(nodes[b1].x, nodes[b1].y, nodes[t1].x, nodes[t1].y),
      angle: angleDeg(nodes[b1].x, nodes[b1].y, nodes[t1].x, nodes[t1].y),
    });
    members.push({
      id: memberId++, startNodeId: b1, endNodeId: t2, type: 'diagonal',
      length: distance(nodes[b1].x, nodes[b1].y, nodes[t2].x, nodes[t2].y),
      angle: angleDeg(nodes[b1].x, nodes[b1].y, nodes[t2].x, nodes[t2].y),
    });
  }
  const lastB = n * 2;
  const lastT = n * 2 + 1;
  members.push({
    id: memberId++, startNodeId: lastB, endNodeId: lastT, type: 'vertical',
    length: distance(nodes[lastB].x, nodes[lastB].y, nodes[lastT].x, nodes[lastT].y),
    angle: angleDeg(nodes[lastB].x, nodes[lastB].y, nodes[lastT].x, nodes[lastT].y),
  });

  const roofLen = distance(0, wallHeight, width, ridgeHeight);
  const roofArea = (roofLen / 1000) * (width / 1000);

  return {
    nodes, members, span: width, ridgeHeight, wallHeight,
    slopeAngle, panelLength: panelLen, panelCount: n, roofArea,
  };
}

function buildDoubleSlope(width: number, ridgeHeight: number): TrussGeometryResult {
  const n = calcPanelCount(width);
  const halfN = Math.ceil(n / 2);
  const panelLen = width / n;
  const eaveHeight = ridgeHeight * 0.35;
  const slopeAngle = Math.atan2(ridgeHeight - eaveHeight, width / 2) * (180 / Math.PI);

  const nodes: TrussNode[] = [];
  const members: TrussMember[] = [];
  let nodeId = 0;
  let memberId = 0;

  for (let i = 0; i <= n; i++) {
    const x = i * panelLen;
    nodes.push({ id: nodeId++, x, y: 0, type: 'bottom' });
  }

  const halfWidth = width / 2;
  for (let i = 0; i <= halfN; i++) {
    const x = i * panelLen;
    if (x <= halfWidth) {
      const y = eaveHeight + (ridgeHeight - eaveHeight) * (x / halfWidth);
      const type = i === halfN ? 'ridge' : 'top';
      nodes.push({ id: nodeId++, x, y, type });
    }
  }

  for (let i = 0; i <= halfN; i++) {
    const x = width - i * panelLen;
    if (x > halfWidth && i < halfN) {
      const distFromRight = i * panelLen;
      const y = eaveHeight + (ridgeHeight - eaveHeight) * (distFromRight / halfWidth);
      nodes.push({ id: nodeId++, x, y, type: 'top' });
    }
  }

  for (let i = 0; i < n; i++) {
    const b1 = i;
    const b2 = i + 1;
    members.push({
      id: memberId++, startNodeId: b1, endNodeId: b2, type: 'bottom_chord',
      length: distance(nodes[b1].x, nodes[b1].y, nodes[b2].x, nodes[b2].y),
      angle: angleDeg(nodes[b1].x, nodes[b1].y, nodes[b2].x, nodes[b2].y),
    });
  }

  const topStart = n + 1;
  for (let i = 0; i < halfN * 2; i++) {
    const t1 = topStart + i;
    const t2 = topStart + i + 1;
    if (t2 < nodes.length) {
      members.push({
        id: memberId++, startNodeId: t1, endNodeId: t2, type: 'top_chord',
        length: distance(nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y),
        angle: angleDeg(nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y),
      });
    }
  }

  for (let i = 0; i <= n; i++) {
    const bottomNode = nodes[i];
    const topNode = nodes.find(tn => tn.type !== 'bottom' && Math.abs(tn.x - bottomNode.x) < panelLen * 0.5);
    if (topNode) {
      members.push({
        id: memberId++, startNodeId: bottomNode.id, endNodeId: topNode.id, type: 'vertical',
        length: distance(bottomNode.x, bottomNode.y, topNode.x, topNode.y),
        angle: angleDeg(bottomNode.x, bottomNode.y, topNode.x, topNode.y),
      });
    }
  }

  for (let i = 0; i < n; i++) {
    const bottomNode = nodes[i];
    const nextTop = nodes.find(tn => tn.type !== 'bottom' && Math.abs(tn.x - (bottomNode.x + panelLen)) < panelLen * 0.5);
    if (nextTop && bottomNode.y === 0) {
      members.push({
        id: memberId++, startNodeId: bottomNode.id, endNodeId: nextTop.id, type: 'diagonal',
        length: distance(bottomNode.x, bottomNode.y, nextTop.x, nextTop.y),
        angle: angleDeg(bottomNode.x, bottomNode.y, nextTop.x, nextTop.y),
      });
    }
  }

  const roofLen = 2 * distance(0, eaveHeight, halfWidth, ridgeHeight);
  const roofArea = (roofLen / 1000) * (width / 1000);

  return {
    nodes, members, span: width, ridgeHeight, wallHeight: eaveHeight,
    slopeAngle, panelLength: panelLen, panelCount: n, roofArea,
  };
}

function buildArch(width: number, ridgeHeight: number): TrussGeometryResult {
  const n = calcPanelCount(width);
  const panelLen = width / n;
  const bottomH = ridgeHeight * 0.3;
  const rise = ridgeHeight - bottomH;
  const halfSpan = width / 2;
  const R = (halfSpan * halfSpan + rise * rise) / (2 * rise);
  const centerY = ridgeHeight - R;

  function arcY(x: number): number {
    const dx = x - halfSpan;
    const val = R * R - dx * dx;
    if (val < 0) return ridgeHeight;
    return centerY + Math.sqrt(val);
  }

  const nodes: TrussNode[] = [];
  const members: TrussMember[] = [];
  let nodeId = 0;
  let memberId = 0;

  for (let i = 0; i <= n; i++) {
    const x = i * panelLen;
    nodes.push({ id: nodeId++, x, y: 0, type: 'bottom' });
    const y = arcY(x);
    nodes.push({ id: nodeId++, x, y, type: i === Math.floor(n / 2) ? 'ridge' : 'top' });
  }

  let arcLength = 0;
  for (let i = 0; i < n; i++) {
    const b1 = i * 2;
    const t1 = i * 2 + 1;
    const b2 = (i + 1) * 2;
    const t2 = (i + 1) * 2 + 1;

    members.push({
      id: memberId++, startNodeId: b1, endNodeId: b2, type: 'bottom_chord',
      length: distance(nodes[b1].x, nodes[b1].y, nodes[b2].x, nodes[b2].y),
      angle: angleDeg(nodes[b1].x, nodes[b1].y, nodes[b2].x, nodes[b2].y),
    });

    const topLen = distance(nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y);
    arcLength += topLen;
    members.push({
      id: memberId++, startNodeId: t1, endNodeId: t2, type: 'top_chord',
      length: topLen,
      angle: angleDeg(nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y),
    });

    members.push({
      id: memberId++, startNodeId: b1, endNodeId: t1, type: 'vertical',
      length: distance(nodes[b1].x, nodes[b1].y, nodes[t1].x, nodes[t1].y),
      angle: angleDeg(nodes[b1].x, nodes[b1].y, nodes[t1].x, nodes[t1].y),
    });

    if (i < n - 1) {
      const nextB = (i + 1) * 2;
      members.push({
        id: memberId++, startNodeId: t1, endNodeId: nextB, type: 'diagonal',
        length: distance(nodes[t1].x, nodes[t1].y, nodes[nextB].x, nodes[nextB].y),
        angle: angleDeg(nodes[t1].x, nodes[t1].y, nodes[nextB].x, nodes[nextB].y),
      });
    }
  }
  const lastB = n * 2;
  const lastT = n * 2 + 1;
  members.push({
    id: memberId++, startNodeId: lastB, endNodeId: lastT, type: 'vertical',
    length: distance(nodes[lastB].x, nodes[lastB].y, nodes[lastT].x, nodes[lastT].y),
    angle: angleDeg(nodes[lastB].x, nodes[lastB].y, nodes[lastT].x, nodes[lastT].y),
  });

  const slopeAngle = Math.atan2(halfSpan, R - rise) * (180 / Math.PI);
  const roofArea = (arcLength / 1000) * (width / 1000);

  return {
    nodes, members, span: width, ridgeHeight, wallHeight: bottomH,
    slopeAngle, arcLength, panelLength: panelLen, panelCount: n, roofArea,
  };
}

function buildSingleSlopeCurved(width: number, ridgeHeight: number, wallHeight: number): TrussGeometryResult {
  const n = calcPanelCount(width);
  const panelLen = width / n;
  const curvePeak = (wallHeight + ridgeHeight) / 2 + (ridgeHeight - wallHeight) * 0.3;

  function curveY(x: number): number {
    const t = x / width;
    const base = wallHeight + (ridgeHeight - wallHeight) * t;
    const bulge = curvePeak - (wallHeight + ridgeHeight) / 2;
    const curve = bulge * Math.sin(Math.PI * t);
    return base + curve;
  }

  const nodes: TrussNode[] = [];
  const members: TrussMember[] = [];
  let nodeId = 0;
  let memberId = 0;

  for (let i = 0; i <= n; i++) {
    const x = i * panelLen;
    nodes.push({ id: nodeId++, x, y: 0, type: 'bottom' });
    nodes.push({ id: nodeId++, x, y: curveY(x), type: 'top' });
  }

  let arcLength = 0;
  for (let i = 0; i < n; i++) {
    const b1 = i * 2;
    const t1 = i * 2 + 1;
    const b2 = (i + 1) * 2;
    const t2 = (i + 1) * 2 + 1;

    members.push({
      id: memberId++, startNodeId: b1, endNodeId: b2, type: 'bottom_chord',
      length: distance(nodes[b1].x, nodes[b1].y, nodes[b2].x, nodes[b2].y),
      angle: angleDeg(nodes[b1].x, nodes[b1].y, nodes[b2].x, nodes[b2].y),
    });

    const topLen = distance(nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y);
    arcLength += topLen;
    members.push({
      id: memberId++, startNodeId: t1, endNodeId: t2, type: 'top_chord',
      length: topLen,
      angle: angleDeg(nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y),
    });

    members.push({
      id: memberId++, startNodeId: b1, endNodeId: t1, type: 'vertical',
      length: distance(nodes[b1].x, nodes[b1].y, nodes[t1].x, nodes[t1].y),
      angle: angleDeg(nodes[b1].x, nodes[b1].y, nodes[t1].x, nodes[t1].y),
    });

    if (i < n - 1) {
      const nextB = (i + 1) * 2;
      members.push({
        id: memberId++, startNodeId: t1, endNodeId: nextB, type: 'diagonal',
        length: distance(nodes[t1].x, nodes[t1].y, nodes[nextB].x, nodes[nextB].y),
        angle: angleDeg(nodes[t1].x, nodes[t1].y, nodes[nextB].x, nodes[nextB].y),
      });
    }
  }
  const lastB = n * 2;
  const lastT = n * 2 + 1;
  members.push({
    id: memberId++, startNodeId: lastB, endNodeId: lastT, type: 'vertical',
    length: distance(nodes[lastB].x, nodes[lastB].y, nodes[lastT].x, nodes[lastT].y),
    angle: angleDeg(nodes[lastB].x, nodes[lastB].y, nodes[lastT].x, nodes[lastT].y),
  });

  const slopeAngle = Math.atan2(ridgeHeight - wallHeight, width) * (180 / Math.PI);
  const roofArea = (arcLength / 1000) * (width / 1000);

  return {
    nodes, members, span: width, ridgeHeight, wallHeight,
    slopeAngle, arcLength, panelLength: panelLen, panelCount: n, roofArea,
  };
}

export function calculateTrussGeometry(
  canopyType: CanopyRoofType,
  width: number,
  ridgeHeight: number,
  wallHeight?: number,
): TrussGeometryResult {
  const defaultWallH = wallHeight ?? ridgeHeight * 0.5;

  switch (canopyType) {
    case 'SINGLE_SLOPE':
      return buildSingleSlope(width, ridgeHeight, defaultWallH);
    case 'DOUBLE_SLOPE':
      return buildDoubleSlope(width, ridgeHeight);
    case 'ARCH':
      return buildArch(width, ridgeHeight);
    case 'SINGLE_SLOPE_CURVED':
      return buildSingleSlopeCurved(width, ridgeHeight, defaultWallH);
  }
}
