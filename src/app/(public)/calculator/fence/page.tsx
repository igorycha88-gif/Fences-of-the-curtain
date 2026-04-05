'use client';

import { useState, useEffect } from 'react';
import { Calculator, Send, Zap, Shield, Clock, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import { AnimatedSection } from '@/hooks/useScrollReveal';
import OrderForm from '@/components/calculator/OrderForm';
import NomenclatureNotFoundModal from '@/components/calculator/NomenclatureNotFoundModal';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { EVENT_NAMES } from '@/types/analytics';

interface FenceType {
  id: string;
  name: string;
  description?: string;
  image?: string;
  difficultyCoef: number;
  postSpacing: number;
  defaultLagRows: number;
  materialsCount: number;
}

interface PicketProfileType {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  active: boolean;
}

interface PicketCoating {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  active: boolean;
}

interface FenceCalculatorForm {
  fenceTypeId: string;
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
  difficultyCoef?: number;
  postSpacing?: number;
  picketProfileType: string;
  picketCoating: string;
  picketStep: number;
  picketMountingType: 'SINGLE' | 'CHESS';
}

interface CalculatorResult {
  estimateId: string;
  items: Array<{
    category: string;
    nomenclatureId: string | null;
    nomenclatureName: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalPrice: number;
  }>;
  totals: {
    materials: number;
    installation: number;
    grandTotal: number;
  };
  parameters: {
    fenceTypeId: string;
    fenceTypeName: string;
    length: number;
    height: number;
    lagRows: number;
    coating: 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE';
    gate?: {
      type: string;
      length: number;
      selectedName: string;
    };
    wicket?: {
      width: number;
      selectedName: string;
    };
  };
  calculatedAt: string;
}

export default function FenceCalculatorPage() {
  const { trackEvent } = useAnalytics();
  const [fenceTypes, setFenceTypes] = useState<FenceType[]>([]);
  const [fenceTypesLoading, setFenceTypesLoading] = useState(true);
  const [fenceTypesError, setFenceTypesError] = useState<string | null>(null);
  const [selectedFenceType, setSelectedFenceType] = useState<FenceType | null>(null);
  const isPanel3D = selectedFenceType?.name === '3D-панели';
  const isPicket = selectedFenceType?.name === 'Евроштакетник';
  const isProfnastil = selectedFenceType?.name === 'Профнастил';

  const [picketProfileTypes, setPicketProfileTypes] = useState<PicketProfileType[]>([]);
  const [picketCoatings, setPicketCoatings] = useState<PicketCoating[]>([]);

  const [formData, setFormData] = useState<FenceCalculatorForm>({
    fenceTypeId: '',
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
    coating: 'POLYMER_SINGLE',
    color: '5005',
    picketProfileType: '',
    picketCoating: '',
    picketStep: 5,
    picketMountingType: 'SINGLE',
  });

  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [gateWarning, setGateWarning] = useState<string | null>(null);
  const [wicketWarning, setWicketWarning] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showNomenclatureNotFoundModal, setShowNomenclatureNotFoundModal] = useState(false);

  useEffect(() => {
    const fetchFenceTypes = async () => {
      try {
        setFenceTypesLoading(true);
        setFenceTypesError(null);
        const response = await fetch('/api/calculator/fence-types');
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить типы заборов');
        }
        
        const data = await response.json();
        setFenceTypes(data.types);

        if (data.types.length > 0 && !formData.fenceTypeId) {
          const firstType = data.types[0];
          setSelectedFenceType(firstType);
          setFormData(prev => ({
            ...prev,
            fenceTypeId: firstType.id,
            lagRows: String(firstType.defaultLagRows) as '2' | '3',
            difficultyCoef: firstType.difficultyCoef,
            postSpacing: firstType.postSpacing,
          }));
        }
      } catch (error) {
        setFenceTypesError('Не удалось загрузить типы заборов. Попробуйте обновить страницу.');
      } finally {
        setFenceTypesLoading(false);
      }
    };

    fetchFenceTypes();

    fetch('/api/calculator/picket-profile-types')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPicketProfileTypes(data);
      })
      .catch(err => console.error('Error loading profile types:', err));

    fetch('/api/calculator/picket-coatings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPicketCoatings(data);
      })
      .catch(err => console.error('Error loading coatings:', err));
  }, []);

  const handleFenceTypeSelect = (fenceType: FenceType) => {
    setSelectedFenceType(fenceType);
    trackEvent(EVENT_NAMES.CALCULATOR_FENCE_TYPE_SELECT, {
      fence_type: fenceType.name,
      fence_type_id: fenceType.id,
    });
    const isPicketType = fenceType.name === 'Евроштакетник';
    setFormData(prev => ({
      ...prev,
      fenceTypeId: fenceType.id,
      lagRows: String(fenceType.defaultLagRows) as '2' | '3',
      difficultyCoef: fenceType.difficultyCoef,
      postSpacing: fenceType.postSpacing,
      picketProfileType: isPicketType ? (picketProfileTypes[0]?.id || '') : '',
      picketCoating: isPicketType ? (picketCoatings[0]?.id || '') : '',
      picketStep: isPicketType ? 5 : 5,
      picketMountingType: isPicketType ? 'SINGLE' : 'SINGLE',
    }));
  };

  useEffect(() => {
    if (formData.hasGate && formData.gateWidth >= formData.length) {
      setGateWarning(`Длина ворот (${formData.gateWidth} м) превышает длину забора (${formData.length} м)`);
    } else {
      setGateWarning(null);
    }
  }, [formData.hasGate, formData.gateWidth, formData.length]);

  useEffect(() => {
    const totalOpening = (formData.hasGate ? formData.gateWidth : 0) + (formData.hasWicket ? formData.wicketWidth : 0);
    if (formData.hasWicket && totalOpening >= formData.length) {
      setWicketWarning(`Ширина калитки (${formData.wicketWidth} м) + ворот (${formData.hasGate ? formData.gateWidth : 0} м) превышает длину забора (${formData.length} м)`);
    } else {
      setWicketWarning(null);
    }
  }, [formData.hasWicket, formData.wicketWidth, formData.hasGate, formData.gateWidth, formData.length]);

  const calculate = async () => {
    if (!formData.fenceTypeId) {
      alert('Выберите тип забора');
      return;
    }

    if (formData.hasGate && formData.gateWidth >= formData.length) {
      alert('Длина ворот превышает или равна общей длине забора');
      return;
    }

    const totalOpening = (formData.hasGate ? formData.gateWidth : 0) + (formData.hasWicket ? formData.wicketWidth : 0);
    if (totalOpening >= formData.length) {
      alert('Суммарная ширина ворот и калитки превышает или равна общей длине забора');
      return;
    }

    setLoading(true);
    try {
      console.log('[Calculator] Form data before submit:', JSON.stringify(formData, null, 2));
      
      const requestBody: Record<string, unknown> = {
        fenceTypeId: formData.fenceTypeId,
        length: formData.length,
        height: formData.height,
        coating: formData.coating,
      };

      if (!isPanel3D) {
        requestBody.lagRows = parseInt(formData.lagRows) as 2 | 3;
      }

      if (isPicket) {
        const selectedProfile = picketProfileTypes.find(p => p.id === formData.picketProfileType);
        const selectedCoating = picketCoatings.find(c => c.id === formData.picketCoating);
        requestBody.picketProfileType = selectedProfile?.name || '';
        requestBody.picketCoating = selectedCoating?.name || '';
        requestBody.picketStep = formData.picketStep;
        requestBody.picketMountingType = formData.picketMountingType;
      }

      if (formData.hasGate) {
        requestBody.hasGate = true;
        requestBody.gateType = formData.gateType || 'SWING';
        requestBody.gateWidth = formData.gateWidth;
        console.log('[Calculator] Sending gate params:', { hasGate: true, gateType: requestBody.gateType, gateWidth: requestBody.gateWidth });
      }

      if (formData.hasWicket) {
        requestBody.hasWicket = true;
        requestBody.wicketWidth = formData.wicketWidth;
        console.log('[Calculator] Sending wicket params:', { hasWicket: true, wicketWidth: requestBody.wicketWidth });
      }

      const response = await fetch('/api/calculator/fence/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Calculator] Received result:', JSON.stringify(data, null, 2));
        setResult(data);
        trackEvent(EVENT_NAMES.CALCULATOR_CALCULATE, {
          fence_type: selectedFenceType?.name,
          length: formData.length,
          height: formData.height,
          total_price: data.totals?.grandTotal,
          has_gate: formData.hasGate,
          has_wicket: formData.hasWicket,
        });
      } else {
        const errorData = await response.json();
        const nomenclatureErrors = [
          'NO_PROFNASTIL_FOUND',
          'NO_GATE_FOUND',
          'NO_WICKET_FOUND',
          'NO_PICKET_FOUND',
          'CALCULATOR_NOT_IMPLEMENTED',
        ];
        if (nomenclatureErrors.includes(errorData.error)) {
          setShowNomenclatureNotFoundModal(true);
        } else {
          alert(errorData.message || errorData.error || 'Ошибка расчета');
        }
      }
    } catch (error) {
      console.error('Calculation error:', error);
      alert('Ошибка расчета');
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

  const coatings = [
    { value: 'POLYMER_SINGLE', label: 'Полимерное (одностороннее)' },
    { value: 'POLYMER_DOUBLE', label: 'Полимерное (двустороннее)' },
    { value: 'GALVANIZED', label: 'Оцинковка' },
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
                  <div className="card-modern p-4 sm:p-8">
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
                      {fenceTypesError && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-destructive">Ошибка загрузки</p>
                            <p className="text-sm text-muted-foreground mt-1">{fenceTypesError}</p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium mb-2">Тип забора</label>
                        {fenceTypesLoading ? (
                          <div className="h-12 bg-secondary/50 rounded-xl animate-pulse" />
                        ) : fenceTypes.length > 0 ? (
                          <select
                            value={formData.fenceTypeId}
                            onChange={(e) => {
                              const selectedType = fenceTypes.find(t => t.id === e.target.value);
                              if (selectedType) {
                                handleFenceTypeSelect(selectedType);
                              }
                            }}
                            className="select-modern"
                          >
                            <option value="" disabled>Выберите тип забора</option>
                            {fenceTypes.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-center py-3 text-muted-foreground border border-border rounded-xl">
                            Нет доступных типов заборов
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {!isPanel3D && (
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
                        )}
                      </div>

                      {isProfnastil && (
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
                      )}

                      {isPicket && (
                        <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                          <h3 className="font-semibold text-primary">Параметры евроштакетника</h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Тип профиля *</label>
                              {picketProfileTypes.length === 0 ? (
                                <div className="h-12 bg-secondary/50 rounded-xl animate-pulse" />
                              ) : (
                                <select
                                  value={formData.picketProfileType}
                                  onChange={(e) => setFormData({ ...formData, picketProfileType: e.target.value })}
                                  className="select-modern"
                                  required
                                >
                                  <option value="">Выберите тип</option>
                                  {picketProfileTypes.map((pt) => (
                                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Покрытие *</label>
                              {picketCoatings.length === 0 ? (
                                <div className="h-12 bg-secondary/50 rounded-xl animate-pulse" />
                              ) : (
                                <select
                                  value={formData.picketCoating}
                                  onChange={(e) => setFormData({ ...formData, picketCoating: e.target.value })}
                                  className="select-modern"
                                  required
                                >
                                  <option value="">Выберите покрытие</option>
                                  {picketCoatings.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Шаг (см) *</label>
                              <input
                                type="number"
                                value={formData.picketStep}
                                onChange={(e) => setFormData({ ...formData, picketStep: parseInt(e.target.value) || 5 })}
                                min="1"
                                max="20"
                                step="1"
                                className="input-modern"
                                required
                              />
                              <p className="text-xs text-muted-foreground mt-1">Расстояние между штакетниками</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Тип монтажа *</label>
                              <select
                                value={formData.picketMountingType}
                                onChange={(e) => setFormData({ ...formData, picketMountingType: e.target.value as 'SINGLE' | 'CHESS' })}
                                className="select-modern"
                                required
                              >
                                <option value="SINGLE">Односторонний</option>
                                <option value="CHESS">В шахматном порядке</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

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
                          {gateWarning && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-700">
                              {gateWarning}
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          {wicketWarning && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-700 mb-3">
                              {wicketWarning}
                            </div>
                          )}
                          <label className="block text-sm font-medium mb-2">Ширина калитки (м)</label>
                          <input
                            type="number"
                            value={formData.wicketWidth}
                            onChange={(e) => setFormData({ ...formData, wicketWidth: Number(e.target.value) })}
                            min="0.8"
                            max="1.5"
                            step="0.1"
                            className="input-modern"
                          />
                        </div>
                      )}

                      <button
                        onClick={calculate}
                        disabled={loading || !formData.fenceTypeId}
                        className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            Смета
                          </h3>
                          <div className="space-y-2">
                            {result.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                                <div>
                                  <span className="text-muted-foreground">{item.nomenclatureName}</span>
                                  <span className="text-xs text-muted-foreground ml-2">({item.quantity} {item.unit})</span>
                                </div>
                                <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 space-y-2">
                          <div className="flex justify-between items-center py-2 font-semibold">
                            <span>Материалы</span>
                            <span className="text-primary">{formatCurrency(result.totals.materials)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 font-semibold">
                            <span>Монтаж</span>
                            <span className="text-primary">{formatCurrency(result.totals.installation)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary/5 p-6 rounded-xl mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">Итого</span>
                          <span className="text-3xl font-bold text-primary">{formatCurrency(result.totals.grandTotal)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => setShowOrderForm(true)}
                          className="btn-primary flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Оформить заявку
                        </button>
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

      {showOrderForm && result && (
        <OrderForm
          calculatedCost={result.totals.grandTotal}
          onClose={() => setShowOrderForm(false)}
          onSuccess={() => setShowOrderForm(false)}
        />
      )}

      <NomenclatureNotFoundModal
        isOpen={showNomenclatureNotFoundModal}
        onClose={() => setShowNomenclatureNotFoundModal(false)}
        onSuccess={() => setShowNomenclatureNotFoundModal(false)}
        fenceParameters={{
          fenceTypeId: formData.fenceTypeId,
          fenceTypeName: selectedFenceType?.name || '',
          length: formData.length,
          height: formData.height,
          coating: formData.coating,
          hasGate: formData.hasGate,
          gateType: formData.gateType || undefined,
          gateWidth: formData.gateWidth,
          hasWicket: formData.hasWicket,
          wicketWidth: formData.wicketWidth,
          lagRows: parseInt(formData.lagRows),
          picketProfileType: formData.picketProfileType,
          picketCoating: picketCoatings.find(c => c.id === formData.picketCoating)?.name || '',
          picketStep: formData.picketStep,
          picketMountingType: formData.picketMountingType,
        }}
      />
    </div>
  );
}
