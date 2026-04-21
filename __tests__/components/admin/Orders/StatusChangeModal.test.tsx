import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StatusChangeModal } from '@/components/admin/Orders/StatusChangeModal';

jest.mock('@/components/ui/modal', () => ({
  Modal: ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button data-testid="modal-close" onClick={onClose}>Close</button>
        <div>{children}</div>
      </div>
    );
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/admin/Orders/StatusChangeForms/EstimateApprovalForm', () => ({
  EstimateApprovalForm: () => <div data-testid="estimate-form">Estimate Form</div>,
}));

jest.mock('@/components/admin/Orders/StatusChangeForms/MeasurementForm', () => ({
  MeasurementForm: () => <div data-testid="measurement-form">Measurement Form</div>,
}));

jest.mock('@/components/admin/Orders/StatusChangeForms/ProductionForm', () => ({
  ProductionForm: () => <div data-testid="production-form">Production Form</div>,
}));

jest.mock('@/components/admin/Orders/StatusChangeForms/InstallationForm', () => ({
  InstallationForm: () => <div data-testid="installation-form">Installation Form</div>,
}));

jest.mock('@/components/admin/Orders/StatusChangeForms/CompletedForm', () => ({
  CompletedForm: () => <div data-testid="completed-form">Completed Form</div>,
}));

jest.mock('@/components/admin/Orders/StatusChangeForms/CancelledForm', () => ({
  CancelledForm: () => <div data-testid="cancelled-form">Cancelled Form</div>,
}));

jest.mock('@/lib/validators/order', () => ({
  STATUS_LABELS: {
    NEW: 'Новая',
    ESTIMATE_APPROVAL: 'Согласование сметы',
    MEASUREMENT: 'Замер',
    PRODUCTION: 'Производство',
    INSTALLATION: 'Монтаж',
    COMPLETED: 'Выполнена',
    CANCELLED: 'Отменена',
  },
}));

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  orderId: 'abc12345def',
  currentStatus: 'NEW',
  newStatus: 'ESTIMATE_APPROVAL',
  onSuccess: jest.fn(),
};

describe('StatusChangeModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with status transition info', () => {
    render(<StatusChangeModal {...defaultProps} />);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Новая')).toBeInTheDocument();
    expect(screen.getByText('Согласование сметы')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('renders cancel and save buttons', () => {
    render(<StatusChangeModal {...defaultProps} />);
    expect(screen.getByText('Отмена')).toBeInTheDocument();
    expect(screen.getByText('Сохранить')).toBeInTheDocument();
  });

  it('calls onClose when cancel button clicked', () => {
    render(<StatusChangeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Отмена'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders EstimateApprovalForm for NEW->ESTIMATE_APPROVAL', () => {
    render(<StatusChangeModal {...defaultProps} />);
    expect(screen.getByTestId('estimate-form')).toBeInTheDocument();
  });

  it('renders CancelledForm when newStatus is CANCELLED', () => {
    render(
      <StatusChangeModal {...defaultProps} currentStatus="NEW" newStatus="CANCELLED" />
    );
    expect(screen.getByTestId('cancelled-form')).toBeInTheDocument();
  });

  it('renders nothing when modal is closed', () => {
    render(<StatusChangeModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders arrow between status labels', () => {
    render(<StatusChangeModal {...defaultProps} />);
    const arrow = screen.getByText('→');
    expect(arrow).toBeInTheDocument();
  });
});
