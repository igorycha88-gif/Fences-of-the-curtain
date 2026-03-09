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
  renderForm?: boolean;
  showButtons?: boolean;
}

export function ReferenceForm({
  fields,
  values,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Сохранить',
  renderForm = true,
  showButtons = true,
}: ReferenceFormProps) {
  console.log('[REFERENCE FORM] Render, renderForm:', renderForm, 'showButtons:', showButtons);
  
  const handleSubmit = (e: React.FormEvent) => {
    console.log('[REFERENCE FORM] Form submit event triggered');
    console.log('[REFERENCE FORM] Event target:', e.target);
    onSubmit(e);
  };

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
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name={field.name}
              id={field.name}
              checked={value}
              onChange={(e) => onChange(field.name, e.target.checked)}
              disabled={isDisabled}
              title="Нажмите, чтобы изменить статус активности"
              className="h-5 w-5 rounded border-gray-300 cursor-pointer transition-all duration-200 accent-green-600 hover:accent-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            />
            <label 
              htmlFor={field.name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  const fieldsContent = (
    <>
      {fields.map((field) => {
        if (field.type === 'checkbox') {
          return <div key={field.name}>{renderField(field)}</div>;
        }
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderField(field)}
          </div>
        );
      })}
    </>
  );

  const buttonsContent = (
    <div className="flex justify-end gap-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
        Отмена
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Сохранение...' : submitLabel}
      </Button>
    </div>
  );

  if (renderForm) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {fieldsContent}
        {showButtons && buttonsContent}
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {fieldsContent}
      {showButtons && buttonsContent}
    </div>
  );
}
