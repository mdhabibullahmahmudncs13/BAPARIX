import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  PaymentHistory,
  PaymentTransaction,
  SubscriptionInfo,
} from './PaymentHistory';

describe('PaymentHistory', () => {
  const mockTransactions: PaymentTransaction[] = [
    {
      id: 'txn-001',
      date: '2024-01-15',
      amount: 999,
      method: 'bkash',
      status: 'completed',
      reference: 'REF-ABC123',
    },
    {
      id: 'txn-002',
      date: '2024-02-15',
      amount: 999,
      method: 'nagad',
      status: 'pending',
      reference: 'REF-DEF456',
    },
    {
      id: 'txn-003',
      date: '2024-03-15',
      amount: 999,
      method: 'sslcommerz',
      status: 'failed',
      reference: 'REF-GHI789',
    },
  ];

  const mockActiveSubscription: SubscriptionInfo = {
    tier: 'pro',
    status: 'active',
    nextBillingDate: '2024-04-15',
    renewalAmount: 999,
  };

  const mockCancelledSubscription: SubscriptionInfo = {
    tier: 'pro',
    status: 'cancelled',
    nextBillingDate: null,
    renewalAmount: null,
  };

  const mockExpiredSubscription: SubscriptionInfo = {
    tier: 'enterprise',
    status: 'expired',
    nextBillingDate: null,
    renewalAmount: null,
  };

  const mockFreeSubscription: SubscriptionInfo = {
    tier: 'free',
    status: 'active',
    nextBillingDate: null,
    renewalAmount: null,
  };

  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnCancel.mockClear();
  });

  describe('Rendering', () => {
    it('should render the payment history component', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      expect(screen.getByTestId('payment-history')).toBeInTheDocument();
    });

    it('should display subscription status badge', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      expect(screen.getByTestId('subscription-status-badge')).toBeInTheDocument();
    });

    it('should display current tier information', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      expect(screen.getByTestId('current-tier')).toBeInTheDocument();
    });

    it('should display next billing date when available', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      expect(screen.getByTestId('next-billing-date')).toBeInTheDocument();
    });

    it('should display renewal amount when available', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      expect(screen.getByTestId('renewal-amount')).toBeInTheDocument();
    });

    it('should not display next billing date when null', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockCancelledSubscription}
        />
      );
      expect(screen.queryByTestId('next-billing-date')).not.toBeInTheDocument();
    });

    it('should not display renewal amount when null', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockCancelledSubscription}
        />
      );
      expect(screen.queryByTestId('renewal-amount')).not.toBeInTheDocument();
    });
  });

  describe('Payment History Table', () => {
    it('should render the transactions table', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      expect(screen.getByTestId('transactions-table')).toBeInTheDocument();
    });

    it('should render all transaction rows', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      expect(screen.getByTestId('transaction-row-txn-001')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-row-txn-002')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-row-txn-003')).toBeInTheDocument();
    });

    it('should render table column headers', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      expect(screen.getByRole('columnheader', { name: 'columns.date' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'columns.amount' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'columns.method' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'columns.status' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'columns.reference' })).toBeInTheDocument();
    });

    it('should display empty state when no transactions', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={[]}
          subscription={mockActiveSubscription}
        />
      );
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.queryByTestId('transactions-table')).not.toBeInTheDocument();
    });
  });

  describe('Subscription Status', () => {
    it('should show cancel button for active paid subscription', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
          onCancelSubscription={mockOnCancel}
        />
      );
      expect(screen.getByTestId('cancel-subscription-button')).toBeInTheDocument();
    });

    it('should not show cancel button for cancelled subscription', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockCancelledSubscription}
          onCancelSubscription={mockOnCancel}
        />
      );
      expect(screen.queryByTestId('cancel-subscription-button')).not.toBeInTheDocument();
    });

    it('should not show cancel button for expired subscription', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockExpiredSubscription}
          onCancelSubscription={mockOnCancel}
        />
      );
      expect(screen.queryByTestId('cancel-subscription-button')).not.toBeInTheDocument();
    });

    it('should not show cancel button for free tier', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockFreeSubscription}
          onCancelSubscription={mockOnCancel}
        />
      );
      expect(screen.queryByTestId('cancel-subscription-button')).not.toBeInTheDocument();
    });
  });

  describe('Cancel Subscription Flow', () => {
    it('should show confirmation dialog when cancel button is clicked', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
          onCancelSubscription={mockOnCancel}
        />
      );
      fireEvent.click(screen.getByTestId('cancel-subscription-button'));
      expect(screen.getByTestId('cancel-confirmation-dialog')).toBeInTheDocument();
    });

    it('should call onCancelSubscription when confirmed', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
          onCancelSubscription={mockOnCancel}
        />
      );
      fireEvent.click(screen.getByTestId('cancel-subscription-button'));
      fireEvent.click(screen.getByTestId('cancel-dialog-confirm'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should dismiss dialog when keep subscription is clicked', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
          onCancelSubscription={mockOnCancel}
        />
      );
      fireEvent.click(screen.getByTestId('cancel-subscription-button'));
      fireEvent.click(screen.getByTestId('cancel-dialog-dismiss'));
      expect(screen.queryByTestId('cancel-confirmation-dialog')).not.toBeInTheDocument();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should close dialog after confirming cancellation', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
          onCancelSubscription={mockOnCancel}
        />
      );
      fireEvent.click(screen.getByTestId('cancel-subscription-button'));
      fireEvent.click(screen.getByTestId('cancel-dialog-confirm'));
      expect(screen.queryByTestId('cancel-confirmation-dialog')).not.toBeInTheDocument();
    });

    it('should have dialog with aria-modal attribute', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
          onCancelSubscription={mockOnCancel}
        />
      );
      fireEvent.click(screen.getByTestId('cancel-subscription-button'));
      const dialog = screen.getByTestId('cancel-confirmation-dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have dialog with role="dialog"', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
          onCancelSubscription={mockOnCancel}
        />
      );
      fireEvent.click(screen.getByTestId('cancel-subscription-button'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={[]}
          subscription={mockActiveSubscription}
          isLoading={true}
        />
      );
      expect(screen.getByTestId('payment-history-loading')).toBeInTheDocument();
    });

    it('should not display main content when loading', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={[]}
          subscription={mockActiveSubscription}
          isLoading={true}
        />
      );
      expect(screen.queryByTestId('payment-history')).not.toBeInTheDocument();
    });

    it('should display main content when not loading', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
          isLoading={false}
        />
      );
      expect(screen.getByTestId('payment-history')).toBeInTheDocument();
      expect(screen.queryByTestId('payment-history-loading')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have section landmarks with aria-labelledby', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      const subscriptionSection = screen.getByTestId('subscription-section');
      expect(subscriptionSection).toHaveAttribute('aria-labelledby', 'subscription-heading');
    });

    it('should have table with aria-label', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      const table = screen.getByTestId('transactions-table');
      expect(table).toHaveAttribute('aria-label');
    });

    it('should have scope attributes on table headers', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should have aria-label on cancel button', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
          onCancelSubscription={mockOnCancel}
        />
      );
      const cancelButton = screen.getByTestId('cancel-subscription-button');
      expect(cancelButton).toHaveAttribute('aria-label');
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale without errors', () => {
      render(
        <PaymentHistory
          locale="bn"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      expect(screen.getByTestId('payment-history')).toBeInTheDocument();
    });

    it('should render with English locale without errors', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      expect(screen.getByTestId('payment-history')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should apply custom className', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
          className="custom-class"
        />
      );
      expect(screen.getByTestId('payment-history')).toHaveClass('custom-class');
    });

    it('should disable cancel button when isCancelling is true', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
          onCancelSubscription={mockOnCancel}
          isCancelling={true}
        />
      );
      expect(screen.getByTestId('cancel-subscription-button')).toBeDisabled();
    });

    it('should not throw when onCancelSubscription is not provided', () => {
      render(
        <PaymentHistory
          locale="en"
          transactions={mockTransactions}
          subscription={mockActiveSubscription}
        />
      );
      const cancelButton = screen.getByTestId('cancel-subscription-button');
      expect(() => {
        fireEvent.click(cancelButton);
        fireEvent.click(screen.getByTestId('cancel-dialog-confirm'));
      }).not.toThrow();
    });
  });
});
