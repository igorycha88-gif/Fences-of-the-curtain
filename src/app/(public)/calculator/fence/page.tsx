'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calculator, Send, Zap, Shield, Clock, AlertCircle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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

interface EstimateItem {
  category: string;
  nomenclatureId: string | null;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

interface CalculatorResult {
  estimateId: string;
  items: EstimateItem[];
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

interface MultiEstimateResult {
  multiEstimateId: string;
  estimates: Array<{
    index: number;
    result: CalculatorResult;
  }>;
  totals: {
    totalMaterials: number;
    totalInstallation: number;
    grandTotal: number;
  };
  calculatedAt: string;
}

const RECOMMENDED_MAX_CALCULATIONS = 4;

const defaultFormData = (): FenceCalculatorForm => ({
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

export default function FenceCalculatorPage() {
  const { trackEvent } = useAnalytics();
  const [fenceTypes, setFenceTypes] = useState<FenceType[]>([]);
  const [fenceTypesLoading, setFenceTypesLoading] = useState(true);
  const [fenceTypesError, setFenceTypesError] = useState<string | null>(null);

  const [picketProfileTypes, setPicketProfileTypes] = useState<PicketProfileType[]>([]);
  const [picketCoatings, setPicketCoatings] = useState<PicketCoating[]>([]);

  const [calculations, setCalculations] = useState<Array<{
    id: string;
    formData: FenceCalculatorForm;
    result: CalculatorResult | null;
    loading: boolean;
    gateWarning: string | null;
    wicketWarning: string | null;
    expanded: boolean;
  }>>([{
    id: crypto.randomUUID(),
    formData: defaultFormData(),
    result: null,
    loading: false,
    gateWarning: null,
    wicketWarning: null,
    expanded: true,
  }]);

  const [multiResult, setMultiResult] = useState<MultiEstimateResult | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showNomenclatureNotFoundModal, setShowNomenclatureNotFoundModal] = useState(false);
  const [nomenclatureNotFoundCalcIndex, setNomenclatureNotFoundCalcIndex] = useState<number | null>(null);

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

        setCalculations(prev => prev.map((calc, i) => {
          if (i === 0 && data.types.length > 0 && !calc.formData.fenceTypeId) {
            const firstType = data.types[0];
            return {
              ...calc,
              formData: {
                ...calc.formData,
                fenceTypeId: firstType.id,
                lagRows: String(firstType.defaultLagRows) as '2' | '3',
                difficultyCoef: firstType.difficultyCoef,
                postSpacing: firstType.postSpacing,
              },
            };
          }
          return calc;
        }));
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

  const updateCalcFormData = useCallback((calcId: string, updates: Partial<FenceCalculatorForm>) => {
    setCalculations(prev => prev.map(calc => {
      if (calc.id !== calcId) return calc;
      const newFormData = { ...calc.formData, ...updates };
      return { ...calc, formData: newFormData };
    }));
  }, []);

  const handleFenceTypeSelect = useCallback((calcId: string, fenceType: FenceType) => {
    const isPicketType = fenceType.name === 'Евроштакетник';
    updateCalcFormData(calcId, {
      fenceTypeId: fenceType.id,
      lagRows: String(fenceType.defaultLagRows) as '2' | '3',
      difficultyCoef: fenceType.difficultyCoef,
      postSpacing: fenceType.postSpacing,
      picketProfileType: isPicketType ? (picketProfileTypes[0]?.id || '') : '',
      picketCoating: isPicketType ? (picketCoatings[0]?.id || '') : '',
      picketStep: isPicketType ? 5 : 5,
      picketMountingType: isPicketType ? 'SINGLE' : 'SINGLE',
    });
  }, [picketProfileTypes, picketCoatings, updateCalcFormData]);

  const addCalculation = useCallback(() => {
    setCalculations(prev => {
      if (prev.length >= 10) return prev;
      const firstType = fenceTypes[0];
      return [...prev, {
        id: crypto.randomUUID(),
        formData: {
          ...defaultFormData(),
          fenceTypeId: firstType?.id || '',
          lagRows: String(firstType?.defaultLagRows || 2) as '2' | '3',
          difficultyCoef: firstType?.difficultyCoef,
          postSpacing: firstType?.postSpacing,
        },
        result: null,
        loading: false,
        gateWarning: null,
        wicketWarning: null,
        expanded: true,
      }];
    });
  }, [fenceTypes]);

  const removeCalculation = useCallback((calcId: string) => {
    setCalculations(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(c => c.id !== calcId);
    });
  }, []);

  const toggleExpanded = useCallback((calcId: string) => {
    setCalculations(prev => prev.map(calc =>
      calc.id === calcId ? { ...calc, expanded: !calc.expanded } : calc
    ));
  }, []);

  const calculateSingle = async (calcId: string) => {
    setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, loading: true, gateWarning: null, wicketWarning: null } : c));
    
    const calc = calculations.find(c => c.id === calcId);
    if (!calc) return;

    const { formData } = calc;
    const selectedFenceType = fenceTypes.find(t => t.id === formData.fenceTypeId);
    if (!selectedFenceType) {
      alert('Выберите тип забора');
      setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, loading: false } : c));
      return;
    }

    const isPanel3D = selectedFenceType.name === '3D-панели';
    const isPicket = selectedFenceType.name === 'Евроштакетник';

    if (formData.hasGate && formData.gateWidth >= formData.length) {
      setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, gateWarning: `Длина ворот (${formData.gateWidth} м) превышает длину забора (${formData.length} м)`, loading: false } : c));
      return;
    }

    const totalOpening = (formData.hasGate ? formData.gateWidth : 0) + (formData.hasWicket ? formData.wicketWidth : 0);
    if (totalOpening >= formData.length) {
      setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, wicketWarning: `Ширина калитки (${formData.wicketWidth} м) + ворот (${formData.hasGate ? formData.gateWidth : 0} м) превышает длину забора (${formData.length} м)`, loading: false } : c));
      return;
    }

    try {
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
      }

      if (formData.hasWicket) {
        requestBody.hasWicket = true;
        requestBody.wicketWidth = formData.wicketWidth;
      }

      const response = await fetch('/api/calculator/fence/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, result: data, loading: false } : c));
      } else {
        const errorData = await response.json();
        const nomenclatureErrors = ['NO_PROFNASTIL_FOUND', 'NO_GATE_FOUND', 'NO_WICKET_FOUND', 'NO_PICKET_FOUND', 'CALCULATOR_NOT_IMPLEMENTED'];
        if (nomenclatureErrors.includes(errorData.error)) {
          setNomenclatureNotFoundCalcIndex(calculations.findIndex(c => c.id === calcId));
          setShowNomenclatureNotFoundModal(true);
        } else {
          alert(errorData.message || errorData.error || 'Ошибка расчета');
        }
        setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, loading: false } : c));
      }
    } catch (error) {
      console.error('Calculation error:', error);
      alert('Ошибка расчета');
      setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, loading: false } : c));
    }
  };

  const calculateAll = async () => {
    const validCalculations = calculations.filter(c => c.formData.fenceTypeId);
    if (validCalculations.length === 0) {
      alert('Добавьте хотя бы один расчет с типом забора');
      return;
    }

    for (const calc of validCalculations) {
      const totalOpening = (calc.formData.hasGate ? calc.formData.gateWidth : 0) + (calc.formData.hasWicket ? calc.formData.wicketWidth : 0);
      if (calc.formData.hasGate && calc.formData.gateWidth >= calc.formData.length) {
        alert(`Расчет "${getFenceTypeName(calc.formData.fenceTypeId)}": длина ворот превышает длину забора`);
        return;
      }
      if (totalOpening >= calc.formData.length) {
        alert(`Расчет "${getFenceTypeName(calc.formData.fenceTypeId)}": ширина ворот и калитки превышает длину забора`);
        return;
      }
    }

    setLoadingAll(true);
    try {
      const estimates = validCalculations.map(calc => {
        const selectedFenceType = fenceTypes.find(t => t.id === calc.formData.fenceTypeId);
        const isPanel3D = selectedFenceType?.name === '3D-панели';
        const isPicket = selectedFenceType?.name === 'Евроштакетник';

        const estimate: Record<string, unknown> = {
          fenceTypeId: calc.formData.fenceTypeId,
          length: calc.formData.length,
          height: calc.formData.height,
          coating: calc.formData.coating,
        };

        if (!isPanel3D) {
          estimate.lagRows = parseInt(calc.formData.lagRows) as 2 | 3;
        }

        if (isPicket) {
          const selectedProfile = picketProfileTypes.find(p => p.id === calc.formData.picketProfileType);
          const selectedCoating = picketCoatings.find(c => c.id === calc.formData.picketCoating);
          estimate.picketProfileType = selectedProfile?.name || '';
          estimate.picketCoating = selectedCoating?.name || '';
          estimate.picketStep = calc.formData.picketStep;
          estimate.picketMountingType = calc.formData.picketMountingType;
        }

        if (calc.formData.hasGate) {
          estimate.hasGate = true;
          estimate.gateType = calc.formData.gateType || 'SWING';
          estimate.gateWidth = calc.formData.gateWidth;
        }

        if (calc.formData.hasWicket) {
          estimate.hasWicket = true;
          estimate.wicketWidth = calc.formData.wicketWidth;
        }

        return estimate;
      });

      const response = await fetch('/api/calculator/fence/multi-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimates }),
      });

      if (response.ok) {
        const data = await response.json();
        setMultiResult(data);
      } else {
        const errorData = await response.json();
        const nomenclatureErrors = ['NO_PROFNASTIL_FOUND', 'NO_GATE_FOUND', 'NO_WICKET_FOUND', 'NO_PICKET_FOUND', 'CALCULATOR_NOT_IMPLEMENTED'];
        if (nomenclatureErrors.includes(errorData.error)) {
          setShowNomenclatureNotFoundModal(true);
        } else {
          alert(errorData.message || errorData.error || 'Ошибка расчета');
        }
      }
    } catch (error) {
      console.error('Multi-calculation error:', error);
      alert('Ошибка расчета');
    } finally {
      setLoadingAll(false);
    }
  };

  const [loadingAll, setLoadingAll] = useState(false);

  const getFenceTypeName = (fenceTypeId: string) => {
    return fenceTypes.find(t => t.id === fenceTypeId)?.name || '';
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

  const hasAnyResults = calculations.some(c => c.result !== null) || multiResult !== null;

  const renderCalculationForm = (calc: typeof calculations[0], index: number) => {
    const { formData, loading, gateWarning, wicketWarning, expanded } = calc;
    const selectedFenceType = fenceTypes.find(t => t.id === formData.fenceTypeId);
    const isPanel3D = selectedFenceType?.name === '3D-панели';
    const isPicket = selectedFenceType?.name === 'Евроштакетник';
    const isProfnastil = selectedFenceType?.name === 'Профнастил';

    return (
      <div key={calc.id} className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleExpanded(calc.id)}
          className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold">
              Расчет {index + 1}
              {selectedFenceType && `: ${selectedFenceType.name}`}
            </span>
            {calc.result && (
              <span className="text-sm text-primary font-medium">
                {formatCurrency(calc.result.totals.grandTotal)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {calculations.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeCalculation(calc.id); }}
                className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {expanded && (
          <div className="p-4 sm:p-6 space-y-6">
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
                    if (selectedType) handleFenceTypeSelect(calc.id, selectedType);
                  }}
                  className="select-modern"
                >
                  <option value="" disabled>Выберите тип забора</option>
                  {fenceTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
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
                  onChange={(e) => updateCalcFormData(calc.id, { length: Number(e.target.value) })}
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
                  onChange={(e) => updateCalcFormData(calc.id, { height: Number(e.target.value) })}
                  min="1.5"
                  max="3.5"
                  step="0.1"
                  className="input-modern"
                />
              </div>
            </div>

            {!isPanel3D && (
              <div>
                <label className="block text-sm font-medium mb-2">Количество лаг</label>
                <select
                  value={formData.lagRows}
                  onChange={(e) => updateCalcFormData(calc.id, { lagRows: e.target.value as '2' | '3' })}
                  className="select-modern"
                >
                  <option value="2">2 ряда</option>
                  <option value="3">3 ряда</option>
                </select>
              </div>
            )}

            {isProfnastil && (
              <div>
                <label className="block text-sm font-medium mb-2">Покрытие</label>
                <select
                  value={formData.coating}
                  onChange={(e) => updateCalcFormData(calc.id, { coating: e.target.value as 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE' })}
                  className="select-modern"
                >
                  {coatings.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
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
                        onChange={(e) => updateCalcFormData(calc.id, { picketProfileType: e.target.value })}
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
                        onChange={(e) => updateCalcFormData(calc.id, { picketCoating: e.target.value })}
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
                      onChange={(e) => updateCalcFormData(calc.id, { picketStep: parseInt(e.target.value) || 5 })}
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
                      onChange={(e) => updateCalcFormData(calc.id, { picketMountingType: e.target.value as 'SINGLE' | 'CHESS' })}
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
                  onChange={(e) => updateCalcFormData(calc.id, { hasGate: e.target.checked })}
                  className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
                />
                <span className="font-medium">Ворота</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors">
                <input
                  type="checkbox"
                  checked={formData.hasWicket}
                  onChange={(e) => updateCalcFormData(calc.id, { hasWicket: e.target.checked })}
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
                      onChange={(e) => updateCalcFormData(calc.id, { gateType: e.target.value as 'SWING' | 'SLIDING' })}
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
                      onChange={(e) => updateCalcFormData(calc.id, { gateWidth: Number(e.target.value) })}
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
                  onChange={(e) => updateCalcFormData(calc.id, { wicketWidth: Number(e.target.value) })}
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  className="input-modern"
                />
              </div>
            )}

            <button
              onClick={() => calculateSingle(calc.id)}
              disabled={loading || !formData.fenceTypeId}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator className="w-5 h-5" />
              {loading ? 'Расчёт...' : 'Рассчитать'}
            </button>

            {calc.result && (
              <div className="space-y-3 pt-4 border-t border-border/50">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Смета</h3>
                <div className="space-y-1">
                  {calc.result.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-border/30">
                      <span className="text-muted-foreground">{item.nomenclatureName}</span>
                      <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Материалы</span>
                  <span>{formatCurrency(calc.result.totals.materials)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Монтаж</span>
                  <span>{formatCurrency(calc.result.totals.installation)}</span>
                </div>
                <div className="bg-primary/5 p-4 rounded-xl flex justify-between items-center">
                  <span className="font-bold">Итого</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(calc.result.totals.grandTotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
            <div className="grid lg:grid-cols-5 gap-8 lg:items-start">
              <div className="lg:col-span-3">
                <AnimatedSection animation="fade-in-right">
                  <div className="card-modern p-4 sm:p-6">
                    <div className="space-y-4">
                      {calculations.map((calc, index) => renderCalculationForm(calc, index))}

                      {calculations.length < 10 && (
                        <button
                          onClick={addCalculation}
                          className="w-full py-4 border-2 border-dashed border-primary/40 rounded-xl text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/60 transition-all"
                        >
                          <Plus className="w-5 h-5" />
                          Добавить ещё один тип забора
                          <span className="text-xs text-muted-foreground">({calculations.length}/10)</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={calculateAll}
                      disabled={loadingAll || calculations.every(c => !c.formData.fenceTypeId)}
                      className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Calculator className="w-5 h-5" />
                      {loadingAll ? 'Расчёт всех заборов...' : 'Рассчитать все заборы'}
                    </button>
                  </div>
                </AnimatedSection>
              </div>

              <div className="lg:col-span-2 lg:sticky lg:top-28 lg:self-start">
                {hasAnyResults ? (
                  <AnimatedSection animation="scale-in">
                    <div className="card-modern p-6">
                      <h2 className="text-xl font-bold mb-6">Результат расчёта</h2>

                      {multiResult ? (
                        <div className="space-y-4 mb-6">
                          {multiResult.estimates.map(({ index, result }) => (
                            <div key={result.estimateId} className="border border-border rounded-xl p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">
                                  {result.parameters.fenceTypeName}
                                </span>
                                <span className="text-primary font-bold">
                                  {formatCurrency(result.totals.grandTotal)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {result.parameters.length} м × {result.parameters.height} м
                              </p>
                            </div>
                          ))}

                          <div className="border-t-2 border-primary/20 pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Материалы (все заборы)</span>
                              <span>{formatCurrency(multiResult.totals.totalMaterials)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Монтаж (все заборы)</span>
                              <span>{formatCurrency(multiResult.totals.totalInstallation)}</span>
                            </div>
                          </div>

                          <div className="bg-primary/5 p-6 rounded-xl">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold">Итого</span>
                              <span className="text-3xl font-bold text-primary">
                                {formatCurrency(multiResult.totals.grandTotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : calculations.filter(c => c.result).length > 0 && (
                        <div className="space-y-4 mb-6">
                          {calculations.filter(c => c.result).map((calc, idx) => calc.result && (
                            <div key={calc.id} className="border border-border rounded-xl p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">
                                  {calc.result.parameters.fenceTypeName}
                                </span>
                                <span className="text-primary font-bold">
                                  {formatCurrency(calc.result.totals.grandTotal)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {calc.result.parameters.length} м × {calc.result.parameters.height} м
                              </p>
                            </div>
                          ))}

                          {calculations.filter(c => c.result).length > 1 && (
                            <>
                              <div className="border-t-2 border-primary/20 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Материалы</span>
                                  <span>
                                    {formatCurrency(
                                      calculations.filter(c => c.result).reduce((sum, c) => sum + (c.result?.totals.materials || 0), 0)
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Монтаж</span>
                                  <span>
                                    {formatCurrency(
                                      calculations.filter(c => c.result).reduce((sum, c) => sum + (c.result?.totals.installation || 0), 0)
                                    )}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-primary/5 p-6 rounded-xl">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-bold">Итого</span>
                                  <span className="text-3xl font-bold text-primary">
                                    {formatCurrency(
                                      calculations.filter(c => c.result).reduce((sum, c) => sum + (c.result?.totals.grandTotal || 0), 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

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
                    <div className="card-modern p-6">
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

      {showOrderForm && (multiResult || calculations.some(c => c.result)) && (
        multiResult ? (
          <OrderForm
            multiEstimateId={multiResult.multiEstimateId}
            estimates={multiResult.estimates}
            totals={multiResult.totals}
            onClose={() => setShowOrderForm(false)}
            onSuccess={() => setShowOrderForm(false)}
          />
        ) : (
          <OrderForm
            calculatedCost={
              calculations.filter(c => c.result).length === 1
                ? calculations.find(c => c.result)!.result!.totals.grandTotal
                : calculations.filter(c => c.result).reduce((sum, c) => sum + (c.result?.totals.grandTotal || 0), 0)
            }
            onClose={() => setShowOrderForm(false)}
            onSuccess={() => setShowOrderForm(false)}
          />
        )
      )}

      <NomenclatureNotFoundModal
        isOpen={showNomenclatureNotFoundModal}
        onClose={() => setShowNomenclatureNotFoundModal(false)}
        onSuccess={() => setShowNomenclatureNotFoundModal(false)}
        fenceParameters={
          nomenclatureNotFoundCalcIndex !== null
            ? {
                fenceTypeId: calculations[nomenclatureNotFoundCalcIndex]?.formData.fenceTypeId || '',
                fenceTypeName: getFenceTypeName(calculations[nomenclatureNotFoundCalcIndex]?.formData.fenceTypeId || ''),
                length: calculations[nomenclatureNotFoundCalcIndex]?.formData.length || 0,
                height: calculations[nomenclatureNotFoundCalcIndex]?.formData.height || 0,
                coating: calculations[nomenclatureNotFoundCalcIndex]?.formData.coating,
                hasGate: calculations[nomenclatureNotFoundCalcIndex]?.formData.hasGate,
                gateType: calculations[nomenclatureNotFoundCalcIndex]?.formData.gateType || undefined,
                gateWidth: calculations[nomenclatureNotFoundCalcIndex]?.formData.gateWidth,
                hasWicket: calculations[nomenclatureNotFoundCalcIndex]?.formData.hasWicket,
                wicketWidth: calculations[nomenclatureNotFoundCalcIndex]?.formData.wicketWidth,
                lagRows: parseInt(calculations[nomenclatureNotFoundCalcIndex]?.formData.lagRows || '2'),
                picketProfileType: calculations[nomenclatureNotFoundCalcIndex]?.formData.picketProfileType,
                picketCoating: picketCoatings.find(c => c.id === calculations[nomenclatureNotFoundCalcIndex]?.formData.picketCoating)?.name || '',
                picketStep: calculations[nomenclatureNotFoundCalcIndex]?.formData.picketStep,
                picketMountingType: calculations[nomenclatureNotFoundCalcIndex]?.formData.picketMountingType,
              }
            : {
                fenceTypeId: '',
                fenceTypeName: '',
                length: 0,
                height: 0,
                coating: 'POLYMER_SINGLE',
                hasGate: false,
                hasWicket: false,
                gateWidth: 0,
                wicketWidth: 0,
                lagRows: 2,
                picketProfileType: '',
                picketCoating: '',
                picketStep: 0,
                picketMountingType: 'SINGLE',
              }
        }
      />
    </div>
  );
}
