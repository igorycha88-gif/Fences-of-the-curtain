'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

interface ReferenceFormProps {
  fields: Field[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ReferenceForm({
  fields,
  values,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Сохранить',
}: ReferenceFormProps) {
  const renderField = (field: Field) => {
    const value = values[field.name] ?? '';
    const isDisabled = isLoading || field.disabled;

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <Input
            type={field.type}
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={isDisabled}
          />
        );

      case 'textarea':
        return (
          <Textarea
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={isDisabled}
          />
        );

      case 'select':
        return (
          <Select
            name={field.name}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            required={field.required}
            disabled={isDisabled}
            options={field.options || []}
          />
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            name={field.name}
            checked={value}
            onChange={(e) => onChange(field.name, e.target.checked)}
            disabled={isDisabled}
            className="h-4 w-4 rounded border-gray-300"
          />
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Отмена
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Сохранение...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
