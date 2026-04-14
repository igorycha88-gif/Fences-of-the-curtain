import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { saveTrussCalculationSchema } from '@/lib/validators/trussCalculator';
import { calculateTruss } from '@/services/truss/trussCalculator';
import { TrussProfileData } from '@/services/truss/types';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const calculations = await prisma.trussCalculation.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        roofCovering: { select: { name: true } },
        postProfile: { select: { name: true } },
        crossbeamProfile: { select: { name: true } },
        topChordProfile: { select: { name: true } },
        strutProfile: { select: { name: true } },
        archProfile: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ calculations });
  } catch (error) {
    console.error('[TRUSS-CALCULATIONS GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;
    const { session } = authResult;

    const body = await request.json();
    const data = saveTrussCalculationSchema.parse(body);

    const [roofCovering, postProfile, crossbeamProfile, topChordProfile, strutProfile, archProfile, allProfiles] = await Promise.all([
      prisma.trussRoofCovering.findUniqueOrThrow({ where: { id: data.roofCoveringId } }),
      prisma.trussProfileType.findUniqueOrThrow({ where: { id: data.postProfileId } }),
      prisma.trussProfileType.findUniqueOrThrow({ where: { id: data.crossbeamProfileId } }),
      data.topChordProfileId ? prisma.trussProfileType.findUnique({ where: { id: data.topChordProfileId } }) : null,
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
      topChordProfileId: topChordProfile?.id,
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
      topChordSectionArea: topChordProfile?.sectionArea,
      topChordSectionModulusX: topChordProfile?.sectionModulusX,
      topChordRadiusOfGyrationX: topChordProfile?.radiusOfGyrationX,
      topChordWeightPerMeter: topChordProfile?.weightPerMeter,
      topChordRetailPricePerMeter: topChordProfile?.retailPricePerMeter,
      topChordProfileName: topChordProfile?.name,
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

    const calculation = await prisma.trussCalculation.create({
      data: {
        name: data.name,
        canopyType: data.canopyType as any,
        width: data.width,
        length: data.length,
        ridgeHeight: data.ridgeHeight,
        wallHeight: data.wallHeight,
        trussSpacing: data.trussSpacing,
        roofCoveringId: data.roofCoveringId,
        postProfileId: data.postProfileId,
        crossbeamProfileId: data.crossbeamProfileId,
        topChordProfileId: data.topChordProfileId || null,
        strutProfileId: data.strutProfileId,
        archProfileId: data.archProfileId || null,
        snowLoad: result.loads.snowLoadDesign,
        windLoad: result.loads.windLoadDesign,
        deadLoad: result.loads.deadLoadDesign,
        totalLoad: result.loads.totalLoadDesign,
        snowLoadNormative: result.loads.snowLoadNormative,
        windLoadNormative: result.loads.windLoadNormative,
        deadLoadNormative: result.loads.deadLoadNormative,
        totalLoadNormative: result.loads.totalLoadNormative,
        loadPerTruss: result.loads.loadPerTruss,
        safetyFactor: result.safetyFactor,
        trussGeometry: result.geometry as any,
        materialList: result.materialList as any,
        profileRecommendations: result.recommendations as any,
        svgDrawing: result.svgDrawing,
        snowCoeffMu: result.loads.snowCoeffMu,
        windCoeffC: result.loads.windCoeffC,
        windHeightCoeff: result.loads.windHeightCoeff,
        slopeAngle: result.loads.slopeAngle,
        createdBy: session.userId,
      },
    });

    return NextResponse.json({ id: calculation.id, result }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }
    console.error('[TRUSS-CALCULATIONS POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
