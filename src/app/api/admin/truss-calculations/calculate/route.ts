import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { trussCalculationRequestSchema } from '@/lib/validators/trussCalculator';
import { calculateTruss } from '@/services/truss/trussCalculator';
import { ZodError } from 'zod';
import { TrussProfileData } from '@/services/truss/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const data = trussCalculationRequestSchema.parse(body);

    const [roofCovering, postProfile, crossbeamProfile, strutProfile, archProfile, allProfiles] = await Promise.all([
      prisma.trussRoofCovering.findUniqueOrThrow({ where: { id: data.roofCoveringId } }),
      prisma.trussProfileType.findUniqueOrThrow({ where: { id: data.postProfileId } }),
      prisma.trussProfileType.findUniqueOrThrow({ where: { id: data.crossbeamProfileId } }),
      prisma.trussProfileType.findUniqueOrThrow({ where: { id: data.strutProfileId } }),
      data.archProfileId ? prisma.trussProfileType.findUnique({ where: { id: data.archProfileId } }) : null,
      prisma.trussProfileType.findMany({ where: { isActive: true } }),
    ]);

    const allProfileData: TrussProfileData[] = allProfiles.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category as any,
      sectionArea: p.sectionArea,
      sectionModulusX: p.sectionModulusX,
      sectionModulusY: p.sectionModulusY,
      momentOfInertiaX: p.momentOfInertiaX,
      momentOfInertiaY: p.momentOfInertiaY,
      radiusOfGyrationX: p.radiusOfGyrationX,
      radiusOfGyrationY: p.radiusOfGyrationY,
      weightPerMeter: p.weightPerMeter,
      retailPricePerMeter: p.retailPricePerMeter,
      yieldStrength: p.yieldStrength,
    }));

    const result = calculateTruss({
      canopyType: data.canopyType,
      width: data.width,
      length: data.length,
      ridgeHeight: data.ridgeHeight,
      wallHeight: data.wallHeight,
      trussSpacing: data.trussSpacing,
      roofCoveringId: data.roofCoveringId,
      roofWeightPerSqm: roofCovering.weightPerSqm,
      roofRetailPricePerSqm: roofCovering.retailPricePerSqm,
      postProfileId: postProfile.id,
      crossbeamProfileId: crossbeamProfile.id,
      strutProfileId: strutProfile.id,
      archProfileId: archProfile?.id,
      postSectionArea: postProfile.sectionArea,
      postSectionModulusX: postProfile.sectionModulusX,
      postRadiusOfGyrationX: postProfile.radiusOfGyrationX,
      postWeightPerMeter: postProfile.weightPerMeter,
      postRetailPricePerMeter: postProfile.retailPricePerMeter,
      postProfileName: postProfile.name,
      crossbeamSectionArea: crossbeamProfile.sectionArea,
      crossbeamSectionModulusX: crossbeamProfile.sectionModulusX,
      crossbeamRadiusOfGyrationX: crossbeamProfile.radiusOfGyrationX,
      crossbeamWeightPerMeter: crossbeamProfile.weightPerMeter,
      crossbeamRetailPricePerMeter: crossbeamProfile.retailPricePerMeter,
      crossbeamProfileName: crossbeamProfile.name,
      strutSectionArea: strutProfile.sectionArea,
      strutSectionModulusX: strutProfile.sectionModulusX,
      strutRadiusOfGyrationX: strutProfile.radiusOfGyrationX,
      strutWeightPerMeter: strutProfile.weightPerMeter,
      strutRetailPricePerMeter: strutProfile.retailPricePerMeter,
      strutProfileName: strutProfile.name,
      archSectionArea: archProfile?.sectionArea,
      archSectionModulusX: archProfile?.sectionModulusX,
      archRadiusOfGyrationX: archProfile?.radiusOfGyrationX,
      archWeightPerMeter: archProfile?.weightPerMeter,
      archRetailPricePerMeter: archProfile?.retailPricePerMeter,
      archProfileName: archProfile?.name,
    }, allProfileData);

    return NextResponse.json({ result, roofCoveringName: roofCovering.name });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }
    console.error('[TRUSS-CALCULATE POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
