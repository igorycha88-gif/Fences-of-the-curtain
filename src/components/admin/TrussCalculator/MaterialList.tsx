'use client';

import { MaterialItem, ProfileRecommendation } from '@/services/truss/types';

interface Props {
  materials: MaterialItem[];
  totalWeight: number;
  totalPrice: number;
  recommendations: ProfileRecommendation[];
}

export default function MaterialList({ materials, totalWeight, totalPrice, recommendations }: Props) {
  return (
    <div className="space-y-4">
      {recommendations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">⚠️ Рекомендации по профилям</h4>
          {recommendations.map((rec, i) => (
            <div key={i} className="text-sm text-amber-700 mb-1">
              <span className="font-medium">{rec.reason}</span> — рекомендуется {rec.recommendedProfileName} вместо {rec.currentProfileName}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Спецификация материалов</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-medium text-gray-600">№</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">Наименование</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">Профиль</th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">Кол-во</th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">Общая длина, м</th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">Вес, кг</th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">Цена, руб</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <td className="py-2 px-2">{i + 1}</td>
                  <td className="py-2 px-2">{m.name}</td>
                  <td className="py-2 px-2 text-gray-600">{m.profileName}</td>
                  <td className="text-right py-2 px-2">{m.count}</td>
                  <td className="text-right py-2 px-2">{m.totalLength.toFixed(1)}</td>
                  <td className="text-right py-2 px-2">{m.totalWeight.toFixed(1)}</td>
                  <td className="text-right py-2 px-2">{m.totalPrice.toLocaleString('ru-RU')}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 bg-blue-50">
                <td colSpan={5} className="py-2.5 px-2 font-bold text-right">ИТОГО</td>
                <td className="text-right py-2.5 px-2 font-bold">{totalWeight.toFixed(1)}</td>
                <td className="text-right py-2.5 px-2 font-bold text-blue-700">{totalPrice.toLocaleString('ru-RU')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
