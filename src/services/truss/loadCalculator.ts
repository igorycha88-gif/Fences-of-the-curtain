import { LoadInput, LoadResult, CanopyRoofType } from './types';

const SG_MOSCOW = 180;
const CE = 1.0;
const CT = 1.0;
const GAMMA_F_SNOW = 1.4;
const GAMMA_F_WIND = 1.4;
const GAMMA_F_DEAD = 1.1;
const W0_MOSCOW = 23;

function calcSlopeAngle(canopyType: CanopyRoofType, width: number, ridgeHeight: number, wallHeight?: number): number {
  switch (canopyType) {
    case 'SINGLE_SLOPE': {
      const h = wallHeight ?? ridgeHeight * 0.5;
      return Math.atan2(ridgeHeight - h, width) * (180 / Math.PI);
    }
    case 'DOUBLE_SLOPE': {
      const eaveHeight = ridgeHeight * 0.35;
      return Math.atan2(ridgeHeight - eaveHeight, width / 2) * (180 / Math.PI);
    }
    case 'ARCH': {
      const bottomH = ridgeHeight * 0.3;
      const rise = ridgeHeight - bottomH;
      const halfSpan = width / 2;
      const R = (halfSpan * halfSpan + rise * rise) / (2 * rise);
      return Math.atan2(halfSpan, R - rise) * (180 / Math.PI);
    }
    case 'SINGLE_SLOPE_CURVED': {
      const h = wallHeight ?? ridgeHeight * 0.4;
      return Math.atan2((ridgeHeight - h) * 0.7, width) * (180 / Math.PI);
    }
  }
}

function calcSnowMu(canopyType: CanopyRoofType, angle: number, width: number, ridgeHeight: number): number {
  switch (canopyType) {
    case 'SINGLE_SLOPE':
    case 'SINGLE_SLOPE_CURVED': {
      if (angle <= 25) return 1.0;
      if (angle >= 60) return 0;
      return (60 - angle) / 35;
    }
    case 'DOUBLE_SLOPE':
      return 1.0;
    case 'ARCH': {
      const bottomH = ridgeHeight * 0.3;
      const rise = ridgeHeight - bottomH;
      const ratio = width / (8 * rise);
      return Math.min(ratio, 1.0);
    }
  }
}

function calcWindC(canopyType: CanopyRoofType, angle: number): number {
  switch (canopyType) {
    case 'SINGLE_SLOPE':
    case 'SINGLE_SLOPE_CURVED':
      if (angle <= 15) return 0.3;
      if (angle <= 30) return 0.2;
      return -0.4;
    case 'DOUBLE_SLOPE':
      if (angle <= 15) return 0.4;
      if (angle <= 30) return 0.3;
      return -0.2;
    case 'ARCH':
      return -0.3;
  }
}

function calcWindHeightCoeff(ridgeHeight: number): number {
  const h = ridgeHeight / 1000;
  if (h <= 5) return 0.5;
  if (h <= 10) return 0.5 + (h - 5) / 5 * 0.15;
  if (h <= 20) return 0.65 + (h - 10) / 10 * 0.20;
  return 0.85 + (h - 20) / 20 * 0.25;
}

export function calculateLoads(input: LoadInput): LoadResult {
  const slopeAngle = calcSlopeAngle(input.canopyType, input.width, input.ridgeHeight, input.wallHeight);
  const snowMu = calcSnowMu(input.canopyType, slopeAngle, input.width, input.ridgeHeight);
  const windC = calcWindC(input.canopyType, slopeAngle);
  const windHeightCoeff = calcWindHeightCoeff(input.ridgeHeight);

  const snowNormative = CE * CT * snowMu * SG_MOSCOW;
  const snowDesign = snowNormative * GAMMA_F_SNOW;

  const windNormative = Math.abs(W0_MOSCOW * windHeightCoeff * windC);
  const windDesign = windNormative * GAMMA_F_WIND;

  const deadNormative = input.roofWeightPerSqm + input.structureWeightPerSqm;
  const deadDesign = deadNormative * GAMMA_F_DEAD;

  const totalNormative = snowNormative + windNormative + deadNormative;
  const totalDesign = snowDesign + windDesign + deadDesign;

  return {
    snowLoadNormative: Math.round(snowNormative * 10) / 10,
    snowLoadDesign: Math.round(snowDesign * 10) / 10,
    windLoadNormative: Math.round(windNormative * 10) / 10,
    windLoadDesign: Math.round(windDesign * 10) / 10,
    deadLoadNormative: Math.round(deadNormative * 10) / 10,
    deadLoadDesign: Math.round(deadDesign * 10) / 10,
    totalLoadNormative: Math.round(totalNormative * 10) / 10,
    totalLoadDesign: Math.round(totalDesign * 10) / 10,
    loadPerMeter: Math.round(totalDesign * 10) / 10,
    loadPerTruss: 0,
    slopeAngle: Math.round(slopeAngle * 10) / 10,
    snowCoeffMu: Math.round(snowMu * 100) / 100,
    windCoeffC: Math.round(windC * 100) / 100,
    windHeightCoeff: Math.round(windHeightCoeff * 100) / 100,
  };
}
