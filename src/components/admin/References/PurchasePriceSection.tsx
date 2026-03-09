'use client';

import React from 'react';
import { calculateMargin, getMarginColor, getMarginEmoji } from '@/lib/utils/marginCalculator';

interface PurchasePriceItem {
  length: number;
  purchasePrice: number | null;
}

interface AvailableLength {
  length: number;
  priceCoef?: number;
  pricePerMeter?: number;
}

interface PurchasePriceSectionProps {
  availableLengths: AvailableLength[];
  purchasePrices: PurchasePriceItem[];
  basePrice: number;
  onChange: (purchasePrices: PurchasePriceItem[]) => void;
}

export function PurchasePriceSection({
  availableLengths,
  purchasePrices,
  basePrice,
  onChange,
}: PurchasePriceSectionProps) {
  const getSalePrice = (length: AvailableLength): number => {
    if (length.pricePerMeter !== undefined) {
      return length.pricePerMeter;
    }
    if (length.priceCoef !== undefined) {
      return basePrice * length.priceCoef;
    }
    return basePrice;
  };

  const getPurchasePrice = (length: number): number | null => {
    const item = purchasePrices.find((p) => p.length === length);
    return item?.purchasePrice ?? null;
  };

  const handlePurchasePriceChange = (length: number, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    
    const updated = [...purchasePrices];
    const existingIndex = updated.findIndex((p) => p.length === length);
    
    if (existingIndex >= 0) {
      updated[existingIndex].purchasePrice = numValue;
    } else {
      updated.push({ length, purchasePrice: numValue });
    }
    
    onChange(updated);
  };

  if (!availableLengths || availableLengths.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-4 border rounded">
        Нет доступных длин для указания цен закупки
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Цены закупки (только для ADMIN)</h3>
        <span className="text-sm text-gray-500 cursor-help" title="Цены закупки видны только администраторам">
          ℹ️
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Длина (м)</th>
              <th className="text-left p-2">Цена продажи (₽)</th>
              <th className="text-left p-2">Цена закупки (₽)</th>
              <th className="text-left p-2">Маржа (%)</th>
              <th className="text-left p-2">Маржа (₽)</th>
            </tr>
          </thead>
          <tbody>
            {availableLengths.map((lengthItem, index) => {
              const salePrice = getSalePrice(lengthItem);
              const purchasePrice = getPurchasePrice(lengthItem.length);
              const margin = calculateMargin(salePrice, purchasePrice);
              const marginColor = getMarginColor(margin?.marginPercent ?? null);
              const marginEmoji = getMarginEmoji(margin?.marginPercent ?? null);

              return (
                <tr key={index} className="border-b">
                  <td className="p-2">{lengthItem.length.toFixed(1)}</td>
                  <td className="p-2">{salePrice.toFixed(2)} ₽</td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={purchasePrice ?? ''}
                      onChange={(e) => handlePurchasePriceChange(lengthItem.length, e.target.value)}
                      placeholder="Не указана"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-2">
                    <span
                      style={{
                        color: marginColor === 'green' ? '#10b981' : 
                               marginColor === 'yellow' ? '#f59e0b' : 
                               marginColor === 'red' ? '#ef4444' : '#9ca3af'
                      }}
                    >
                      {margin ? `${margin.marginPercent.toFixed(1)}% ${marginEmoji}` : `Не указана ${marginEmoji}`}
                    </span>
                  </td>
                  <td className="p-2">
                    {margin ? `${margin.marginAbsolute.toFixed(2)} ₽` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-gray-600">
        <p>ℹ️ Маржа рассчитывается автоматически</p>
        <p className="mt-1">
          🟢 Маржа ≥ 30% &nbsp;|&nbsp; 🟡 Маржа 10-30% &nbsp;|&nbsp; 🔴 Маржа &lt; 10% &nbsp;|&nbsp; ⚪ Не указана
        </p>
      </div>
    </div>
  );
}
