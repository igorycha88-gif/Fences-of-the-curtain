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
}

interface EstimateSectionProps {
  estimateId: string;
  items: EstimateItem[];
  materialsTotal: number;
  installationTotal: number;
  grandTotal: number;
}

const formatPrice = (price: number) => {
  return price.toLocaleString('ru-RU') + ' ₽';
};

export function EstimateSection({
  estimateId,
  items,
  materialsTotal,
  installationTotal,
  grandTotal,
}: EstimateSectionProps) {
  const materialItems = items.filter((item) => item.category !== 'installation');
  const workItems = items.filter((item) => item.category === 'installation');

  return (
    <div className="bg-white rounded-xl shadow-md border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="text-xl">💰</span>
          Смета
        </h2>
        <Link
          href={`/admin/estimates?open=${estimateId}`}
          className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          Открыть в Расчетах
        </Link>
      </div>

      {materialItems.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Материалы</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                {materialItems.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-gray-500">{index + 1}</td>
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
                  <td className="p-2 text-right whitespace-nowrap">{formatPrice(materialsTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {workItems.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Работы</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                {workItems.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-gray-500">{index + 1}</td>
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
                  <td className="p-2 text-right whitespace-nowrap">{formatPrice(installationTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="border-t-2 border-gray-300 pt-4">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>ИТОГО:</span>
          <span className="text-primary">{formatPrice(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
