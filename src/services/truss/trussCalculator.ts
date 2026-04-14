import {
  TrussCalculationInput,
  TrussCalculationResult,
  MaterialItem,
  ProfileRecommendation,
  TrussProfileData,
  TrussGeometryResult,
} from './types';
import { calculateLoads } from './loadCalculator';
import { calculateTrussGeometry } from './trussGeometry';
import { calculateMemberForces, checkAllProfiles, findRecommendedProfile } from './profileSelector';
import { generateTrussSvg } from './svgGenerator';

export function calculateTruss(
  input: TrussCalculationInput,
  allProfiles: TrussProfileData[],
): TrussCalculationResult {
  const geometry = calculateTrussGeometry(
    input.canopyType,
    input.width,
    input.ridgeHeight,
    input.wallHeight,
  );

  const avgHeight = (geometry.ridgeHeight + geometry.wallHeight) / 2;
  const totalProfileWeight = geometry.members.reduce((sum, m) => {
    let wpm = 0;
    if (m.type === 'bottom_chord') wpm = input.crossbeamWeightPerMeter;
    else if (m.type === 'top_chord') {
      wpm = input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED'
        ? (input.archWeightPerMeter ?? input.strutWeightPerMeter)
        : input.crossbeamWeightPerMeter;
    } else {
      wpm = input.strutWeightPerMeter;
    }
    return sum + (m.length / 1000) * wpm;
  }, 0);

  const tributaryArea = (input.width / 1000) * (input.trussSpacing / 1000);
  const structureWeightPerSqm = tributaryArea > 0 ? totalProfileWeight / tributaryArea : 0;

  const loads = calculateLoads({
    canopyType: input.canopyType,
    width: input.width,
    ridgeHeight: input.ridgeHeight,
    wallHeight: input.wallHeight,
    roofWeightPerSqm: input.roofWeightPerSqm,
    structureWeightPerSqm,
  });

  const loadPerTruss = loads.totalLoadDesign * (input.trussSpacing / 1000);
  loads.loadPerTruss = Math.round(loadPerTruss * 10) / 10;

  const bottomChordProfile: TrussProfileData = {
    id: input.crossbeamProfileId,
    name: input.crossbeamProfileName,
    category: 'CROSSBEAM',
    sectionArea: input.crossbeamSectionArea,
    sectionModulusX: input.crossbeamSectionModulusX,
    sectionModulusY: input.crossbeamSectionModulusX,
    momentOfInertiaX: 0,
    momentOfInertiaY: 0,
    radiusOfGyrationX: input.crossbeamRadiusOfGyrationX,
    radiusOfGyrationY: input.crossbeamRadiusOfGyrationX,
    weightPerMeter: input.crossbeamWeightPerMeter,
    retailPricePerMeter: input.crossbeamRetailPricePerMeter,
    yieldStrength: 235,
  };

  const topChordProfile: TrussProfileData = {
    id: input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED'
      ? (input.archProfileId ?? input.strutProfileId)
      : input.crossbeamProfileId,
    name: input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED'
      ? (input.archProfileName ?? input.strutProfileName)
      : input.crossbeamProfileName,
    category: 'CROSSBEAM',
    sectionArea: input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED'
      ? (input.archSectionArea ?? input.strutSectionArea)
      : input.crossbeamSectionArea,
    sectionModulusX: input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED'
      ? (input.archSectionModulusX ?? input.strutSectionModulusX)
      : input.crossbeamSectionModulusX,
    sectionModulusY: input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED'
      ? (input.archSectionModulusX ?? input.strutSectionModulusX)
      : input.crossbeamSectionModulusX,
    momentOfInertiaX: 0,
    momentOfInertiaY: 0,
    radiusOfGyrationX: input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED'
      ? (input.archRadiusOfGyrationX ?? input.strutRadiusOfGyrationX)
      : input.crossbeamRadiusOfGyrationX,
    radiusOfGyrationY: input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED'
      ? (input.archRadiusOfGyrationX ?? input.strutRadiusOfGyrationX)
      : input.crossbeamRadiusOfGyrationX,
    weightPerMeter: input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED'
      ? (input.archWeightPerMeter ?? input.strutWeightPerMeter)
      : input.crossbeamWeightPerMeter,
    retailPricePerMeter: input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED'
      ? (input.archRetailPricePerMeter ?? input.strutRetailPricePerMeter)
      : input.crossbeamRetailPricePerMeter,
    yieldStrength: 235,
  };

  const webProfile: TrussProfileData = {
    id: input.strutProfileId,
    name: input.strutProfileName,
    category: 'STRUT',
    sectionArea: input.strutSectionArea,
    sectionModulusX: input.strutSectionModulusX,
    sectionModulusY: input.strutSectionModulusX,
    momentOfInertiaX: 0,
    momentOfInertiaY: 0,
    radiusOfGyrationX: input.strutRadiusOfGyrationX,
    radiusOfGyrationY: input.strutRadiusOfGyrationX,
    weightPerMeter: input.strutWeightPerMeter,
    retailPricePerMeter: input.strutRetailPricePerMeter,
    yieldStrength: 235,
  };

  const memberForces = calculateMemberForces(loads.loadPerMeter, geometry);
  const profileChecks = checkAllProfiles(memberForces, geometry, bottomChordProfile, topChordProfile, webProfile);

  const allUtilizations = [
    profileChecks.bottomChord.utilizationRatio,
    profileChecks.topChord.utilizationRatio,
    profileChecks.verticals.utilizationRatio,
    profileChecks.diagonals.utilizationRatio,
  ];
  const maxUtilization = Math.max(...allUtilizations);
  const safetyFactor = maxUtilization > 0 ? Math.round((1 / maxUtilization) * 100) / 100 : 99;
  const allProfilesPassed = allUtilizations.every(u => u <= 1.0);

  const recommendations: ProfileRecommendation[] = [];
  if (!profileChecks.bottomChord.passed) {
    const rec = findRecommendedProfile('CROSSBEAM', profileChecks.bottomChord.utilizationRatio, bottomChordProfile.id, allProfiles);
    if (rec) recommendations.push({
      category: 'CROSSBEAM',
      currentProfileName: bottomChordProfile.name,
      currentUtilization: profileChecks.bottomChord.utilizationRatio,
      recommendedProfileId: rec.id,
      recommendedProfileName: rec.name,
      reason: `Нижний пояс: использование ${Math.round(profileChecks.bottomChord.utilizationRatio * 100)}%`,
    });
  }
  if (!profileChecks.topChord.passed) {
    const cat = (input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED') ? 'ARCH' : 'CROSSBEAM';
    const rec = findRecommendedProfile(cat, profileChecks.topChord.utilizationRatio, topChordProfile.id, allProfiles);
    if (rec) recommendations.push({
      category: cat as any,
      currentProfileName: topChordProfile.name,
      currentUtilization: profileChecks.topChord.utilizationRatio,
      recommendedProfileId: rec.id,
      recommendedProfileName: rec.name,
      reason: `Верхний пояс: использование ${Math.round(profileChecks.topChord.utilizationRatio * 100)}%`,
    });
  }
  if (!profileChecks.verticals.passed || !profileChecks.diagonals.passed) {
    const worstUtil = Math.max(profileChecks.verticals.utilizationRatio, profileChecks.diagonals.utilizationRatio);
    const rec = findRecommendedProfile('STRUT', worstUtil, webProfile.id, allProfiles);
    if (rec) recommendations.push({
      category: 'STRUT',
      currentProfileName: webProfile.name,
      currentUtilization: worstUtil,
      recommendedProfileId: rec.id,
      recommendedProfileName: rec.name,
      reason: `Решётка: использование ${Math.round(worstUtil * 100)}%`,
    });
  }

  const nTrusses = Math.floor(input.length / input.trussSpacing) + 1;
  const materialList = calculateMaterials(input, geometry, nTrusses);

  const totalWeight = materialList.reduce((sum, m) => sum + m.totalWeight, 0);
  const totalPrice = materialList.reduce((sum, m) => sum + m.totalPrice, 0);

  const svgDrawing = generateTrussSvg(geometry, input.canopyType);

  return {
    loads,
    geometry,
    memberForces,
    profileChecks,
    safetyFactor,
    allProfilesPassed,
    recommendations,
    materialList,
    totalWeight: Math.round(totalWeight * 10) / 10,
    totalPrice: Math.round(totalPrice * 10) / 10,
    svgDrawing,
  };
}

function calculateMaterials(
  input: TrussCalculationInput,
  geometry: TrussGeometryResult,
  nTrusses: number,
): MaterialItem[] {
  const materials: MaterialItem[] = [];
  const postHeight = Math.max(input.ridgeHeight, input.wallHeight ?? input.ridgeHeight * 0.5) + 300;

  materials.push({
    name: 'Столбы',
    profileName: input.postProfileName,
    profileCategory: 'POST',
    length: postHeight,
    count: (nTrusses + 1) * 2,
    totalLength: Math.round((postHeight * (nTrusses + 1) * 2) / 1000 * 100) / 100,
    weightPerMeter: input.postWeightPerMeter,
    totalWeight: Math.round(postHeight / 1000 * (nTrusses + 1) * 2 * input.postWeightPerMeter * 10) / 10,
    pricePerMeter: input.postRetailPricePerMeter,
    totalPrice: Math.round(postHeight / 1000 * (nTrusses + 1) * 2 * input.postRetailPricePerMeter * 100) / 100,
  });

  const purlinRows = input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED' ? 4 : 3;
  materials.push({
    name: 'Перекладины (прогоны)',
    profileName: input.crossbeamProfileName,
    profileCategory: 'CROSSBEAM',
    length: input.width,
    count: nTrusses * purlinRows,
    totalLength: Math.round(input.width / 1000 * nTrusses * purlinRows * 100) / 100,
    weightPerMeter: input.crossbeamWeightPerMeter,
    totalWeight: Math.round(input.width / 1000 * nTrusses * purlinRows * input.crossbeamWeightPerMeter * 10) / 10,
    pricePerMeter: input.crossbeamRetailPricePerMeter,
    totalPrice: Math.round(input.width / 1000 * nTrusses * purlinRows * input.crossbeamRetailPricePerMeter * 100) / 100,
  });

  const bottomChordMembers = geometry.members.filter(m => m.type === 'bottom_chord');
  const totalBottomLen = bottomChordMembers.reduce((s, m) => s + m.length, 0);
  materials.push({
    name: 'Нижний пояс фермы',
    profileName: input.crossbeamProfileName,
    profileCategory: 'CROSSBEAM',
    length: Math.round(totalBottomLen),
    count: nTrusses,
    totalLength: Math.round(totalBottomLen / 1000 * nTrusses * 100) / 100,
    weightPerMeter: input.crossbeamWeightPerMeter,
    totalWeight: Math.round(totalBottomLen / 1000 * nTrusses * input.crossbeamWeightPerMeter * 10) / 10,
    pricePerMeter: input.crossbeamRetailPricePerMeter,
    totalPrice: Math.round(totalBottomLen / 1000 * nTrusses * input.crossbeamRetailPricePerMeter * 100) / 100,
  });

  const topChordMembers = geometry.members.filter(m => m.type === 'top_chord');
  const totalTopLen = topChordMembers.reduce((s, m) => s + m.length, 0);
  const topProfileName = (input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED')
    ? (input.archProfileName ?? input.strutProfileName) : input.crossbeamProfileName;
  const topWPM = (input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED')
    ? (input.archWeightPerMeter ?? input.strutWeightPerMeter) : input.crossbeamWeightPerMeter;
  const topPPM = (input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED')
    ? (input.archRetailPricePerMeter ?? input.strutRetailPricePerMeter) : input.crossbeamRetailPricePerMeter;
  materials.push({
    name: 'Верхний пояс фермы',
    profileName: topProfileName,
    profileCategory: (input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED') ? 'ARCH' : 'CROSSBEAM',
    length: Math.round(totalTopLen),
    count: nTrusses,
    totalLength: Math.round(totalTopLen / 1000 * nTrusses * 100) / 100,
    weightPerMeter: topWPM,
    totalWeight: Math.round(totalTopLen / 1000 * nTrusses * topWPM * 10) / 10,
    pricePerMeter: topPPM,
    totalPrice: Math.round(totalTopLen / 1000 * nTrusses * topPPM * 100) / 100,
  });

  const verticalMembers = geometry.members.filter(m => m.type === 'vertical');
  const totalVertLen = verticalMembers.reduce((s, m) => s + m.length, 0);
  materials.push({
    name: 'Вертикальные стойки',
    profileName: input.strutProfileName,
    profileCategory: 'STRUT',
    length: Math.round(totalVertLen / verticalMembers.length),
    count: verticalMembers.length * nTrusses,
    totalLength: Math.round(totalVertLen / 1000 * nTrusses * 100) / 100,
    weightPerMeter: input.strutWeightPerMeter,
    totalWeight: Math.round(totalVertLen / 1000 * nTrusses * input.strutWeightPerMeter * 10) / 10,
    pricePerMeter: input.strutRetailPricePerMeter,
    totalPrice: Math.round(totalVertLen / 1000 * nTrusses * input.strutRetailPricePerMeter * 100) / 100,
  });

  const diagonalMembers = geometry.members.filter(m => m.type === 'diagonal');
  const totalDiagLen = diagonalMembers.reduce((s, m) => s + m.length, 0);
  materials.push({
    name: 'Диагональные раскосы',
    profileName: input.strutProfileName,
    profileCategory: 'STRUT',
    length: Math.round(totalDiagLen / diagonalMembers.length),
    count: diagonalMembers.length * nTrusses,
    totalLength: Math.round(totalDiagLen / 1000 * nTrusses * 100) / 100,
    weightPerMeter: input.strutWeightPerMeter,
    totalWeight: Math.round(totalDiagLen / 1000 * nTrusses * input.strutWeightPerMeter * 10) / 10,
    pricePerMeter: input.strutRetailPricePerMeter,
    totalPrice: Math.round(totalDiagLen / 1000 * nTrusses * input.strutRetailPricePerMeter * 100) / 100,
  });

  const roofSlopeLen = geometry.members
    .filter(m => m.type === 'top_chord')
    .reduce((s, m) => s + m.length, 0) / 1000;
  const roofArea = roofSlopeLen * (input.length / 1000);
  materials.push({
    name: 'Кровельное покрытие',
    profileName: '—',
    profileCategory: 'POST',
    length: 0,
    count: Math.ceil(roofArea),
    totalLength: 0,
    weightPerMeter: input.roofWeightPerSqm,
    totalWeight: Math.round(roofArea * input.roofWeightPerSqm * 10) / 10,
    pricePerMeter: input.roofRetailPricePerSqm,
    totalPrice: Math.round(roofArea * input.roofRetailPricePerSqm * 100) / 100,
  });

  return materials;
}
