'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { Modal } from '@/components/ui/modal';
import { SimplifiedPurchasePriceInput } from '@/components/admin/References/SimplifiedPurchasePriceInput';
import { calculateMargin, getMarginEmoji } from '@/lib/utils/marginCalculator';
import { formatDimension, formatPrice, formatSection } from '@/lib/utils/formatters';
import { GATES_COLUMN_TOOLTIPS } from '@/lib/constants/columnTooltips';
import { ColumnHeaderWithTooltip } from '@/components/admin/References/ColumnHeaderWithTooltip';
import { PriorityColumn } from '@/components/admin/References/shared';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { RelatedMountingHardware } from '@/components/admin/References/RelatedMountingHardware';
import { RelatedWorks } from '@/components/admin/Works/RelatedWorks';
import { RelatedWorksByReference } from '@/components/admin/Works/RelatedWorksByReference';

interface GateType {
  id: string;
  name: string;
  description: string | null;
  type: 'Распашные' | 'Откатные';
  metalThickness: number;
  sectionWidth: number;
  sectionHeight: number;
  gateHeight: number;
  gateLength: number;
  retailPrice: number;
  purchasePrice: number | null;
  image: string | null;
  active: boolean;
  validFrom: string | null;
  expirationDate: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'CONTENT_MANAGER';
}

const formatDate = (date: string | Date | null): string => {
  if (!date) return 'Бессрочно';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU');
};

const formatValidFrom = (date: string | Date | null): string => {
  if (!date) return 'С момента добавления';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU');
};

const getGateTypeIcon = (type: 'Распашные' | 'Откатные') => {
  if (type === 'Распашные') {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-blue-600">🚪</span>
        <span>Распашные</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-green-600">↔️</span>
      <span>Откатные</span>
    </span>
  );
};

export default function GatesPage() {
  const [gates, setGates] = useState<GateType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Распашные' | 'Откатные'>('all');
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGate, setEditingGate] = useState<GateType | null>(null);
  const [formValues, setFormValues] = useState<Partial<GateType>>({});
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

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

  const fetchGates = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        type: typeFilter,
        validityFilter,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/gate-types?${params}`, { credentials: 'include' });
      const data = await response.json();

      if (response.ok) {
        setGates(data.gates || []);
        setTotal(data.total || 0);
      } else {
        setGates([]);
        setTotal(0);
        console.error('Error fetching gate types:', data.error);
      }
    } catch (error) {
      console.error('Error fetching gate types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGates();
  }, [page, search, typeFilter, validityFilter]);

  const handleAdd = () => {
    setEditingGate(null);
    setFormValues({
      name: '',
      description: '',
      type: 'Распашные',
      metalThickness: 2.0,
      sectionWidth: 40,
      sectionHeight: 40,
      gateHeight: 2000,
      gateLength: 3000,
      retailPrice: 0,
      purchasePrice: null,
      active: true,
      validFrom: null,
      expirationDate: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (gate: GateType) => {
    setEditingGate(gate);
    setFormValues({
      name: gate.name,
      description: gate.description || '',
      type: gate.type,
      metalThickness: gate.metalThickness,
      sectionWidth: gate.sectionWidth,
      sectionHeight: gate.sectionHeight,
      gateHeight: gate.gateHeight,
      gateLength: gate.gateLength,
      retailPrice: gate.retailPrice,
      purchasePrice: gate.purchasePrice,
      active: gate.active,
      validFrom: gate.validFrom,
      expirationDate: gate.expirationDate,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (gate: GateType) => {
    if (!confirm(`Удалить ворота "${gate.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/gate-types/${gate.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Ворота успешно удалены');
        fetchGates();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting gate type:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (gate: GateType) => {
    try {
      const response = await fetch(`/api/admin/gate-types/${gate.id}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Статус изменен');
        fetchGates();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка изменения статуса');
      }
    } catch (error) {
      console.error('Error toggling gate type:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  const handlePriorityChange = async (id: string, newPriority: number) => {
    const response = await fetch('/api/admin/gate-types/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, newPriority }),
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Ошибка изменения приоритета');
    }

    fetchGates();
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handlePurchasePriceChange = (value: number | null) => {
    setFormValues((prev) => ({ ...prev, purchasePrice: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingGate
        ? `/api/admin/gate-types/${editingGate.id}`
        : '/api/admin/gate-types';
      const method = editingGate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingGate ? 'Ворота успешно обновлены' : 'Ворота успешно созданы');
        setIsModalOpen(false);
        fetchGates();
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
      key: 'type', 
      label: <ColumnHeaderWithTooltip title="Тип" tooltip={GATES_COLUMN_TOOLTIPS.type} />, 
      render: (gate: GateType) => getGateTypeIcon(gate.type)
    },
    { 
      key: 'metalThickness', 
      label: <ColumnHeaderWithTooltip title="Толщина металла (мм)" tooltip={GATES_COLUMN_TOOLTIPS.metalThickness} />, 
      render: (gate: GateType) => formatDimension(gate.metalThickness)
    },
    { 
      key: 'section', 
      label: <ColumnHeaderWithTooltip title="Сечение (мм)" tooltip={GATES_COLUMN_TOOLTIPS.section} />, 
      render: (gate: GateType) => formatSection(gate.sectionWidth, gate.sectionHeight)
    },
    { 
      key: 'gateHeight', 
      label: <ColumnHeaderWithTooltip title="Высота (мм)" tooltip={GATES_COLUMN_TOOLTIPS.gateHeight} />, 
      render: (gate: GateType) => formatDimension(gate.gateHeight)
    },
    { 
      key: 'gateLength', 
      label: <ColumnHeaderWithTooltip title="Длина (мм)" tooltip={GATES_COLUMN_TOOLTIPS.gateLength} />, 
      render: (gate: GateType) => formatDimension(gate.gateLength)
    },
    { 
      key: 'retailPrice', 
      label: <ColumnHeaderWithTooltip title="Розничная стоимость (₽)" tooltip={GATES_COLUMN_TOOLTIPS.retailPrice} />, 
      render: (gate: GateType) => formatPrice(gate.retailPrice)
    },
    {
      key: 'expirationDate',
      label: 'Срок действия',
      render: (gate: GateType) => {
        const isExpired = gate.expirationDate && new Date(gate.expirationDate) < new Date();
        const isExpiringSoon = gate.expirationDate && !isExpired && 
          new Date(gate.expirationDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return (
          <span className={
            isExpired ? 'text-red-500' : 
            isExpiringSoon ? 'text-yellow-600' : 
            !gate.expirationDate ? 'text-gray-400' : ''
          }>
            {formatDate(gate.expirationDate)}
          </span>
        );
      },
    },
    ...(isAdmin ? [{
      key: 'purchasePrice' as const,
      label: <ColumnHeaderWithTooltip title="Цена закупки за ед. (₽)" tooltip={GATES_COLUMN_TOOLTIPS.purchasePrice} />,
      render: (gate: GateType) => {
        if (gate.purchasePrice === null) {
          return <span className="text-gray-400">Не указана ⚪</span>;
        }
        const margin = calculateMargin(gate.retailPrice, gate.purchasePrice);
        const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);
        return (
          <span title={`Цена закупки: ${gate.purchasePrice} ₽\nМаржа: ${margin?.marginPercent.toFixed(1)}%`}>
            {formatPrice(gate.purchasePrice)} {marginEmoji}
          </span>
        );
      }
    }] : []),
    { 
      key: 'priority', 
      label: 'Приоритет',
      render: (gate: GateType) => (
        <PriorityColumn
          value={gate.priority}
          totalItems={total}
          onChange={async (newPriority) => {
            await handlePriorityChange(gate.id, newPriority);
            toast.success('Приоритет обновлён');
          }}
        />
      )
    },
  ];

  const typeFilterOptions = [
    { value: 'all', label: 'Все типы' },
    { value: 'Распашные', label: '🚪 Распашные' },
    { value: 'Откатные', label: '↔️ Откатные' },
  ];

  const validityFilterOptions = [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'expired', label: 'Истек срок' },
    { value: 'expiring_soon', label: 'Истекает скоро (7 дней)' },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex gap-4 items-center">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          {typeFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={validityFilter}
          onChange={(e) => setValidityFilter(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          {validityFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <DataTable
        title="Ворота"
        columns={columns}
        data={gates}
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
        title={editingGate ? 'Редактировать ворота' : 'Создать ворота'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input
              type="text"
              value={formValues.name || ''}
              onChange={(e) => handleFormChange('name', e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={formValues.description || ''}
              onChange={(e) => handleFormChange('description', e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Тип *</label>
            <select
              value={formValues.type || 'Распашные'}
              onChange={(e) => handleFormChange('type', e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="Распашные">🚪 Распашные</option>
              <option value="Откатные">↔️ Откатные</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Технические характеристики</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Толщина металла (мм) *</label>
                <input
                  type="number"
                  value={formValues.metalThickness || ''}
                  onChange={(e) => handleFormChange('metalThickness', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={1.0}
                  max={5.0}
                  step={0.1}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ширина сечения (мм) *</label>
                <input
                  type="number"
                  value={formValues.sectionWidth || ''}
                  onChange={(e) => handleFormChange('sectionWidth', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={20}
                  max={200}
                  step={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Высота сечения (мм) *</label>
                <input
                  type="number"
                  value={formValues.sectionHeight || ''}
                  onChange={(e) => handleFormChange('sectionHeight', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={20}
                  max={200}
                  step={1}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Высота ворот (мм) *</label>
                <input
                  type="number"
                  value={formValues.gateHeight || ''}
                  onChange={(e) => handleFormChange('gateHeight', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={500}
                  max={3000}
                  step={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Длина (мм) *</label>
                <input
                  type="number"
                  value={formValues.gateLength || ''}
                  onChange={(e) => handleFormChange('gateLength', parseFloat(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min={500}
                  max={6000}
                  step={1}
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Ценообразование</h4>
            <div>
              <label className="block text-sm font-medium mb-1">Розничная стоимость (₽) *</label>
              <input
                type="number"
                value={formValues.retailPrice || ''}
                onChange={(e) => handleFormChange('retailPrice', parseFloat(e.target.value))}
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
                purchasePrice={formValues.purchasePrice ?? null}
                retailPrice={formValues.retailPrice || 0}
                onChange={handlePurchasePriceChange}
              />
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Период действия (опционально)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Дата начала действия</label>
                <input
                  type="date"
                  value={formValues.validFrom ? new Date(formValues.validFrom).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFormChange('validFrom', e.target.value ? new Date(e.target.value) : null)}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Пусто = с момента добавления</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Срок действия</label>
                <input
                  type="date"
                  value={formValues.expirationDate ? new Date(formValues.expirationDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFormChange('expirationDate', e.target.value ? new Date(e.target.value) : null)}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Пусто = бессрочно</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Если указать срок, номенклатура автоматически деактивируется в 01:00 следующего дня
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formValues.active ?? true}
              onChange={(e) => handleFormChange('active', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="active" className="text-sm font-medium">Активен</label>
          </div>

          {isAdmin && editingGate && (
            <RelatedMountingHardware
              referenceType="GATE"
              referenceId={editingGate.id}
            />
          )}

          {isAdmin && editingGate && (
            <RelatedWorks
              fenceType="GATE"
            />
          )}

          {isAdmin && editingGate && (
            <RelatedWorksByReference
              referenceType="GATE"
              referenceId={editingGate.id}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">
              {editingGate ? 'Обновить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
