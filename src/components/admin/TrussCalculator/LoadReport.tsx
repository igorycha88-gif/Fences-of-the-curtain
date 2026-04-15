'use client';

import { LoadResult } from '@/services/truss/types';

interface Props {
  loads: LoadResult;
  safetyFactor: number;
  allPassed: boolean;
}

export default function LoadReport({ loads, safetyFactor, allPassed }: Props) {
  const totalNorm = loads.totalLoadNormative || 1;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Расчёт нагрузок</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-600">Вид нагрузки</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Нормативная, кг/м²</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Расчётная, кг/м²</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">γf</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Доля</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="py-2 px-3">Снеговая (район III)</td>
              <td className="text-right py-2 px-3">{loads.snowLoadNormative.toFixed(1)}</td>
              <td className="text-right py-2 px-3 font-medium">{loads.snowLoadDesign.toFixed(1)}</td>
              <td className="text-right py-2 px-3 text-gray-500">1.4</td>
              <td className="text-right py-2 px-3">{Math.round(loads.snowLoadDesign / totalNorm * 100)}%</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 px-3">Ветровая (район I)</td>
              <td className="text-right py-2 px-3">{loads.windLoadNormative.toFixed(1)}</td>
              <td className="text-right py-2 px-3 font-medium">{loads.windLoadDesign.toFixed(1)}</td>
              <td className="text-right py-2 px-3 text-gray-500">1.4</td>
              <td className="text-right py-2 px-3">{Math.round(loads.windLoadDesign / totalNorm * 100)}%</td>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="py-2 px-3">Собственный вес</td>
              <td className="text-right py-2 px-3">{loads.deadLoadNormative.toFixed(1)}</td>
              <td className="text-right py-2 px-3 font-medium">{loads.deadLoadDesign.toFixed(1)}</td>
              <td className="text-right py-2 px-3 text-gray-500">1.1</td>
              <td className="text-right py-2 px-3">{Math.round(loads.deadLoadDesign / totalNorm * 100)}%</td>
            </tr>
            <tr className="border-b-2 border-gray-300 bg-blue-50">
              <td className="py-2.5 px-3 font-bold text-gray-900">ИТОГО</td>
              <td className="text-right py-2.5 px-3 font-bold">{loads.totalLoadNormative.toFixed(1)}</td>
              <td className="text-right py-2.5 px-3 font-bold text-blue-700">{loads.totalLoadDesign.toFixed(1)}</td>
              <td className="text-right py-2.5 px-3 text-gray-500">—</td>
              <td className="text-right py-2.5 px-3 font-bold">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Нагрузка на ферму</div>
          <div className="text-lg font-bold text-gray-900">{loads.loadPerTruss.toFixed(1)} кг</div>
        </div>
        <div className={`rounded-lg p-3 ${allPassed ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-xs text-gray-500">Коэффициент запаса</div>
          <div className={`text-lg font-bold ${allPassed ? 'text-green-700' : 'text-red-700'}`}>
            {safetyFactor.toFixed(2)} {allPassed ? '✓' : '✗'}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Угол наклона: {loads.slopeAngle}° | μ = {loads.snowCoeffMu} | Снеговой район III (Москва, Sg = 180 кг/м²)
      </div>
    </div>
  );
}
