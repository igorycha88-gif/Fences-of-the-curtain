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

interface CatalogPost {
  id: string;
  name: string;
  retailPricePerMeter: number;
  retailPricePerUnit: number;
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
  postTypeId: string;
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
    postTypeId: '',
    length: 6,
    width: 4,
    height: 2.5,
    ridgeHeight: 1.0,
    roofCoveringId: '',
    installationType: 'ground',
    hasWaterSystem: false,
  });

  const [posts, setPosts] = useState<CatalogPost[]>([]);
  const [roofCoverings, setRoofCoverings] = useState<CatalogRoofCovering[]>([]);
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);

  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [showIndividualRequestModal, setShowIndividualRequestModal] = useState(false);

  useEffect(() => {
    trackEvent(EVENT_NAMES.CALCULATOR_OPEN, { calculator: 'canopy' });

    Promise.all([
      fetch('/api/calculator/canopy-profiles?category=POST')
        .then(res => res.json())
        .then((data: CatalogPost[]) => {
          setPosts(data);
          if (data.length > 0 && !formData.postTypeId) {
            setFormData(prev => ({ ...prev, postTypeId: data[0].id }));
          }
        })
        .catch(() => {}),
      fetch('/api/calculator/canopy-roof-coverings')
        .then(res => res.json())
        .then((data: CatalogRoofCovering[]) => {
          setRoofCoverings(data);
          if (data.length > 0 && !formData.roofCoveringId) {
            setFormData(prev => ({ ...prev, roofCoveringId: data[0].id }));
          }
        })
        .catch(() => {}),
    ]).finally(() => setCatalogsLoaded(true));
  }, []);

  const calculate = async () => {
    if (!formData.postTypeId || !formData.roofCoveringId) return;
    setLoading(true);
    setCalcError(null);
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
        metrikaEvents.calculatorComplete('canopy', data.totalCost || data.grandTotal || 0);
        trackEvent(EVENT_NAMES.CALCULATOR_CALCULATE, { canopyType: formData.canopyType, calculator: 'canopy' });
      } else {
        const data = await response.json().catch(() => ({}));
        setCalcError(data.error || 'Ошибка расчёта. Попробуйте позже.');
      }
    } catch (error) {
      setCalcError('Ошибка соединения. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = () => {
    setShowIndividualRequestModal(false);
  };

  const selectedPostName = posts.find(p => p.id === formData.postTypeId)?.name || '';
  const selectedRoofCoveringName = roofCoverings.find(r => r.id === formData.roofCoveringId)?.name || '';

  const canopyParameters = {
    canopyType: formData.canopyType,
    canopyTypeLabel: canopyTypeLabels[formData.canopyType] || formData.canopyType,
    purpose: formData.purpose,
    purposeLabel: purposeLabels[formData.purpose] || formData.purpose,
    postTypeId: formData.postTypeId,
    postTypeName: selectedPostName,
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Столбы</label>
                  <select
                    value={formData.postTypeId}
                    onChange={(e) => setFormData({ ...formData, postTypeId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={posts.length === 0}
                  >
                    {posts.length === 0 && (
                      <option value="">Нет доступных столбов</option>
                    )}
                    {posts.map((post) => (
                      <option key={post.id} value={post.id}>{post.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Высота конька (м)</label>
                    <input
                      type="number"
                      value={formData.ridgeHeight}
                      onChange={(e) => setFormData({ ...formData, ridgeHeight: Number(e.target.value) })}
                      min="0.5"
                      max="2"
                      step="0.1"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип установки</label>
                  <select
                    value={formData.installationType}
                    onChange={(e) => setFormData({ ...formData, installationType: e.target.value as CanopyCalculatorForm['installationType'] })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {Object.entries(installationTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
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
                  disabled={loading || !formData.postTypeId || !formData.roofCoveringId}
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
                        <span className="text-muted-foreground">Столбы:</span>{' '}
                        <span className="font-medium">{canopyParameters.postTypeName}</span>
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
                        <span className="text-muted-foreground">Высота конька:</span>{' '}
                        <span className="font-medium">{canopyParameters.ridgeHeight} м</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Кровля:</span>{' '}
                        <span className="font-medium">{canopyParameters.roofCoveringName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Установка:</span>{' '}
                        <span className="font-medium">{canopyParameters.installationTypeLabel}</span>
                      </div>
                      {canopyParameters.hasWaterSystem && (
                        <div>
                          <span className="text-muted-foreground">Водосток:</span>{' '}
                          <span className="font-medium">Да</span>
                        </div>
                      )}
                    </div>
                  </div>

                {calcError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {calcError}
                  </div>
                )}

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
