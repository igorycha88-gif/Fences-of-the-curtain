'use client';

import { useState } from 'react';
import { Calculator, Download, Send, Zap, Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { AnimatedSection } from '@/hooks/useScrollReveal';

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

  const fenceTypes = [
    { value: 'PROFNASTIL', label: 'Профнастил' },
    { value: 'SHAKHETNIK', label: 'Евроштакетник' },
    { value: 'MESH', label: 'Сетка-рабица' },
    { value: 'PANELS_3D', label: '3D-панели' },
  ];

  const coatings = [
    { value: 'GALVANIZED', label: 'Оцинковка' },
    { value: 'POLYMER_SINGLE', label: 'Полимерное (одностороннее)' },
    { value: 'POLYMER_DOUBLE', label: 'Полимерное (двустороннее)' },
  ];

  const soilTypes = [
    { value: 'normal', label: 'Нормальный' },
    { value: 'concrete', label: 'Бетон/Асфальт (+15%)' },
    { value: 'stones', label: 'Каменистый (+25%)' },
    { value: 'swamp', label: 'Болотистый (+40%)' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="fade-in-up" className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Расчёт за 30 секунд
            </div>
            <h1 className="section-title mb-4">Калькулятор забора</h1>
            <p className="section-subtitle">
              Получите точный расчёт стоимости онлайн без скрытых платежей
            </p>
          </AnimatedSection>

          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <AnimatedSection animation="fade-in-right">
                  <div className="card-modern p-8">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Calculator className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Параметры забора</h2>
                        <p className="text-muted-foreground text-sm">Заполните все поля для расчёта</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Тип забора</label>
                        <select
                          value={formData.fenceType}
                          onChange={(e) => setFormData({ ...formData, fenceType: e.target.value as any })}
                          className="select-modern"
                        >
                          {fenceTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Длина (м)</label>
                          <input
                            type="number"
                            value={formData.length}
                            onChange={(e) => setFormData({ ...formData, length: Number(e.target.value) })}
                            min="10"
                            max="1000"
                            className="input-modern"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Высота (м)</label>
                          <input
                            type="number"
                            value={formData.height}
                            onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                            min="1.5"
                            max="3.5"
                            step="0.1"
                            className="input-modern"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Тип грунта</label>
                          <select
                            value={formData.soilType}
                            onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                            className="select-modern"
                          >
                            {soilTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Количество лаг</label>
                          <select
                            value={formData.lagRows}
                            onChange={(e) => setFormData({ ...formData, lagRows: e.target.value as '2' | '3' })}
                            className="select-modern"
                          >
                            <option value="2">2 ряда</option>
                            <option value="3">3 ряда</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Покрытие</label>
                        <select
                          value={formData.coating}
                          onChange={(e) => setFormData({ ...formData, coating: e.target.value as any })}
                          className="select-modern"
                        >
                          {coatings.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.hasGate}
                            onChange={(e) => setFormData({ ...formData, hasGate: e.target.checked })}
                            className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
                          />
                          <span className="font-medium">Ворота</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.hasWicket}
                            onChange={(e) => setFormData({ ...formData, hasWicket: e.target.checked })}
                            className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
                          />
                          <span className="font-medium">Калитка</span>
                        </label>
                      </div>

                      {formData.hasGate && (
                        <div className="space-y-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Тип ворот</label>
                              <select
                                value={formData.gateType}
                                onChange={(e) => setFormData({ ...formData, gateType: e.target.value as any })}
                                className="select-modern"
                              >
                                <option value="SWING">Распашные</option>
                                <option value="SLIDING">Откатные</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Ширина ворот (м)</label>
                              <input
                                type="number"
                                value={formData.gateWidth}
                                onChange={(e) => setFormData({ ...formData, gateWidth: Number(e.target.value) })}
                                min="2"
                                max="6"
                                step="0.1"
                                className="input-modern"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {formData.hasWicket && (
                        <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                          <label className="block text-sm font-medium mb-2">Ширина калитки (м)</label>
                          <input
                            type="number"
                            value={formData.wicketWidth}
                            onChange={(e) => setFormData({ ...formData, wicketWidth: Number(e.target.value) })}
                            min="0.8"
                            max="1.2"
                            step="0.1"
                            className="input-modern"
                          />
                        </div>
                      )}

                      <button
                        onClick={calculate}
                        disabled={loading}
                        className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
                      >
                        <Calculator className="w-5 h-5" />
                        {loading ? 'Расчёт...' : 'Рассчитать стоимость'}
                      </button>
                    </div>
                  </div>
                </AnimatedSection>
              </div>

              <div className="lg:col-span-2">
                {result ? (
                  <AnimatedSection animation="scale-in">
                    <div className="card-modern p-6 sticky top-28">
                      <h2 className="text-xl font-bold mb-6">Результат расчёта</h2>

                      <div className="space-y-4 mb-6">
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Материалы
                          </h3>
                          <div className="space-y-2">
                            {result.materials.map((item, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                                <span className="text-muted-foreground">{item.name}</span>
                                <span className="font-medium">{formatCurrency(item.total)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center py-2 font-semibold">
                            <span>Итого материалы</span>
                            <span className="text-primary">{formatCurrency(result.materialsTotal)}</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Работы
                          </h3>
                          <div className="space-y-2">
                            {result.works.map((item, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                                <span className="text-muted-foreground">{item.name}</span>
                                <span className="font-medium">{formatCurrency(item.total)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center py-2 font-semibold">
                            <span>Итого работы</span>
                            <span className="text-primary">{formatCurrency(result.worksTotal)}</span>
                          </div>
                        </div>

                        {result.soilSurcharge > 0 && (
                          <div className="flex justify-between items-center py-2 text-sm">
                            <span className="text-muted-foreground">Наценка за грунт</span>
                            <span className="font-medium">{formatCurrency(result.soilSurcharge)}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-primary/5 p-6 rounded-xl mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">Итого</span>
                          <span className="text-3xl font-bold text-primary">{formatCurrency(result.grandTotal)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          className="btn-secondary flex items-center justify-center gap-2"
                          onClick={() => alert('PDF скачивание будет реализовано')}
                        >
                          <Download className="w-4 h-4" />
                          Скачать PDF
                        </button>
                        <Link
                          href="/contacts"
                          className="btn-primary flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Заказать расчёт
                        </Link>
                      </div>
                    </div>
                  </AnimatedSection>
                ) : (
                  <AnimatedSection animation="fade-in-left">
                    <div className="card-modern p-6 sticky top-28">
                      <h3 className="font-bold mb-4">Что включено в расчёт?</h3>
                      <ul className="space-y-3">
                        {[
                          'Все необходимые материалы',
                          'Работы по установке',
                          'Доставка (при необходимости)',
                          'Гарантия на работы',
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="w-4 h-4 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6 p-4 bg-secondary/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">Быстрый расчёт</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Получите точную стоимость за 30 секунд
                        </p>
                      </div>
                    </div>
                  </AnimatedSection>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
