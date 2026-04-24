import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    render(<Textarea placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('accepts and displays typed text', async () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'Hello world');
    expect(textarea).toHaveValue('Hello world');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Textarea className="my-area" />);
    expect(screen.getByRole('textbox').className).toContain('my-area');
  });

  it('passes through HTML textarea attributes', () => {
    render(<Textarea name="description" rows={5} maxLength={500} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('name', 'description');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveAttribute('maxlength', '500');
  });

  it('calls onChange when value changes', async () => {
    const onChange = jest.fn();
    render(<Textarea onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'X');
    expect(onChange).toHaveBeenCalled();
  });
});
