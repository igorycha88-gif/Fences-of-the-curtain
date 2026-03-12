'use client';

import React from 'react';
import { calculateMargin, getMarginColor, getMarginEmoji } from '@/lib/utils/marginCalculator';

interface SimplifiedPurchasePriceInputProps {
  purchasePrice: number | null;
  retailPrice: number;
  onChange: (value: number | null) => void;
}

export function SimplifiedPurchasePriceInput({
  purchasePrice,
  retailPrice,
  onChange,
}: SimplifiedPurchasePriceInputProps) {
  const margin = calculateMargin(retailPrice, purchasePrice);
  const marginColor = getMarginColor(margin?.marginPercent ?? null);
  const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? null : parseFloat(e.target.value);
    onChange(value);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Цены закупки (только для ADMIN)</h3>
        <span 
          className="text-sm text-gray-500 cursor-help" 
          title="Цены закупки видны только администраторам и используются для расчета маржинальности"
        >
          ℹ️
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Цена закупки за единицу (₽)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={purchasePrice ?? ''}
            onChange={handleChange}
            placeholder="Не указана"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Цена закупки за единицу
          </p>
        </div>

        <div className="p-3 bg-white rounded border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Цена продажи за единицу:</span>
            <span className="font-semibold">{retailPrice.toFixed(2)} ₽</span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Маржа:</span>
            <span
              className="font-semibold"
              style={{
                color: marginColor === 'green' ? '#10b981' : 
                       marginColor === 'yellow' ? '#f59e0b' : 
                       marginColor === 'red' ? '#ef4444' : '#9ca3af'
              }}
            >
              {margin ? `${margin.marginPercent.toFixed(1)}% ${marginEmoji}` : `Не указана ${marginEmoji}`}
            </span>
          </div>

          {margin && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Абсолютная маржа:</span>
              <span className="font-semibold">{margin.marginAbsolute.toFixed(2)} ₽</span>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <p>ℹ️ Маржа рассчитывается автоматически</p>
          <p>
            🟢 Маржа ≥ 30% &nbsp;|&nbsp; 🟡 Маржа 10-30% &nbsp;|&nbsp; 🔴 Маржа &lt; 10% &nbsp;|&nbsp; ⚪ Не указана
          </p>
        </div>
      </div>
    </div>
  );
}
