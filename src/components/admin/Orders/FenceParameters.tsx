'use client';

import { Ruler, Layers, Palette, DoorOpen, MapPin } from 'lucide-react';

interface FenceParametersProps {
  fenceType: {
    id: string;
    name: string;
  };
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
}

export function FenceParameters({
  fenceType,
  length,
  height,
  lagRows,
  coatingLabel,
  hasGate,
  gateTypeLabel,
  gateLength,
  gateNomenclatureName,
  hasWicket,
  wicketWidth,
  wicketNomenclatureName,
  city,
}: FenceParametersProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-xl">🏗️</span>
        Параметры забора
      </h2>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Ruler className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <label className="text-sm text-gray-500 block">Тип забора</label>
            <p className="font-medium text-gray-900">{fenceType.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Длина</label>
            <p className="font-medium text-gray-900">{length} м</p>
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Высота</label>
            <p className="font-medium text-gray-900">{height} м</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Layers className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <label className="text-sm text-gray-500 block">Лаги</label>
            <p className="font-medium text-gray-900">{lagRows} ряда</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Palette className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <label className="text-sm text-gray-500 block">Покрытие</label>
            <p className="font-medium text-gray-900">{coatingLabel}</p>
          </div>
        </div>

        {hasGate && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-500 mt-0.5"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 12h18" />
              <path d="M12 3v18" />
            </svg>
            <div className="flex-1">
              <label className="text-sm text-blue-600 block">Ворота</label>
              <p className="font-medium text-blue-800">
                {gateTypeLabel && `${gateTypeLabel} `}
                {gateLength && `${gateLength} м`}
                {gateNomenclatureName && ` — ${gateNomenclatureName}`}
              </p>
            </div>
          </div>
        )}

        {hasWicket && (
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <DoorOpen className="w-4 h-4 text-green-500 mt-0.5" />
            <div className="flex-1">
              <label className="text-sm text-green-600 block">Калитка</label>
              <p className="font-medium text-green-800">
                {wicketWidth && `${wicketWidth} м`}
                {wicketNomenclatureName && ` — ${wicketNomenclatureName}`}
              </p>
            </div>
          </div>
        )}

        {city && (
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <label className="text-sm text-gray-500 block">Город</label>
              <p className="font-medium text-gray-900">{city}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
