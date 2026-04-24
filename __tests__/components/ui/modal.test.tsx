import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/ui/modal';

jest.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">X</span>,
}));

describe('Modal', () => {
  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders the title in a heading', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="My Title">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText('My Title').tagName).toBe('H3');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Modal">
        <p>Content</p>
      </Modal>
    );
    await userEvent.click(screen.getByTestId('x-icon').closest('button')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Modal">
        <p>Content</p>
      </Modal>
    );
    const backdrop = document.querySelector('.fixed.inset-0.bg-black');
    expect(backdrop).toBeTruthy();
    await userEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders children content', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Modal">
        <div data-testid="child">Child Element</div>
      </Modal>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
