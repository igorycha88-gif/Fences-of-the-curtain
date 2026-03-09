'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/admin/References/DataTable';
import { ReferenceForm } from '@/components/admin/References/ReferenceForm';
import { Modal } from '@/components/ui/modal';
import toast from 'react-hot-toast';

interface Material {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  availableHeights: Array<{
    height: number;
    priceCoef: number;
    isCustom: boolean;
    comment?: string;
  }>;
  active: boolean;
  fenceType?: {
    id: string;
    name: string;
  };
}

export default function HeightsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [formValues, setFormValues] = useState<any>({});
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());

  const pageSize = 20;

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/fence-heights?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMaterials(data.materials);
        setTotal(data.total);
      } else {
        console.error('Error fetching materials:', data.error);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [page, search]);

  const handleAddHeight = (material: Material) => {
    setSelectedMaterial(material);
    setFormValues({
      materialId: material.id,
      height: '',
      priceCoef: 1.0,
      isCustom: false,
      comment: '',
    });
    setIsModalOpen(true);
  };

  const handleEditHeight = (material: Material, height: any) => {
    setSelectedMaterial(material);
    setFormValues({
      materialId: material.id,
      height: height.height,
      priceCoef: height.priceCoef,
      isCustom: height.isCustom,
      comment: height.comment || '',
      editingHeight: height.height,
    });
    setIsModalOpen(true);
  };

  const handleDeleteHeight = async (material: Material, height: number) => {
    if (!confirm(`Удалить высоту ${height}м для материала "${material.name}"?`)) return;

    try {
      const response = await fetch(
        `/api/admin/fence-heights/${material.id}/${height}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast.success('Высота успешно удалена');
        fetchMaterials();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting height:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleFormChange = (name: string, value: any) => {
    setFormValues((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const isEditing = formValues.editingHeight !== undefined;
      const url = isEditing
        ? `/api/admin/fence-heights/${formValues.materialId}/${formValues.editingHeight}`
        : '/api/admin/fence-heights';
      const method = isEditing ? 'PUT' : 'POST';

      const body: any = {
        materialId: formValues.materialId,
        priceCoef: parseFloat(formValues.priceCoef),
        comment: formValues.comment || null,
      };

      if (!isEditing) {
        body.height = parseFloat(formValues.height);
        body.isCustom = formValues.isCustom;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(isEditing ? 'Высота успешно обновлена' : 'Высота успешно добавлена');
        setIsModalOpen(false);
        fetchMaterials();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving height:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const toggleExpanded = (materialId: string) => {
    setExpandedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(materialId)) {
        next.delete(materialId);
      } else {
        next.add(materialId);
      }
      return next;
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      PROFNASTIL: 'Профнастил',
      SHAKHETNIK: 'Евроштакетник',
      MESH: 'Сетка-рабица',
      PANEL_3D: '3D-панели',
    };
    return labels[category] || category;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Высоты материалов</h1>
        <p className="text-gray-600 mt-1">
          Управление доступными высотами для материалов заборов
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Поиск по названию материала..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : materials.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Материалы не найдены
          </div>
        ) : (
          <div className="divide-y">
            {materials.map((material) => (
              <div key={material.id} className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpanded(material.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">
                      {expandedMaterials.has(material.id) ? '▼' : '▶'}
                    </span>
                    <div>
                      <div className="font-medium">{material.name}</div>
                      <div className="text-sm text-gray-500">
                        {getCategoryLabel(material.category)}
                        {material.fenceType && ` • ${material.fenceType.name}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {material.availableHeights?.length || 0} высот
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        material.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {material.active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                </div>

                {expandedMaterials.has(material.id) && (
                  <div className="mt-4 ml-8">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        Доступные высоты:
                      </h4>
                      <button
                        onClick={() => handleAddHeight(material)}
                        className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                      >
                        + Добавить высоту
                      </button>
                    </div>
                    {material.availableHeights &&
                    material.availableHeights.length > 0 ? (
                      <div className="space-y-2">
                        {material.availableHeights.map((h, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-4">
                              <span className="font-medium">{h.height} м</span>
                              <span className="text-sm text-gray-600">
                                Коэф. цены: {h.priceCoef}
                              </span>
                              {h.isCustom && (
                                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                                  Нестандартная
                                </span>
                              )}
                              {h.comment && (
                                <span className="text-sm text-gray-500">
                                  {h.comment}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditHeight(material, h)}
                                className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                              >
                                Редактировать
                              </button>
                              <button
                                onClick={() => handleDeleteHeight(material, h.height)}
                                className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        Нет добавленных высот
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {total > pageSize && (
          <div className="p-4 border-t flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Назад
            </button>
            <span className="px-4 py-2">
              Страница {page} из {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Вперед
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          formValues.editingHeight !== undefined
            ? 'Редактировать высоту'
            : 'Добавить высоту'
        }
      >
        <ReferenceForm
          fields={[
            {
              name: 'height',
              label: 'Высота (м)',
              type: 'number',
              required: true,
              min: 1.0,
              max: 5.0,
              step: 0.1,
              disabled: formValues.editingHeight !== undefined,
            },
            {
              name: 'priceCoef',
              label: 'Коэффициент цены',
              type: 'number',
              required: true,
              min: 0.5,
              max: 3.0,
              step: 0.1,
            },
            {
              name: 'isCustom',
              label: 'Нестандартная высота',
              type: 'checkbox',
              disabled: formValues.editingHeight !== undefined,
            },
            {
              name: 'comment',
              label: 'Комментарий',
              type: 'textarea',
            },
          ]}
          values={formValues}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          submitLabel={
            formValues.editingHeight !== undefined ? 'Обновить' : 'Добавить'
          }
        />
      </Modal>
    </div>
  );
}
