'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusChangeData } from '@/lib/validators/order';

interface InstallationFormProps {
  data: StatusChangeData;
  onChange: (data: StatusChangeData) => void;
  errors: Record<string, string>;
}

export function InstallationForm({ data, onChange, errors }: InstallationFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="productionReadyDate">Дата готовности</Label>
        <Input
          id="productionReadyDate"
          type="date"
          value={data.productionReadyDate || ''}
          onChange={(e) => onChange({ ...data, productionReadyDate: e.target.value })}
        />
        {errors.productionReadyDate && (
          <p className="text-sm text-red-600 mt-1">{errors.productionReadyDate}</p>
        )}
      </div>

      <div>
        <Label htmlFor="productionNotes">Примечания</Label>
        <Textarea
          id="productionNotes"
          value={data.productionNotes || ''}
          onChange={(e) => onChange({ ...data, productionNotes: e.target.value })}
          placeholder="Особенности производства, комментарии..."
          rows={3}
        />
        {errors.productionNotes && (
          <p className="text-sm text-red-600 mt-1">{errors.productionNotes}</p>
        )}
      </div>
    </div>
  );
}
