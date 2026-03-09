'use client';

import React, { useState } from 'react';

interface LengthItem {
  length: number;
  priceCoef?: number;
  pricePerMeter?: number;
}

interface AvailableLengthsSectionProps {
  type: 'lags' | 'posts';
  availableLengths: LengthItem[];
  basePrice: number;
  onChange: (availableLengths: LengthItem[]) => void;
}

export function AvailableLengthsSection({
  type,
  availableLengths,
  basePrice,
  onChange,
}: AvailableLengthsSectionProps) {
  const [newLength, setNewLength] = useState<string>('');
  const [newPriceCoef, setNewPriceCoef] = useState<string>('1.0');
  const [newPricePerMeter, setNewPricePerMeter] = useState<string>('');

  const handleAddLength = () => {
    const length = parseFloat(newLength);
    const priceCoef = parseFloat(newPriceCoef) || 1.0;
    const pricePerMeter = parseFloat(newPricePerMeter);

    if (!length || length < 1.5 || length > 6.0) {
      alert('Длина должна быть от 1.5 до 6.0 метров');
      return;
    }

    if (availableLengths.some((l) => l.length === length)) {
      alert('Такая длина уже добавлена');
      return;
    }

    const newItem: LengthItem = {
      length,
      priceCoef: type === 'lags' ? priceCoef : undefined,
      pricePerMeter: type === 'posts' ? (!isNaN(pricePerMeter) ? pricePerMeter : basePrice) : undefined,
    };

    console.log('[AVAILABLE LENGTHS] Adding new item:', newItem);
    
    onChange([...availableLengths, newItem]);
    setNewLength('');
    setNewPriceCoef('1.0');
    setNewPricePerMeter('');
  };

  const handleRemoveLength = (length: number) => {
    onChange(availableLengths.filter((l) => l.length !== length));
  };

  const handleUpdateLength = (index: number, field: string, value: number) => {
    const updated = [...availableLengths];
    if (type === 'posts' && field === 'pricePerMeter') {
      updated[index] = { 
        ...updated[index], 
        pricePerMeter: !isNaN(value) ? value : basePrice 
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    console.log('[AVAILABLE LENGTHS] Updated item:', updated[index]);
    onChange(updated);
  };

  const calculateSalePrice = (item: LengthItem): number => {
    if (type === 'lags') {
      return basePrice * (item.priceCoef || 1.0);
    }
    return item.pricePerMeter || basePrice;
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 mb-4">
      <h3 className="text-lg font-semibold mb-4">Доступные длины</h3>

      <div className="mb-4 p-3 bg-white rounded border">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <label className="block text-sm font-medium mb-1">Длина (м)</label>
            <input
              type="number"
              min="1.5"
              max="6.0"
              step="0.1"
              value={newLength}
              onChange={(e) => setNewLength(e.target.value)}
              placeholder="2.5"
              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {type === 'posts' && (
            <div>
              <label className="block text-sm font-medium mb-1">Цена за м.п. (₽)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newPricePerMeter}
                onChange={(e) => setNewPricePerMeter(e.target.value)}
                placeholder={basePrice.toString()}
                className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddLength}
              className="w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Добавить
            </button>
          </div>
        </div>
      </div>

      {availableLengths && availableLengths.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-white">
                <th className="text-left p-2">Длина (м)</th>
                {type === 'posts' && <th className="text-left p-2">Цена за м.п. (₽)</th>}
                <th className="text-left p-2">Цена продажи (₽/м.п.)</th>
                <th className="text-left p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {availableLengths.map((item, index) => (
                <tr key={index} className="border-b bg-white">
                  <td className="p-2">{item.length.toFixed(1)}</td>
                  {type === 'posts' && (
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.pricePerMeter || ''}
                        onChange={(e) =>
                          handleUpdateLength(index, 'pricePerMeter', parseFloat(e.target.value))
                        }
                        placeholder={basePrice.toString()}
                        className="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="p-2">{calculateSalePrice(item).toFixed(2)} ₽</td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveLength(item.length)}
                      className="px-2 py-1 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(!availableLengths || availableLengths.length === 0) && (
        <p className="text-sm text-gray-500 italic">Нет добавленных длин</p>
      )}
    </div>
  );
}
