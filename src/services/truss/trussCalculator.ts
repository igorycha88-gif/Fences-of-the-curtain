import {
  TrussCalculationInput,
  TrussCalculationResult,
  MaterialItem,
  ProfileRecommendation,
  TrussProfileData,
  TrussGeometryResult,
  TrussElementDetail,
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

  const elementDetails = buildElementDetails(geometry, input);

  const archProfileLength = geometry.archProfileBendLength;

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
    elementDetails,
    archProfileLength,
  };
}

export function getProfileForType(
  memberType: string,
  input: TrussCalculationInput,
): string {
  switch (memberType) {
    case 'bottom_chord': return input.crossbeamProfileName;
    case 'top_chord':
      return (input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED')
        ? (input.archProfileName ?? input.strutProfileName) : input.crossbeamProfileName;
    default: return input.strutProfileName;
  }
}

export function extractThickness(profileName: string): string {
  const match = profileName.match(/(\d+[.,]?\d*)\s*(?:мм|mm)/i);
  if (match) return match[1].replace(',', '.');
  const thickMatch = profileName.match(/(\d+(?:[.,]\d+)?)\s*[×xX]\s*\d+(?:[.,]\d+)?(?:[×xX]\s*(\d+(?:[.,]\d+)?))?/);
  if (thickMatch) {
    return thickMatch[2] ? thickMatch[2].replace(',', '.') : thickMatch[1].replace(',', '.');
  }
  const numMatch = profileName.match(/(\d+[.,]?\d*)$/);
  return numMatch ? numMatch[1].replace(',', '.') : '—';
}

export function buildElementDetails(
  geometry: TrussGeometryResult,
  input: TrussCalculationInput,
): TrussElementDetail[] {
  const details: TrussElementDetail[] = [];
  let vertIdx = 0;
  let diagIdx = 0;

  const bottomChordProfile = getProfileForType('bottom_chord', input);
  details.push({
    elementType: 'bottom_chord',
    elementLabel: 'НП-1',
    length: Math.round(geometry.span),
    bottomCutAngle: 90,
    topCutAngle: 90,
    profileName: bottomChordProfile,
    profileThickness: extractThickness(bottomChordProfile),
    quantity: 1,
  });

  const topChordProfile = getProfileForType('top_chord', input);
  const topChordThickness = extractThickness(topChordProfile);

  if (input.canopyType === 'DOUBLE_SLOPE') {
    const topChordMembers = geometry.members.filter(m => m.type === 'top_chord');
    const ridgeNode = geometry.nodes.find(n => n.type === 'ridge');
    const ridgeX = ridgeNode?.x ?? geometry.span / 2;

    const leftSlopeMembers = topChordMembers.filter(m => {
      const sn = geometry.nodes.find(n => n.id === m.startNodeId);
      const en = geometry.nodes.find(n => n.id === m.endNodeId);
      return ((sn!.x + en!.x) / 2) <= ridgeX;
    });
    const rightSlopeMembers = topChordMembers.filter(m => {
      const sn = geometry.nodes.find(n => n.id === m.startNodeId);
      const en = geometry.nodes.find(n => n.id === m.endNodeId);
      return ((sn!.x + en!.x) / 2) > ridgeX;
    });

    const leftLen = leftSlopeMembers.reduce((s, m) => s + m.length, 0);
    const rightLen = rightSlopeMembers.reduce((s, m) => s + m.length, 0);
    const slopeAngle = Math.round(geometry.slopeAngle * 10) / 10;

    details.push({
      elementType: 'top_chord',
      elementLabel: 'ВП-1',
      length: Math.round(leftLen),
      bottomCutAngle: geometry.edgeAngles?.leftAngle ?? 90,
      topCutAngle: slopeAngle,
      profileName: topChordProfile,
      profileThickness: topChordThickness,
      quantity: 1,
    });

    details.push({
      elementType: 'top_chord',
      elementLabel: 'ВП-2',
      length: Math.round(rightLen),
      bottomCutAngle: slopeAngle,
      topCutAngle: geometry.edgeAngles?.rightAngle ?? 90,
      profileName: topChordProfile,
      profileThickness: topChordThickness,
      quantity: 1,
    });
  } else {
    let topChordLength: number;
    if (input.canopyType === 'ARCH' || input.canopyType === 'SINGLE_SLOPE_CURVED') {
      topChordLength = geometry.arcLength ?? 0;
    } else {
      const topChordMembers = geometry.members.filter(m => m.type === 'top_chord');
      topChordLength = topChordMembers.reduce((s, m) => s + m.length, 0);
    }

    let bottomCut = 90;
    let topCut = 90;
    if (input.canopyType === 'SINGLE_SLOPE') {
      bottomCut = geometry.edgeAngles?.leftAngle ?? 90;
      topCut = geometry.edgeAngles?.rightAngle ?? 90;
    } else if (input.canopyType === 'ARCH') {
      bottomCut = geometry.edgeAngles?.leftAngle ?? 90;
      topCut = geometry.edgeAngles?.rightAngle ?? 90;
    }

    details.push({
      elementType: 'top_chord',
      elementLabel: 'ВП-1',
      length: Math.round(topChordLength),
      bottomCutAngle: bottomCut,
      topCutAngle: topCut,
      profileName: topChordProfile,
      profileThickness: topChordThickness,
      quantity: 1,
    });
  }

  const webMembers = geometry.members
    .filter(m => m.type === 'vertical' || m.type === 'diagonal')
    .sort((a, b) => a.id - b.id);

  for (const member of webMembers) {
    const profileName = getProfileForType(member.type, input);
    const thickness = extractThickness(profileName);

    let label = '';
    switch (member.type) {
      case 'vertical': label = `Стойка-${++vertIdx}`; break;
      case 'diagonal': label = `Раскос-${++diagIdx}`; break;
    }

    details.push({
      elementType: member.type,
      elementLabel: label,
      length: Math.round(member.length),
      bottomCutAngle: member.cutAngles?.bottomCutAngle ?? 90,
      topCutAngle: member.cutAngles?.topCutAngle ?? 90,
      profileName,
      profileThickness: thickness,
      quantity: 1,
    });
  }

  return groupIdenticalElements(details);
}

function groupIdenticalElements(details: TrussElementDetail[]): TrussElementDetail[] {
  const grouped: TrussElementDetail[] = [];
  const used = new Set<number>();

  for (let i = 0; i < details.length; i++) {
    if (used.has(i)) continue;
    const d = details[i];
    let count = 1;
    used.add(i);

    for (let j = i + 1; j < details.length; j++) {
      if (used.has(j)) continue;
      const other = details[j];
      if (
        other.elementType === d.elementType &&
        Math.abs(other.length - d.length) <= 1 &&
        Math.abs(other.bottomCutAngle - d.bottomCutAngle) <= 0.5 &&
        Math.abs(other.topCutAngle - d.topCutAngle) <= 0.5 &&
        other.profileName === d.profileName
      ) {
        count++;
        used.add(j);
      }
    }

    grouped.push({
      ...d,
      quantity: count,
    });
  }

  return grouped;
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
