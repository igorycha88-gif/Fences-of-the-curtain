'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { SimplifiedPurchasePriceInput } from '@/components/admin/References/SimplifiedPurchasePriceInput';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { formatPrice } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { X, Plus } from 'lucide-react';

interface Relation {
  id: string;
  referenceType: string;
  referenceId: string;
  referenceName?: string;
}

interface MountingHardware {
  id: string;
  name: string;
  description: string | null;
  purchasePrice: number;
  retailPrice: number;
  validUntil: string | null;
  active: boolean;
  sortOrder: number;
  useInCalculator: boolean;
  calculationMethod: string | null;
  calculationValue: number | null;
  relations: Relation[];
  createdAt: string;
  updatedAt: string;
}

interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'CONTENT_MANAGER';
}

interface ReferenceOption {
  id: string;
  name: string;
}

interface ReferenceOptions {
  LAG: ReferenceOption[];
  POST: ReferenceOption[];
  PROFNASTIL: ReferenceOption[];
  PICKET: ReferenceOption[];
  GATE: ReferenceOption[];
  WICKET: ReferenceOption[];
  PANEL_3D: ReferenceOption[];
}

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  LAG: 'Лаги',
  POST: 'Столбы',
  PROFNASTIL: 'Профнастил',
  PICKET: 'Евроштакетник',
  GATE: 'Ворота',
  WICKET: 'Калитки',
  PANEL_3D: '3D-панели',
};

const CALCULATION_METHOD_LABELS: Record<string, string> = {
  BY_QUANTITY: 'По количеству (1:1)',
  BY_LENGTH: 'По длине забора',
  BY_AREA: 'По площади забора',
  BY_RATIO: 'По соотношению (N:1)',
  BY_INVERSE_RATIO: 'По обратному соотношению (1/N)',
};

const formatDate = (date: string | Date | null): string => {
  if (!date) return 'Бессрочно';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU');
};

export default function MountingHardwarePage() {
  const [items, setItems] = useState<MountingHardware[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MountingHardware | null>(null);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [referenceOptions, setReferenceOptions] = useState<ReferenceOptions | null>(null);
  
  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
    purchasePrice: number | null;
    retailPrice: number;
    validUntil: string | null;
    active: boolean;
    sortOrder: number;
    useInCalculator: boolean;
    calculationMethod: string | null;
    calculationValue: number | null;
    relations: { referenceType: string; referenceId: string }[];
  }>({
    name: '',
    description: '',
    purchasePrice: null,
    retailPrice: 0,
    validUntil: null,
    active: true,
    sortOrder: 0,
    useInCalculator: false,
    calculationMethod: null,
    calculationValue: null,
    relations: [],
  });

  const pageSize = 20;

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error('Error fetching session:', err));
  }, []);

  useEffect(() => {
    fetch('/api/admin/mounting-hardware/references', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.options) {
          setReferenceOptions(data.options);
        }
      })
      .catch((err) => console.error('Error fetching reference options:', err));
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/mounting-hardware?${params}`, { credentials: 'include' });
      const data = await response.json();

      if (response.ok) {
        setItems(data.items || []);
        setTotal(data.total || 0);
      } else {
        setItems([]);
        setTotal(0);
        console.error('Error fetching mounting hardware:', data.error);
      }
    } catch (error) {
      console.error('Error fetching mounting hardware:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, search]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormValues({
      name: '',
      description: '',
      purchasePrice: null,
      retailPrice: 0,
      validUntil: null,
      active: true,
      sortOrder: 0,
      useInCalculator: false,
      calculationMethod: null,
      calculationValue: null,
      relations: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: MountingHardware) => {
    setEditingItem(item);
    setFormValues({
      name: item.name,
      description: item.description || '',
      purchasePrice: item.purchasePrice,
      retailPrice: item.retailPrice,
      validUntil: item.validUntil ? item.validUntil.split('T')[0] : null,
      active: item.active,
      sortOrder: item.sortOrder,
      useInCalculator: item.useInCalculator,
      calculationMethod: item.calculationMethod,
      calculationValue: item.calculationValue,
      relations: item.relations.map((r) => ({
        referenceType: r.referenceType,
        referenceId: r.referenceId,
      })),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: MountingHardware) => {
    if (!confirm(`Удалить "${item.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/mounting-hardware/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Позиция успешно удалена');
        fetchItems();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting mounting hardware:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (item: MountingHardware) => {
    try {
      const response = await fetch(`/api/admin/mounting-hardware/${item.id}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Статус изменен');
        fetchItems();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling mounting hardware:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handlePurchasePriceChange = (value: number | null) => {
    setFormValues((prev) => ({ ...prev, purchasePrice: value }));
  };

  const addRelation = () => {
    setFormValues((prev) => ({
      ...prev,
      relations: [...prev.relations, { referenceType: 'LAG', referenceId: '' }],
    }));
  };

  const removeRelation = (index: number) => {
    setFormValues((prev) => ({
      ...prev,
      relations: prev.relations.filter((_, i) => i !== index),
    }));
  };

  const updateRelation = (index: number, field: 'referenceType' | 'referenceId', value: string) => {
    setFormValues((prev) => {
      const newRelations = [...prev.relations];
      if (field === 'referenceType') {
        newRelations[index] = { referenceType: value, referenceId: '' };
      } else {
        newRelations[index] = { ...newRelations[index], [field]: value };
      }
      return { ...prev, relations: newRelations };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formValues.relations.length === 0) {
      toast.error('Необходимо указать хотя бы одну связь');
      return;
    }

    const hasEmptyRelations = formValues.relations.some((r) => !r.referenceId);
    if (hasEmptyRelations) {
      toast.error('Все связи должны иметь выбранную позицию');
      return;
    }

    if (formValues.useInCalculator) {
      if (!formValues.calculationMethod) {
        toast.error('Необходимо выбрать метод расчёта');
        return;
      }
      if (['BY_LENGTH', 'BY_AREA', 'BY_RATIO'].includes(formValues.calculationMethod)) {
        if (!formValues.calculationValue || formValues.calculationValue <= 0) {
          toast.error('Необходимо указать значение для выбранного метода расчёта');
          return;
        }
      }
      if (formValues.calculationMethod === 'BY_INVERSE_RATIO') {
        const n = formValues.calculationValue;
        if (!n || !Number.isInteger(n) || n < 1 || n > 10000) {
          toast.error('N должно быть целым числом от 1 до 10000');
          return;
        }
      }
    }

    try {
      const url = editingItem
        ? `/api/admin/mounting-hardware/${editingItem.id}`
        : '/api/admin/mounting-hardware';
      const method = editingItem ? 'PUT' : 'POST';

      const submitData = {
        ...formValues,
        validUntil: formValues.validUntil ? new Date(formValues.validUntil).toISOString() : null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingItem ? 'Позиция успешно обновлена' : 'Позиция успешно создана');
        setIsModalOpen(false);
        fetchItems();
      } else {
        if (Array.isArray(data.error)) {
          const errorMessages = data.error.map((err: any) => {
            const field = err.path?.join('.') || 'field';
            return `${field}: ${err.message}`;
          }).join(', ');
          toast.error(`Ошибка валидации: ${errorMessages}`);
        } else {
          toast.error(data.error || 'Ошибка сохранения');
        }
      }
    } catch (error) {
      console.error('Exception:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  const columns = [
    { key: 'name', label: 'Название' },
    {
      key: 'relations',
      label: 'Принадлежность',
      render: (item: MountingHardware) => {
        if (!item.relations || item.relations.length === 0) {
          return <span className="text-gray-400">Нет связей</span>;
        }
        const grouped = item.relations.reduce((acc, r) => {
          const typeLabel = REFERENCE_TYPE_LABELS[r.referenceType] || r.referenceType;
          if (!acc[typeLabel]) acc[typeLabel] = [];
          acc[typeLabel].push(r.referenceName || r.referenceId);
          return acc;
        }, {} as Record<string, string[]>);
        
        return (
          <div className="text-sm">
            {Object.entries(grouped).map(([type, names]) => (
              <div key={type}>
                <span className="font-medium">{type}:</span> {names.join(', ')}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'validUntil',
      label: 'Срок действия',
      render: (item: MountingHardware) => {
        const isExpired = item.validUntil && new Date(item.validUntil) < new Date();
        const isExpiringSoon = item.validUntil && !isExpired &&
          new Date(item.validUntil) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return (
          <span className={
            isExpired ? 'text-red-500' :
            isExpiringSoon ? 'text-yellow-600' :
            !item.validUntil ? 'text-gray-400' : ''
          }>
            {formatDate(item.validUntil)}
          </span>
        );
      },
    },
    {
      key: 'useInCalculator',
      label: 'В калькуляторе',
      render: (item: MountingHardware) => {
        if (!item.useInCalculator) {
          return <span className="text-gray-400">—</span>;
        }
        const methodLabel = CALCULATION_METHOD_LABELS[item.calculationMethod || ''] || item.calculationMethod;
        let valueLabel = '';
        if (item.calculationMethod === 'BY_LENGTH' && item.calculationValue) {
          valueLabel = ` ${item.calculationValue}м`;
        } else if (item.calculationMethod === 'BY_AREA' && item.calculationValue) {
          valueLabel = ` ${item.calculationValue}м²`;
        } else if (item.calculationMethod === 'BY_RATIO' && item.calculationValue) {
          valueLabel = ` ×${item.calculationValue}`;
        } else if (item.calculationMethod === 'BY_INVERSE_RATIO' && item.calculationValue) {
          valueLabel = ` x${item.calculationValue}`;
        }
        return (
          <span className="text-green-600">
            ✓ {methodLabel}{valueLabel}
          </span>
        );
      },
    },
    ...(isAdmin ? [{
      key: 'purchasePrice' as const,
      label: 'Цена закупки за ед. (₽)',
      render: (item: MountingHardware) => {
        if (item.purchasePrice === null) {
          return <span className="text-gray-400">Не указана</span>;
        }
        const margin = calculateMargin(item.retailPrice, item.purchasePrice);
        const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);
        return (
          <span title={`Цена закупки: ${item.purchasePrice} ₽\nМаржа: ${margin?.marginPercent.toFixed(1)}%`}>
            {formatPrice(item.purchasePrice)} {marginEmoji}
          </span>
        );
      },
    }] : []),
    {
      key: 'retailPrice',
      label: 'Розничная стоимость (₽)',
      render: (item: MountingHardware) => formatPrice(item.retailPrice),
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <DataTable
        title="Монтажная фурнитура"
        columns={columns}
        data={items}
        total={total}
        page={page}
        pageSize={pageSize}
        searchPlaceholder="Поиск по названию..."
        onSearch={setSearch}
        onPageChange={setPage}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Редактировать позицию' : 'Создать позицию монтажной фурнитуры'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input
              type="text"
              value={formValues.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
              minLength={2}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={formValues.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Принадлежность *</label>
            <div className="space-y-2 border rounded p-3 bg-gray-50">
              {formValues.relations.map((rel, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={rel.referenceType}
                    onChange={(e) => updateRelation(index, 'referenceType', e.target.value)}
                    className="border rounded px-2 py-1 flex-1"
                  >
                    {Object.entries(REFERENCE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={rel.referenceId}
                    onChange={(e) => updateRelation(index, 'referenceId', e.target.value)}
                    className="border rounded px-2 py-1 flex-1"
                    required
                  >
                    <option value="">Выберите позицию</option>
                    {referenceOptions && referenceOptions[rel.referenceType as keyof ReferenceOptions]?.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRelation(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRelation}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить связь
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Срок действия</label>
            <input
              type="date"
              value={formValues.validUntil || ''}
              onChange={(e) => handleFormChange('validUntil', e.target.value || null)}
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              После истечения срока запись автоматически деактивируется
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Цены</h4>
            <div>
              <label className="block text-sm font-medium mb-1">Розничная стоимость (₽) *</label>
              <input
                type="number"
                value={formValues.retailPrice}
                onChange={(e) => handleFormChange('retailPrice', parseFloat(e.target.value) || 0)}
                className="w-full border rounded px-3 py-2"
                min={0}
                step={0.01}
                required
              />
            </div>
          </div>

          {isAdmin && (
            <div className="mt-4">
              <SimplifiedPurchasePriceInput
                purchasePrice={formValues.purchasePrice}
                retailPrice={formValues.retailPrice}
                onChange={handlePurchasePriceChange}
              />
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Расчёт в калькуляторе</h4>
            
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="useInCalculator"
                checked={formValues.useInCalculator}
                onChange={(e) => handleFormChange('useInCalculator', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="useInCalculator" className="text-sm font-medium">
                Используется при расчёте в калькуляторе
              </label>
            </div>

            {formValues.useInCalculator && (
              <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                <div>
                  <label className="block text-sm font-medium mb-1">Метод расчёта *</label>
                  <select
                    value={formValues.calculationMethod || ''}
                    onChange={(e) => handleFormChange('calculationMethod', e.target.value || null)}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Выберите метод</option>
                    <option value="BY_QUANTITY">По количеству (1:1)</option>
                    <option value="BY_LENGTH">По длине забора</option>
                    <option value="BY_AREA">По площади забора</option>
                    <option value="BY_RATIO">По соотношению (N:1)</option>
                    <option value="BY_INVERSE_RATIO">По обратному соотношению (1/N)</option>
                  </select>
                </div>

                {formValues.calculationMethod === 'BY_LENGTH' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Длина единицы (м) *</label>
                    <input
                      type="number"
                      value={formValues.calculationValue || ''}
                      onChange={(e) => handleFormChange('calculationValue', parseFloat(e.target.value) || null)}
                      className="w-full border rounded px-3 py-2"
                      min={0.01}
                      step={0.01}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Количество = Длина забора / Длина единицы
                    </p>
                  </div>
                )}

                {formValues.calculationMethod === 'BY_AREA' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Площадь единицы (м²) *</label>
                    <input
                      type="number"
                      value={formValues.calculationValue || ''}
                      onChange={(e) => handleFormChange('calculationValue', parseFloat(e.target.value) || null)}
                      className="w-full border rounded px-3 py-2"
                      min={0.01}
                      step={0.01}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Количество = Площадь забора / Площадь единицы
                    </p>
                  </div>
                )}

                {formValues.calculationMethod === 'BY_RATIO' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Коэффициент *</label>
                    <input
                      type="number"
                      value={formValues.calculationValue || ''}
                      onChange={(e) => handleFormChange('calculationValue', parseFloat(e.target.value) || null)}
                      className="w-full border rounded px-3 py-2"
                      min={0.01}
                      step={0.01}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Если &gt; 1: N единиц фурнитуры на 1 единицу номенклатуры (например, 8 саморезов на лист)<br/>
                      Если &lt; 1: 1 единица фурнитуры на N единиц номенклатуры
                    </p>
                  </div>
                )}

                {formValues.calculationMethod === 'BY_INVERSE_RATIO' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">N (единиц номенклатуры) *</label>
                    <input
                      type="number"
                      value={formValues.calculationValue || ''}
                      onChange={(e) => handleFormChange('calculationValue', parseInt(e.target.value) || null)}
                      className="w-full border rounded px-3 py-2"
                      min={1}
                      max={10000}
                      step={1}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      1 единица фурнитуры на N единиц связанной номенклатуры
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formValues.active}
              onChange={(e) => handleFormChange('active', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="active" className="text-sm font-medium">Активен</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">
              {editingItem ? 'Обновить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
