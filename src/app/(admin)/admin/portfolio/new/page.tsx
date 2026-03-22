'use client';

import { PortfolioForm } from '@/components/admin/Portfolio/PortfolioForm';

export default function NewPortfolioPage() {
  const handleSubmit = async (data: any) => {
    const res = await fetch('/api/admin/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Ошибка создания');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Добавить работу</h1>
        <p className="text-gray-500 mt-1">Создание нового элемента портфолио</p>
      </div>

      <PortfolioForm onSubmit={handleSubmit} />
    </div>
  );
}
