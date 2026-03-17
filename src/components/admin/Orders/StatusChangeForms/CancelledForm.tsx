'use client';

import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  StatusChangeData, 
  CANCELLATION_REASON_LABELS,
  CANCELLATION_REASONS 
} from '@/lib/validators/order';

interface CancelledFormProps {
  data: StatusChangeData;
  onChange: (data: StatusChangeData) => void;
  errors: Record<string, string>;
}

export function CancelledForm({ data, onChange, errors }: CancelledFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cancellationReason">
          Причина отмены <span className="text-red-500">*</span>
        </Label>
        <Select
          id="cancellationReason"
          value={data.cancellationReason || ''}
          onChange={(e) => onChange({ ...data, cancellationReason: e.target.value as any })}
          options={[
            { value: '', label: 'Выберите причину' },
            ...CANCELLATION_REASONS.map((value) => ({
              value,
              label: CANCELLATION_REASON_LABELS[value],
            })),
          ]}
        />
        {errors.cancellationReason && (
          <p className="text-sm text-red-600 mt-1">{errors.cancellationReason}</p>
        )}
      </div>

      <div>
        <Label htmlFor="cancellationComment">
          Комментарий <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="cancellationComment"
          value={data.cancellationComment || ''}
          onChange={(e) => onChange({ ...data, cancellationComment: e.target.value })}
          placeholder="Укажите подробности причины отмены..."
          rows={3}
        />
        {errors.cancellationComment && (
          <p className="text-sm text-red-600 mt-1">{errors.cancellationComment}</p>
        )}
      </div>
    </div>
  );
}
