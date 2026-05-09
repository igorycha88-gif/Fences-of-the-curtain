import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { ordersService } from '@/services/admin/ordersService';
import { generateEstimateWord, WordEstimateData, WordEstimateSection } from '@/services/word/estimateWordGenerator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(req, 'orders');
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const data = await ordersService.getOrderFull(id, authResult.session.role);
    if (!data) {
      return NextResponse.json(
        { error: 'ORDER_NOT_FOUND', message: 'Заявка не найдена' },
        { status: 404 }
      );
    }

    const { order, estimate, adminEstimate, multiEstimates } = data;
    const isMultiEstimate = !!multiEstimates && multiEstimates.length > 0;
    const isIndividualRequest = order.serviceType === 'INDIVIDUAL_CALCULATION' || (!estimate && !adminEstimate && !multiEstimates);

    if (isIndividualRequest) {
      return NextResponse.json(
        { error: 'NO_ESTIMATE', message: 'В заявке нет сметы для экспорта' },
        { status: 400 }
      );
    }

    const estimateSections: WordEstimateSection[] = [];

    if (isMultiEstimate && multiEstimates) {
      for (const est of multiEstimates) {
        const correction = (est as any).adminCorrection;

        let effectiveItems = (correction || est).items || [];
        let effectiveMaterialsTotal = (correction || est).materialsTotal;
        let effectiveInstallationTotal = (correction || est).installationTotal;
        let effectiveGrandTotal = (correction || est).grandTotal;

        if (correction) {
          const sourceItems = est.items || [];
          const adminItems = correction.items || [];
          const sourceMap = new Map(
            sourceItems
              .filter((i: any) => i.nomenclatureId)
              .map((i: any) => [i.nomenclatureId!, i])
          );
          const deletedIds = new Set<string>();
          for (const [id] of sourceMap) {
            const inAdmin = adminItems.find((ai: any) => ai.nomenclatureId === id);
            if (!inAdmin) deletedIds.add(id as string);
          }

          effectiveItems = effectiveItems.filter((item: any) => {
            const nid = item.nomenclatureId as string | undefined;
            return !nid || !deletedIds.has(nid);
          });

          effectiveMaterialsTotal = effectiveItems
            .filter((i: any) => i.category !== 'installation')
            .reduce((s: number, i: any) => s + (i.totalPrice || 0), 0);
          effectiveInstallationTotal = effectiveItems
            .filter((i: any) => i.category === 'installation')
            .reduce((s: number, i: any) => s + (i.totalPrice || 0), 0);
          effectiveGrandTotal = effectiveMaterialsTotal + effectiveInstallationTotal;
        }

        const materials = effectiveItems
          .filter((i: any) => i.category !== 'installation')
          .map((i: any) => ({
            name: i.nomenclatureName,
            unit: i.unit,
            quantity: i.quantity,
            pricePerUnit: i.pricePerUnit,
            totalPrice: i.totalPrice,
          }));

        const works = effectiveItems
          .filter((i: any) => i.category === 'installation')
          .map((i: any) => ({
            name: i.nomenclatureName,
            unit: i.unit,
            quantity: i.quantity,
            pricePerUnit: i.pricePerUnit,
            totalPrice: i.totalPrice,
          }));

        estimateSections.push({
          fenceTypeName: est.fenceType.name,
          length: est.length,
          height: est.height,
          lagRows: est.lagRows,
          coatingLabel: est.coatingLabel,
          hasGate: est.hasGate,
          gateTypeLabel: est.gateTypeLabel,
          gateLength: est.gateLength,
          hasWicket: est.hasWicket,
          wicketWidth: est.wicketWidth,
          materials,
          works,
          materialsTotal: effectiveMaterialsTotal,
          installationTotal: effectiveInstallationTotal,
          grandTotal: effectiveGrandTotal,
        });
      }
    } else {
      const effective = adminEstimate || estimate;
      if (!effective) {
        return NextResponse.json(
          { error: 'NO_ESTIMATE', message: 'В заявке нет сметы для экспорта' },
          { status: 400 }
        );
      }

      let effectiveItems = effective.items || [];

      if (adminEstimate && estimate) {
        const sourceItems = estimate.items || [];
        const adminItems = adminEstimate.items || [];
        const sourceMap = new Map(
          sourceItems
            .filter((i: any) => i.nomenclatureId)
            .map((i: any) => [i.nomenclatureId!, i])
        );
        const deletedIds = new Set<string>();
        for (const [id] of sourceMap) {
          const inAdmin = adminItems.find((ai: any) => ai.nomenclatureId === id);
          if (!inAdmin) deletedIds.add(id as string);
        }
        effectiveItems = effectiveItems.filter((item: any) => {
          const nid = item.nomenclatureId as string | undefined;
          return !nid || !deletedIds.has(nid);
        });
      }

      const materials = effectiveItems
        .filter((i: any) => i.category !== 'installation')
        .map((i: any) => ({
          name: i.nomenclatureName,
          unit: i.unit,
          quantity: i.quantity,
          pricePerUnit: i.pricePerUnit,
          totalPrice: i.totalPrice,
        }));

      const works = effectiveItems
        .filter((i: any) => i.category === 'installation')
        .map((i: any) => ({
          name: i.nomenclatureName,
          unit: i.unit,
          quantity: i.quantity,
          pricePerUnit: i.pricePerUnit,
          totalPrice: i.totalPrice,
        }));

      estimateSections.push({
        fenceTypeName: effective.fenceType.name,
        length: effective.length,
        height: effective.height,
        lagRows: effective.lagRows,
        coatingLabel: effective.coatingLabel,
        hasGate: effective.hasGate,
        gateTypeLabel: effective.gateTypeLabel,
        gateLength: effective.gateLength,
        hasWicket: effective.hasWicket,
        wicketWidth: effective.wicketWidth,
        materials,
        works,
        materialsTotal: effective.materialsTotal,
        installationTotal: effective.installationTotal,
        grandTotal: effective.grandTotal,
      });
    }

    if (estimateSections.length === 0) {
      return NextResponse.json(
        { error: 'NO_ESTIMATE', message: 'В заявке нет сметы для экспорта' },
        { status: 400 }
      );
    }

    const totalMaterials = estimateSections.reduce((s, e) => s + e.materialsTotal, 0);
    const totalInstallation = estimateSections.reduce((s, e) => s + e.installationTotal, 0);
    const grandTotal = estimateSections.reduce((s, e) => s + e.grandTotal, 0);

    const wordData: WordEstimateData = {
      orderId: order.id,
      clientName: order.clientName,
      createdAt: order.createdAt,
      measurementAddress: order.measurementAddress,
      estimates: estimateSections,
      totalMaterials,
      totalInstallation,
      grandTotal,
    };

    const buffer = await generateEstimateWord(wordData);

    const fileName = `смета_заявка_${order.id.slice(0, 8)}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="estimate_${order.id.slice(0, 8)}.docx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error('[API] Error in GET /api/admin/orders/[id]/export-estimate-word:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
