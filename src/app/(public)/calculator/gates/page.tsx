'use client';

import { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Loader2, AlertCircle, DoorOpen } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AnimatedSection } from '@/hooks/useScrollReveal';
import OrderForm from '@/components/calculator/OrderForm';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { EVENT_NAMES } from '@/types/analytics';
import { trackEvent } from '@/lib/analytics';

interface AutomationType {
  id: string;
  name: string;
  retailPrice: number;
  description: string | null;
}

interface GateFormItem {
  gateType: 'SWING' | 'SLIDING';
  gateWidth: number;
  hasAutomation: boolean;
  automationId: string;
}

interface WicketFormItem {
  wicketWidth: number;
}

interface GatesFormState {
  height: number | '';
  needsInstallation: boolean;
  gates: GateFormItem[];
  wickets: WicketFormItem[];
}

interface EstimateItem {
  category: string;
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

interface GatesCalculatorResult {
  estimateId: string;
  items: EstimateItem[];
  totals: {
    materials: number;
    installation: number;
    grandTotal: number;
  };
  parameters: {
    height: number;
    needsInstallation: boolean;
    gates: Array<{
      type: string;
      width: number;
      height: number;
      selectedName: string;
    }>;
    wickets: Array<{
      width: number;
      height: number;
      selectedName: string;
    }>;
  };
  calculatedAt: string;
}

const MAX_GATES = 2;
const MAX_WICKETS = 2;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

const defaultGate = (): GateFormItem => ({
  gateType: 'SWING',
  gateWidth: 4.0,
  hasAutomation: false,
  automationId: '',
});

const defaultWicket = (): WicketFormItem => ({
  wicketWidth: 1.0,
});

export default function GatesCalculatorPage() {
  const { trackEvent: analyticsTrack } = useAnalytics();

  const [form, setForm] = useState<GatesFormState>({
    height: 2.0,
    needsInstallation: true,
    gates: [defaultGate()],
    wickets: [],
  });

  const [automationTypes, setAutomationTypes] = useState<AutomationType[]>([]);
  const [automationLoading, setAutomationLoading] = useState(false);

  const [result, setResult] = useState<GatesCalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    analyticsTrack(EVENT_NAMES.CALCULATOR_OPEN, { calculator: 'gates' });
  }, [analyticsTrack]);

  useEffect(() => {
    setAutomationLoading(true);
    fetch('/api/calculator/automation-types')
      .then(res => res.json())
      .then(data => {
        setAutomationTypes(data.automationTypes || data || []);
      })
      .catch(err => console.error('Failed to load automation types:', err))
      .finally(() => setAutomationLoading(false));
  }, []);

  const addGate = () => {
    if (form.gates.length < MAX_GATES) {
      setForm({ ...form, gates: [...form.gates, defaultGate()] });
    }
  };

  const removeGate = (index: number) => {
    setForm({ ...form, gates: form.gates.filter((_, i) => i !== index) });
  };

  const updateGate = (index: number, updates: Partial<GateFormItem>) => {
    const newGates = [...form.gates];
    newGates[index] = { ...newGates[index], ...updates };
    if (updates.gateType === 'SWING') {
      newGates[index].hasAutomation = false;
      newGates[index].automationId = '';
    }
    setForm({ ...form, gates: newGates });
  };

  const addWicket = () => {
    if (form.wickets.length < MAX_WICKETS) {
      setForm({ ...form, wickets: [...form.wickets, defaultWicket()] });
    }
  };

  const removeWicket = (index: number) => {
    setForm({ ...form, wickets: form.wickets.filter((_, i) => i !== index) });
  };

  const updateWicket = (index: number, updates: Partial<WicketFormItem>) => {
    const newWickets = [...form.wickets];
    newWickets[index] = { ...newWickets[index], ...updates };
    setForm({ ...form, wickets: newWickets });
  };

  const validate = (): string | null => {
    if (!form.height || form.height < 1.5 || form.height > 3.0) {
      return 'Укажите высоту от 1.5 до 3.0 м';
    }
    if (form.gates.length === 0 && form.wickets.length === 0) {
      return 'Добавьте хотя бы одни ворота или одну калитку';
    }
    for (const gate of form.gates) {
      if (!gate.gateWidth || gate.gateWidth < 2.0 || gate.gateWidth > 6.0) {
        return 'Ширина ворот должна быть от 2.0 до 6.0 м';
      }
      if (gate.hasAutomation && gate.gateType !== 'SLIDING') {
        return 'Автоматика доступна только для откатных ворот';
      }
      if (gate.hasAutomation && !gate.automationId) {
        return 'Выберите тип автоматики';
      }
    }
    for (const wicket of form.wickets) {
      if (!wicket.wicketWidth || wicket.wicketWidth < 0.8 || wicket.wicketWidth > 1.5) {
        return 'Ширина калитки должна быть от 0.8 до 1.5 м';
      }
    }
    return null;
  };

  const calculate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body = {
        height: Number(form.height),
        needsInstallation: form.needsInstallation,
        gates: form.gates.map(g => ({
          gateType: g.gateType,
          gateWidth: g.gateWidth,
          hasAutomation: g.hasAutomation,
          ...(g.hasAutomation && g.automationId ? { automationId: g.automationId } : {}),
        })),
        wickets: form.wickets.map(w => ({
          wicketWidth: w.wicketWidth,
        })),
      };

      const response = await fetch('/api/calculator/gates/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Ошибка расчёта');
        return;
      }

      setResult(data);
      trackEvent(EVENT_NAMES.CALCULATOR_CALCULATE, { calculator: 'gates', total: data.totals.grandTotal });
    } catch (err) {
      setError('Ошибка расчёта. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <AnimatedSection>
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <DoorOpen className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold text-gray-900">Калькулятор ворот и калиток</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Рассчитайте стоимость ворот и калиток с монтажом или без
            </p>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Общая высота (м) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={e => setForm({ ...form, height: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    min={1.5}
                    max={3.0}
                    step={0.1}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="2.0"
                  />
                  <p className="text-xs text-gray-400 mt-1">От 1.5 до 3.0 м</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Ворота</h3>
                    {form.gates.length < MAX_GATES && (
                      <button
                        type="button"
                        onClick={addGate}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить
                      </button>
                    )}
                  </div>

                  {form.gates.map((gate, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
                      {form.gates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGate(index)}
                          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <DoorOpen className="w-4 h-4 text-primary" />
                        <span className="font-medium text-gray-800">Ворота {index + 1}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Тип ворот</label>
                          <select
                            value={gate.gateType}
                            onChange={e => updateGate(index, { gateType: e.target.value as 'SWING' | 'SLIDING' })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                          >
                            <option value="SWING">Распашные</option>
                            <option value="SLIDING">Откатные</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Ширина (м)</label>
                          <input
                            type="number"
                            value={gate.gateWidth}
                            onChange={e => updateGate(index, { gateWidth: parseFloat(e.target.value) || 2.0 })}
                            min={2.0}
                            max={6.0}
                            step={0.5}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                          />
                        </div>
                      </div>

                      {gate.gateType === 'SLIDING' && (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={gate.hasAutomation}
                              onChange={e => updateGate(index, { hasAutomation: e.target.checked })}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">Добавить автоматику</span>
                          </label>
                          {gate.hasAutomation && (
                            <select
                              value={gate.automationId}
                              onChange={e => updateGate(index, { automationId: e.target.value })}
                              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            >
                              <option value="">Выберите автоматику</option>
                              {automationTypes.map(at => (
                                <option key={at.id} value={at.id}>
                                  {at.name} — {formatCurrency(at.retailPrice)}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Калитки</h3>
                    {form.wickets.length < MAX_WICKETS && (
                      <button
                        type="button"
                        onClick={addWicket}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить
                      </button>
                    )}
                  </div>

                  {form.wickets.map((wicket, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removeWicket(index)}
                        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2 mb-1">
                        <DoorOpen className="w-4 h-4 text-primary rotate-180" />
                        <span className="font-medium text-gray-800">Калитка {index + 1}</span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ширина (м)</label>
                        <input
                          type="number"
                          value={wicket.wicketWidth}
                          onChange={e => updateWicket(index, { wicketWidth: parseFloat(e.target.value) || 1.0 })}
                          min={0.8}
                          max={1.5}
                          step={0.1}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">От 0.8 до 1.5 м</p>
                      </div>
                    </div>
                  ))}

                  {form.wickets.length === 0 && (
                    <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">
                      <p className="text-sm text-gray-400">Калитки не добавлены</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.needsInstallation}
                      onChange={e => setForm({ ...form, needsInstallation: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-medium text-gray-800">Нужен монтаж</span>
                      <p className="text-xs text-gray-400">Включить стоимость монтажных работ в расчёт</p>
                    </div>
                  </label>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  onClick={calculate}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Расчёт...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5" />
                      Рассчитать стоимость
                    </>
                  )}
                </button>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
              {result ? (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">Результат расчёта</h3>

                  <div className="space-y-3">
                    {result.items.filter(i => i.category !== 'installation').map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100">
                        <div>
                          <p className="font-medium text-gray-800">{item.nomenclatureName}</p>
                          <p className="text-xs text-gray-400">{item.quantity} {item.unit} × {formatCurrency(item.pricePerUnit)}</p>
                        </div>
                        <span className="font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>

                  {result.items.some(i => i.category === 'installation') && (
                    <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                      <h4 className="font-semibold text-blue-800 text-sm">Монтажные работы</h4>
                      {result.items.filter(i => i.category === 'installation').map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-blue-700">{item.nomenclatureName}</span>
                          <span className="font-medium text-blue-900">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Материалы</span>
                      <span className="font-medium">{formatCurrency(result.totals.materials)}</span>
                    </div>
                    {form.needsInstallation && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Монтаж</span>
                        <span className="font-medium">{formatCurrency(result.totals.installation)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Итого</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(result.totals.grandTotal)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 text-center">
                    Расчёт от {new Date(result.calculatedAt).toLocaleString('ru-RU')}
                  </div>

                  <button
                    onClick={() => setShowOrderForm(true)}
                    className="w-full px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
                  >
                    Оформить заявку
                  </button>

                  {showOrderForm && (
                    <OrderForm
                      gateEstimateId={result.estimateId}
                      calculatedCost={result.totals.grandTotal}
                      onClose={() => setShowOrderForm(false)}
                      onSuccess={() => setShowOrderForm(false)}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Calculator className="w-10 h-10 text-primary/40" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-400 mb-2">Заполните параметры</h3>
                  <p className="text-gray-400 text-sm max-w-xs">
                    Укажите высоту, добавьте ворота и/или калитки, затем нажмите «Рассчитать стоимость»
                  </p>
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>
      </main>

      <Footer />
    </div>
  );
}
