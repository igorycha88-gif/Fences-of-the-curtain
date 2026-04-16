'use client';

import { useState, useEffect } from 'react';
import { Star, Plus, Pencil, Trash2, X, GripVertical, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  image: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ReviewFormData {
  name: string;
  text: string;
  rating: number;
  image: string;
  sortOrder: number;
  active: boolean;
}

const emptyForm: ReviewFormData = {
  name: '',
  text: '',
  rating: 5,
  image: '',
  sortOrder: 0,
  active: true,
};

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      toast.error('Ошибка загрузки отзывов');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      toast.error('Заполните имя и текст отзыва');
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/reviews/${editingId}`
        : '/api/admin/reviews';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(editingId ? 'Отзыв обновлён' : 'Отзыв добавлен');
        resetForm();
        fetchReviews();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (review: Review) => {
    setForm({
      name: review.name,
      text: review.text,
      rating: review.rating,
      image: review.image || '',
      sortOrder: review.sortOrder,
      active: review.active,
    });
    setEditingId(review.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот отзыв?')) return;

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Отзыв удалён');
        fetchReviews();
      }
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (review: Review) => {
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !review.active }),
      });
      if (res.ok) {
        toast.success(review.active ? 'Отзыв скрыт' : 'Отзыв опубликован');
        fetchReviews();
      }
    } catch {
      toast.error('Ошибка');
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setForm({ ...form, rating: star })}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Отзывы</h1>
          <p className="text-sm text-gray-500 mt-1">
            Управление отзывами клиентов на сайте
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить отзыв
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingId ? 'Редактировать отзыв' : 'Новый отзыв'}
            </h2>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя автора *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Иван Иванов"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Текст отзыва *
              </label>
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[100px]"
                placeholder="Текст отзыва..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Рейтинг
              </label>
              {renderStars(form.rating, true)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Порядок сортировки
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  min={0}
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Опубликован</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving
                  ? 'Сохранение...'
                  : editingId
                    ? 'Сохранить'
                    : 'Добавить'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">Отзывов пока нет</p>
          <p className="text-sm mt-1">Нажмите «Добавить отзыв» чтобы создать первый</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white border rounded-xl p-4 shadow-sm transition-opacity ${
                review.active ? 'border-gray-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1">
                  <GripVertical className="w-4 h-4 text-gray-300" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-900">
                      {review.name}
                    </span>
                    {renderStars(review.rating)}
                    {!review.active && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Скрыт
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {review.text}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Порядок: {review.sortOrder} ·{' '}
                    {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(review)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={review.active ? 'Скрыть' : 'Опубликовать'}
                  >
                    {review.active ? (
                      <Eye className="w-4 h-4 text-gray-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(review)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Редактировать"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
