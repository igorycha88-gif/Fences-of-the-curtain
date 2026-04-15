'use client';

import { useState } from 'react';
import { MaterialItem, ProfileRecommendation, TrussElementDetail, CanopyRoofType } from '@/services/truss/types';

interface Props {
  materials: MaterialItem[];
  totalWeight: number;
  totalPrice: number;
  recommendations: ProfileRecommendation[];
  elementDetails: TrussElementDetail[];
  archProfileLength?: number;
  canopyType: CanopyRoofType;
}

const TYPE_LABELS: Record<string, string> = {
  bottom_chord: 'Нижний пояс',
  top_chord: 'Верхний пояс',
  vertical: 'Вертикальная стойка',
  diagonal: 'Диагональный раскос',
};

export default function MaterialList({ materials, totalWeight, totalPrice, recommendations, elementDetails, archProfileLength, canopyType }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-4">
      {recommendations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Рекомендации по профилям</h4>
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

      <div className="bg-white rounded-lg border">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Детализация элементов фермы</h3>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="px-6 pb-6">
            {archProfileLength && (canopyType === 'ARCH' || canopyType === 'SINGLE_SLOPE_CURVED') && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <span className="font-semibold">Арочный пояс (профиль для гибки):</span>{' '}
                {Math.round(archProfileLength)} мм ({(archProfileLength / 1000).toFixed(2)} м) — длина профиля для получения заданного радиуса
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2 px-2 font-medium text-gray-600">№</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600">Тип</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">Длина, мм</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">Запил снизу, °</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">Запил сверху, °</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600">Профиль</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">Толщина</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">Кол-во, шт</th>
                  </tr>
                </thead>
                <tbody>
                  {elementDetails.map((d, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50' : ''}`}>
                      <td className="py-2 px-2">{i + 1}</td>
                      <td className="py-2 px-2">
                        <span className="text-xs text-gray-500">{TYPE_LABELS[d.elementType] || d.elementType}</span>
                        <span className="ml-1 font-medium">{d.elementLabel}</span>
                      </td>
                      <td className="text-right py-2 px-2 font-mono">{d.length}</td>
                      <td className="text-right py-2 px-2">{d.bottomCutAngle}°</td>
                      <td className="text-right py-2 px-2">{d.topCutAngle}°</td>
                      <td className="py-2 px-2 text-gray-600">{d.profileName}</td>
                      <td className="text-right py-2 px-2">{d.profileThickness}</td>
                      <td className="text-right py-2 px-2 font-semibold">{d.quantity > 1 ? d.quantity : ''}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 bg-blue-50">
                    <td colSpan={7} className="py-2.5 px-2 font-bold text-right">
                      Всего элементов (с учётом одинаковых):
                    </td>
                    <td className="text-right py-2.5 px-2 font-bold text-blue-700">
                      {elementDetails.reduce((s, d) => s + d.quantity, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
