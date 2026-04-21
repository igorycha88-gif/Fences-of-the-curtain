import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '@/components/ui/select';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select', () => {
  it('renders all options', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('displays option labels', () => {
    render(<Select options={options} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('allows selecting an option', async () => {
    render(<Select options={options} />);
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'option2');
    expect(select).toHaveValue('option2');
  });

  it('respects defaultValue prop', () => {
    render(<Select options={options} defaultValue="option3" />);
    expect(screen.getByRole('combobox')).toHaveValue('option3');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select options={options} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Select options={options} className="my-select" />);
    expect(screen.getByRole('combobox').className).toContain('my-select');
  });

  it('calls onChange when selection changes', async () => {
    const onChange = jest.fn();
    render(<Select options={options} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'option1');
    expect(onChange).toHaveBeenCalled();
  });
});
