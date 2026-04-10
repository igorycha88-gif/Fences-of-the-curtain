'use client';

import { useState } from 'react';
import { ChevronDown, Calculator, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { metrikaEvents } from '@/lib/seo/metrika';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function FaqClient({ items }: { items: FaqItem[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[];

  const filteredItems = activeCategory
    ? items.filter(i => i.category === activeCategory)
    : items;

  const grouped = categories.reduce<Record<string, FaqItem[]>>((acc, cat) => {
    if (!activeCategory || activeCategory === cat) {
      acc[cat] = filteredItems.filter(i => i.category === cat);
    }
    return acc;
  }, {});

  const toggleItem = (id: string, question: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        metrikaEvents.faqExpand(question);
      }
      return next;
    });
  };

  return (
    <>
      <section className="py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              Часто задаваемые вопросы
            </div>
            <h1 className="section-title mb-4">Вопросы и ответы</h1>
            <p className="section-subtitle">
              Ответы на популярные вопросы о заборах, навесах и наших услугах
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
              activeCategory === null
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Все вопросы
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="max-w-3xl mx-auto space-y-10">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h2 className="text-xl font-bold mb-4 text-foreground">{category}</h2>
              <div className="space-y-3">
                {categoryItems.map(item => (
                  <div
                    key={item.id}
                    className="card-modern overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(item.id, item.question)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/30 transition-colors"
                    >
                      <span className="font-semibold text-foreground pr-4">{item.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
                          openItems.has(item.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openItems.has(item.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="px-5 pb-5 text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-16">
          <div className="bg-primary text-primary-foreground p-8 rounded-2xl text-center">
            <h3 className="font-bold text-xl mb-3">Не нашли ответ?</h3>
            <p className="opacity-90 text-sm mb-6">
              Рассчитайте стоимость забора или навеса онлайн за 30 секунд
            </p>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
            >
              <Calculator className="w-5 h-5" />
              Калькулятор стоимости
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
