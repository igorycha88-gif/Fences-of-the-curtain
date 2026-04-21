import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReferenceForm } from '@/components/admin/References/ReferenceForm';

const textFields = [
  { name: 'title', label: 'Title', type: 'text' as const, required: true },
  { name: 'description', label: 'Description', type: 'textarea' as const },
  { name: 'count', label: 'Count', type: 'number' as const },
];

const selectField = {
  name: 'status',
  label: 'Status',
  type: 'select' as const,
  options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
};

const checkboxField = {
  name: 'active',
  label: 'Active',
  type: 'checkbox' as const,
};

const defaultProps = {
  fields: textFields,
  values: { title: '', description: '', count: 0 },
  onChange: jest.fn(),
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
};

describe('ReferenceForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all field labels and inputs', () => {
    render(<ReferenceForm {...defaultProps} />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    render(<ReferenceForm {...defaultProps} />);
    const titleInput = document.querySelector('input[name="title"]')!;
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('title', 'New Title');
  });

  it('calls onSubmit when form is submitted', () => {
    render(<ReferenceForm {...defaultProps} />);
    const form = document.querySelector('form')!;
    fireEvent.submit(form);
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<ReferenceForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Отмена'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('renders loading state', () => {
    render(<ReferenceForm {...defaultProps} isLoading={true} />);
    expect(screen.getByText('Сохранение...')).toBeInTheDocument();
    expect(screen.getByText('Отмена')).toBeDisabled();
  });

  it('renders custom submit label', () => {
    render(<ReferenceForm {...defaultProps} submitLabel="Update" />);
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('renders select field', () => {
    render(
      <ReferenceForm
        {...defaultProps}
        fields={[selectField]}
        values={{ status: 'active' }}
      />
    );
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders checkbox field', () => {
    render(
      <ReferenceForm
        {...defaultProps}
        fields={[checkboxField]}
        values={{ active: false }}
      />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    const checkbox = document.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeInTheDocument();
  });

  it('hides buttons when showButtons is false', () => {
    render(<ReferenceForm {...defaultProps} showButtons={false} />);
    expect(screen.queryByText('Отмена')).not.toBeInTheDocument();
    expect(screen.queryByText('Сохранить')).not.toBeInTheDocument();
  });

  it('renders without form wrapper when renderForm is false', () => {
    render(<ReferenceForm {...defaultProps} renderForm={false} />);
    expect(document.querySelector('form')).toBeNull();
    expect(screen.getByText('Сохранить')).toBeInTheDocument();
  });
});
