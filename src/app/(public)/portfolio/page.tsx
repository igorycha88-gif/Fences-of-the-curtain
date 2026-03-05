'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import Header from '@/components/layout/Header';

export default function PortfolioPage() {
  const [filter, setFilter] = useState<'all' | 'fence' | 'canopy'>('all');

  const portfolioItems = [
    {
      id: 1,
      title: 'Забор из профнастила',
      category: 'fence',
      type: 'Заборы',
      description: 'Забор длиной 50м, высотой 2м с калиткой и воротами',
      images: ['/images/portfolio/fence-1.jpg'],
      showCost: false,
    },
    {
      id: 2,
      title: 'Навес под 2 автомобиля',
      category: 'canopy',
      type: 'Навесы',
      description: 'Двускатный навес 6x4м из поликарбоната',
      images: ['/images/portfolio/canopy-1.jpg'],
      showCost: false,
    },
    {
      id: 3,
      title: 'Забор евроштакетник',
      category: 'fence',
      type: 'Заборы',
      description: 'Забор длиной 35м, высотой 1.8м',
      images: ['/images/portfolio/fence-2.jpg'],
      showCost: false,
    },
    {
      id: 4,
      title: 'Беседка для отдыха',
      category: 'canopy',
      type: 'Навесы',
      description: 'Круглая беседка с крышей из поликарбоната',
      images: ['/images/portfolio/canopy-2.jpg'],
      showCost: false,
    },
    {
      id: 5,
      title: '3D-панели для дачи',
      category: 'fence',
      type: 'Заборы',
      description: 'Забор из 3D-панелей с каменными столбами',
      images: ['/images/portfolio/fence-3.jpg'],
      showCost: false,
    },
    {
      id: 6,
      title: 'Навес-терраса',
      category: 'canopy',
      type: 'Навесы',
      description: 'Терраса 8x3м примыкающая к дому',
      images: ['/images/portfolio/canopy-3.jpg'],
      showCost: false,
    },
  ];

  const filteredItems = filter === 'all'
    ? portfolioItems
    : portfolioItems.filter(item => item.category === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-900">Портфолио</h1>
        <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Примеры наших работ выполненных с высоким качеством
        </p>

        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-md border">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Все работы
              </button>
              <button
                onClick={() => setFilter('fence')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'fence'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Заборы
              </button>
              <button
                onClick={() => setFilter('canopy')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'canopy'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Навесы
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border"
            >
              <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Изображение {item.id}</span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    {item.type}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                <Link
                  href={`/calculator/${item.category === 'fence' ? 'fence' : 'canopy'}`}
                  className="text-primary font-medium text-sm hover:underline inline-flex items-center gap-1"
                >
                  Рассчитать подобный проект →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Нет проектов в выбранной категории</p>
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">© 2026 Заборы и Навесы. Все права защищены.</p>
          <p className="text-gray-400">+7 (900) 123-45-67 | info@fences.ru</p>
        </div>
      </footer>
    </div>
  );
}
