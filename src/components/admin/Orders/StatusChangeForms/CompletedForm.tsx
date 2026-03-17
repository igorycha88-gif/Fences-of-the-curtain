'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusChangeData } from '@/lib/validators/order';

interface CompletedFormProps {
  data: StatusChangeData;
  onChange: (data: StatusChangeData) => void;
  errors: Record<string, string>;
}

export function CompletedForm({ data, onChange, errors }: CompletedFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="completionDate">Дата завершения</Label>
        <Input
          id="completionDate"
          type="date"
          value={data.completionDate || ''}
          onChange={(e) => onChange({ ...data, completionDate: e.target.value })}
        />
        {errors.completionDate && (
          <p className="text-sm text-red-600 mt-1">{errors.completionDate}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="clientSatisfied"
          type="checkbox"
          checked={data.clientSatisfied || false}
          onChange={(e) => onChange({ ...data, clientSatisfied: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300"
        />
        <Label htmlFor="clientSatisfied">Клиент доволен</Label>
      </div>

      <div>
        <Label htmlFor="photos">Ссылки на фото (через запятую)</Label>
        <Textarea
          id="photos"
          value={data.photos?.join(', ') || ''}
          onChange={(e) => onChange({ 
            ...data, 
            photos: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined 
          })}
          placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
          rows={2}
        />
        {errors.photos && (
          <p className="text-sm text-red-600 mt-1">{errors.photos}</p>
        )}
      </div>

      <div>
        <Label htmlFor="reviewLink">Ссылка на отзыв</Label>
        <Input
          id="reviewLink"
          type="url"
          value={data.reviewLink || ''}
          onChange={(e) => onChange({ ...data, reviewLink: e.target.value })}
          placeholder="https://..."
        />
        {errors.reviewLink && (
          <p className="text-sm text-red-600 mt-1">{errors.reviewLink}</p>
        )}
      </div>
    </div>
  );
}
