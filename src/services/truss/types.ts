export type CanopyRoofType = 'SINGLE_SLOPE' | 'DOUBLE_SLOPE' | 'ARCH' | 'SINGLE_SLOPE_CURVED';
export type ProfileCategory = 'POST' | 'CROSSBEAM' | 'STRUT' | 'ARCH';

export interface LoadInput {
  canopyType: CanopyRoofType;
  width: number;
  ridgeHeight: number;
  wallHeight?: number;
  roofWeightPerSqm: number;
  structureWeightPerSqm: number;
}

export interface LoadResult {
  snowLoadNormative: number;
  snowLoadDesign: number;
  windLoadNormative: number;
  windLoadDesign: number;
  deadLoadNormative: number;
  deadLoadDesign: number;
  totalLoadNormative: number;
  totalLoadDesign: number;
  loadPerTruss: number;
  loadPerMeter: number;
  slopeAngle: number;
  snowCoeffMu: number;
  windCoeffC: number;
  windHeightCoeff: number;
}

export interface TrussNode {
  id: number;
  x: number;
  y: number;
  type: 'bottom' | 'top' | 'ridge';
}

export interface TrussMember {
  id: number;
  startNodeId: number;
  endNodeId: number;
  type: 'bottom_chord' | 'top_chord' | 'vertical' | 'diagonal';
  length: number;
  angle: number;
  diagonalAngles?: {
    angleToBottomChord: number;
    angleToTopChord: number;
  };
  cutAngles?: {
    bottomCutAngle: number;
    topCutAngle: number;
  };
}

export interface TrussGeometryResult {
  nodes: TrussNode[];
  members: TrussMember[];
  span: number;
  ridgeHeight: number;
  wallHeight: number;
  slopeAngle: number;
  arcLength?: number;
  panelLength: number;
  panelCount: number;
  roofArea: number;
  edgeAngles?: {
    leftAngle: number;
    rightAngle?: number;
  };
  archProfileBendLength?: number;
}

export interface ProfileCheckResult {
  passed: boolean;
  utilizationRatio: number;
  requiredSectionModulus: number;
  actualSectionModulus: number;
  recommendedProfileId?: string;
  recommendedProfileName?: string;
  failureReason?: string;
}

export interface MemberForce {
  memberId: number;
  axialForce: number;
  isCompression: boolean;
  bendingMoment: number;
  effectiveLength: number;
}

export interface MaterialItem {
  name: string;
  profileName: string;
  profileCategory: ProfileCategory;
  length: number;
  count: number;
  totalLength: number;
  weightPerMeter: number;
  totalWeight: number;
  pricePerMeter: number;
  totalPrice: number;
}

export interface TrussElementDetail {
  elementType: 'vertical' | 'diagonal' | 'bottom_chord' | 'top_chord';
  elementLabel: string;
  length: number;
  bottomCutAngle: number;
  topCutAngle: number;
  profileName: string;
  profileThickness: string;
  quantity: number;
}

export interface TrussCalculationInput {
  canopyType: CanopyRoofType;
  width: number;
  length: number;
  ridgeHeight: number;
  wallHeight?: number;
  trussSpacing: number;
  roofCoveringId: string;
  roofWeightPerSqm: number;
  roofRetailPricePerSqm: number;
  postProfileId: string;
  crossbeamProfileId: string;
  topChordProfileId?: string;
  strutProfileId: string;
  archProfileId?: string;
  postSectionArea: number;
  postSectionModulusX: number;
  postRadiusOfGyrationX: number;
  postWeightPerMeter: number;
  postRetailPricePerMeter: number;
  postProfileName: string;
  crossbeamSectionArea: number;
  crossbeamSectionModulusX: number;
  crossbeamRadiusOfGyrationX: number;
  crossbeamWeightPerMeter: number;
  crossbeamRetailPricePerMeter: number;
  crossbeamProfileName: string;
  topChordSectionArea?: number;
  topChordSectionModulusX?: number;
  topChordRadiusOfGyrationX?: number;
  topChordWeightPerMeter?: number;
  topChordRetailPricePerMeter?: number;
  topChordProfileName?: string;
  strutSectionArea: number;
  strutSectionModulusX: number;
  strutRadiusOfGyrationX: number;
  strutWeightPerMeter: number;
  strutRetailPricePerMeter: number;
  strutProfileName: string;
  archSectionArea?: number;
  archSectionModulusX?: number;
  archRadiusOfGyrationX?: number;
  archWeightPerMeter?: number;
  archRetailPricePerMeter?: number;
  archProfileName?: string;
}

export interface ProfileRecommendation {
  category: ProfileCategory;
  currentProfileName: string;
  currentUtilization: number;
  recommendedProfileId: string;
  recommendedProfileName: string;
  reason: string;
}

export interface TrussCalculationResult {
  loads: LoadResult;
  geometry: TrussGeometryResult;
  memberForces: MemberForce[];
  profileChecks: {
    bottomChord: ProfileCheckResult;
    topChord: ProfileCheckResult;
    verticals: ProfileCheckResult;
    diagonals: ProfileCheckResult;
  };
  safetyFactor: number;
  allProfilesPassed: boolean;
  recommendations: ProfileRecommendation[];
  materialList: MaterialItem[];
  totalWeight: number;
  totalPrice: number;
  svgDrawing: string;
  elementDetails: TrussElementDetail[];
  archProfileLength?: number;
}

export interface TrussProfileData {
  id: string;
  name: string;
  category: ProfileCategory;
  sectionArea: number;
  sectionModulusX: number;
  sectionModulusY: number;
  momentOfInertiaX: number;
  momentOfInertiaY: number;
  radiusOfGyrationX: number;
  radiusOfGyrationY: number;
  weightPerMeter: number;
  retailPricePerMeter: number;
  yieldStrength: number;
}

export interface TrussRoofCoveringData {
  id: string;
  name: string;
  weightPerSqm: number;
  retailPricePerSqm: number;
  purchasePricePerSqm: number | null;
  width: number | null;
  usefulWidth: number | null;
  standardLength: number | null;
}
