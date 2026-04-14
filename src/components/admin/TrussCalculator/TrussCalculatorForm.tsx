'use client';

import { useState, useEffect, useCallback } from 'react';
import { CanopyRoofType } from '@/services/truss/types';

interface FormData {
  canopyType: CanopyRoofType;
  width: number;
  length: number;
  ridgeHeight: number;
  wallHeight: number;
  trussSpacing: number;
  roofCoveringId: string;
  postProfileId: string;
  crossbeamProfileId: string;
  strutProfileId: string;
  archProfileId: string;
}

interface ReferenceItem {
  id: string;
  name: string;
}

interface ProfileItem extends ReferenceItem {
  category: string;
}

const CANOPY_TYPES: { value: CanopyRoofType; label: string }[] = [
  { value: 'SINGLE_SLOPE', label: 'Односкатная' },
  { value: 'DOUBLE_SLOPE', label: 'Двухскатная' },
  { value: 'ARCH', label: 'Арочная' },
  { value: 'SINGLE_SLOPE_CURVED', label: 'Односкатная в дуге' },
];

interface Props {
  onCalculate: (data: FormData) => void;
  loading: boolean;
}

export default function TrussCalculatorForm({ onCalculate, loading }: Props) {
  const [form, setForm] = useState<FormData>({
    canopyType: 'SINGLE_SLOPE',
    width: 6000,
    length: 8000,
    ridgeHeight: 3000,
    wallHeight: 2500,
    trussSpacing: 2000,
    roofCoveringId: '',
    postProfileId: '',
    crossbeamProfileId: '',
    strutProfileId: '',
    archProfileId: '',
  });

  const [roofCoverings, setRoofCoverings] = useState<ReferenceItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/truss-roof-coverings').then(r => r.json()),
      fetch('/api/admin/truss-profiles').then(r => r.json()),
    ]).then(([coveringsData, profilesData]) => {
      setRoofCoverings(coveringsData.coverings || []);
      setProfiles(profilesData.profiles || []);
    });
  }, []);

  const getProfilesByCategory = useCallback((category: string) =>
    profiles.filter(p => p.category === category), [profiles]);

  const showWallHeight = form.canopyType === 'SINGLE_SLOPE' || form.canopyType === 'SINGLE_SLOPE_CURVED';
  const showArch = form.canopyType === 'ARCH' || form.canopyType === 'SINGLE_SLOPE_CURVED';

  const handleChange = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = { ...form };
    if (!showWallHeight) {
      delete (cleaned as Partial<FormData>).wallHeight;
    }
    if (!showArch) {
      cleaned.archProfileId = '';
    }
    onCalculate(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Параметры навеса</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип крыши</label>
            <select
              value={form.canopyType}
              onChange={e => handleChange('canopyType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {CANOPY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Покрытие крыши</label>
            <select
              value={form.roofCoveringId}
              onChange={e => handleChange('roofCoveringId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Выберите покрытие</option>
              {roofCoverings.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ширина навеса (пролёт), мм</label>
            <input
              type="number"
              value={form.width}
              onChange={e => handleChange('width', Number(e.target.value))}
              min={2000}
              max={12000}
              step={100}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Длина навеса, мм</label>
            <input
              type="number"
              value={form.length}
              onChange={e => handleChange('length', Number(e.target.value))}
              min={2000}
              max={12000}
              step={100}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Высота в коньке/центре, мм</label>
            <input
              type="number"
              value={form.ridgeHeight}
              onChange={e => handleChange('ridgeHeight', Number(e.target.value))}
              min={500}
              max={6000}
              step={100}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          {showWallHeight && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Высота у низкой стены, мм</label>
              <input
                type="number"
                value={form.wallHeight}
                onChange={e => handleChange('wallHeight', Number(e.target.value))}
                min={500}
                max={6000}
                step={100}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Шаг установки ферм, мм</label>
            <input
              type="number"
              value={form.trussSpacing}
              onChange={e => handleChange('trussSpacing', Number(e.target.value))}
              min={1500}
              max={3000}
              step={100}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Профили</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Столбы</label>
            <select
              value={form.postProfileId}
              onChange={e => handleChange('postProfileId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Выберите профиль</option>
              {getProfilesByCategory('POST').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Перекладины</label>
            <select
              value={form.crossbeamProfileId}
              onChange={e => handleChange('crossbeamProfileId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Выберите профиль</option>
              {getProfilesByCategory('CROSSBEAM').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Перемычки</label>
            <select
              value={form.strutProfileId}
              onChange={e => handleChange('strutProfileId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Выберите профиль</option>
              {getProfilesByCategory('STRUT').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {showArch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Арочная дуга</label>
              <select
                value={form.archProfileId}
                onChange={e => handleChange('archProfileId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              >
                <option value="">Выберите профиль</option>
                {getProfilesByCategory('ARCH').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Расчёт...' : 'Рассчитать'}
      </button>
    </form>
  );
}
