'use client';

import { useState } from 'react';
import { Calculator, Download, Send } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

interface FenceCalculatorForm {
  fenceType: 'PROFNASTIL' | 'SHAKHETNIK' | 'MESH' | 'PANELS_3D';
  length: number;
  height: number;
  postType: string;
  lagType: string;
  lagRows: '2' | '3';
  hasGate: boolean;
  gateType: 'SWING' | 'SLIDING' | '';
  gateWidth: number;
  hasWicket: boolean;
  wicketWidth: number;
  coating: 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE';
  color: string;
  soilType: string;
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
  soilSurcharge: number;
  grandTotal: number;
}

export default function FenceCalculatorPage() {
  const [formData, setFormData] = useState<FenceCalculatorForm>({
    fenceType: 'PROFNASTIL',
    length: 50,
    height: 2.0,
    postType: 'standard',
    lagType: 'standard',
    lagRows: '2',
    hasGate: false,
    gateType: '',
    gateWidth: 4.0,
    hasWicket: false,
    wicketWidth: 1.0,
    coating: 'GALVANIZED',
    color: '5005',
    soilType: 'normal',
  });

  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/calculator/fence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">Калькулятор забора</h1>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-primary" />
                Параметры забора
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип забора</label>
                  <select
                    value={formData.fenceType}
                    onChange={(e) => setFormData({ ...formData, fenceType: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="PROFNASTIL">Профнастил</option>
                    <option value="SHAKHETNIK">Евроштакетник</option>
                    <option value="MESH">Сетка-рабица</option>
                    <option value="PANELS_3D">3D-панели</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Длина (м)</label>
                    <input
                      type="number"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: Number(e.target.value) })}
                      min="10"
                      max="1000"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Высота (м)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                      min="1.5"
                      max="3.5"
                      step="0.1"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип грунта</label>
                  <select
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="normal">Нормальный</option>
                    <option value="concrete">Бетон/Асфальт (+15%)</option>
                    <option value="stones">Каменистый (+25%)</option>
                    <option value="swamp">Болотистый (+40%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Количество лаг</label>
                  <select
                    value={formData.lagRows}
                    onChange={(e) => setFormData({ ...formData, lagRows: e.target.value as '2' | '3' })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="2">2 ряда</option>
                    <option value="3">3 ряда</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Покрытие</label>
                  <select
                    value={formData.coating}
                    onChange={(e) => setFormData({ ...formData, coating: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="GALVANIZED">Оцинковка</option>
                    <option value="POLYMER_SINGLE">Полимерное (одностороннее)</option>
                    <option value="POLYMER_DOUBLE">Полимерное (двустороннее)</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasGate}
                      onChange={(e) => setFormData({ ...formData, hasGate: e.target.checked })}
                      className="w-5 h-5 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Ворота</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasWicket}
                      onChange={(e) => setFormData({ ...formData, hasWicket: e.target.checked })}
                      className="w-5 h-5 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Калитка</span>
                  </label>
                </div>

                {formData.hasGate && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Тип ворот</label>
                      <select
                        value={formData.gateType}
                        onChange={(e) => setFormData({ ...formData, gateType: e.target.value as any })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="SWING">Распашные</option>
                        <option value="SLIDING">Откатные</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ширина ворот (м)</label>
                      <input
                        type="number"
                        value={formData.gateWidth}
                        onChange={(e) => setFormData({ ...formData, gateWidth: Number(e.target.value) })}
                        min="2"
                        max="6"
                        step="0.1"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {formData.hasWicket && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ширина калитки (м)</label>
                      <input
                        type="number"
                        value={formData.wicketWidth}
                        onChange={(e) => setFormData({ ...formData, wicketWidth: Number(e.target.value) })}
                        min="0.8"
                        max="1.2"
                        step="0.1"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

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
                <h2 className="text-2xl font-semibold mb-6">Результат расчета</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Материалы</h3>
                    <div className="space-y-2">
                      {result.materials.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="font-semibold">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center py-2 border-b font-semibold">
                      <span>Итого материалы</span>
                      <span className="text-primary">{formatCurrency(result.materialsTotal)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Работы</h3>
                    <div className="space-y-2">
                      {result.works.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="font-semibold">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center py-2 border-b font-semibold">
                      <span>Итого работы</span>
                      <span className="text-primary">{formatCurrency(result.worksTotal)}</span>
                    </div>
                  </div>

                  {result.soilSurcharge > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Наценка за грунт</span>
                      <span className="font-semibold">{formatCurrency(result.soilSurcharge)}</span>
                    </div>
                  )}

                  <div className="bg-primary/5 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Итого</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(result.grandTotal)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      className="flex-1 bg-secondary text-foreground py-3 rounded-lg font-semibold hover:bg-secondary/80 transition-colors border flex items-center justify-center gap-2"
                      onClick={() => alert('PDF скачивание будет реализовано')}
                    >
                      <Download className="w-5 h-5" />
                      Скачать PDF
                    </button>
                    <Link
                      href={`/calculator/fence?order=true`}
                      className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Заказать расчет
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
