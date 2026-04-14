export interface SectionProperties {
  sectionArea: number;
  momentOfInertiaX: number;
  momentOfInertiaY: number;
  sectionModulusX: number;
  sectionModulusY: number;
  radiusOfGyrationX: number;
  radiusOfGyrationY: number;
  weightPerMeter: number;
}

export function calculateSectionProperties(
  sectionWidth: number,
  sectionHeight: number,
  wallThickness: number,
): SectionProperties {
  const W = sectionWidth;
  const H = sectionHeight;
  const t = wallThickness;
  const Wi = W - 2 * t;
  const Hi = H - 2 * t;

  const sectionArea = 2 * (W + H - 2 * t) * t / 100;

  const momentOfInertiaX = Math.max(0, (Math.pow(H, 3) * W - Math.pow(Hi, 3) * Wi) / 12 / 10000);
  const momentOfInertiaY = Math.max(0, (Math.pow(W, 3) * H - Math.pow(Wi, 3) * Hi) / 12 / 10000);

  const sectionModulusX = H > 0 ? momentOfInertiaX / (H / 200) : 0;
  const sectionModulusY = W > 0 ? momentOfInertiaY / (W / 200) : 0;

  const radiusOfGyrationX = sectionArea > 0 ? Math.sqrt(momentOfInertiaX / sectionArea) : 0;
  const radiusOfGyrationY = sectionArea > 0 ? Math.sqrt(momentOfInertiaY / sectionArea) : 0;

  const weightPerMeter = sectionArea * 100 * 7.85 / 100;

  return {
    sectionArea: Math.round(sectionArea * 100) / 100,
    momentOfInertiaX: Math.round(momentOfInertiaX * 100) / 100,
    momentOfInertiaY: Math.round(momentOfInertiaY * 100) / 100,
    sectionModulusX: Math.round(sectionModulusX * 100) / 100,
    sectionModulusY: Math.round(sectionModulusY * 100) / 100,
    radiusOfGyrationX: Math.round(radiusOfGyrationX * 100) / 100,
    radiusOfGyrationY: Math.round(radiusOfGyrationY * 100) / 100,
    weightPerMeter: Math.round(weightPerMeter * 100) / 100,
  };
}
