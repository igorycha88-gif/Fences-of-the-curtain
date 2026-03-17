'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusChangeData } from '@/lib/validators/order';

interface MeasurementFormProps {
  data: StatusChangeData;
  onChange: (data: StatusChangeData) => void;
  errors: Record<string, string>;
}

export function MeasurementForm({ data, onChange, errors }: MeasurementFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="measurementDate">Дата замера</Label>
        <Input
          id="measurementDate"
          type="date"
          value={data.measurementDate || ''}
          onChange={(e) => onChange({ ...data, measurementDate: e.target.value })}
        />
        {errors.measurementDate && (
          <p className="text-sm text-red-600 mt-1">{errors.measurementDate}</p>
        )}
      </div>

      <div>
        <Label htmlFor="measurementAddress">
          Адрес объекта <span className="text-red-500">*</span>
        </Label>
        <Input
          id="measurementAddress"
          type="text"
          value={data.measurementAddress || ''}
          onChange={(e) => onChange({ ...data, measurementAddress: e.target.value })}
          placeholder="г. Москва, ул. Ленина, д. 10"
        />
        {errors.measurementAddress && (
          <p className="text-sm text-red-600 mt-1">{errors.measurementAddress}</p>
        )}
      </div>

      <div>
        <Label htmlFor="measurementComment">Комментарий к замеру</Label>
        <Textarea
          id="measurementComment"
          value={data.measurementComment || ''}
          onChange={(e) => onChange({ ...data, measurementComment: e.target.value })}
          placeholder="Дом за забором, звонить за 30 минут"
          rows={3}
        />
        {errors.measurementComment && (
          <p className="text-sm text-red-600 mt-1">{errors.measurementComment}</p>
        )}
      </div>
    </div>
  );
}
