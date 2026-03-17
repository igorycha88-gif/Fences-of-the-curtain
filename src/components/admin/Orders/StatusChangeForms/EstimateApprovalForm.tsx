'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { 
  StatusChangeData, 
  CONTACT_RESULT_LABELS,
  CONTACT_RESULTS 
} from '@/lib/validators/order';

interface EstimateApprovalFormProps {
  data: StatusChangeData;
  onChange: (data: StatusChangeData) => void;
  errors: Record<string, string>;
}

export function EstimateApprovalForm({ data, onChange, errors }: EstimateApprovalFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="contactResult">Результат связи</Label>
        <Select
          id="contactResult"
          value={data.contactResult || ''}
          onChange={(e) => onChange({ ...data, contactResult: e.target.value as any })}
          options={[
            { value: '', label: 'Не указано' },
            ...CONTACT_RESULTS.map((value) => ({
              value,
              label: CONTACT_RESULT_LABELS[value],
            })),
          ]}
        />
        {errors.contactResult && (
          <p className="text-sm text-red-600 mt-1">{errors.contactResult}</p>
        )}
      </div>

      <div>
        <Label htmlFor="preferredContactDate">Предпочтительная дата связи</Label>
        <Input
          id="preferredContactDate"
          type="date"
          value={data.preferredContactDate || ''}
          onChange={(e) => onChange({ ...data, preferredContactDate: e.target.value })}
        />
        {errors.preferredContactDate && (
          <p className="text-sm text-red-600 mt-1">{errors.preferredContactDate}</p>
        )}
      </div>
    </div>
  );
}
