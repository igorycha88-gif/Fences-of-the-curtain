import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ColumnHeaderWithTooltip } from '@/components/admin/References/ColumnHeaderWithTooltip';

jest.mock('@radix-ui/react-tooltip', () => ({
  Provider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  Root: ({ children }: any) => <div data-testid="tooltip-root">{children}</div>,
  Trigger: ({ children, asChild }: any) => <div data-testid="tooltip-trigger">{children}</div>,
  Portal: ({ children }: any) => <div data-testid="tooltip-portal">{children}</div>,
  Content: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
  Arrow: () => <div data-testid="tooltip-arrow" />,
}));

describe('ColumnHeaderWithTooltip', () => {
  it('renders the title text', () => {
    render(<ColumnHeaderWithTooltip title="Price" tooltip="The price in rubles" />);
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('renders tooltip content', () => {
    render(<ColumnHeaderWithTooltip title="Price" tooltip="The price in rubles" />);
    expect(screen.getByText('The price in rubles')).toBeInTheDocument();
  });

  it('renders the info icon', () => {
    const { container } = render(
      <ColumnHeaderWithTooltip title="Test" tooltip="Test tip" />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with trigger wrapper for cursor help', () => {
    render(<ColumnHeaderWithTooltip title="Margin" tooltip="Calculated margin" />);
    const trigger = screen.getByTestId('tooltip-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger.textContent).toContain('Margin');
  });
});
