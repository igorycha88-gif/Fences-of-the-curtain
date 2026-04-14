import { TrussProfileData, ProfileCheckResult, MemberForce, ProfileCategory } from './types';

const RY = 235;
const GAMMA_C = 0.9;
const MU_EFF_CHORD = 0.8;
const MU_EFF_WEB = 0.9;

function bucklingCoeff(slenderness: number): number {
  if (slenderness <= 0) return 1.0;
  if (slenderness <= 40) return 1.0 - 0.004 * slenderness;
  if (slenderness <= 100) return 0.84 - 0.005 * (slenderness - 40);
  if (slenderness <= 150) return 0.54 - 0.004 * (slenderness - 100);
  return Math.max(0.14, 0.34 - 0.001 * (slenderness - 150));
}

function checkProfile(
  axialForce: number,
  bendingMoment: number,
  effectiveLength: number,
  profile: TrussProfileData,
  isCompression: boolean,
  memberType: string,
): ProfileCheckResult {
  const W = profile.sectionModulusX;
  const A = profile.sectionArea;
  const i = profile.radiusOfGyrationX;

  const sigmaBending = bendingMoment > 0 ? (bendingMoment * 100) / (W * 0.001) / 10 : 0;
  const sigmaDirect = axialForce > 0 ? (axialForce * 9.81) / (A * 100) / 10 : 0;

  let sigmaMax: number;
  if (isCompression && axialForce > 0) {
    const mu = (memberType === 'vertical' || memberType === 'diagonal') ? MU_EFF_WEB : MU_EFF_CHORD;
    const lef = effectiveLength * mu;
    const lambda = (lef / 10) / i;
    const phi = bucklingCoeff(lambda);
    sigmaMax = (axialForce * 9.81) / (phi * A * 100);
    if (sigmaBending > 0) {
      sigmaMax += sigmaBending;
    }
  } else {
    sigmaMax = sigmaDirect + sigmaBending;
  }

  const limitStress = RY * GAMMA_C * 10;
  const utilization = sigmaMax / limitStress;
  const passed = utilization <= 1.0;

  return {
    passed,
    utilizationRatio: Math.round(utilization * 100) / 100,
    requiredSectionModulus: bendingMoment > 0 ? (bendingMoment * 100) / (limitStress * 0.001 * 10) : 0,
    actualSectionModulus: W,
    failureReason: passed ? undefined : `Использование профиля ${Math.round(utilization * 100)}%. Превышен предел прочности.`,
  };
}

export function calculateMemberForces(
  loadPerMeter: number,
  geometry: { span: number; ridgeHeight: number; wallHeight: number; panelCount: number; panelLength: number; members: Array<{ id: number; type: string; length: number; angle: number }> },
): MemberForce[] {
  const q = loadPerMeter;
  const L = geometry.span;
  const h = Math.max(geometry.ridgeHeight - geometry.wallHeight, 100);
  const forces: MemberForce[] = [];

  for (const member of geometry.members) {
    let axialForce = 0;
    let isCompression = false;
    let bendingMoment = 0;
    let effectiveLength = member.length;

    switch (member.type) {
      case 'bottom_chord': {
        axialForce = q * L * L / (8 * h) / 1000;
        isCompression = false;
        bendingMoment = q * member.length * member.length / 8 / 1e6;
        effectiveLength = member.length * MU_EFF_CHORD;
        break;
      }
      case 'top_chord': {
        const cosA = Math.abs(Math.cos(member.angle * Math.PI / 180));
        const chordForce = cosA > 0.1 ? (q * L * L / (8 * h)) / 1000 / cosA : (q * L * L / (8 * h)) / 1000;
        axialForce = chordForce;
        isCompression = true;
        bendingMoment = q * member.length * member.length / 8 / 1e6;
        effectiveLength = member.length * MU_EFF_CHORD;
        break;
      }
      case 'vertical': {
        axialForce = q * geometry.panelLength / 1000;
        isCompression = true;
        effectiveLength = member.length * MU_EFF_WEB;
        break;
      }
      case 'diagonal': {
        const sinA = Math.abs(Math.sin(member.angle * Math.PI / 180));
        const panelLoad = q * geometry.panelLength / 1000;
        axialForce = sinA > 0.1 ? panelLoad / sinA : panelLoad * 1.5;
        isCompression = true;
        effectiveLength = member.length * MU_EFF_WEB;
        break;
      }
    }

    forces.push({
      memberId: member.id,
      axialForce: Math.round(axialForce * 100) / 100,
      isCompression,
      bendingMoment: Math.round(bendingMoment * 1000) / 1000,
      effectiveLength: Math.round(effectiveLength),
    });
  }

  return forces;
}

export function checkAllProfiles(
  memberForces: MemberForce[],
  geometry: { members: Array<{ id: number; type: string }> },
  bottomChordProfile: TrussProfileData,
  topChordProfile: TrussProfileData,
  webProfile: TrussProfileData,
): {
  bottomChord: ProfileCheckResult;
  topChord: ProfileCheckResult;
  verticals: ProfileCheckResult;
  diagonals: ProfileCheckResult;
} {
  let worstVerticalUtil = 0;
  let worstDiagUtil = 0;
  let worstVertCheck: ProfileCheckResult = { passed: true, utilizationRatio: 0, requiredSectionModulus: 0, actualSectionModulus: webProfile.sectionModulusX };
  let worstDiagCheck: ProfileCheckResult = { passed: true, utilizationRatio: 0, requiredSectionModulus: 0, actualSectionModulus: webProfile.sectionModulusX };

  for (const force of memberForces) {
    const member = geometry.members.find(m => m.id === force.memberId);
    if (!member) continue;

    if (member.type === 'vertical') {
      const check = checkProfile(force.axialForce, force.bendingMoment, force.effectiveLength, webProfile, force.isCompression, member.type);
      if (check.utilizationRatio > worstVerticalUtil) {
        worstVerticalUtil = check.utilizationRatio;
        worstVertCheck = check;
      }
    } else if (member.type === 'diagonal') {
      const check = checkProfile(force.axialForce, force.bendingMoment, force.effectiveLength, webProfile, force.isCompression, member.type);
      if (check.utilizationRatio > worstDiagUtil) {
        worstDiagUtil = check.utilizationRatio;
        worstDiagCheck = check;
      }
    }
  }

  return {
    bottomChord: checkWorstInCategory(memberForces, geometry, 'bottom_chord', bottomChordProfile),
    topChord: checkWorstInCategory(memberForces, geometry, 'top_chord', topChordProfile),
    verticals: worstVertCheck,
    diagonals: worstDiagCheck,
  };
}

function checkWorstInCategory(
  forces: MemberForce[],
  geometry: { members: Array<{ id: number; type: string }> },
  memberType: string,
  profile: TrussProfileData,
): ProfileCheckResult {
  let worst: ProfileCheckResult = { passed: true, utilizationRatio: 0, requiredSectionModulus: 0, actualSectionModulus: profile.sectionModulusX };

  for (const force of forces) {
    const member = geometry.members.find(m => m.id === force.memberId);
    if (!member || member.type !== memberType) continue;

    const check = checkProfile(force.axialForce, force.bendingMoment, force.effectiveLength, profile, force.isCompression, member.type);
    if (check.utilizationRatio > worst.utilizationRatio) {
      worst = check;
    }
  }

  return worst;
}

export function findRecommendedProfile(
  category: ProfileCategory,
  currentUtilization: number,
  currentProfileId: string,
  allProfiles: TrussProfileData[],
): TrussProfileData | null {
  if (currentUtilization <= 1.0) return null;

  const currentProfile = allProfiles.find(p => p.id === currentProfileId);
  const currentModulus = currentProfile?.sectionModulusX ?? 0;

  const sorted = allProfiles
    .filter(p => p.category === category && p.id !== currentProfileId)
    .sort((a, b) => a.sectionModulusX - b.sectionModulusX);

  for (const profile of sorted) {
    if (currentModulus > 0) {
      const estimatedUtil = currentUtilization * (currentModulus / profile.sectionModulusX);
      if (estimatedUtil <= 1.0) return profile;
    } else {
      if (profile.sectionModulusX > 0) return profile;
    }
  }

  return sorted.length > 0 ? sorted[sorted.length - 1] : null;
}
