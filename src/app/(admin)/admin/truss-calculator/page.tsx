'use client';

import { useState } from 'react';
import TrussCalculatorForm from '@/components/admin/TrussCalculator/TrussCalculatorForm';
import TrussDrawing from '@/components/admin/TrussCalculator/TrussDrawing';
import LoadReport from '@/components/admin/TrussCalculator/LoadReport';
import MaterialList from '@/components/admin/TrussCalculator/MaterialList';
import SavedCalculations from '@/components/admin/TrussCalculator/SavedCalculations';
import { TrussCalculationResult, CanopyRoofType } from '@/services/truss/types';
import { buildElementDetails } from '@/services/truss';
import toast from 'react-hot-toast';

interface CalculationFormState {
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

type TabType = 'calculator' | 'saved';

export default function TrussCalculatorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [result, setResult] = useState<TrussCalculationResult | null>(null);
  const [roofCoveringName, setRoofCoveringName] = useState('');
  const [formData, setFormData] = useState<CalculationFormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleCalculate = async (form: CalculationFormState) => {
    setLoading(true);
    setResult(null);
    setSavedId(null);
    try {
      const res = await fetch('/api/admin/truss-calculations/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Ошибка расчёта');
        return;
      }
      setResult(data.result);
      setRoofCoveringName(data.roofCoveringName);
      setFormData(form);
    } catch (error) {
      toast.error('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData || !result) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/truss-calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: `${getCanopyTypeName(formData.canopyType)} ${formData.width}x${formData.length}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Ошибка сохранения');
        return;
      }
      setSavedId(data.id);
      toast.success('Расчёт сохранён');
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!savedId) return;
    try {
      const res = await fetch(`/api/admin/truss-calculations/${savedId}/export`);
      if (!res.ok) {
        toast.error('Ошибка экспорта');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ТЗ_Навес_${formData?.canopyType || 'calc'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Ошибка экспорта');
    }
  };

  const handleQuickExport = async () => {
    if (!formData || !result) return;
    setSaving(true);
    try {
      const saveRes = await fetch('/api/admin/truss-calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: `${getCanopyTypeName(formData.canopyType)} ${formData.width}x${formData.length}`,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        toast.error(saveData.error || 'Ошибка сохранения');
        return;
      }
      setSavedId(saveData.id);

      const exportRes = await fetch(`/api/admin/truss-calculations/${saveData.id}/export`);
      if (!exportRes.ok) {
        toast.error('Ошибка экспорта');
        return;
      }
      const blob = await exportRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ТЗ_Навес_${getCanopyTypeName(formData.canopyType)}_${formData.width}x${formData.length}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Word-документ скачан');
    } catch {
      toast.error('Ошибка экспорта');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCalculation = async (calc: any) => {
    setActiveTab('calculator');
    setLoading(true);
    setResult(null);
    setSavedId(null);
    try {
      const res = await fetch(`/api/admin/truss-calculations/${calc.id}`);
      if (!res.ok) {
        toast.error('Ошибка загрузки расчёта');
        return;
      }
      const data = await res.json();
      const c = data.calculation;
      const geometry = c.trussGeometry;
      const materials = c.materialList;

      const form: CalculationFormState = {
        canopyType: c.canopyType,
        width: c.width,
        length: c.length,
        ridgeHeight: c.ridgeHeight,
        wallHeight: c.wallHeight || 0,
        trussSpacing: c.trussSpacing,
        roofCoveringId: c.roofCoveringId,
        postProfileId: c.postProfileId,
        crossbeamProfileId: c.crossbeamProfileId,
        strutProfileId: c.strutProfileId,
        archProfileId: c.archProfileId || '',
      };

      setFormData(form);
      setSavedId(c.id);
      setRoofCoveringName(c.roofCovering?.name || '');

      const elementDetails = buildElementDetails(geometry, {
        canopyType: c.canopyType,
        crossbeamProfileName: c.crossbeamProfile?.name || '',
        strutProfileName: c.strutProfile?.name || '',
        archProfileName: c.archProfile?.name,
      } as any);

      setResult({
        loads: {
          snowLoadNormative: c.snowLoadNormative,
          snowLoadDesign: c.snowLoad,
          windLoadNormative: c.windLoadNormative,
          windLoadDesign: c.windLoad,
          deadLoadNormative: c.deadLoadNormative,
          deadLoadDesign: c.deadLoad,
          totalLoadNormative: c.totalLoadNormative,
          totalLoadDesign: c.totalLoad,
          loadPerTruss: c.loadPerTruss,
          loadPerMeter: 0,
          slopeAngle: c.slopeAngle,
          snowCoeffMu: c.snowCoeffMu,
          windCoeffC: c.windCoeffC,
          windHeightCoeff: c.windHeightCoeff,
        },
        geometry,
        memberForces: [],
        profileChecks: {
          bottomChord: { passed: true, utilizationRatio: 0, requiredSectionModulus: 0, actualSectionModulus: 0 },
          topChord: { passed: true, utilizationRatio: 0, requiredSectionModulus: 0, actualSectionModulus: 0 },
          verticals: { passed: true, utilizationRatio: 0, requiredSectionModulus: 0, actualSectionModulus: 0 },
          diagonals: { passed: true, utilizationRatio: 0, requiredSectionModulus: 0, actualSectionModulus: 0 },
        },
        safetyFactor: c.safetyFactor,
        allProfilesPassed: true,
        recommendations: [],
        materialList: materials,
        totalWeight: materials?.reduce((s: number, m: any) => s + m.totalWeight, 0) || 0,
        totalPrice: materials?.reduce((s: number, m: any) => s + m.totalPrice, 0) || 0,
        svgDrawing: c.svgDrawing || '',
        elementDetails,
        archProfileLength: geometry?.archProfileBendLength,
      });

      toast.success('Расчёт загружен');
    } catch {
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Калькулятор ферм</h1>
        <p className="text-sm text-gray-500 mt-1">
          Расчёт нагрузки и проектирование ферм для навесов (снеговой район III — Московская область)
        </p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-0">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'calculator'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Калькулятор
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'saved'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Расчёты
          </button>
        </nav>
      </div>

      {activeTab === 'saved' && (
        <SavedCalculations onSelect={handleSelectCalculation} />
      )}

      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <TrussCalculatorForm onCalculate={handleCalculate} loading={loading} />
          </div>

          <div className="lg:col-span-8 space-y-6">
            {result && (
              <>
                <TrussDrawing svgString={result.svgDrawing} />
                <LoadReport
                  loads={result.loads}
                  safetyFactor={result.safetyFactor}
                  allPassed={result.allProfilesPassed}
                />
                <MaterialList
                  materials={result.materialList}
                  totalWeight={result.totalWeight}
                  totalPrice={result.totalPrice}
                  recommendations={result.recommendations}
                  elementDetails={result.elementDetails || []}
                  archProfileLength={result.archProfileLength}
                  canopyType={formData?.canopyType || 'SINGLE_SLOPE'}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || !!savedId}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {savedId ? '✓ Сохранено' : saving ? 'Сохранение...' : '💾 Сохранить расчёт'}
                  </button>
                  <button
                    onClick={savedId ? handleExport : handleQuickExport}
                    disabled={saving}
                    className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    📄 Скачать Word
                  </button>
                </div>

                <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                  Расчёт выполнен в соответствии с СП 20.13330.2016 «Нагрузки и воздействия» для снегового района III (Московская область).
                  Данный расчёт является предварительным и не заменяет полноценный инженерный расчёт.
                </div>
              </>
            )}

            {!result && !loading && (
              <div className="bg-white rounded-lg border p-12 text-center">
                <div className="text-gray-400 text-lg mb-2">📐</div>
                <p className="text-gray-500">Заполните параметры навеса и нажмите «Рассчитать»</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getCanopyTypeName(type: CanopyRoofType): string {
  switch (type) {
    case 'SINGLE_SLOPE': return 'Односкатный';
    case 'DOUBLE_SLOPE': return 'Двухскатный';
    case 'ARCH': return 'Арочный';
    case 'SINGLE_SLOPE_CURVED': return 'Односкатный_дуга';
  }
}
