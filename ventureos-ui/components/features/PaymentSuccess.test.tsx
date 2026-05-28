import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentSuccess } from './PaymentSuccess';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('PaymentSuccess', () => {
  const defaultProps = {
    tierId: 'pro' as const,
    amount: 999,
    transactionRef: 'TXN-20240115-ABC123',
    locale: 'en' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  describe('Rendering', () => {
    it('should render the payment success component', () => {
      render(<PaymentSuccess {...defaultProps} />);
      expect(screen.getByTestId('payment-success')).toBeInTheDocument();
    });

    it('should display a success icon', () => {
      render(<PaymentSuccess {...defaultProps} />);
      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    });

    it('should display the success title', () => {
      render(<PaymentSuccess {...defaultProps} />);
      expect(screen.getByTestId('success-title')).toBeInTheDocument();
      expect(screen.getByTestId('success-title')).toHaveTextContent('title');
    });

    it('should display the success message', () => {
      render(<PaymentSuccess {...defaultProps} />);
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByTestId('success-message')).toHaveTextContent('message');
    });

    it('should display the payment details section', () => {
      render(<PaymentSuccess {...defaultProps} />);
      expect(screen.getByTestId('payment-details')).toBeInTheDocument();
    });

    it('should display the Go to Dashboard button', () => {
      render(<PaymentSuccess {...defaultProps} />);
      expect(screen.getByTestId('go-to-dashboard-button')).toBeInTheDocument();
      expect(screen.getByTestId('go-to-dashboard-button')).toHaveTextContent('goToDashboard');
    });
  });

  describe('Subscription Tier Display', () => {
    it('should display the Pro tier label', () => {
      render(<PaymentSuccess {...defaultProps} tierId="pro" />);
      expect(screen.getByTestId('activated-tier')).toHaveTextContent('Pro');
    });

    it('should display the Enterprise tier label', () => {
      render(<PaymentSuccess {...defaultProps} tierId="enterprise" />);
      expect(screen.getByTestId('activated-tier')).toHaveTextContent('Enterprise');
    });
  });

  describe('Amount Display', () => {
    it('should display the amount paid with BDT symbol', () => {
      render(<PaymentSuccess {...defaultProps} amount={999} />);
      expect(screen.getByTestId('amount-paid')).toHaveTextContent('৳');
      expect(screen.getByTestId('amount-paid')).toHaveTextContent('999');
    });

    it('should display enterprise amount with BDT symbol', () => {
      render(<PaymentSuccess {...defaultProps} amount={3499} />);
      expect(screen.getByTestId('amount-paid')).toHaveTextContent('৳');
      expect(screen.getByTestId('amount-paid')).toHaveTextContent('3,499');
    });
  });

  describe('Transaction Reference', () => {
    it('should display the transaction reference number', () => {
      render(<PaymentSuccess {...defaultProps} transactionRef="TXN-20240115-ABC123" />);
      expect(screen.getByTestId('transaction-ref')).toHaveTextContent('TXN-20240115-ABC123');
    });

    it('should display a different transaction reference', () => {
      render(<PaymentSuccess {...defaultProps} transactionRef="TXN-20240220-XYZ789" />);
      expect(screen.getByTestId('transaction-ref')).toHaveTextContent('TXN-20240220-XYZ789');
    });
  });

  describe('Status Update Notice', () => {
    it('should display the status update notice', () => {
      render(<PaymentSuccess {...defaultProps} />);
      expect(screen.getByTestId('status-update-notice')).toBeInTheDocument();
      expect(screen.getByTestId('status-update-notice')).toHaveTextContent('statusUpdateNotice');
    });
  });

  describe('Navigation', () => {
    it('should navigate to dashboard when button is clicked', () => {
      render(<PaymentSuccess {...defaultProps} />);
      fireEvent.click(screen.getByTestId('go-to-dashboard-button'));
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should call onGoToDashboard callback when provided', () => {
      const mockCallback = jest.fn();
      render(<PaymentSuccess {...defaultProps} onGoToDashboard={mockCallback} />);
      fireEvent.click(screen.getByTestId('go-to-dashboard-button'));
      expect(mockCallback).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" on the container', () => {
      render(<PaymentSuccess {...defaultProps} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live="polite" for screen reader announcements', () => {
      render(<PaymentSuccess {...defaultProps} />);
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-hidden on the success icon', () => {
      render(<PaymentSuccess {...defaultProps} />);
      expect(screen.getByTestId('success-icon')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Locale Support', () => {
    it('should render with English locale without errors', () => {
      render(<PaymentSuccess {...defaultProps} locale="en" />);
      expect(screen.getByTestId('payment-success')).toBeInTheDocument();
    });

    it('should render with Bengali locale without errors', () => {
      render(<PaymentSuccess {...defaultProps} locale="bn" />);
      expect(screen.getByTestId('payment-success')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should apply custom className', () => {
      render(<PaymentSuccess {...defaultProps} className="custom-class" />);
      const container = screen.getByTestId('payment-success').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('should use default locale when not provided', () => {
      const { tierId, amount, transactionRef } = defaultProps;
      render(<PaymentSuccess tierId={tierId} amount={amount} transactionRef={transactionRef} />);
      expect(screen.getByTestId('payment-success')).toBeInTheDocument();
    });
  });
});
