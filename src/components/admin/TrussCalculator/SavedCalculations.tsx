'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { sanitizeSvg } from '@/lib/sanitize';

interface SavedCalculation {
  id: string;
  name: string | null;
  canopyType: string;
  width: number;
  length: number;
  ridgeHeight: number;
  wallHeight: number | null;
  trussSpacing: number;
  createdAt: string;
  svgDrawing: string | null;
  roofCovering: { name: string };
  postProfile: { name: string };
  crossbeamProfile: { name: string };
  topChordProfile: { name: string } | null;
  strutProfile: { name: string };
  archProfile: { name: string } | null;
  user: { name: string | null; email: string } | null;
  snowLoad: number;
  windLoad: number;
  totalLoad: number;
  safetyFactor: number;
  trussGeometry: any;
  materialList: any;
  slopeAngle: number;
}

function getCanopyTypeName(type: string): string {
  switch (type) {
    case 'SINGLE_SLOPE': return 'Односкатная';
    case 'DOUBLE_SLOPE': return 'Двухскатная';
    case 'ARCH': return 'Арочная';
    case 'SINGLE_SLOPE_CURVED': return 'Односкатная в дуге';
    default: return type;
  }
}

interface Props {
  onSelect: (calculation: SavedCalculation) => void;
}

export default function SavedCalculations({ onSelect }: Props) {
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCalculations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/truss-calculations');
      if (!res.ok) {
        toast.error('Ошибка загрузки расчётов');
        return;
      }
      const data = await res.json();
      setCalculations(data.calculations || []);
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalculations();
  }, [fetchCalculations]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить расчёт «${name || 'Без названия'}»?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/truss-calculations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Ошибка удаления');
        return;
      }
      setCalculations(prev => prev.filter(c => c.id !== id));
      if (expandedId === id) setExpandedId(null);
      toast.success('Расчёт удалён');
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setDeleting(null);
    }
  };

  const handleView = (calc: SavedCalculation) => {
    if (expandedId === calc.id) {
      setExpandedId(null);
    } else {
      setExpandedId(calc.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Загрузка расчётов...</div>
      </div>
    );
  }

  if (calculations.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <div className="text-gray-400 text-lg mb-2">📋</div>
        <p className="text-gray-500">Нет сохранённых расчётов</p>
        <p className="text-gray-400 text-sm mt-1">Выполните расчёт на вкладке «Калькулятор» и сохраните его</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Всего расчётов: {calculations.length}</p>
        <button
          onClick={fetchCalculations}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Обновить
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-3 font-medium text-gray-600">№</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Название</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Тип</th>
                <th className="text-right py-3 px-3 font-medium text-gray-600">Ширина</th>
                <th className="text-right py-3 px-3 font-medium text-gray-600">Длина</th>
                <th className="text-right py-3 px-3 font-medium text-gray-600">Высота</th>
                <th className="text-right py-3 px-3 font-medium text-gray-600">Запас</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">Дата</th>
                <th className="text-center py-3 px-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody>
              {calculations.map((calc, i) => (
                <CalculationRow
                  key={calc.id}
                  calculation={calc}
                  index={i + 1}
                  expanded={expandedId === calc.id}
                  deleting={deleting === calc.id}
                  onToggle={() => handleView(calc)}
                  onDelete={() => handleDelete(calc.id, calc.name || '')}
                  onSelect={() => onSelect(calc)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CalculationRow({
  calculation: calc,
  index,
  expanded,
  deleting,
  onToggle,
  onDelete,
  onSelect,
}: {
  calculation: SavedCalculation;
  index: number;
  expanded: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  return (
    <>
      <tr className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
        <td className="py-2.5 px-3 text-gray-500">{index}</td>
        <td className="py-2.5 px-3 font-medium text-gray-900">
          {calc.name || 'Без названия'}
        </td>
        <td className="py-2.5 px-3">
          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
            {getCanopyTypeName(calc.canopyType)}
          </span>
        </td>
        <td className="text-right py-2.5 px-3 font-mono">{calc.width}</td>
        <td className="text-right py-2.5 px-3 font-mono">{calc.length}</td>
        <td className="text-right py-2.5 px-3 font-mono">{calc.ridgeHeight}</td>
        <td className="text-right py-2.5 px-3">
          <span className={`font-semibold ${calc.safetyFactor >= 1.5 ? 'text-green-600' : calc.safetyFactor >= 1.0 ? 'text-amber-600' : 'text-red-600'}`}>
            {calc.safetyFactor.toFixed(2)}
          </span>
        </td>
        <td className="py-2.5 px-3 text-gray-500 text-xs">
          {new Date(calc.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="py-2.5 px-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onToggle}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              title="Просмотр"
            >
              {expanded ? 'Свернуть' : 'Просмотр'}
            </button>
            <button
              onClick={onSelect}
              className="text-green-600 hover:text-green-800 text-xs font-medium"
              title="Открыть в калькуляторе"
            >
              Открыть
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
              title="Удалить"
            >
              {deleting ? '...' : 'Удалить'}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={9} className="p-0">
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Параметры</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Покрытие: <span className="font-medium">{calc.roofCovering?.name || '—'}</span></div>
                    <div>Шаг ферм: <span className="font-medium">{calc.trussSpacing} мм</span></div>
                    <div>Столбы: <span className="font-medium">{calc.postProfile?.name || '—'}</span></div>
                    <div>Нижний пояс: <span className="font-medium">{calc.crossbeamProfile?.name || '—'}</span></div>
                    {calc.topChordProfile && <div>Верхний пояс: <span className="font-medium">{calc.topChordProfile.name}</span></div>}
                    <div>Решётка: <span className="font-medium">{calc.strutProfile?.name || '—'}</span></div>
                    {calc.archProfile && <div>Арка: <span className="font-medium">{calc.archProfile.name}</span></div>}
                    <div>Снеговая: <span className="font-medium">{calc.snowLoad.toFixed(1)} кг/м²</span></div>
                    <div>Ветровая: <span className="font-medium">{calc.windLoad.toFixed(1)} кг/м²</span></div>
                    <div>Полная: <span className="font-medium">{calc.totalLoad.toFixed(1)} кг/м²</span></div>
                    <div>Уклон: <span className="font-medium">{calc.slopeAngle.toFixed(1)}°</span></div>
                    <div>Автор: <span className="font-medium">{calc.user?.name || calc.user?.email || '—'}</span></div>
                  </div>
                </div>
                {calc.svgDrawing && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Схема</h4>
                    <div className="bg-white rounded border overflow-auto max-h-64" dangerouslySetInnerHTML={{ __html: sanitizeSvg(calc.svgDrawing) }} />
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
