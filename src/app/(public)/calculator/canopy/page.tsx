'use client';

import { useState } from 'react';
import { Calculator, Send } from 'lucide-react';
import Header from '@/components/layout/Header';
import CanopyNomenclatureNotFoundModal from '@/components/calculator/CanopyNomenclatureNotFoundModal';

const canopyTypeLabels: Record<string, string> = {
  'single-slope': 'Односкатный',
  'double-slope': 'Двускатный',
  'arch': 'Арочный',
};

const purposeLabels: Record<string, string> = {
  'car-1': 'Автомобиль (1)',
  'car-2': 'Автомобиль (2)',
  'car-3': 'Автомобиль (3)',
  'gazebo': 'Беседка',
  'terrace': 'Терраса',
  'storage': 'Хозблок',
};

const installationTypeLabels: Record<string, string> = {
  'ground': 'На землю (сваи)',
  'wall': 'К стене',
  'base': 'На основание',
};

const roofMaterialLabels: Record<string, string> = {
  'polycarbonate-8': 'Поликарбонат 8мм',
  'polycarbonate-10': 'Поликарбонат 10мм',
  'profnastil': 'Профнастил',
  'metal-tile': 'Металлочерепица',
};

interface CanopyCalculatorForm {
  canopyType: 'single-slope' | 'double-slope' | 'arch';
  purpose: string;
  length: number;
  width: number;
  height: number;
  frameMaterial: string;
  roofMaterial: string;
  installationType: 'ground' | 'wall' | 'base';
  hasWaterSystem: boolean;
}

interface CalculatorResult {
  materials: Array<{
    name: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    total: number;
  }>;
  works: Array<{
    name: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    total: number;
  }>;
  materialsTotal: number;
  worksTotal: number;
  grandTotal: number;
}

export default function CanopyCalculatorPage() {
  const [formData, setFormData] = useState<CanopyCalculatorForm>({
    canopyType: 'single-slope',
    purpose: 'car-2',
    length: 6,
    width: 4,
    height: 2.5,
    frameMaterial: 'profile-60x60',
    roofMaterial: 'polycarbonate-8',
    installationType: 'ground',
    hasWaterSystem: false,
  });

  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showIndividualRequestModal, setShowIndividualRequestModal] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/calculator/canopy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setShowIndividualRequestModal(true);
      }
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleModalSuccess = () => {
    setShowIndividualRequestModal(false);
  };

  const canopyParameters = {
    canopyType: formData.canopyType,
    canopyTypeLabel: canopyTypeLabels[formData.canopyType] || formData.canopyType,
    purpose: formData.purpose,
    purposeLabel: purposeLabels[formData.purpose] || formData.purpose,
    length: formData.length,
    width: formData.width,
    height: formData.height,
    installationType: formData.installationType,
    installationTypeLabel: installationTypeLabels[formData.installationType] || formData.installationType,
    roofMaterial: formData.roofMaterial,
    roofMaterialLabel: roofMaterialLabels[formData.roofMaterial] || formData.roofMaterial,
    hasWaterSystem: formData.hasWaterSystem,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">Калькулятор навеса</h1>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-primary" />
                Параметры навеса
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип навеса</label>
                  <select
                    value={formData.canopyType}
                    onChange={(e) => setFormData({ ...formData, canopyType: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="single-slope">Односкатный</option>
                    <option value="double-slope">Двускатный</option>
                    <option value="arch">Арочный</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Назначение</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="car-1">Автомобиль (1)</option>
                    <option value="car-2">Автомобиль (2)</option>
                    <option value="car-3">Автомобиль (3)</option>
                    <option value="gazebo">Беседка</option>
                    <option value="terrace">Терраса</option>
                    <option value="storage">Хозблок</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Длина (м)</label>
                    <input
                      type="number"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: Number(e.target.value) })}
                      min="3"
                      max="50"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ширина (м)</label>
                    <input
                      type="number"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                      min="2"
                      max="20"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Высота (м)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                      min="2"
                      max="6"
                      step="0.1"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип установки</label>
                  <select
                    value={formData.installationType}
                    onChange={(e) => setFormData({ ...formData, installationType: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="ground">На землю (сваи)</option>
                    <option value="wall">К стене</option>
                    <option value="base">На основание</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Материал кровли</label>
                  <select
                    value={formData.roofMaterial}
                    onChange={(e) => setFormData({ ...formData, roofMaterial: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="polycarbonate-8">Поликарбонат 8мм</option>
                    <option value="polycarbonate-10">Поликарбонат 10мм</option>
                    <option value="profnastil">Профнастил</option>
                    <option value="metal-tile">Металлочерепица</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.hasWaterSystem}
                    onChange={(e) => setFormData({ ...formData, hasWaterSystem: e.target.checked })}
                    className="w-5 h-5 rounded text-primary focus:ring-primary"
                  />
                  <label className="text-sm font-medium text-gray-700 cursor-pointer">
                    Водосточная система
                  </label>
                </div>

                <button
                  onClick={calculate}
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  {loading ? 'Расчет...' : 'Рассчитать стоимость'}
                </button>
              </div>
            </div>

            {result && (
              <div className="bg-white rounded-xl shadow-lg p-6 border">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Send className="w-6 h-6 text-primary" />
                  Оформить заявку
                </h2>

                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">
                      Для выбранных вами параметров подготовлен расчёт. 
                      Оставьте контакты — менеджер свяжется с вами, уточнит детали и подготовит персональное предложение.
                    </p>
                  </div>

                  <div className="bg-secondary/30 border border-border/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Параметры вашего навеса:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Тип:</span>{' '}
                        <span className="font-medium">{canopyParameters.canopyTypeLabel}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Назначение:</span>{' '}
                        <span className="font-medium">{canopyParameters.purposeLabel}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Длина:</span>{' '}
                        <span className="font-medium">{canopyParameters.length} м</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ширина:</span>{' '}
                        <span className="font-medium">{canopyParameters.width} м</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Высота:</span>{' '}
                        <span className="font-medium">{canopyParameters.height} м</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Установка:</span>{' '}
                        <span className="font-medium">{canopyParameters.installationTypeLabel}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowIndividualRequestModal(true)}
                    className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Оформить заявку
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <CanopyNomenclatureNotFoundModal
        isOpen={showIndividualRequestModal}
        onClose={() => setShowIndividualRequestModal(false)}
        onSuccess={handleModalSuccess}
        canopyParameters={canopyParameters}
      />
    </div>
  );
}
