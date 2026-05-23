'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface MarkupRule {
  id: string;
  minLength: number;
  maxLength: number;
  markupPercent: number;
  active: boolean;
  priority: number;
}

interface LengthMarkupRulesProps {
  fenceTypeId: string;
  markupEnabled: boolean;
  onMarkupEnabledChange: (enabled: boolean) => void;
}

export function LengthMarkupRules({ fenceTypeId, markupEnabled, onMarkupEnabledChange }: LengthMarkupRulesProps) {
  const [rules, setRules] = useState<MarkupRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRule, setEditingRule] = useState<MarkupRule | null>(null);
  const [form, setForm] = useState({ minLength: '', maxLength: '', markupPercent: '', active: true });

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/materials/fence-types/${fenceTypeId}/markups`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data.markups || []);
      }
    } catch (error) {
      console.error('[LengthMarkupRules] Error fetching:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fenceTypeId]);

  useEffect(() => {
    if (fenceTypeId) {
      fetchRules();
    }
  }, [fenceTypeId, fetchRules]);

  const handleAdd = () => {
    setIsAdding(true);
    setEditingRule(null);
    setForm({ minLength: '', maxLength: '', markupPercent: '', active: true });
  };

  const handleEdit = (rule: MarkupRule) => {
    setIsAdding(false);
    setEditingRule(rule);
    setForm({
      minLength: rule.minLength.toString(),
      maxLength: rule.maxLength.toString(),
      markupPercent: rule.markupPercent.toString(),
      active: rule.active,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingRule(null);
    setForm({ minLength: '', maxLength: '', markupPercent: '', active: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      minLength: parseFloat(form.minLength),
      maxLength: parseFloat(form.maxLength),
      markupPercent: parseFloat(form.markupPercent),
      active: form.active,
    };

    if (isNaN(payload.minLength) || isNaN(payload.maxLength) || isNaN(payload.markupPercent)) {
      toast.error('Заполните все числовые поля');
      return;
    }

    if (payload.maxLength <= payload.minLength) {
      toast.error('Макс. длина должна быть больше мин. длины');
      return;
    }

    try {
      const url = `/api/admin/materials/fence-types/${fenceTypeId}/markups`;
      const response = await fetch(url, {
        method: editingRule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRule ? { markupId: editingRule.id, ...payload } : payload),
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(editingRule ? 'Правило обновлено' : 'Правило добавлено');
        handleCancel();
        fetchRules();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('[LengthMarkupRules] Error saving:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Удалить правило удорожания?')) return;

    try {
      const response = await fetch(
        `/api/admin/materials/fence-types/${fenceTypeId}/markups?markupId=${ruleId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast.success('Правило удалено');
        fetchRules();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('[LengthMarkupRules] Error deleting:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (rule: MarkupRule) => {
    try {
      const response = await fetch(`/api/admin/materials/fence-types/${fenceTypeId}/markups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markupId: rule.id, active: !rule.active }),
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Статус изменён');
        fetchRules();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка');
      }
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Удорожание материалов по длине
        </h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={markupEnabled}
            onChange={(e) => onMarkupEnabledChange(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span>Удорожание активно</span>
        </label>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Настройте % надбавки к стоимости материалов в зависимости от длины забора.
        Удорожание применяется только к материалам, не к монтажу.
      </p>

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : (
        <>
          {rules.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-3 py-2 text-left">От (м)</th>
                    <th className="border px-3 py-2 text-left">До (м)</th>
                    <th className="border px-3 py-2 text-left">Надбавка %</th>
                    <th className="border px-3 py-2 text-left">Активно</th>
                    <th className="border px-3 py-2 text-left">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className={!rule.active ? 'opacity-50' : ''}>
                      <td className="border px-3 py-2">{rule.minLength}</td>
                      <td className="border px-3 py-2">{rule.maxLength}</td>
                      <td className="border px-3 py-2 font-medium text-orange-600">
                        +{rule.markupPercent}%
                      </td>
                      <td className="border px-3 py-2">
                        <input
                          type="checkbox"
                          checked={rule.active}
                          onChange={() => handleToggleActive(rule)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="border px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(rule)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Изменить
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(isAdding || editingRule) && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    От (метров)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.minLength}
                    onChange={(e) => setForm((prev) => ({ ...prev, minLength: e.target.value }))}
                    className="w-full border rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    До (метров)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.maxLength}
                    onChange={(e) => setForm((prev) => ({ ...prev, maxLength: e.target.value }))}
                    className="w-full border rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Надбавка (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="500"
                    value={form.markupPercent}
                    onChange={(e) => setForm((prev) => ({ ...prev, markupPercent: e.target.value }))}
                    className="w-full border rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  {editingRule ? 'Обновить' : 'Добавить'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}

          {!isAdding && !editingRule && (
            <button
              onClick={handleAdd}
              className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              + Добавить правило
            </button>
          )}
        </>
      )}
    </div>
  );
}
