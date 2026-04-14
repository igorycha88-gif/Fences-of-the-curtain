import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { generateTrussWord } from '@/services/truss/wordGenerator';
import { calculateTruss } from '@/services/truss/trussCalculator';
import { TrussProfileData } from '@/services/truss/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request, 'materials');
    if (authResult instanceof NextResponse) return authResult;

    const calc = await prisma.trussCalculation.findUnique({
      where: { id: params.id },
      include: {
        roofCovering: true,
        postProfile: true,
        crossbeamProfile: true,
        strutProfile: true,
        archProfile: true,
      },
    });

    if (!calc || !calc.isActive) {
      return NextResponse.json({ error: 'Расчёт не найден' }, { status: 404 });
    }

    const geometry = calc.trussGeometry as any;
    const materialList = calc.materialList as any[];

    const wordBuffer = await generateTrussWord({
      canopyType: calc.canopyType as any,
      width: calc.width,
      length: calc.length,
      ridgeHeight: calc.ridgeHeight,
      wallHeight: calc.wallHeight ?? undefined,
      trussSpacing: calc.trussSpacing,
      roofCoveringName: calc.roofCovering.name,
      calculation: {
        loads: {
          snowLoadNormative: calc.snowLoadNormative,
          snowLoadDesign: calc.snowLoad,
          windLoadNormative: calc.windLoadNormative,
          windLoadDesign: calc.windLoad,
          deadLoadNormative: calc.deadLoadNormative,
          deadLoadDesign: calc.deadLoad,
          totalLoadNormative: calc.totalLoadNormative,
          totalLoadDesign: calc.totalLoad,
          loadPerTruss: calc.loadPerTruss,
          loadPerMeter: calc.totalLoad,
          slopeAngle: calc.slopeAngle,
          snowCoeffMu: calc.snowCoeffMu,
          windCoeffC: calc.windCoeffC,
          windHeightCoeff: calc.windHeightCoeff,
        },
        geometry,
        memberForces: [],
        profileChecks: { bottomChord: { passed: true, utilizationRatio: 0.5, requiredSectionModulus: 0, actualSectionModulus: 0 }, topChord: { passed: true, utilizationRatio: 0.5, requiredSectionModulus: 0, actualSectionModulus: 0 }, verticals: { passed: true, utilizationRatio: 0.5, requiredSectionModulus: 0, actualSectionModulus: 0 }, diagonals: { passed: true, utilizationRatio: 0.5, requiredSectionModulus: 0, actualSectionModulus: 0 } },
        safetyFactor: calc.safetyFactor,
        allProfilesPassed: calc.safetyFactor >= 1.0,
        recommendations: (calc.profileRecommendations as any[]) ?? [],
        materialList,
        totalWeight: materialList.reduce((s: number, m: any) => s + (m.totalWeight ?? 0), 0),
        totalPrice: materialList.reduce((s: number, m: any) => s + (m.totalPrice ?? 0), 0),
        svgDrawing: calc.svgDrawing ?? '',
        elementDetails: [],
      },
    });

    const canopyTypeName = getCanopyTypeName(calc.canopyType as any);

    return new NextResponse(new Uint8Array(wordBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="truss_${calc.width}x${calc.length}.docx"; filename*=UTF-8''${encodeURIComponent(`ТЗ_Навес_${canopyTypeName}_${calc.width}x${calc.length}.docx`)}`,
      },
    });
  } catch (error: any) {
    console.error('[TRUSS-CALCULATION EXPORT GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function getCanopyTypeName(type: string): string {
  switch (type) {
    case 'SINGLE_SLOPE': return 'Односкатный';
    case 'DOUBLE_SLOPE': return 'Двухскатный';
    case 'ARCH': return 'Арочный';
    case 'SINGLE_SLOPE_CURVED': return 'Односкатный_дуга';
    default: return 'Навес';
  }
}
