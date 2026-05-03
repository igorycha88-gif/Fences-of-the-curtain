'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calculator, Send, Plus, Trash2, ChevronDown, ChevronUp, ShoppingCart, Save, AlertCircle, X, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ExtendedEstimateItem, EstimateSummary } from '@/lib/utils/marginCalculator';

interface FenceType {
  id: string;
  name: string;
  description?: string;
  difficultyCoef: number;
  postSpacing: number;
  defaultLagRows: number;
}

interface PicketProfileType {
  id: string;
  name: string;
}

interface FenceCalculatorForm {
  fenceTypeId: string;
  length: number | '';
  height: number | '';
  lagRows: '2' | '3';
  hasGate: boolean;
  gateType: 'SWING' | 'SLIDING' | '';
  gateWidth: number;
  hasWicket: boolean;
  wicketWidth: number;
  coating: 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE';
  picketProfileType: string;
  picketStep: number;
  picketMountingType: 'SINGLE' | 'CHESS';
  meshCoating: 'GALVANIZED' | 'POLYMER';
  meshCellSize: number;
  meshWireThickness: number;
  hasAutomation: boolean;
  automationId: string;
}

interface AdminEstimateResult {
  estimateId: string;
  items: ExtendedEstimateItem[];
  summary: EstimateSummary;
  parameters: {
    fenceTypeId: string;
    fenceTypeName: string;
    length: number;
    height: number;
    lagRows: 2 | 3;
    coating?: string;
  };
  calculatedAt: string;
}

interface NomenclatureSearchItem {
  id: string;
  name: string;
  retailPrice: number;
  unit: string;
  category: string;
}

const defaultFormData = (): FenceCalculatorForm => ({
  fenceTypeId: '',
  length: '',
  height: '',
  lagRows: '2',
  hasGate: false,
  gateType: '',
  gateWidth: 4.0,
  hasWicket: false,
  wicketWidth: 1.0,
  coating: 'POLYMER_SINGLE',
  picketProfileType: '',
  picketStep: 5,
  picketMountingType: 'SINGLE',
  meshCoating: 'GALVANIZED',
  meshCellSize: 50,
  meshWireThickness: 2.0,
  hasAutomation: false,
  automationId: '',
});

const COATING_LABELS: Record<string, string> = {
  GALVANIZED: 'Оцинковка',
  POLYMER_SINGLE: 'Полимерное одностороннее',
  POLYMER_DOUBLE: 'Полимерное двустороннее',
};

const CATEGORY_LABELS: Record<string, string> = {
  posts: 'Столбы',
  lags: 'Лаги',
  profnastil: 'Профнастил',
  panel3d: '3D-панели',
  picket: 'Евроштакетник',
  mesh: 'Сетка-рабица',
  gates: 'Ворота',
  wickets: 'Калитки',
  automation: 'Автоматика',
  mounting_hardware: 'Монтажная фурнитура',
  installation: 'Работы',
};

const CATEGORY_ICONS: Record<string, string> = {
  posts: '🏗️',
  lags: '📏',
  profnastil: '🔩',
  panel3d: '🔲',
  picket: '🪵',
  mesh: '🔗',
  gates: '🚪',
  wickets: '🚶',
  mounting_hardware: '🔧',
  installation: '⚒️',
};

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 1) return '+7';
  if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
  if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

export default function AdminCalculatorPage() {
  const [fenceTypes, setFenceTypes] = useState<FenceType[]>([]);
  const [picketProfileTypes, setPicketProfileTypes] = useState<PicketProfileType[]>([]);
  const [meshOptions, setMeshOptions] = useState<{
    coatings: Record<string, string>;
    cellSizes: number[];
    wireThicknesses: number[];
  }>({ coatings: {}, cellSizes: [], wireThicknesses: [] });
  const [automationTypes, setAutomationTypes] = useState<Array<{ id: string; name: string; retailPrice: number }>>([]);

  const [calculations, setCalculations] = useState<Array<{
    id: string;
    formData: FenceCalculatorForm;
    result: AdminEstimateResult | null;
    loading: boolean;
    error: string | null;
    expanded: boolean;
  }>>([{
    id: crypto.randomUUID(),
    formData: defaultFormData(),
    result: null,
    loading: false,
    error: null,
    expanded: true,
  }]);

  const [multiResult, setMultiResult] = useState<{
    multiEstimateId: string;
    estimates: AdminEstimateResult[];
    totals: { materials: number; installation: number; grandTotal: number };
  } | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ clientName: '', phone: '', email: '', comment: '' });
  const [orderFormErrors, setOrderFormErrors] = useState<Record<string, string>>({});
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const [showNomenclaturePicker, setShowNomenclaturePicker] = useState(false);
  const [activeEstimateId, setActiveEstimateId] = useState<string | null>(null);
  const [nomenclatureSearch, setNomenclatureSearch] = useState('');
  const [nomenclatureCategory, setNomenclatureCategory] = useState('all');
  const [nomenclatureResults, setNomenclatureResults] = useState<Record<string, NomenclatureSearchItem[]>>({});
  const [nomenclatureLoading, setNomenclatureLoading] = useState(false);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [addingItemQty, setAddingItemQty] = useState(1);

  useEffect(() => {
    fetch('/api/calculator/fence-types')
      .then(res => res.json())
      .then(data => {
        const types = data.types || [];
        setFenceTypes(types);
        if (types.length > 0) {
          setCalculations(prev => prev.map((calc, i) => {
            if (i === 0) {
              return {
                ...calc,
                formData: {
                  ...calc.formData,
                  fenceTypeId: types[0].id,
                  lagRows: String(types[0].defaultLagRows) as '2' | '3',
                },
              };
            }
            return calc;
          }));
        }
      })
      .catch(() => toast.error('Не удалось загрузить типы заборов'));

    fetch('/api/calculator/picket-profile-types')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setPicketProfileTypes(data); })
      .catch(() => {});

    fetch('/api/calculator/mesh-options?height=2.0')
      .then(res => res.json())
      .then(data => { if (data.coatings || data.cellSizes) setMeshOptions(data); })
      .catch(() => {});

    fetch('/api/calculator/automation-types')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setAutomationTypes(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const meshCalc = calculations.find(c => {
      const ft = fenceTypes.find(t => t.id === c.formData.fenceTypeId);
      return ft?.name === 'Сетка-рабица';
    });
    if (!meshCalc) return;
    const h = meshCalc.formData.height;
    if (!h || h < 1 || h > 5) return;
    fetch(`/api/calculator/mesh-options?height=${h}`)
      .then(res => res.json())
      .then(data => { if (data.coatings || data.cellSizes) setMeshOptions(data); })
      .catch(() => {});
  }, [calculations, fenceTypes]);

  const updateCalcFormData = useCallback((calcId: string, updates: Partial<FenceCalculatorForm>) => {
    setCalculations(prev => prev.map(calc =>
      calc.id === calcId ? { ...calc, formData: { ...calc.formData, ...updates } } : calc
    ));
  }, []);

  const getFenceTypeName = (fenceTypeId: string) => fenceTypes.find(t => t.id === fenceTypeId)?.name || '';

  const buildRequestBody = (calc: typeof calculations[0]) => {
    const formData = calc.formData;
    const selectedFenceType = fenceTypes.find(t => t.id === formData.fenceTypeId);
    if (!selectedFenceType) return null;

    const isPanel3D = selectedFenceType.name === '3D-панели';
    const isPicket = selectedFenceType.name === 'Евроштакетник';
    const isMesh = selectedFenceType.name === 'Сетка-рабица';

    const body: Record<string, unknown> = {
      fenceTypeId: formData.fenceTypeId,
      length: Number(formData.length),
      height: Number(formData.height),
      coating: formData.coating,
    };

    if (!isPanel3D) body.lagRows = parseInt(formData.lagRows) as 2 | 3;
    if (isPicket) {
      const profile = picketProfileTypes.find(p => p.id === formData.picketProfileType);
      body.picketProfileType = profile?.name || '';
      body.picketStep = formData.picketStep;
      body.picketMountingType = formData.picketMountingType;
    }
    if (isMesh) {
      body.meshCellSize = formData.meshCellSize;
      body.meshWireThickness = formData.meshWireThickness;
      body.meshCoating = formData.meshCoating;
    }
    if (formData.hasGate) {
      body.hasGate = true;
      body.gateType = formData.gateType || 'SWING';
      body.gateWidth = formData.gateWidth;
    }
    if (formData.hasWicket) {
      body.hasWicket = true;
      body.wicketWidth = formData.wicketWidth;
    }
    if (formData.hasAutomation && formData.automationId && (formData.gateType === 'SLIDING')) {
      body.hasAutomation = true;
      body.automationId = formData.automationId;
    }

    return body;
  };

  const calculateSingle = async (calcId: string) => {
    const calc = calculations.find(c => c.id === calcId);
    if (!calc) return;

    const { formData } = calc;
    if (!formData.fenceTypeId || formData.length === '' || formData.height === '') {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const length = Number(formData.length);
    const height = Number(formData.height);
    if (length < 1 || length > 1000) { toast.error('Длина: 1-1000 м'); return; }
    if (height < 1.5 || height > 3.5) { toast.error('Высота: 1.5-3.5 м'); return; }

    if (formData.hasGate && formData.gateWidth >= length) {
      toast.error('Ширина ворот превышает длину забора');
      return;
    }
    const totalOpening = (formData.hasGate ? formData.gateWidth : 0) + (formData.hasWicket ? formData.wicketWidth : 0);
    if (totalOpening >= length) {
      toast.error('Сумма ворот и калитки превышает длину забора');
      return;
    }

    setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, loading: true, error: null } : c));

    const body = buildRequestBody(calc);
    if (!body) {
      setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, loading: false } : c));
      return;
    }

    try {
      const response = await fetch('/api/admin/calculator/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, result: data, loading: false } : c));
        const origQtys: Record<string, number> = {};
        data.items.forEach((item: ExtendedEstimateItem) => { origQtys[item.nomenclatureId] = item.quantity; });
        setOriginalQuantities(prev => ({ ...prev, ...origQtys }));
        toast.success('Расчёт выполнен');
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.message || errorData.error || 'Ошибка расчёта';
        setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, loading: false, error: errorMsg } : c));
        toast.error(errorMsg);
      }
    } catch {
      setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, loading: false, error: 'Ошибка сети' } : c));
      toast.error('Ошибка сети');
    }
  };

  const calculateAll = async () => {
    const validCalcs = calculations.filter(c => c.formData.fenceTypeId);
    if (validCalcs.length === 0) { toast.error('Добавьте расчёт'); return; }
    if (validCalcs.length === 1) {
      await calculateSingle(validCalcs[0].id);
      return;
    }

    setLoadingAll(true);
    try {
      const estimates = [];
      const estimateCalcIds: string[] = [];
      for (const calc of validCalcs) {
        const body = buildRequestBody(calc);
        if (body) {
          estimates.push(body);
          estimateCalcIds.push(calc.id);
        }
      }

      if (estimates.length === 0) { setLoadingAll(false); return; }

      const response = await fetch('/api/admin/calculator/multi-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimates }),
      });

      if (response.ok) {
        const data = await response.json();
        setMultiResult(data);
        data.estimates.forEach((est: AdminEstimateResult, idx: number) => {
          const calcId = estimateCalcIds[idx];
          if (calcId) {
            setCalculations(prev => prev.map(c => c.id === calcId ? { ...c, result: est, loading: false } : c));
          }
        });
        toast.success('Все расчёты выполнены');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || errorData.error || 'Ошибка расчёта');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setLoadingAll(false);
    }
  };

  const recalcSummary = (items: ExtendedEstimateItem[]): EstimateSummary => {
    const materialItems = items.filter(i => i.category !== 'installation');
    const workItems = items.filter(i => i.category === 'installation');
    const retailTotal = items.reduce((s, i) => s + i.totalPrice, 0);
    const purchaseTotal = items.reduce((s, i) => s + (i.purchaseTotal ?? i.purchasePricePerUnit ? (i.purchasePricePerUnit ?? 0) * i.quantity : 0), 0);
    const retailMaterialsTotal = materialItems.reduce((s, i) => s + i.totalPrice, 0);
    const purchaseMaterialsTotal = materialItems.reduce((s, i) => s + (i.purchasePricePerUnit ? i.purchasePricePerUnit * i.quantity : 0), 0);
    const worksTotal = workItems.reduce((s, i) => s + i.totalPrice, 0);
    const marginTotalRub = retailTotal - purchaseTotal;
    const materialMarginRub = retailMaterialsTotal - purchaseMaterialsTotal;
    return {
      retailTotal: Math.round(retailTotal * 100) / 100,
      purchaseTotal: Math.round(purchaseTotal * 100) / 100,
      marginTotalRub: Math.round(marginTotalRub * 100) / 100,
      marginTotalPercent: retailTotal > 0 ? Math.round(marginTotalRub / retailTotal * 10000) / 100 : 0,
      retailMaterialsTotal: Math.round(retailMaterialsTotal * 100) / 100,
      purchaseMaterialsTotal: Math.round(purchaseMaterialsTotal * 100) / 100,
      materialMarginRub: Math.round(materialMarginRub * 100) / 100,
      materialMarginPercent: retailMaterialsTotal > 0 ? Math.round(materialMarginRub / retailMaterialsTotal * 10000) / 100 : 0,
      worksTotal: Math.round(worksTotal * 100) / 100,
      grandTotal: Math.round((retailMaterialsTotal + worksTotal) * 100) / 100,
    };
  };

  const handleItemQuantityChange = async (estimateId: string, nomenclatureId: string, newQuantity: number) => {
    const calc = calculations.find(c => c.result?.estimateId === estimateId);
    if (!calc?.result) return;

    const updatedItems = calc.result.items.map(item => {
      if (item.nomenclatureId !== nomenclatureId) return item;
      const newTotalPrice = Math.round(newQuantity * item.pricePerUnit * 100) / 100;
      const purchaseTotal = item.purchasePricePerUnit != null ? Math.round(item.purchasePricePerUnit * newQuantity * 100) / 100 : null;
      const marginRub = purchaseTotal != null ? Math.round((newTotalPrice - purchaseTotal) * 100) / 100 : null;
      const marginPercent = marginRub != null && newTotalPrice > 0 ? Math.round(marginRub / newTotalPrice * 10000) / 100 : null;
      return { ...item, quantity: newQuantity, totalPrice: newTotalPrice, purchaseTotal, marginRub, marginPercent };
    });

    const newSummary = recalcSummary(updatedItems);

    setCalculations(prev => prev.map(c => {
      if (c.result?.estimateId !== estimateId) return c;
      return { ...c, result: { ...c.result, items: updatedItems, summary: newSummary } };
    }));
  };

  const [originalQuantities, setOriginalQuantities] = useState<Record<string, number>>({});

  const saveItemChanges = async (estimateId: string) => {
    const calc = calculations.find(c => c.result?.estimateId === estimateId);
    if (!calc?.result) return;

    try {
      const response = await fetch(`/api/admin/calculator/estimate/${estimateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: calc.result.items.map(item => {
            const origQty = originalQuantities[item.nomenclatureId];
            return {
              nomenclatureId: item.nomenclatureId,
              nomenclatureName: item.nomenclatureName,
              category: item.category,
              quantity: item.quantity,
              unit: item.unit,
              pricePerUnit: item.pricePerUnit,
              autoQuantity: origQty !== undefined && origQty !== item.quantity ? origQty : undefined,
            };
          }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCalculations(prev => prev.map(c => {
          if (c.result?.estimateId !== estimateId) return c;
          return { ...c, result: data };
        }));
        toast.success('Изменения сохранены');
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка сети');
    }
  };

  const handleRemoveItem = async (estimateId: string, nomenclatureId: string) => {
    try {
      const response = await fetch(
        `/api/admin/calculator/estimate/${estimateId}/items/${nomenclatureId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        const data = await response.json();
        setCalculations(prev => prev.map(c => {
          if (c.result?.estimateId !== estimateId) return c;
          return { ...c, result: data };
        }));
        toast.success('Позиция удалена');
      } else {
        toast.error('Ошибка удаления');
      }
    } catch {
      toast.error('Ошибка сети');
    }
  };

  const openNomenclaturePicker = (estimateId: string) => {
    setActiveEstimateId(estimateId);
    setShowNomenclaturePicker(true);
    setNomenclatureSearch('');
    setNomenclatureCategory('all');
    fetchNomenclature('', '');
  };

  const fetchNomenclature = async (search: string, category: string) => {
    setNomenclatureLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category && category !== 'all') params.set('category', category);
      const response = await fetch(`/api/admin/nomenclature/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        const mapped: Record<string, NomenclatureSearchItem[]> = {};
        for (const cat of data.categories || []) {
          if (cat.items && cat.items.length > 0) {
            mapped[cat.category] = cat.items;
          }
        }
        setNomenclatureResults(mapped);
      }
    } catch {
      toast.error('Ошибка загрузки номенклатуры');
    } finally {
      setNomenclatureLoading(false);
    }
  };

  const handleAddNomenclature = async (item: NomenclatureSearchItem) => {
    if (!activeEstimateId) return;

    try {
      const response = await fetch(`/api/admin/calculator/estimate/${activeEstimateId}/add-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomenclatureId: item.id,
          category: item.category,
          nomenclatureName: item.name,
          quantity: addingItemQty,
          unit: item.unit,
          pricePerUnit: item.retailPrice,
          purchasePrice: null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCalculations(prev => prev.map(c => {
          if (c.result?.estimateId !== activeEstimateId) return c;
          return { ...c, result: data };
        }));
        toast.success(`Добавлено: ${item.name}`);
        setAddingItemId(null);
        setAddingItemQty(1);
      } else {
        toast.error('Ошибка добавления');
      }
    } catch {
      toast.error('Ошибка сети');
    }
  };

  const handleCreateOrder = async () => {
    const errors: Record<string, string> = {};
    if (!orderForm.clientName || orderForm.clientName.length < 2) errors.clientName = 'Минимум 2 символа';
    const phoneDigits = orderForm.phone.replace(/\D/g, '');
    if (!orderForm.phone || phoneDigits.length < 11) errors.phone = 'Введите корректный номер';
    if (orderForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderForm.email)) errors.email = 'Некорректный email';

    if (Object.keys(errors).length > 0) {
      setOrderFormErrors(errors);
      return;
    }

    setOrderLoading(true);
    try {
      let estimateId = '';
      let multiEstimateId: string | undefined;

      if (multiResult) {
        estimateId = multiResult.estimates[0]?.estimateId || '';
        multiEstimateId = multiResult.multiEstimateId;
      } else {
        const calcWithResult = calculations.find(c => c.result);
        if (!calcWithResult?.result) {
          toast.error('Сначала выполните расчёт');
          setOrderLoading(false);
          return;
        }
        estimateId = calcWithResult.result.estimateId;
      }

      const response = await fetch('/api/admin/calculator/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateId,
          multiEstimateId,
          clientName: orderForm.clientName,
          phone: orderForm.phone,
          email: orderForm.email || undefined,
          comment: orderForm.comment || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedOrderId(data.orderId);
        setOrderSuccess(true);
        toast.success('Заявка создана!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Ошибка создания заявки');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setOrderLoading(false);
    }
  };

  const addCalculation = () => {
    if (calculations.length >= 10) { toast.error('Максимум 10 расчётов'); return; }
    const firstType = fenceTypes[0];
    setCalculations(prev => [...prev, {
      id: crypto.randomUUID(),
      formData: {
        ...defaultFormData(),
        fenceTypeId: firstType?.id || '',
        lagRows: String(firstType?.defaultLagRows || 2) as '2' | '3',
      },
      result: null,
      loading: false,
      error: null,
      expanded: true,
    }]);
  };

  const removeCalculation = (calcId: string) => {
    if (calculations.length <= 1) return;
    setCalculations(prev => prev.filter(c => c.id !== calcId));
  };

  const renderCalculationForm = (calc: typeof calculations[0]) => {
    const selectedFenceType = fenceTypes.find(t => t.id === calc.formData.fenceTypeId);
    const ftName = selectedFenceType?.name || '';
    const isPanel3D = ftName === '3D-панели';
    const isPicket = ftName === 'Евроштакетник';
    const isMesh = ftName === 'Сетка-рабица';

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Тип забора</label>
          <select
            value={calc.formData.fenceTypeId}
            onChange={e => {
              const ft = fenceTypes.find(t => t.id === e.target.value);
              if (ft) {
                updateCalcFormData(calc.id, {
                  fenceTypeId: ft.id,
                  lagRows: String(ft.defaultLagRows) as '2' | '3',
                  picketProfileType: ft.name === 'Евроштакетник' ? (picketProfileTypes[0]?.id || '') : '',
                  meshCoating: 'GALVANIZED',
                });
              }
            }}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {fenceTypes.map(ft => (
              <option key={ft.id} value={ft.id}>{ft.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Длина (м)</label>
            <input
              type="number"
              value={calc.formData.length}
              onChange={e => updateCalcFormData(calc.id, { length: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="50"
              min="1"
              max="1000"
              step="0.1"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Высота (м)</label>
            <input
              type="number"
              value={calc.formData.height}
              onChange={e => updateCalcFormData(calc.id, { height: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="2.0"
              min="1.5"
              max="3.5"
              step="0.1"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {!isPanel3D && !isMesh && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Покрытие</label>
            <select
              value={calc.formData.coating}
              onChange={e => updateCalcFormData(calc.id, { coating: e.target.value as FenceCalculatorForm['coating'] })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(COATING_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {!isPanel3D && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Количество лаг</label>
            <div className="flex gap-2">
              {(['2', '3'] as const).map(rows => (
                <button
                  key={rows}
                  onClick={() => updateCalcFormData(calc.id, { lagRows: rows })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    calc.formData.lagRows === rows
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rows} лаги
                </button>
              ))}
            </div>
          </div>
        )}

        {isPicket && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Профиль</label>
              <select
                value={calc.formData.picketProfileType}
                onChange={e => updateCalcFormData(calc.id, { picketProfileType: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {picketProfileTypes.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Шаг (см)</label>
                <input
                  type="number"
                  value={calc.formData.picketStep}
                  onChange={e => updateCalcFormData(calc.id, { picketStep: Number(e.target.value) })}
                  min="1"
                  max="20"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип монтажа</label>
                <select
                  value={calc.formData.picketMountingType}
                  onChange={e => updateCalcFormData(calc.id, { picketMountingType: e.target.value as 'SINGLE' | 'CHESS' })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="SINGLE">Односторонний</option>
                  <option value="CHESS">Шахматный</option>
                </select>
              </div>
            </div>
          </>
        )}

        {isMesh && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Покрытие</label>
              <select
                value={calc.formData.meshCoating}
                onChange={e => updateCalcFormData(calc.id, { meshCoating: e.target.value as 'GALVANIZED' | 'POLYMER' })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(meshOptions.coatings || {}).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ячейка (мм)</label>
              <select
                value={calc.formData.meshCellSize}
                onChange={e => updateCalcFormData(calc.id, { meshCellSize: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {(meshOptions.cellSizes || []).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Проволока (мм)</label>
              <select
                value={calc.formData.meshWireThickness}
                onChange={e => updateCalcFormData(calc.id, { meshWireThickness: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {(meshOptions.wireThicknesses || []).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="border-t pt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={calc.formData.hasGate}
              onChange={e => updateCalcFormData(calc.id, { 
                hasGate: e.target.checked,
                ...(!e.target.checked ? { hasAutomation: false, automationId: '' } : {})
              })}
              className="rounded border-gray-300"
            />
            Ворота
          </label>
          {calc.formData.hasGate && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Тип</label>
                <select
                  value={calc.formData.gateType}
                  onChange={e => updateCalcFormData(calc.id, { 
                    gateType: e.target.value as 'SWING' | 'SLIDING',
                    ...(e.target.value !== 'SLIDING' ? { hasAutomation: false, automationId: '' } : {})
                  })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SWING">Распашные</option>
                  <option value="SLIDING">Откатные</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ширина (м)</label>
                <input
                  type="number"
                  value={calc.formData.gateWidth}
                  onChange={e => updateCalcFormData(calc.id, { gateWidth: Number(e.target.value) })}
                  min="2"
                  max="6"
                  step="0.5"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {calc.formData.hasGate && calc.formData.gateType === 'SLIDING' && automationTypes.length > 0 && (
            <div className="pl-6 space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={calc.formData.hasAutomation}
                  onChange={e => updateCalcFormData(calc.id, { hasAutomation: e.target.checked, automationId: '' })}
                  className="rounded border-gray-300"
                />
                Автоматика
              </label>
              {calc.formData.hasAutomation && (
                <select
                  value={calc.formData.automationId}
                  onChange={e => updateCalcFormData(calc.id, { automationId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите автоматику</option>
                  {automationTypes.map(at => (
                    <option key={at.id} value={at.id}>
                      {at.name} — {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(at.retailPrice)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={calc.formData.hasWicket}
              onChange={e => updateCalcFormData(calc.id, { hasWicket: e.target.checked })}
              className="rounded border-gray-300"
            />
            Калитка
          </label>
          {calc.formData.hasWicket && (
            <div className="pl-6">
              <label className="block text-xs text-gray-500 mb-1">Ширина (м)</label>
              <input
                type="number"
                value={calc.formData.wicketWidth}
                onChange={e => updateCalcFormData(calc.id, { wicketWidth: Number(e.target.value) })}
                min="0.8"
                max="1.5"
                step="0.1"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <button
          onClick={() => calculateSingle(calc.id)}
          disabled={calc.loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {calc.loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Расчёт...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4" />
              Рассчитать
            </>
          )}
        </button>

        {calc.error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {calc.error}
          </div>
        )}
      </div>
    );
  };

  const renderResults = (result: AdminEstimateResult) => {
    const { items, summary } = result;

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-2 font-medium text-gray-600">Наименование</th>
                <th className="text-center py-2 px-2 font-medium text-gray-600 w-24">Кол-во</th>
                <th className="text-center py-2 px-2 font-medium text-gray-600 w-14">Ед.</th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">Розница</th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">Закупка</th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">Маржа</th>
                <th className="text-right py-2 px-2 font-medium text-gray-600">Сумма</th>
                <th className="text-center py-2 px-2 font-medium text-gray-600 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.nomenclatureId} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2">
                    <span className="mr-1">{CATEGORY_ICONS[item.category] || ''}</span>
                    {item.nomenclatureName}
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => handleItemQuantityChange(result.estimateId, item.nomenclatureId, Number(e.target.value))}
                      onBlur={() => saveItemChanges(result.estimateId)}
                      min="0.01"
                      step="any"
                      className="w-full text-center border rounded px-1 py-1 text-sm"
                    />
                  </td>
                  <td className="py-2 px-2 text-center text-gray-500">{item.unit}</td>
                  <td className="py-2 px-2 text-right">{formatPrice(item.pricePerUnit)}</td>
                  <td className="py-2 px-2 text-right text-blue-600">
                    {item.purchasePricePerUnit != null ? formatPrice(item.purchasePricePerUnit) : '—'}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {item.marginRub != null ? (
                      <span className={item.marginPercent && item.marginPercent >= 20 ? 'text-green-600' : 'text-yellow-600'}>
                        {formatPrice(item.marginRub)} ({item.marginPercent}%)
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-2 text-right font-medium">{formatPrice(item.totalPrice)}</td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => handleRemoveItem(result.estimateId, item.nomenclatureId)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Материалы (розница):</span>
            <span className="font-medium">{formatPrice(summary.retailMaterialsTotal)} ₽</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Материалы (закупка):</span>
            <span className="font-medium text-blue-600">{formatPrice(summary.purchaseMaterialsTotal)} ₽</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Маржа на материалы:</span>
            <span className="font-medium text-green-600">{formatPrice(summary.materialMarginRub)} ₽ ({summary.materialMarginPercent}%)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Стоимость работ:</span>
            <span className="font-medium">{formatPrice(summary.worksTotal)} ₽</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-base font-bold">
            <span>ИТОГО:</span>
            <span>{formatPrice(summary.grandTotal)} ₽</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Общая маржа:</span>
            <span className="text-green-600 font-medium">{formatPrice(summary.marginTotalRub)} ₽ ({summary.marginTotalPercent}%)</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => openNomenclaturePicker(result.estimateId)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить номенклатуру
          </button>
        </div>
      </div>
    );
  };

  const hasAnyResult = calculations.some(c => c.result) || multiResult;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Calculator className="w-7 h-7 text-blue-600" />
          Калькулятор забора
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {calculations.map((calc, idx) => (
            <div key={calc.id} className="bg-white rounded-lg shadow-sm border">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setCalculations(prev => prev.map(c => c.id === calc.id ? { ...c, expanded: !c.expanded } : c))}
              >
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">#{idx + 1}</span>
                  <span className="text-sm font-medium">{getFenceTypeName(calc.formData.fenceTypeId) || 'Выберите тип'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {calculations.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); removeCalculation(calc.id); }}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {calc.expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              {calc.expanded && (
                <div className="px-4 pb-4 border-t">
                  {renderCalculationForm(calc)}
                </div>
              )}
            </div>
          ))}

          {calculations.length < 10 && (
            <button
              onClick={addCalculation}
              className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить ещё забор
            </button>
          )}

          {calculations.length > 1 && (
            <button
              onClick={calculateAll}
              disabled={loadingAll}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loadingAll ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Расчёт...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Рассчитать всё
                </>
              )}
            </button>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {multiResult && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold mb-3">Общий итог (мульти-расчёт)</h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Материалы:</span>
                  <span className="font-medium">{formatPrice(multiResult.totals.materials)} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span>Работы:</span>
                  <span className="font-medium">{formatPrice(multiResult.totals.installation)} ₽</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>ИТОГО:</span>
                  <span>{formatPrice(multiResult.totals.grandTotal)} ₽</span>
                </div>
              </div>
            </div>
          )}

          {calculations.map((calc, idx) => (
            calc.result && (
              <div key={calc.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="text-sm font-semibold">
                    Расчёт #{idx + 1}: {calc.result.parameters.fenceTypeName}
                    {' '}{calc.result.parameters.length}м x {calc.result.parameters.height}м
                  </h3>
                </div>
                <div className="p-4">
                  {renderResults(calc.result)}
                </div>
              </div>
            )
          ))}

          {!hasAnyResult && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-400">
              <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">Заполните параметры и нажмите «Рассчитать»</p>
              <p className="text-sm mt-1">Результаты с закупочными ценами и маржой появятся здесь</p>
            </div>
          )}

          {hasAnyResult && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowOrderForm(true)}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Оформить заявку
              </button>
              <button
                onClick={() => toast.success('Расчёт уже сохранён')}
                className="px-4 py-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Сохранено
              </button>
            </div>
          )}
        </div>
      </div>

      {showOrderForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOrderForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {orderSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Заявка создана!</h3>
                <p className="text-gray-500 mb-4">Заявка успешно создана и появится во вкладке «Заявки»</p>
                {createdOrderId && (
                  <a
                    href={`/admin/orders/${createdOrderId}`}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Перейти к заявке
                  </a>
                )}
                <button
                  onClick={() => {
                    setShowOrderForm(false);
                    setOrderSuccess(false);
                    setCreatedOrderId(null);
                    setOrderForm({ clientName: '', phone: '', email: '', comment: '' });
                  }}
                  className="ml-3 px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Новый расчёт
                </button>
              </div>
            ) : (
              <>
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Оформление заявки</h2>
                  <button onClick={() => setShowOrderForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ФИО клиента <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={orderForm.clientName}
                      onChange={e => { setOrderForm(prev => ({ ...prev, clientName: e.target.value })); setOrderFormErrors(prev => ({ ...prev, clientName: '' })); }}
                      placeholder="Иванов Иван Иванович"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 ${orderFormErrors.clientName ? 'border-red-500' : ''}`}
                    />
                    {orderFormErrors.clientName && <p className="text-red-500 text-xs mt-1">{orderFormErrors.clientName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={orderForm.phone}
                      onChange={e => { setOrderForm(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) })); setOrderFormErrors(prev => ({ ...prev, phone: '' })); }}
                      placeholder="+7 (___) ___-__-__"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 ${orderFormErrors.phone ? 'border-red-500' : ''}`}
                    />
                    {orderFormErrors.phone && <p className="text-red-500 text-xs mt-1">{orderFormErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={orderForm.email}
                      onChange={e => { setOrderForm(prev => ({ ...prev, email: e.target.value })); setOrderFormErrors(prev => ({ ...prev, email: '' })); }}
                      placeholder="client@example.com"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 ${orderFormErrors.email ? 'border-red-500' : ''}`}
                    />
                    {orderFormErrors.email && <p className="text-red-500 text-xs mt-1">{orderFormErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                    <textarea
                      value={orderForm.comment}
                      onChange={e => setOrderForm(prev => ({ ...prev, comment: e.target.value }))}
                      rows={3}
                      placeholder="Дополнительная информация..."
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {multiResult && (
                    <div className="bg-blue-50 rounded-lg p-3 text-sm">
                      <span className="font-medium">Итого: {formatPrice(multiResult.totals.grandTotal)} ₽</span>
                      <span className="text-gray-500 ml-2">({multiResult.estimates.length} расчётов)</span>
                    </div>
                  )}
                  {!multiResult && calculations.find(c => c.result)?.result && (
                    <div className="bg-blue-50 rounded-lg p-3 text-sm">
                      <span className="font-medium">Итого: {formatPrice(calculations.find(c => c.result)!.result!.summary.grandTotal)} ₽</span>
                    </div>
                  )}

                  <button
                    onClick={handleCreateOrder}
                    disabled={orderLoading}
                    className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {orderLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Создание...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Создать заявку
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showNomenclaturePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowNomenclaturePicker(false); setAddingItemId(null); }}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                Добавить номенклатуру
              </h2>
              <button onClick={() => { setShowNomenclaturePicker(false); setAddingItemId(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b sticky top-[57px] bg-white z-10 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={nomenclatureSearch}
                  onChange={e => { setNomenclatureSearch(e.target.value); fetchNomenclature(e.target.value, nomenclatureCategory); }}
                  placeholder="Поиск по названию..."
                  className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => { setNomenclatureCategory('all'); fetchNomenclature(nomenclatureSearch, ''); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${nomenclatureCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Все
                </button>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setNomenclatureCategory(key); fetchNomenclature(nomenclatureSearch, key); }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${nomenclatureCategory === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {CATEGORY_ICONS[key]} {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              {nomenclatureLoading ? (
                <div className="text-center py-8 text-gray-400">Загрузка...</div>
              ) : (
                Object.entries(nomenclatureResults).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                      {CATEGORY_LABELS[category] || category}
                    </h4>
                    <div className="space-y-1">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <span className="text-sm">{item.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{formatPrice(item.retailPrice)} ₽/{item.unit}</span>
                          </div>
                          {addingItemId === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={addingItemQty}
                                onChange={e => setAddingItemQty(Number(e.target.value))}
                                min="1"
                                className="w-20 border rounded px-2 py-1 text-sm text-center"
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleAddNomenclature(item); if (e.key === 'Escape') setAddingItemId(null); }}
                              />
                              <button
                                onClick={() => handleAddNomenclature(item)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                              >
                                Добавить
                              </button>
                              <button onClick={() => setAddingItemId(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAddingItemId(item.id); setAddingItemQty(1); }}
                              className="text-blue-600 hover:text-blue-800 p-1"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
