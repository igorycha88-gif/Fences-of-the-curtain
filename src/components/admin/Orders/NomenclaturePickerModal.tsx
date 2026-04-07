'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Search, Plus, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface NomenclatureItem {
  id: string;
  name: string;
  retailPrice: number;
  unit: string;
  category: string;
}

export interface SelectedNomenclatureItem {
  category: string;
  nomenclatureId: string;
  nomenclatureName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
}

interface CategoryGroup {
  category: string;
  label: string;
  items: NomenclatureItem[];
}

interface NomenclaturePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: SelectedNomenclatureItem) => void;
  excludeIds?: string[];
}

const CATEGORY_ICONS: Record<string, string> = {
  posts: '\u{1F4E6}',
  lags: '\u{1F4E6}',
  profnastil: '\u{1F4E6}',
  panel3d: '\u{1F4E6}',
  picket: '\u{1F4E6}',
  gates: '\u{1F6AA}',
  wickets: '\u{1F6AA}',
  mounting_hardware: '\u{1F527}',
  installation: '\u{1F477}',
};

export function NomenclaturePickerModal({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
}: NomenclaturePickerModalProps) {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [pendingItem, setPendingItem] = useState<NomenclatureItem | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const quantityRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const activeCategoryRef = useRef<string | null>(null);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  const fetchData = useCallback(async (searchValue: string, category?: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchValue) params.set('search', searchValue);
      if (category) params.set('category', category);

      const res = await fetch(`/api/admin/nomenclature/search?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching nomenclature:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!isOpen) return;

    setSearch('');
    setActiveCategory(null);
    activeCategoryRef.current = null;
    setPendingItem(null);
    setQuantityInput('1');
    setCategories([]);
    isInitialMount.current = true;
    
    fetchData('').then(() => {
      setTimeout(() => {
        isInitialMount.current = false;
      }, 100);
    });
  }, [isOpen, fetchData]);

  useEffect(() => {
    if (!isOpen || isInitialMount.current) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchData(search, activeCategory);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, isOpen, fetchData, activeCategory]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pendingItem) {
        onClose();
      }
      if (e.key === 'Escape' && pendingItem) {
        setPendingItem(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, pendingItem]);

  useEffect(() => {
    if (pendingItem && quantityRef.current) {
      quantityRef.current.focus();
      quantityRef.current.select();
    }
  }, [pendingItem]);

  const handleCategoryClick = (category: string) => {
    const newCategory = category || null;
    setActiveCategory(newCategory);
    activeCategoryRef.current = newCategory;
    setSearch('');
  };

  const handleAddClick = (item: NomenclatureItem) => {
    setPendingItem(item);
    setQuantityInput('1');
  };

  const handleConfirmAdd = () => {
    if (!pendingItem) return;

    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) return;

    onSelect({
      category: pendingItem.category,
      nomenclatureId: pendingItem.id,
      nomenclatureName: pendingItem.name,
      quantity: qty,
      unit: pendingItem.unit,
      pricePerUnit: pendingItem.retailPrice,
    });

    setPendingItem(null);
    setQuantityInput('1');
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmAdd();
    }
    if (e.key === 'Escape') {
      setPendingItem(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-4xl transform rounded-lg bg-white shadow-xl transition-all">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-semibold">Добавить номенклатуру</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск номенклатуры..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => handleCategoryClick('')}
                className={!activeCategory
                  ? 'px-3 py-1.5 text-xs font-medium rounded-full bg-blue-600 text-white'
                  : 'px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              >
                Все
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => handleCategoryClick(cat.category)}
                  className={activeCategory === cat.category
                    ? 'px-3 py-1.5 text-xs font-medium rounded-full bg-blue-600 text-white'
                    : 'px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto p-4">
            {loading && categories.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-500">Загрузка...</span>
              </div>
            ) : (
              <>
                {categories
                  .filter((cat) => !activeCategory || cat.category === activeCategory)
                  .map((cat) => {
                    const filteredItems = cat.items.filter(
                      (item) => !excludeSet.has(item.id)
                    );

                    if (filteredItems.length === 0 && search) return null;

                    return (
                      <div key={cat.category} className="mb-6 last:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">{CATEGORY_ICONS[cat.category] || '\u{1F4E6}'}</span>
                          <h4 className="font-semibold text-gray-800 text-sm">
                            {cat.label}
                          </h4>
                          <span className="text-xs text-gray-400">
                            ({filteredItems.length})
                          </span>
                        </div>

                        {filteredItems.length === 0 ? (
                          <p className="text-sm text-gray-400 pl-6">
                            {search ? 'Ничего не найдено' : 'Нет доступных позиций'}
                          </p>
                        ) : (
                          <div className="space-y-1 pl-2">
                            {filteredItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 group"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatCurrency(item.retailPrice)}/{item.unit}
                                  </p>
                                </div>

                                {pendingItem?.id === item.id ? (
                                  <div className="flex items-center gap-2 ml-3">
                                    <input
                                      ref={quantityRef}
                                      type="number"
                                      value={quantityInput}
                                      onChange={(e) => setQuantityInput(e.target.value)}
                                      onKeyDown={handleQuantityKeyDown}
                                      min="0.1"
                                      step="0.1"
                                      className="w-20 h-8 text-center text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                      onClick={handleConfirmAdd}
                                      className="h-8 px-3 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    >
                                      ОК
                                    </button>
                                    <button
                                      onClick={() => setPendingItem(null)}
                                      className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAddClick(item)}
                                    className="h-8 w-8 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Добавить"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {!loading && categories.every(
                  (cat) => cat.items.filter((i) => !excludeSet.has(i.id)).length === 0
                ) && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">
                      {search
                        ? `По запросу "${search}" ничего не найдено`
                        : 'Нет доступных номенклатур'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t p-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
