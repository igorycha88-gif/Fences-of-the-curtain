'use client';

import { useState, useEffect } from 'react';
import { Calculator, Send } from 'lucide-react';
import Header from '@/components/layout/Header';
import CanopyNomenclatureNotFoundModal from '@/components/calculator/CanopyNomenclatureNotFoundModal';
import { metrikaEvents } from '@/lib/seo/metrika';
import { trackEvent } from '@/lib/analytics';
import { EVENT_NAMES } from '@/types/analytics';

const canopyTypeLabels: Record<string, string> = {
  'SINGLE_SLOPE': 'Односкатная',
  'DOUBLE_SLOPE': 'Двускатная',
  'ARCH': 'Арочная',
  'SINGLE_SLOPE_CURVED': 'Односкатная в дуге',
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

// Временная упрощённая стоимость: руб. за м²
const CANOPY_PRICE_PER_SQM = 8500;

function formatPrice(value: number): string {
  return Math.round(value).toLocaleString('ru-RU') + ' руб.';
}

interface CatalogRoofCovering {
  id: string;
  name: string;
  retailPricePerSqm: number;
  thickness: number | null;
}

interface CanopyCalculatorForm {
  canopyType: 'SINGLE_SLOPE' | 'DOUBLE_SLOPE' | 'ARCH' | 'SINGLE_SLOPE_CURVED';
  purpose: string;
  length: number;
  width: number;
  height: number;
  ridgeHeight: number;
  roofCoveringId: string;
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
    canopyType: 'SINGLE_SLOPE',
    purpose: 'car-2',
    length: 6,
    width: 4,
    height: 2.5,
    ridgeHeight: 1.0,
    roofCoveringId: '',
    installationType: 'ground',
    hasWaterSystem: false,
  });

  const [roofCoverings, setRoofCoverings] = useState<CatalogRoofCovering[]>([]);
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);

  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [showIndividualRequestModal, setShowIndividualRequestModal] = useState(false);

  type NumericField = 'height' | 'length' | 'width';

  const [inputValues, setInputValues] = useState<Record<NumericField, string>>({
    height: String(formData.height),
    length: String(formData.length),
    width: String(formData.width),
  });

  const handleNumericChange = (field: NumericField, raw: string) => {
    setInputValues(prev => ({ ...prev, [field]: raw }));
    if (raw === '') {
      setFormData(prev => ({ ...prev, [field]: 0 }));
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      setFormData(prev => ({ ...prev, [field]: parsed }));
    }
  };

  useEffect(() => {
    trackEvent(EVENT_NAMES.CALCULATOR_OPEN, { calculator: 'canopy' });

    fetch('/api/calculator/canopy-roof-coverings')
      .then(res => res.json())
      .then((data: CatalogRoofCovering[]) => {
        setRoofCoverings(data);
        if (data.length > 0 && !formData.roofCoveringId) {
          setFormData(prev => ({ ...prev, roofCoveringId: data[0].id }));
        }
      })
      .catch(() => {})
      .finally(() => setCatalogsLoaded(true));
  }, []);

  const calculate = () => {
    if (formData.length <= 0 || formData.width <= 0) {
      setCalcError('Длина и ширина должны быть положительными числами');
      return;
    }
    setCalcError(null);
    const area = formData.length * formData.width;
    const totalCost = area * CANOPY_PRICE_PER_SQM;
    const calcResult: CalculatorResult = {
      materials: [],
      works: [],
      materialsTotal: 0,
      worksTotal: 0,
      grandTotal: totalCost,
    };
    setResult(calcResult);
    metrikaEvents.calculatorComplete('canopy', totalCost);
    trackEvent(EVENT_NAMES.CALCULATOR_CALCULATE, { canopyType: formData.canopyType, calculator: 'canopy', area, totalCost });
  };

  const handleModalSuccess = () => {
    setShowIndividualRequestModal(false);
  };

  const selectedRoofCoveringName = roofCoverings.find(r => r.id === formData.roofCoveringId)?.name || '';

  const canopyParameters = {
    canopyType: formData.canopyType,
    canopyTypeLabel: canopyTypeLabels[formData.canopyType] || formData.canopyType,
    purpose: formData.purpose,
    purposeLabel: purposeLabels[formData.purpose] || formData.purpose,
    length: formData.length,
    width: formData.width,
    height: formData.height,
    ridgeHeight: formData.ridgeHeight,
    roofCoveringId: formData.roofCoveringId,
    roofCoveringName: selectedRoofCoveringName,
    installationType: formData.installationType,
    installationTypeLabel: installationTypeLabels[formData.installationType] || formData.installationType,
    hasWaterSystem: formData.hasWaterSystem,
  };

  if (!catalogsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="animate-pulse text-lg text-gray-500">Загрузка справочников...</div>
          </div>
        </main>
      </div>
    );
  }

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
                    onChange={(e) => setFormData({ ...formData, canopyType: e.target.value as CanopyCalculatorForm['canopyType'] })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {Object.entries(canopyTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Назначение</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {Object.entries(purposeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Высота (м)</label>
                  <input
                    type="number"
                    value={inputValues.height}
                    onChange={(e) => handleNumericChange('height', e.target.value)}
                    min="2"
                    max="6"
                    step="0.1"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Длина (м)</label>
                    <input
                      type="number"
                      value={inputValues.length}
                      onChange={(e) => handleNumericChange('length', e.target.value)}
                      min="3"
                      max="50"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ширина (м)</label>
                    <input
                      type="number"
                      value={inputValues.width}
                      onChange={(e) => handleNumericChange('width', e.target.value)}
                      min="2"
                      max="20"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Материал кровли</label>
                  <select
                    value={formData.roofCoveringId}
                    onChange={(e) => setFormData({ ...formData, roofCoveringId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={roofCoverings.length === 0}
                  >
                    {roofCoverings.length === 0 && (
                      <option value="">Нет доступных покрытий</option>
                    )}
                    {roofCoverings.map((covering) => (
                      <option key={covering.id} value={covering.id}>{covering.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={calculate}
                  disabled={loading || !formData.roofCoveringId}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  {loading ? 'Расчет...' : 'Рассчитать стоимость'}
                </button>

                {calcError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {calcError}
                  </div>
                )}
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

                  <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Предварительная стоимость:</span>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {formatPrice(result.grandTotal)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Площадь: {(canopyParameters.length * canopyParameters.width).toLocaleString('ru-RU')} м² × {CANOPY_PRICE_PER_SQM.toLocaleString('ru-RU')} руб./м²
                    </div>
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
                        <span className="text-muted-foreground">Кровля:</span>{' '}
                        <span className="font-medium">{canopyParameters.roofCoveringName}</span>
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
        totalCost={result?.grandTotal}
        pricePerSqm={CANOPY_PRICE_PER_SQM}
      />
    </div>
  );
}
