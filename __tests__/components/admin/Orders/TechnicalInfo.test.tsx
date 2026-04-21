import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TechnicalInfo } from '@/components/admin/Orders/TechnicalInfo';

const defaultProps = {
  estimateId: 'est-123-abc',
  userId: 'user1',
  user: { id: 'user1', name: 'Admin User', role: 'ADMIN' },
  sessionId: 'sess-abc123456789',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
};

describe('TechnicalInfo', () => {
  it('renders collapsed by default', () => {
    render(<TechnicalInfo {...defaultProps} />);
    expect(screen.getByText('Техническая информация')).toBeInTheDocument();
    expect(screen.queryByText('ID расчета')).not.toBeInTheDocument();
  });

  it('expands on click and shows technical details', () => {
    render(<TechnicalInfo {...defaultProps} />);
    fireEvent.click(screen.getByText('Техническая информация'));
    expect(screen.getByText('ID расчета')).toBeInTheDocument();
    expect(screen.getByText('est-123-abc')).toBeInTheDocument();
  });

  it('displays IP address when expanded', () => {
    render(<TechnicalInfo {...defaultProps} />);
    fireEvent.click(screen.getByText('Техническая информация'));
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('displays user info when user is provided', () => {
    render(<TechnicalInfo {...defaultProps} />);
    fireEvent.click(screen.getByText('Техническая информация'));
    expect(screen.getByText(/Admin User/)).toBeInTheDocument();
    expect(screen.getByText(/Администратор/)).toBeInTheDocument();
  });

  it('shows client label when no user', () => {
    render(<TechnicalInfo {...defaultProps} user={null} />);
    fireEvent.click(screen.getByText('Техническая информация'));
    expect(screen.getByText('Клиент (через калькулятор)')).toBeInTheDocument();
  });

  it('displays browser info from user agent', () => {
    render(<TechnicalInfo {...defaultProps} />);
    fireEvent.click(screen.getByText('Техническая информация'));
    expect(screen.getByText(/Chrome 120/)).toBeInTheDocument();
  });

  it('displays session ID when provided', () => {
    render(<TechnicalInfo {...defaultProps} />);
    fireEvent.click(screen.getByText('Техническая информация'));
    expect(screen.getByText(/sess-abc123456789/)).toBeInTheDocument();
  });

  it('collapses when clicked again', () => {
    render(<TechnicalInfo {...defaultProps} />);
    const header = screen.getByText('Техническая информация');
    fireEvent.click(header);
    expect(screen.getByText('ID расчета')).toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.queryByText('ID расчета')).not.toBeInTheDocument();
  });
});
