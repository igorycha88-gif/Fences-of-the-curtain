'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface ContactInfo {
  id: string;
  address: string;
  phone: string;
  email: string;
  workHoursMonFri: string;
  workHoursSat: string;
  workHoursSun: string;
}

export default function ContactInfoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    address: '',
    phone: '',
    email: '',
    workHoursMonFri: '',
    workHoursSat: '',
    workHoursSun: '',
  });

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/contact-info');
      const data = await response.json();

      if (response.ok) {
        setFormValues({
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          workHoursMonFri: data.workHoursMonFri || '',
          workHoursSat: data.workHoursSat || '',
          workHoursSun: data.workHoursSun || '',
        });
      } else {
        console.error('Error fetching contact info:', data.error);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/contact-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Контактная информация успешно сохранена');
      } else {
        if (Array.isArray(data.error)) {
          const errorMessages = data.error
            .map((err: any) => {
              const field = err.path?.join('.') || 'field';
              return `${field}: ${err.message}`;
            })
            .join(', ');
          toast.error(`Ошибка валидации: ${errorMessages}`);
        } else {
          toast.error(data.error || 'Ошибка сохранения');
        }
      }
    } catch (error) {
      console.error('Exception:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Контактная информация</h1>

        <form onSubmit={handleFormSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium mb-1">Адрес</label>
            <input
              type="text"
              value={formValues.address}
              onChange={(e) => handleFormChange('address', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="г. Москва, ул. Строительная, д. 15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Телефон</label>
            <input
              type="tel"
              value={formValues.phone}
              onChange={(e) => handleFormChange('phone', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="+7 (900) 123-45-67"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formValues.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="info@fences.ru"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Режим работы</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Понедельник-Пятница</label>
                <input
                  type="text"
                  value={formValues.workHoursMonFri}
                  onChange={(e) => handleFormChange('workHoursMonFri', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="9:00 - 18:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Суббота</label>
                <input
                  type="text"
                  value={formValues.workHoursSat}
                  onChange={(e) => handleFormChange('workHoursSat', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="10:00 - 16:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Воскресенье</label>
                <input
                  type="text"
                  value={formValues.workHoursSun}
                  onChange={(e) => handleFormChange('workHoursSun', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="выходной"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
