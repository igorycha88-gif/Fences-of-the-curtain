import { prisma } from '@/lib/prisma';
import { GateEstimateInput } from '@/lib/validators/gateEstimate';
import { findGateByTypeAndLength, GateTypeValue } from './gateLookup';
import { findWicketByHeightAndWidth } from './wicketLookup';
import { findAutomationById } from './automationLookup';
import { workService } from '@/services/admin/workService';
import { getCityByIP } from '@/services/admin/ipLookupService';

export interface GateEstimateItem {
  category: 'gates' | 'wickets' | 'automation' | 'installation';
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export interface GateParameterInfo {
  type: string;
  width: number;
  height: number;
  selectedName: string;
}

export interface WicketParameterInfo {
  width: number;
  height: number;
  selectedName: string;
}

export interface GateEstimateCoreResult {
  items: GateEstimateItem[];
  totals: {
    materials: number;
    installation: number;
    grandTotal: number;
  };
  parameters: {
    height: number;
    needsInstallation: boolean;
    gates: GateParameterInfo[];
    wickets: WicketParameterInfo[];
  };
}

export interface GateEstimateResult {
  estimateId: string;
  items: GateEstimateItem[];
  totals: {
    materials: number;
    installation: number;
    grandTotal: number;
  };
  parameters: {
    height: number;
    needsInstallation: boolean;
    gates: GateParameterInfo[];
    wickets: WicketParameterInfo[];
  };
  calculatedAt: string;
}

export interface CalculationError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export async function calculateGateEstimateCore(
  input: GateEstimateInput
): Promise<GateEstimateCoreResult> {
  const { height, needsInstallation, gates, wickets } = input;
  const heightMm = Math.round(height * 1000);

  const items: GateEstimateItem[] = [];
  let materialsTotal = 0;
  let installationTotal = 0;

  const gateParameters: GateParameterInfo[] = [];
  const wicketParameters: WicketParameterInfo[] = [];

  for (const gateInput of gates) {
    const gateWidthMm = Math.round(gateInput.gateWidth * 1000);
    const selectedGate = await findGateByTypeAndLength(
      gateInput.gateType as GateTypeValue,
      gateWidthMm,
      heightMm
    );

    const gateParam: GateParameterInfo = {
      type: selectedGate.type,
      width: selectedGate.gateLength,
      height: selectedGate.gateHeight,
      selectedName: selectedGate.name,
    };
    gateParameters.push(gateParam);

    items.push({
      category: 'gates',
      nomenclatureId: selectedGate.id,
      nomenclatureName: selectedGate.name,
      quantity: 1,
      unit: 'шт',
      pricePerUnit: selectedGate.retailPrice,
      totalPrice: selectedGate.retailPrice,
    });
    materialsTotal += selectedGate.retailPrice;

    if (needsInstallation) {
      const gateWorks = await workService.getWorksForCalculatorByReference('GATE', selectedGate.id);
      for (const work of gateWorks) {
        items.push({
          category: 'installation',
          nomenclatureId: work.id,
          nomenclatureName: work.name,
          quantity: 1,
          unit: 'шт',
          pricePerUnit: work.price,
          totalPrice: work.price,
        });
        installationTotal += work.price;
      }
    }

    if (gateInput.gateType === 'SLIDING' && gateInput.hasAutomation && gateInput.automationId) {
      const selectedAutomation = await findAutomationById(gateInput.automationId);

      items.push({
        category: 'automation',
        nomenclatureId: selectedAutomation.id,
        nomenclatureName: selectedAutomation.name,
        quantity: 1,
        unit: 'шт',
        pricePerUnit: selectedAutomation.retailPrice,
        totalPrice: selectedAutomation.retailPrice,
      });
      materialsTotal += selectedAutomation.retailPrice;

      if (needsInstallation) {
        const automationWorks = await workService.getWorksForCalculatorByReference(
          'AUTOMATION',
          selectedAutomation.id
        );
        for (const work of automationWorks) {
          items.push({
            category: 'installation',
            nomenclatureId: work.id,
            nomenclatureName: work.name,
            quantity: 1,
            unit: 'шт',
            pricePerUnit: work.price,
            totalPrice: work.price,
          });
          installationTotal += work.price;
        }
      }
    }
  }

  for (const wicketInput of wickets) {
    const wicketWidthMm = Math.round(wicketInput.wicketWidth * 1000);
    const selectedWicket = await findWicketByHeightAndWidth(heightMm, wicketWidthMm);

    const wicketParam: WicketParameterInfo = {
      width: selectedWicket.wicketLength,
      height: selectedWicket.wicketHeight,
      selectedName: selectedWicket.name,
    };
    wicketParameters.push(wicketParam);

    items.push({
      category: 'wickets',
      nomenclatureId: selectedWicket.id,
      nomenclatureName: selectedWicket.name,
      quantity: 1,
      unit: 'шт',
      pricePerUnit: selectedWicket.retailPrice,
      totalPrice: selectedWicket.retailPrice,
    });
    materialsTotal += selectedWicket.retailPrice;

    if (needsInstallation) {
      const wicketWorks = await workService.getWorksForCalculatorByReference('WICKET', selectedWicket.id);
      for (const work of wicketWorks) {
        items.push({
          category: 'installation',
          nomenclatureId: work.id,
          nomenclatureName: work.name,
          quantity: 1,
          unit: 'шт',
          pricePerUnit: work.price,
          totalPrice: work.price,
        });
        installationTotal += work.price;
      }
    }
  }

  const grandTotal = materialsTotal + installationTotal;

  return {
    items,
    totals: {
      materials: materialsTotal,
      installation: installationTotal,
      grandTotal,
    },
    parameters: {
      height,
      needsInstallation,
      gates: gateParameters,
      wickets: wicketParameters,
    },
  };
}

export async function calculateGateEstimate(
  input: GateEstimateInput,
  metadata?: { userId?: string; sessionId?: string; userAgent?: string; ipAddress?: string }
): Promise<GateEstimateResult> {
  const coreResult = await calculateGateEstimateCore(input);

  const estimate = await prisma.gateEstimate.create({
    data: {
      id: `gate-${crypto.randomUUID()}`,
      height: input.height,
      needsInstallation: input.needsInstallation,
      materialsTotal: coreResult.totals.materials,
      installationTotal: coreResult.totals.installation,
      grandTotal: coreResult.totals.grandTotal,
      items: JSON.parse(JSON.stringify(coreResult.items)),
      userId: metadata?.userId,
      sessionId: metadata?.sessionId,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
      city: null,
    },
  });

  if (metadata?.ipAddress) {
    getCityByIP(metadata.ipAddress)
      .then(city => {
        if (city) {
          return prisma.gateEstimate.update({
            where: { id: estimate.id },
            data: { city },
          });
        }
        return null;
      })
      .catch(err => console.error('[GateEstimate] IP Lookup failed:', err));
  }

  return {
    estimateId: estimate.id,
    items: coreResult.items,
    totals: coreResult.totals,
    parameters: coreResult.parameters,
    calculatedAt: estimate.createdAt.toISOString(),
  };
}
