'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { ImageUploader } from '@/components/admin/Portfolio/ImageUploader';

interface PortfolioFormData {
  title: string;
  category: 'fence' | 'canopy' | 'garage';
  type: string;
  description: string;
  images: string[];
  active: boolean;
}

interface PortfolioFormProps {
  initialData?: PortfolioFormData;
  onSubmit: (data: PortfolioFormData) => Promise<void>;
  isEditing?: boolean;
}

export function PortfolioForm({ initialData, onSubmit, isEditing }: PortfolioFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PortfolioFormData>(
    initialData || {
      title: '',
      category: 'fence',
      type: '',
      description: '',
      images: [],
      active: true,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Максимум 255 символов';
    }

    if (formData.type && formData.type.length > 100) {
      newErrors.type = 'Максимум 100 символов';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Максимум 2000 символов';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'Минимум 1 изображение';
    } else if (formData.images.length > 5) {
      newErrors.images = 'Максимум 5 изображений';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      toast.success(isEditing ? 'Работа обновлена' : 'Работа добавлена');
      router.push('/admin/portfolio');
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Забор из профнастила"
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Категория <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="category"
                value="fence"
                checked={formData.category === 'fence'}
                onChange={() => setFormData({ ...formData, category: 'fence' })}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-gray-700">Заборы</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="category"
                value="canopy"
                checked={formData.category === 'canopy'}
                onChange={() => setFormData({ ...formData, category: 'canopy' })}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-gray-700">Навесы</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="category"
                value="garage"
                checked={formData.category === 'garage'}
                onChange={() => setFormData({ ...formData, category: 'garage' })}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-gray-700">Гаражи из сендвич-панелей</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип работы
          </label>
          <input
            type="text"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary ${
              errors.type ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Двускатный навес"
          />
          {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Описание выполненной работы..."
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Фотографии <span className="text-red-500">*</span> (1-5 шт)
          </label>
          <ImageUploader
            images={formData.images}
            onChange={(images) => setFormData({ ...formData, images })}
          />
          {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="active" className="text-sm text-gray-700">
            Активен (показывать на сайте)
          </label>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <span>Сохранение...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Сохранить
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
