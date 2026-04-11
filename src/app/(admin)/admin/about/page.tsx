'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, Upload, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';

interface Advantage {
  _id: number;
  icon: string;
  title: string;
  description: string;
}

interface Step {
  _id: number;
  number: number;
  title: string;
  description: string;
}

interface Photo {
  _id: number;
  image: string;
  caption: string;
}

interface AboutFormData {
  about_hero_title: string;
  about_hero_subtitle: string;
  about_hero_image: string;
  about_text: string;
  about_advantages: Advantage[];
  about_steps: Step[];
  about_photos: Photo[];
}

const ICON_OPTIONS = [
  { value: 'Factory', label: 'Производство' },
  { value: 'Cog', label: 'Механизм' },
  { value: 'Shield', label: 'Щит' },
  { value: 'BadgePercent', label: 'Цена' },
];

const EMPTY_ADVANTAGE = (): Advantage => ({ _id: uid(), icon: 'Factory', title: '', description: '' });
const EMPTY_STEP = (number: number): Step => ({ _id: uid(), number, title: '', description: '' });
const EMPTY_PHOTO = (): Photo => ({ _id: uid(), image: '', caption: '' });

let _idCounter = 0;
function uid() { return ++_idCounter; }

export default function AdminAboutPage() {
  const [formData, setFormData] = useState<AboutFormData>({
    about_hero_title: '',
    about_hero_subtitle: '',
    about_hero_image: '',
    about_text: '',
    about_advantages: [],
    about_steps: [],
    about_photos: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/about', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            about_hero_title: data.about_hero_title || '',
            about_hero_subtitle: data.about_hero_subtitle || '',
            about_hero_image: data.about_hero_image || '',
            about_text: data.about_text || '',
            about_advantages: data.about_advantages ? JSON.parse(data.about_advantages).map((a: any) => ({ ...a, _id: uid() })) : [],
            about_steps: data.about_steps ? JSON.parse(data.about_steps).map((s: any) => ({ ...s, _id: uid() })) : [],
            about_photos: data.about_photos ? JSON.parse(data.about_photos).map((p: any) => ({ ...p, _id: uid() })) : [],
          });
        }
      } catch (error) {
        console.error('Error fetching about data:', error);
        toast.error('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/portfolio/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  }, []);

  const handleFileUpload = useCallback(async (
    field: string,
    file: File,
    index?: number
  ) => {
    setUploadingField(field + (index !== undefined ? `-${index}` : ''));
    try {
      const url = await uploadImage(file);
      if (url) {
        if (field === 'hero_image') {
          setFormData((prev) => ({ ...prev, about_hero_image: url }));
        } else if (field === 'photo_image' && index !== undefined) {
          setFormData((prev) => {
            const photos = [...prev.about_photos];
            photos[index] = { ...photos[index], image: url };
            return { ...prev, about_photos: photos };
          });
        }
        toast.success('Фото загружено');
      } else {
        toast.error('Ошибка загрузки');
      }
    } catch {
      toast.error('Ошибка загрузки');
    } finally {
      setUploadingField(null);
    }
  }, [uploadImage]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        about_hero_title: formData.about_hero_title,
        about_hero_subtitle: formData.about_hero_subtitle,
        about_hero_image: formData.about_hero_image,
        about_text: formData.about_text,
        about_advantages: JSON.stringify(formData.about_advantages.map(({ _id, ...rest }) => rest)),
        about_steps: JSON.stringify(formData.about_steps.map(({ _id, ...rest }) => rest)),
        about_photos: JSON.stringify(formData.about_photos.map(({ _id, ...rest }) => rest)),
      };

      const res = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (res.ok) {
        toast.success('Данные сохранены');
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const updateAdvantage = (index: number, field: keyof Advantage, value: string) => {
    setFormData((prev) => {
      const advantages = [...prev.about_advantages];
      advantages[index] = { ...advantages[index], [field]: value };
      return { ...prev, about_advantages: advantages };
    });
  };

  const addAdvantage = () => {
    setFormData((prev) => ({
      ...prev,
      about_advantages: [...prev.about_advantages, EMPTY_ADVANTAGE()],
    }));
  };

  const removeAdvantage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      about_advantages: prev.about_advantages.filter((_, i) => i !== index),
    }));
  };

  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    setFormData((prev) => {
      const steps = [...prev.about_steps];
      steps[index] = { ...steps[index], [field]: value };
      return { ...prev, about_steps: steps };
    });
  };

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      about_steps: [...prev.about_steps, EMPTY_STEP(prev.about_steps.length + 1)],
    }));
  };

  const removeStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      about_steps: prev.about_steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, number: i + 1 })),
    }));
  };

  const updatePhoto = (index: number, field: keyof Photo, value: string) => {
    setFormData((prev) => {
      const photos = [...prev.about_photos];
      photos[index] = { ...photos[index], [field]: value };
      return { ...prev, about_photos: photos };
    });
  };

  const addPhoto = () => {
    setFormData((prev) => ({
      ...prev,
      about_photos: [...prev.about_photos, EMPTY_PHOTO()],
    }));
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      about_photos: prev.about_photos.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Страница «О нас»</h1>
          <p className="text-gray-500 mt-1">Редактирование контента страницы</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Сохранить
        </button>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hero-секция</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
              <input
                type="text"
                value={formData.about_hero_title}
                onChange={(e) => setFormData((prev) => ({ ...prev, about_hero_title: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок</label>
              <textarea
                value={formData.about_hero_subtitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, about_hero_subtitle: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фото hero</label>
              <div className="flex items-center gap-4">
                {formData.about_hero_image && (
                  <img
                    src={getThumbnailUrl(formData.about_hero_image)}
                    alt="Hero"
                    className="w-32 h-20 object-cover rounded-lg border"
                  />
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                  {uploadingField === 'hero_image' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span className="text-sm">Загрузить</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('hero_image', e.target.files[0])}
                    disabled={uploadingField !== null}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Текст о компании</h2>
          <textarea
            value={formData.about_text}
            onChange={(e) => setFormData((prev) => ({ ...prev, about_text: e.target.value }))}
            rows={6}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none"
            placeholder="Описание компании..."
          />
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Преимущества</h2>
            <button
              onClick={addAdvantage}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>
          <div className="space-y-4">
            {formData.about_advantages.map((adv, index) => (
              <div key={adv._id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <select
                    value={adv.icon}
                    onChange={(e) => updateAdvantage(index, 'icon', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={adv.title}
                    onChange={(e) => updateAdvantage(index, 'title', e.target.value)}
                    placeholder="Заголовок"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none"
                  />
                  <input
                    type="text"
                    value={adv.description}
                    onChange={(e) => updateAdvantage(index, 'description', e.target.value)}
                    placeholder="Описание"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none"
                  />
                </div>
                <button
                  onClick={() => removeAdvantage(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Этапы работы</h2>
            <button
              onClick={addStep}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>
          <div className="space-y-4">
            {formData.about_steps.map((step, index) => (
              <div key={step._id} className="flex gap-3 p-4 bg-gray-50 rounded-lg items-center">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {step.number}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(index, 'title', e.target.value)}
                    placeholder="Заголовок"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none"
                  />
                  <input
                    type="text"
                    value={step.description}
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                    placeholder="Описание"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none"
                  />
                </div>
                <button
                  onClick={() => removeStep(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Фотографии</h2>
            <button
              onClick={addPhoto}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>
          <div className="space-y-4">
            {formData.about_photos.map((photo, index) => (
              <div key={photo._id} className="flex gap-3 p-4 bg-gray-50 rounded-lg items-center">
                <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {photo.image ? (
                    <img
                      src={getThumbnailUrl(photo.image)}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Нет фото
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => updatePhoto(index, 'caption', e.target.value)}
                    placeholder="Подпись к фото"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none mb-2"
                  />
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors w-fit">
                    {uploadingField === `photo_image-${index}` ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    <span className="text-xs">Загрузить фото</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('photo_image', e.target.files[0], index)}
                      disabled={uploadingField !== null}
                    />
                  </label>
                </div>
                <button
                  onClick={() => removePhoto(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Сохранить изменения
          </button>
        </div>
      </div>
    </div>
  );
}
