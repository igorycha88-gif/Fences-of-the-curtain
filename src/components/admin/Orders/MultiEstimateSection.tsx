'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface EstimateItem {
  category: string;
  nomenclatureId: string | null;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  purchasePricePerUnit?: number | null;
  purchaseTotal?: number | null;
  marginRub?: number | null;
  marginPercent?: number | null;
}

interface FenceType {
  id: string;
  name: string;
}

interface Estimate {
  id: string;
  fenceType: FenceType;
  length: number;
  height: number;
  lagRows: number;
  coating: string;
  coatingLabel: string;
  hasGate: boolean;
  gateType: string | null;
  gateTypeLabel: string | null;
  gateLength: number | null;
  gateNomenclatureName: string | null;
  hasWicket: boolean;
  wicketWidth: number | null;
  wicketNomenclatureName: string | null;
  city: string | null;
  items: EstimateItem[];
  materialsTotal: number;
  installationTotal: number;
  grandTotal: number;
  purchaseTotal?: number | null;
  marginTotalRub?: number | null;
  marginTotalPercent?: number | null;
}

interface MultiEstimateSectionProps {
  estimates: Estimate[];
  showPurchasePrices?: boolean;
}

const formatPrice = (price: number) => {
  return price.toLocaleString('ru-RU') + ' ₽';
};

export function MultiEstimateSection({
  estimates,
  showPurchasePrices = false,
}: MultiEstimateSectionProps) {
  if (!estimates || estimates.length === 0) return null;

  const totalMaterials = estimates.reduce((sum, est) => sum + est.materialsTotal, 0);
  const totalInstallation = estimates.reduce((sum, est) => sum + est.installationTotal, 0);
  const grandTotal = estimates.reduce((sum, est) => sum + est.grandTotal, 0);
  const totalPurchase = showPurchasePrices
    ? estimates.reduce((sum, est) => sum + (est.purchaseTotal || 0), 0)
    : null;
  const totalMarginRub = showPurchasePrices && totalPurchase !== null
    ? grandTotal - totalPurchase
    : null;
  const totalMarginPercent = showPurchasePrices && totalPurchase !== null && totalPurchase > 0
    ? (totalMarginRub! / grandTotal) * 100
    : null;

  return (
    <div className="space-y-6">
      {estimates.map((estimate, index) => {
        const isFallback = estimate.id.startsWith('fallback-');
        const materialItems = estimate.items.filter((item) => item.category !== 'installation');
        const workItems = estimate.items.filter((item) => item.category === 'installation');

        return (
          <div key={estimate.id} className="bg-white rounded-xl shadow-md border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">
                  {index + 1}. {estimate.fenceType.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {estimate.length} м × {estimate.height} м, {estimate.lagRows} лаг{estimate.lagRows === 1 ? 'а' : estimate.lagRows < 5 ? 'и' : ''}
                </p>
              </div>
              {!isFallback ? (
                <Link
                  href={`/admin/estimates?open=${estimate.id}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Открыть смету
                </Link>
              ) : (
                <span className="text-xs text-gray-400 italic">Детали сметы недоступны</span>
              )}
            </div>

            {materialItems.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2 pb-2 border-b text-sm">Материалы</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2 font-medium text-gray-600">№</th>
                        <th className="text-left p-2 font-medium text-gray-600">Наименование</th>
                        <th className="text-left p-2 font-medium text-gray-600 whitespace-nowrap">Ед.</th>
                        <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Кол-во</th>
                        <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Цена</th>
                        <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialItems.map((item, itemIndex) => (
                        <tr key={itemIndex} className="border-b hover:bg-gray-50">
                          <td className="p-2 text-gray-500">{itemIndex + 1}</td>
                          <td className="p-2">{item.nomenclatureName}</td>
                          <td className="p-2 text-gray-500 whitespace-nowrap">{item.unit}</td>
                          <td className="p-2 text-right whitespace-nowrap">{item.quantity}</td>
                          <td className="p-2 text-right whitespace-nowrap">{formatPrice(item.pricePerUnit)}</td>
                          <td className="p-2 text-right font-medium whitespace-nowrap">{formatPrice(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan={5} className="p-2 text-right">Итого материалы:</td>
                        <td className="p-2 text-right whitespace-nowrap">{formatPrice(estimate.materialsTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {workItems.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2 pb-2 border-b text-sm">Работы</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2 font-medium text-gray-600">№</th>
                        <th className="text-left p-2 font-medium text-gray-600">Наименование</th>
                        <th className="text-left p-2 font-medium text-gray-600 whitespace-nowrap">Ед.</th>
                        <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Кол-во</th>
                        <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Цена</th>
                        <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workItems.map((item, itemIndex) => (
                        <tr key={itemIndex} className="border-b hover:bg-gray-50">
                          <td className="p-2 text-gray-500">{itemIndex + 1}</td>
                          <td className="p-2">{item.nomenclatureName}</td>
                          <td className="p-2 text-gray-500 whitespace-nowrap">{item.unit}</td>
                          <td className="p-2 text-right whitespace-nowrap">{item.quantity}</td>
                          <td className="p-2 text-right whitespace-nowrap">{formatPrice(item.pricePerUnit)}</td>
                          <td className="p-2 text-right font-medium whitespace-nowrap">{formatPrice(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan={5} className="p-2 text-right">Итого работы:</td>
                        <td className="p-2 text-right whitespace-nowrap">{formatPrice(estimate.installationTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {isFallback && materialItems.length === 0 && workItems.length === 0 && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Детализация сметы недоступна. Показаны только параметры забора и общая сумма.
                </p>
              </div>
            )}

            <div className="border-t pt-3">
              <div className="flex justify-between items-center font-bold">
                <span>ИТОГО ({estimate.fenceType.name}):</span>
                <span className="text-primary">{formatPrice(estimate.grandTotal)}</span>
              </div>
            </div>
          </div>
        );
      })}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md border-2 border-blue-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Итого по всем типам заборов</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-gray-500 mb-1">Материалы</p>
            <p className="text-lg font-bold text-gray-900">{formatPrice(totalMaterials)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-gray-500 mb-1">Работы</p>
            <p className="text-lg font-bold text-gray-900">{formatPrice(totalInstallation)}</p>
          </div>
          {showPurchasePrices && totalMarginRub !== null && (
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-500 mb-1">Маржа</p>
              <p className="text-lg font-bold text-green-600">
                {formatPrice(totalMarginRub)}
                {totalMarginPercent !== null && (
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    ({totalMarginPercent.toFixed(1)}%)
                  </span>
                )}
              </p>
            </div>
          )}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">Общая сумма</p>
            <p className="text-xl font-bold text-primary">{formatPrice(grandTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
