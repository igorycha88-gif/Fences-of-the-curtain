'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState<'fence' | 'canopy'>('fence');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, [activeTab, category]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const endpoint = activeTab === 'fence' ? '/api/admin/materials/fence' : '/api/admin/materials/canopy';
      const res = await fetch(`${endpoint}?${params.toString()}`);
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const endpoint = activeTab === 'fence' ? `/api/admin/materials/fence/${id}` : `/api/admin/materials/canopy/${id}`;
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      fetchMaterials();
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот материал?')) return;

    try {
      const endpoint = activeTab === 'fence' ? `/api/admin/materials/fence/${id}` : `/api/admin/materials/canopy/${id}`;
      await fetch(endpoint, {
        method: 'DELETE',
      });
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const categories = activeTab === 'fence'
    ? [
        'PROFNASTIL',
        'SHAKHETNIK',
        'MESH',
        'PANELS_3D',
        'POSTS',
        'LAGS',
        'GATES',
        'WICKETS',
        'FASTENERS',
      ]
    : [
        'POLYCARBONATE',
        'PROFNASTIL',
        'METAL_TILE',
        'PROFILE',
        'FASTENERS',
        'WATER_SYSTEM',
      ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Материалы</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md border">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('fence')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'fence'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Материалы для заборов
            </button>
            <button
              onClick={() => setActiveTab('canopy')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'canopy'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Материалы для навесов
            </button>
          </nav>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchMaterials()}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Все категории</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              onClick={fetchMaterials}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Найти
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Название</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Категория</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Цена</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Единица</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Активен</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => (
                    <tr key={material.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{material.name}</td>
                      <td className="py-3 px-4">{material.category}</td>
                      <td className="py-3 px-4">{material.basePrice}</td>
                      <td className="py-3 px-4">{material.unit}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(material.id, material.active)}
                          className={`px-2 py-1 rounded text-sm ${
                            material.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {material.active ? 'Да' : 'Нет'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
