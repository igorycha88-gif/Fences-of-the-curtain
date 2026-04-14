import { TrussGeometryResult, TrussNode, TrussMember, CanopyRoofType } from './types';

const TARGET_PANEL_LENGTH = 1000;
const MIN_DIAGONAL_ANGLE = 5;

function calcPanelCount(span: number): number {
  return Math.max(3, Math.round(span / TARGET_PANEL_LENGTH));
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function angleDeg(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

function acuteAngleBetween(a1Deg: number, a2Deg: number): number {
  let diff = Math.abs(a1Deg - a2Deg) % 360;
  if (diff > 180) diff = 360 - diff;
  if (diff > 90) diff = 180 - diff;
  return diff;
}

function calcDiagonalAngles(
  diagStartX: number, diagStartY: number,
  diagEndX: number, diagEndY: number,
  chordStartX: number, chordStartY: number,
  chordEndX: number, chordEndY: number,
): { angleToBottomChord: number; angleToTopChord: number } {
  const diagAngle = Math.atan2(diagEndY - diagStartY, diagEndX - diagStartX);
  const chordAngle = Math.atan2(chordEndY - chordStartY, chordEndX - chordStartX);
  let diff = Math.abs(diagAngle - chordAngle) * (180 / Math.PI);
  diff = diff % 360;
  if (diff > 180) diff = 360 - diff;
  if (diff > 90) diff = 180 - diff;
  let bottomAngle = Math.abs(diagAngle) * (180 / Math.PI);
  bottomAngle = bottomAngle % 360;
  if (bottomAngle > 180) bottomAngle = 360 - bottomAngle;
  if (bottomAngle > 90) bottomAngle = 180 - bottomAngle;
  return {
    angleToBottomChord: Math.round(bottomAngle * 10) / 10,
    angleToTopChord: Math.round(diff * 10) / 10,
  };
}

function buildSingleSlope(width: number, ridgeHeight: number, wallHeight: number): TrussGeometryResult {
  const n = calcPanelCount(width);
  const panelLen = width / n;

  const nodes: TrussNode[] = [];
  const members: TrussMember[] = [];
  let nodeId = 0;
  let memberId = 0;

  for (let i = 0; i <= n; i++) {
    const x = i * panelLen;
    nodes.push({ id: nodeId++, x, y: 0, type: 'bottom' });
    const y = ridgeHeight * (i / n);
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

    if (i % 2 === 0) {
      members.push({
        id: memberId++, startNodeId: b1, endNodeId: t2, type: 'diagonal',
        length: distance(nodes[b1].x, nodes[b1].y, nodes[t2].x, nodes[t2].y),
        angle: angleDeg(nodes[b1].x, nodes[b1].y, nodes[t2].x, nodes[t2].y),
        diagonalAngles: calcDiagonalAngles(
          nodes[b1].x, nodes[b1].y, nodes[t2].x, nodes[t2].y,
          nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y,
        ),
      });
    } else {
      members.push({
        id: memberId++, startNodeId: t1, endNodeId: b2, type: 'diagonal',
        length: distance(nodes[t1].x, nodes[t1].y, nodes[b2].x, nodes[b2].y),
        angle: angleDeg(nodes[t1].x, nodes[t1].y, nodes[b2].x, nodes[b2].y),
        diagonalAngles: calcDiagonalAngles(
          nodes[t1].x, nodes[t1].y, nodes[b2].x, nodes[b2].y,
          nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y,
        ),
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

  const leftAngle = Math.atan2(nodes[1].y, panelLen) * (180 / Math.PI);
  const rightTopAngle = Math.atan2(nodes[lastT].y, width) * (180 / Math.PI);
  const slopeAngle = Math.atan2(ridgeHeight, width) * (180 / Math.PI);

  const roofLen = distance(0, 0, width, ridgeHeight);
  const roofArea = (roofLen / 1000) * (width / 1000);

  return {
    nodes, members, span: width, ridgeHeight, wallHeight: 0,
    slopeAngle, panelLength: panelLen, panelCount: n, roofArea,
    edgeAngles: {
      leftAngle: Math.round(leftAngle * 10) / 10,
      rightAngle: Math.round(rightTopAngle * 10) / 10,
    },
  };
}

function buildDoubleSlope(width: number, ridgeHeight: number): TrussGeometryResult {
  const n = calcPanelCount(width);
  const halfN = Math.ceil(n / 2);
  const panelLen = width / n;
  const eaveHeight = 0;

  const nodes: TrussNode[] = [];
  const members: TrussMember[] = [];
  let nodeId = 0;
  let memberId = 0;

  for (let i = 0; i <= n; i++) {
    const x = i * panelLen;
    nodes.push({ id: nodeId++, x, y: 0, type: 'bottom' });
  }

  const halfWidth = width / 2;
  const ridgeIdx = n % 2 === 0 ? halfN : n / 2;
  for (let i = 0; i <= halfN; i++) {
    const x = i * panelLen;
    if (x <= halfWidth + panelLen * 0.01) {
      const y = eaveHeight + (ridgeHeight - eaveHeight) * (x / halfWidth);
      const type = Math.abs(x - halfWidth) < panelLen * 0.01 ? 'ridge' : 'top';
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

  const ridgeNode = nodes.find(n => n.type === 'ridge');
  const centerBottom = nodes.find(n => n.type === 'bottom' && Math.abs(n.x - halfWidth) < panelLen * 0.5);

  for (let i = 0; i < Math.floor(n / 2); i++) {
    const leftBottom = nodes[i];
    const leftTopAtI = nodes.find(tn => tn.type !== 'bottom' && Math.abs(tn.x - leftBottom.x) < panelLen * 0.5);
    const leftNextTop = nodes.find(tn => tn.type !== 'bottom' && Math.abs(tn.x - (leftBottom.x + panelLen)) < panelLen * 0.5);
    const leftNextBottom = nodes[i + 1];

    if (!leftTopAtI || !leftNextTop || !leftNextBottom) continue;

    if (i % 2 === 0) {
      const diagAngles = calcDiagonalAngles(
        leftBottom.x, leftBottom.y, leftNextTop.x, leftNextTop.y,
        leftTopAtI.x, leftTopAtI.y, leftNextTop.x, leftNextTop.y,
      );
      if (diagAngles.angleToTopChord < MIN_DIAGONAL_ANGLE || diagAngles.angleToBottomChord < MIN_DIAGONAL_ANGLE) continue;
      members.push({
        id: memberId++, startNodeId: leftBottom.id, endNodeId: leftNextTop.id, type: 'diagonal',
        length: distance(leftBottom.x, leftBottom.y, leftNextTop.x, leftNextTop.y),
        angle: angleDeg(leftBottom.x, leftBottom.y, leftNextTop.x, leftNextTop.y),
        diagonalAngles: diagAngles,
      });
    } else {
      const diagAngles = calcDiagonalAngles(
        leftTopAtI.x, leftTopAtI.y, leftNextBottom.x, leftNextBottom.y,
        leftTopAtI.x, leftTopAtI.y, leftNextTop.x, leftNextTop.y,
      );
      if (diagAngles.angleToTopChord < MIN_DIAGONAL_ANGLE || diagAngles.angleToBottomChord < MIN_DIAGONAL_ANGLE) continue;
      members.push({
        id: memberId++, startNodeId: leftTopAtI.id, endNodeId: leftNextBottom.id, type: 'diagonal',
        length: distance(leftTopAtI.x, leftTopAtI.y, leftNextBottom.x, leftNextBottom.y),
        angle: angleDeg(leftTopAtI.x, leftTopAtI.y, leftNextBottom.x, leftNextBottom.y),
        diagonalAngles: diagAngles,
      });
    }
  }

  if (ridgeNode) {
    const rightDiags: TrussMember[] = [];
    const leftDiags = members.filter(m => m.type === 'diagonal');

    for (const leftDiag of leftDiags) {
      const startNode = nodes.find(n => n.id === leftDiag.startNodeId)!;
      const endNode = nodes.find(n => n.id === leftDiag.endNodeId)!;

      const mirrorStartX = width - startNode.x;
      const mirrorEndX = width - endNode.x;

      const mirrorStart = nodes.find(n => {
        const xMatch = Math.abs(n.x - mirrorStartX) < panelLen * 0.5;
        return startNode.type === 'bottom' ? (n.type === 'bottom' && xMatch) : (n.type !== 'bottom' && xMatch);
      });
      const mirrorEnd = nodes.find(n => {
        const xMatch = Math.abs(n.x - mirrorEndX) < panelLen * 0.5;
        return endNode.type === 'bottom' ? (n.type === 'bottom' && xMatch) : (n.type !== 'bottom' && xMatch);
      });

      if (mirrorStart && mirrorEnd && mirrorStart.id !== mirrorEnd.id) {
        const mChordStart = nodes.find(tn => tn.type !== 'bottom' && Math.abs(tn.x - mirrorStart.x) < panelLen * 0.5);
        const mChordEnd = nodes.find(tn => tn.type !== 'bottom' && Math.abs(tn.x - mirrorEnd.x) < panelLen * 0.5);

        let diagAngles = leftDiag.diagonalAngles;
        if (mChordStart && mChordEnd) {
          diagAngles = calcDiagonalAngles(
            mirrorStart.x, mirrorStart.y, mirrorEnd.x, mirrorEnd.y,
            mChordStart.x, mChordStart.y, mChordEnd.x, mChordEnd.y,
          );
          if (diagAngles.angleToTopChord < MIN_DIAGONAL_ANGLE || diagAngles.angleToBottomChord < MIN_DIAGONAL_ANGLE) continue;
        }

        rightDiags.push({
          id: memberId++, startNodeId: mirrorStart.id, endNodeId: mirrorEnd.id, type: 'diagonal',
          length: leftDiag.length,
          angle: angleDeg(mirrorStart.x, mirrorStart.y, mirrorEnd.x, mirrorEnd.y),
          diagonalAngles: diagAngles,
        });
      }
    }
    members.push(...rightDiags);
  }

  const leftAngle = Math.atan2(ridgeHeight, halfWidth) * (180 / Math.PI);
  const slopeAngle = leftAngle;

  const roofLen = 2 * distance(0, eaveHeight, halfWidth, ridgeHeight);
  const roofArea = (roofLen / 1000) * (width / 1000);

  return {
    nodes, members, span: width, ridgeHeight, wallHeight: eaveHeight,
    slopeAngle, panelLength: panelLen, panelCount: n, roofArea,
    edgeAngles: {
      leftAngle: Math.round(leftAngle * 10) / 10,
      rightAngle: Math.round(leftAngle * 10) / 10,
    },
  };
}

function buildArch(width: number, ridgeHeight: number): TrussGeometryResult {
  const n = calcPanelCount(width);
  const panelLen = width / n;
  const bottomH = 0;
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

  function arcTangentAngle(x: number): number {
    const dx = x - halfSpan;
    const val = R * R - dx * dx;
    if (val <= 0) return 0;
    const dydx = -dx / Math.sqrt(val);
    return Math.atan(dydx) * (180 / Math.PI);
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
  const ridgeIdx = Math.floor(n / 2);
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

    if (i < ridgeIdx && i < n - 1) {
      const nextB = (i + 1) * 2;
      const nextT2 = (i + 1) * 2 + 1;
      if (i % 2 === 0) {
        const diagAngles = calcDiagonalAngles(
          nodes[b1].x, nodes[b1].y, nodes[nextT2].x, nodes[nextT2].y,
          nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y,
        );
        if (diagAngles.angleToTopChord >= MIN_DIAGONAL_ANGLE && diagAngles.angleToBottomChord >= MIN_DIAGONAL_ANGLE) {
          members.push({
            id: memberId++, startNodeId: b1, endNodeId: nextT2, type: 'diagonal',
            length: distance(nodes[b1].x, nodes[b1].y, nodes[nextT2].x, nodes[nextT2].y),
            angle: angleDeg(nodes[b1].x, nodes[b1].y, nodes[nextT2].x, nodes[nextT2].y),
            diagonalAngles: diagAngles,
          });
        }
      } else {
        const diagAngles = calcDiagonalAngles(
          nodes[t1].x, nodes[t1].y, nodes[nextB].x, nodes[nextB].y,
          nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y,
        );
        if (diagAngles.angleToTopChord >= MIN_DIAGONAL_ANGLE && diagAngles.angleToBottomChord >= MIN_DIAGONAL_ANGLE) {
          members.push({
            id: memberId++, startNodeId: t1, endNodeId: nextB, type: 'diagonal',
            length: distance(nodes[t1].x, nodes[t1].y, nodes[nextB].x, nodes[nextB].y),
            angle: angleDeg(nodes[t1].x, nodes[t1].y, nodes[nextB].x, nodes[nextB].y),
            diagonalAngles: diagAngles,
          });
        }
      }
    }
  }
  const lastB = n * 2;
  const lastT = n * 2 + 1;
  members.push({
    id: memberId++, startNodeId: lastB, endNodeId: lastT, type: 'vertical',
    length: distance(nodes[lastB].x, nodes[lastB].y, nodes[lastT].x, nodes[lastT].y),
    angle: angleDeg(nodes[lastB].x, nodes[lastB].y, nodes[lastT].x, nodes[lastT].y),
  });

  const leftDiags = members.filter(m => m.type === 'diagonal');

  const rightDiags: TrussMember[] = [];
  for (const ld of leftDiags) {
    const sn = nodes.find(n => n.id === ld.startNodeId)!;
    const en = nodes.find(n => n.id === ld.endNodeId)!;

    const mirrorSnX = width - sn.x;
    const mirrorEnX = width - en.x;

    const mirrorSn = nodes.find(n => {
      const xMatch = Math.abs(n.x - mirrorSnX) < panelLen * 0.5;
      return sn.type === 'bottom' ? (n.type === 'bottom' && xMatch) : (n.type !== 'bottom' && xMatch);
    });
    const mirrorEn = nodes.find(n => {
      const xMatch = Math.abs(n.x - mirrorEnX) < panelLen * 0.5;
      return en.type === 'bottom' ? (n.type === 'bottom' && xMatch) : (n.type !== 'bottom' && xMatch);
    });

    if (mirrorSn && mirrorEn && mirrorSn.id !== mirrorEn.id) {
      const mTopStart = nodes.find(tn => tn.type !== 'bottom' && Math.abs(tn.x - mirrorSn.x) < panelLen * 0.5);
      const mTopEnd = nodes.find(tn => tn.type !== 'bottom' && Math.abs(tn.x - mirrorEn.x) < panelLen * 0.5);

      let diagAngles = ld.diagonalAngles;
      if (mTopStart && mTopEnd) {
        diagAngles = calcDiagonalAngles(
          mirrorSn.x, mirrorSn.y, mirrorEn.x, mirrorEn.y,
          mTopStart.x, mTopStart.y, mTopEnd.x, mTopEnd.y,
        );
        if (diagAngles.angleToTopChord < MIN_DIAGONAL_ANGLE || diagAngles.angleToBottomChord < MIN_DIAGONAL_ANGLE) continue;
      }

      const exists = members.some(m =>
        m.type === 'diagonal' &&
        ((m.startNodeId === mirrorSn.id && m.endNodeId === mirrorEn.id) ||
         (m.startNodeId === mirrorEn.id && m.endNodeId === mirrorSn.id))
      );
      if (!exists) {
        rightDiags.push({
          id: memberId++, startNodeId: mirrorSn.id, endNodeId: mirrorEn.id, type: 'diagonal',
          length: ld.length,
          angle: angleDeg(mirrorSn.x, mirrorSn.y, mirrorEn.x, mirrorEn.y),
          diagonalAngles: diagAngles,
        });
      }
    }
  }
  members.push(...rightDiags);

  const edgeAngle = Math.atan2(halfSpan, R - rise) * (180 / Math.PI);
  const slopeAngle = edgeAngle;
  const roofArea = (arcLength / 1000) * (width / 1000);

  const archProfileBendLength = 2 * R * Math.asin(halfSpan / R);

  return {
    nodes, members, span: width, ridgeHeight, wallHeight: bottomH,
    slopeAngle, arcLength, panelLength: panelLen, panelCount: n, roofArea,
    archProfileBendLength: Math.round(archProfileBendLength * 10) / 10,
    edgeAngles: {
      leftAngle: Math.round(edgeAngle * 10) / 10,
      rightAngle: Math.round(edgeAngle * 10) / 10,
    },
  };
}

function buildSingleSlopeCurved(width: number, ridgeHeight: number, wallHeight: number): TrussGeometryResult {
  const n = calcPanelCount(width);
  const panelLen = width / n;
  const curvePeak = ridgeHeight / 2 + ridgeHeight * 0.3;

  function curveY(x: number): number {
    const t = x / width;
    const base = ridgeHeight * t;
    const bulge = curvePeak - ridgeHeight / 2;
    const curve = bulge * Math.sin(Math.PI * t);
    return base + curve;
  }

  function curveTangentAngle(x: number): number {
    const dx = 0.1;
    const y1 = curveY(x - dx);
    const y2 = curveY(x + dx);
    return Math.atan2(y2 - y1, 2 * dx) * (180 / Math.PI);
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
      const nextT2 = (i + 1) * 2 + 1;
      if (i % 2 === 0) {
        const diagAngles = calcDiagonalAngles(
          nodes[b1].x, nodes[b1].y, nodes[t2].x, nodes[t2].y,
          nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y,
        );
        if (diagAngles.angleToTopChord >= MIN_DIAGONAL_ANGLE && diagAngles.angleToBottomChord >= MIN_DIAGONAL_ANGLE) {
          members.push({
            id: memberId++, startNodeId: b1, endNodeId: nextT2, type: 'diagonal',
            length: distance(nodes[b1].x, nodes[b1].y, nodes[nextT2].x, nodes[nextT2].y),
            angle: angleDeg(nodes[b1].x, nodes[b1].y, nodes[nextT2].x, nodes[nextT2].y),
            diagonalAngles: diagAngles,
          });
        }
      } else {
        const diagAngles = calcDiagonalAngles(
          nodes[t1].x, nodes[t1].y, nodes[nextB].x, nodes[nextB].y,
          nodes[t1].x, nodes[t1].y, nodes[t2].x, nodes[t2].y,
        );
        if (diagAngles.angleToTopChord >= MIN_DIAGONAL_ANGLE && diagAngles.angleToBottomChord >= MIN_DIAGONAL_ANGLE) {
          members.push({
            id: memberId++, startNodeId: t1, endNodeId: nextB, type: 'diagonal',
            length: distance(nodes[t1].x, nodes[t1].y, nodes[nextB].x, nodes[nextB].y),
            angle: angleDeg(nodes[t1].x, nodes[t1].y, nodes[nextB].x, nodes[nextB].y),
            diagonalAngles: diagAngles,
          });
        }
      }
    }
  }
  const lastB = n * 2;
  const lastT = n * 2 + 1;
  members.push({
    id: memberId++, startNodeId: lastB, endNodeId: lastT, type: 'vertical',
    length: distance(nodes[lastB].x, nodes[lastB].y, nodes[lastT].x, nodes[lastT].y),
    angle: angleDeg(nodes[lastB].x, nodes[lastB].y, nodes[lastT].x, nodes[lastT].y),
  });

  const leftAngle = Math.atan2(nodes[1].y, panelLen) * (180 / Math.PI);
  const rightAngle = Math.atan2(nodes[lastT].y, width) * (180 / Math.PI);
  const slopeAngle = Math.atan2(ridgeHeight, width) * (180 / Math.PI);
  const roofArea = (arcLength / 1000) * (width / 1000);

  let integralLen = 0;
  const steps = 1000;
  const dx = width / steps;
  for (let i = 0; i < steps; i++) {
    const x1 = i * dx;
    const x2 = (i + 1) * dx;
    integralLen += distance(x1, curveY(x1), x2, curveY(x2));
  }

  return {
    nodes, members, span: width, ridgeHeight, wallHeight,
    slopeAngle, arcLength, panelLength: panelLen, panelCount: n, roofArea,
    archProfileBendLength: Math.round(integralLen * 10) / 10,
    edgeAngles: {
      leftAngle: Math.round(leftAngle * 10) / 10,
      rightAngle: Math.round(rightAngle * 10) / 10,
    },
  };
}

function addCutAngles(result: TrussGeometryResult, canopyType: CanopyRoofType): void {
  const { nodes, members } = result;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const halfSpan = result.span / 2;

  function getTopChordTangentAtNode(nodeId: number): number {
    const node = nodeMap.get(nodeId);
    if (!node || node.type === 'bottom') return 0;

    if (canopyType === 'ARCH') {
      const rise = result.ridgeHeight;
      const R = (halfSpan * halfSpan + rise * rise) / (2 * rise);
      const centerY = result.ridgeHeight - R;
      const dx = node.x - halfSpan;
      const val = R * R - dx * dx;
      if (val <= 0) return 0;
      return Math.atan(-dx / Math.sqrt(val)) * (180 / Math.PI);
    }

    if (canopyType === 'SINGLE_SLOPE_CURVED') {
      const curvePeak = result.ridgeHeight / 2 + result.ridgeHeight * 0.3;
      const w = result.span;
      function curveY(x: number): number {
        const t = x / w;
        const base = result.ridgeHeight * t;
        const bulge = curvePeak - result.ridgeHeight / 2;
        return base + bulge * Math.sin(Math.PI * t);
      }
      const eps = 0.1;
      return Math.atan2(curveY(node.x + eps) - curveY(node.x - eps), 2 * eps) * (180 / Math.PI);
    }

    const topChordMembers = members.filter(m =>
      m.type === 'top_chord' && (m.startNodeId === nodeId || m.endNodeId === nodeId)
    );
    if (topChordMembers.length === 0) return 0;
    let sumAngle = 0;
    for (const tcm of topChordMembers) {
      const s = nodeMap.get(tcm.startNodeId)!;
      const e = nodeMap.get(tcm.endNodeId)!;
      sumAngle += angleDeg(s.x, s.y, e.x, e.y);
    }
    return sumAngle / topChordMembers.length;
  }

  for (const member of members) {
    if (member.type === 'vertical') {
      const topNodeId = member.endNodeId;
      const bottomNodeId = member.startNodeId;

      const bottomNode = nodeMap.get(bottomNodeId)!;
      const topNode = nodeMap.get(topNodeId)!;

      const actualBottom = bottomNode.y <= topNode.y ? bottomNodeId : topNodeId;
      const actualTop = bottomNode.y <= topNode.y ? topNodeId : bottomNodeId;

      const bottomCutAngle = 90;

      const tangentAngle = getTopChordTangentAtNode(actualTop);
      const topCutAngle = Math.round(acuteAngleBetween(90, tangentAngle) * 10) / 10;

      member.cutAngles = { bottomCutAngle, topCutAngle };
    } else if (member.type === 'diagonal') {
      if (member.diagonalAngles) {
        member.cutAngles = {
          bottomCutAngle: member.diagonalAngles.angleToBottomChord,
          topCutAngle: member.diagonalAngles.angleToTopChord,
        };
      } else {
        const startNode = nodeMap.get(member.startNodeId)!;
        const endNode = nodeMap.get(member.endNodeId)!;

        const bottomEnd = startNode.y <= endNode.y ? startNode : endNode;
        const topEnd = startNode.y <= endNode.y ? endNode : startNode;

        const bottomCut = Math.round(acuteAngleBetween(member.angle, 0) * 10) / 10;
        const tangentAngle = getTopChordTangentAtNode(topEnd.id);
        const topCut = Math.round(acuteAngleBetween(member.angle, tangentAngle) * 10) / 10;

        member.cutAngles = { bottomCutAngle: bottomCut, topCutAngle: topCut };
      }
    } else {
      member.cutAngles = { bottomCutAngle: 90, topCutAngle: 90 };
    }
  }
}

function removeParallelDiagonals(members: TrussMember[]): TrussMember[] {
  return members.filter(m => {
    if (m.type !== 'diagonal') return true;
    if (!m.diagonalAngles) return true;
    return m.diagonalAngles.angleToTopChord >= MIN_DIAGONAL_ANGLE &&
           m.diagonalAngles.angleToBottomChord >= MIN_DIAGONAL_ANGLE;
  });
}

export function calculateTrussGeometry(
  canopyType: CanopyRoofType,
  width: number,
  ridgeHeight: number,
  wallHeight?: number,
): TrussGeometryResult {
  const defaultWallH = wallHeight ?? 0;

  let result: TrussGeometryResult;

  switch (canopyType) {
    case 'SINGLE_SLOPE':
      result = buildSingleSlope(width, ridgeHeight, defaultWallH);
      break;
    case 'DOUBLE_SLOPE':
      result = buildDoubleSlope(width, ridgeHeight);
      break;
    case 'ARCH':
      result = buildArch(width, ridgeHeight);
      break;
    case 'SINGLE_SLOPE_CURVED':
      result = buildSingleSlopeCurved(width, ridgeHeight, defaultWallH);
      break;
  }

  result.members = removeParallelDiagonals(result.members);

  addCutAngles(result, canopyType);

  return result;
}
