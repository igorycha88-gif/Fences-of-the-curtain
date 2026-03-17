'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusChangeData } from '@/lib/validators/order';

interface ProductionFormProps {
  data: StatusChangeData;
  onChange: (data: StatusChangeData) => void;
  errors: Record<string, string>;
}

export function ProductionForm({ data, onChange, errors }: ProductionFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          id="measurementConfirmed"
          type="checkbox"
          checked={data.measurementConfirmed || false}
          onChange={(e) => onChange({ ...data, measurementConfirmed: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300"
        />
        <Label htmlFor="measurementConfirmed">Смета подтверждена</Label>
      </div>

      <div>
        <Label htmlFor="measurementResult">Результат замера</Label>
        <Textarea
          id="measurementResult"
          value={data.measurementResult || ''}
          onChange={(e) => onChange({ ...data, measurementResult: e.target.value })}
          placeholder="Результаты замера, особенности объекта..."
          rows={3}
        />
        {errors.measurementResult && (
          <p className="text-sm text-red-600 mt-1">{errors.measurementResult}</p>
        )}
      </div>

      <div>
        <Label htmlFor="adjustedCost">Скорректированная стоимость (руб.)</Label>
        <Input
          id="adjustedCost"
          type="number"
          value={data.adjustedCost || ''}
          onChange={(e) => onChange({ ...data, adjustedCost: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="0"
        />
        {errors.adjustedCost && (
          <p className="text-sm text-red-600 mt-1">{errors.adjustedCost}</p>
        )}
      </div>
    </div>
  );
}
