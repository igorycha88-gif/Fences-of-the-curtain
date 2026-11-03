'use client';

import { Ruler, Layers, Palette, DoorOpen, MapPin, Grid3X3, Bot } from 'lucide-react';

interface FenceParametersProps {
  fenceType: {
    id: string;
    name: string;
  };
  fenceTypeName: string;
  length: number;
  height: number;
  lagRows: number;
  coating: string;
  coatingLabel: string;
  picketMountingType?: string | null;
  picketStep?: number | null;
  picketProfileType?: string | null;
  picketCoatingName?: string | null;
  meshCoating?: string | null;
  meshCellSize?: number | null;
  meshWireThickness?: number | null;
  hasAutomation?: boolean | null;
  automationNomenclatureName?: string | null;
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

const PICKET_MOUNTING_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Односторонний',
  CHESS: 'В шахматном порядке',
};

export function FenceParameters({
  fenceType,
  fenceTypeName,
  length,
  height,
  lagRows,
  coatingLabel,
  picketMountingType,
  picketStep,
  picketProfileType,
  picketCoatingName,
  meshCoating,
  meshCellSize,
  meshWireThickness,
  hasAutomation,
  automationNomenclatureName,
  hasGate,
  gateTypeLabel,
  gateLength,
  gateNomenclatureName,
  hasWicket,
  wicketWidth,
  wicketNomenclatureName,
  city,
}: FenceParametersProps) {
  const isMesh = meshCoating != null || meshCellSize != null || meshWireThickness != null;
  const isPicket = picketMountingType != null || picketStep != null || picketProfileType != null;

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

        {isMesh ? (
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Grid3X3 className="w-4 h-4 text-primary mt-0.5" />
            <div className="flex-1">
              <label className="text-sm text-primary block mb-1 font-semibold">Параметры сетки-рабицы</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block">Покрытие</label>
                  <p className="font-medium text-gray-900 text-sm">{meshCoating || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block">Ячейка</label>
                  <p className="font-medium text-gray-900 text-sm">{meshCellSize != null ? `${meshCellSize} мм` : '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block">Пруток</label>
                  <p className="font-medium text-gray-900 text-sm">{meshWireThickness != null ? `${meshWireThickness} мм` : '-'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {fenceType.name !== 'Сетка-рабица' && (
              <div className="flex items-start gap-3">
                <Layers className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-sm text-gray-500 block">Лаги</label>
                  <p className="font-medium text-gray-900">{lagRows} ряда</p>
                </div>
              </div>
            )}

            {fenceTypeName !== 'Сетка-рабица' && (
              <div className="flex items-start gap-3">
                <Palette className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-sm text-gray-500 block">Покрытие</label>
                  <p className="font-medium text-gray-900">{coatingLabel}</p>
                </div>
              </div>
            )}
          </>
        )}

        {isPicket && (
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <span className="text-lg leading-none mt-0.5">🪵</span>
            <div className="flex-1">
              <label className="text-sm text-primary block mb-1 font-semibold">Параметры евроштакетника</label>
              <div className="grid grid-cols-3 gap-2">
                {picketProfileType && (
                  <div>
                    <label className="text-xs text-gray-500 block">Профиль</label>
                    <p className="font-medium text-gray-900 text-sm">{picketProfileType}</p>
                  </div>
                )}
                {picketStep != null && (
                  <div>
                    <label className="text-xs text-gray-500 block">Шаг</label>
                    <p className="font-medium text-gray-900 text-sm">{picketStep} см</p>
                  </div>
                )}
                {picketMountingType && (
                  <div>
                    <label className="text-xs text-gray-500 block">Тип монтажа</label>
                    <p className="font-medium text-gray-900 text-sm">
                      {PICKET_MOUNTING_TYPE_LABELS[picketMountingType] || picketMountingType}
                    </p>
                  </div>
                )}
                {picketCoatingName && (
                  <div>
                    <label className="text-xs text-gray-500 block">Покрытие штакетника</label>
                    <p className="font-medium text-gray-900 text-sm">{picketCoatingName}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                {gateLength != null && `${gateLength / 1000} м`}
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
                {wicketWidth != null && `${wicketWidth / 1000} м`}
                {wicketNomenclatureName && ` — ${wicketNomenclatureName}`}
              </p>
            </div>
          </div>
        )}

        {hasAutomation && (
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <Bot className="w-4 h-4 text-purple-500 mt-0.5" />
            <div className="flex-1">
              <label className="text-sm text-purple-600 block">Автоматика ворот</label>
              <p className="font-medium text-purple-800">{automationNomenclatureName || '-'}</p>
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
