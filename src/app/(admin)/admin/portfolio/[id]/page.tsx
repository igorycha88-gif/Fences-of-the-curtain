'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PortfolioForm } from '@/components/admin/Portfolio/PortfolioForm';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  type?: string;
  description?: string;
  images: string[];
  active: boolean;
}

export default function EditPortfolioPage() {
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/admin/portfolio/${id}`, { credentials: 'include' });
        if (!res.ok) {
          throw new Error('Элемент не найден');
        }
        const data = await res.json();
        setItem(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleSubmit = async (data: any) => {
    const res = await fetch(`/api/admin/portfolio/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Ошибка обновления');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Элемент не найден</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Редактировать работу</h1>
        <p className="text-gray-500 mt-1">Изменение элемента портфолио</p>
      </div>

      <PortfolioForm
        initialData={{
          title: item.title,
          category: item.category as 'fence' | 'canopy' | 'garage',
          type: item.type || '',
          description: item.description || '',
          images: item.images as string[],
          active: item.active,
        }}
        onSubmit={handleSubmit}
        isEditing
      />
    </div>
  );
}
