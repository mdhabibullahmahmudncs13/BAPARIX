import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentForm } from './PaymentForm';

describe('PaymentForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('Rendering', () => {
    it('should render the payment form', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      expect(screen.getByTestId('payment-form')).toBeInTheDocument();
    });

    it('should display the selected tier name', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      expect(screen.getByTestId('tier-name')).toBeInTheDocument();
    });

    it('should display the tier price', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      expect(screen.getByTestId('tier-price')).toBeInTheDocument();
    });

    it('should render all four payment method options', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      expect(screen.getByTestId('payment-method-bkash')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-nagad')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-rocket')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-sslcommerz')).toBeInTheDocument();
    });

    it('should render payment method radio buttons', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(4);
    });

    it('should render the total amount section', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      expect(screen.getByTestId('total-section')).toBeInTheDocument();
      expect(screen.getByTestId('total-amount')).toBeInTheDocument();
    });

    it('should render the Pay Now button', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      expect(screen.getByTestId('pay-now-button')).toBeInTheDocument();
    });

    it('should render tier summary section', () => {
      render(<PaymentForm locale="en" tierId="enterprise" />);
      expect(screen.getByTestId('tier-summary')).toBeInTheDocument();
    });

    it('should not show phone input by default', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      expect(screen.queryByTestId('phone-input-section')).not.toBeInTheDocument();
    });
  });

  describe('Payment Method Selection', () => {
    it('should show phone input when bkash is selected', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      const bkashRadio = screen.getByTestId('payment-method-bkash').querySelector('input');
      fireEvent.click(bkashRadio!);
      expect(screen.getByTestId('phone-input-section')).toBeInTheDocument();
    });

    it('should show phone input when nagad is selected', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      const nagadRadio = screen.getByTestId('payment-method-nagad').querySelector('input');
      fireEvent.click(nagadRadio!);
      expect(screen.getByTestId('phone-input-section')).toBeInTheDocument();
    });

    it('should show phone input when rocket is selected', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      const rocketRadio = screen.getByTestId('payment-method-rocket').querySelector('input');
      fireEvent.click(rocketRadio!);
      expect(screen.getByTestId('phone-input-section')).toBeInTheDocument();
    });

    it('should not show phone input when sslcommerz is selected', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      const sslRadio = screen.getByTestId('payment-method-sslcommerz').querySelector('input');
      fireEvent.click(sslRadio!);
      expect(screen.queryByTestId('phone-input-section')).not.toBeInTheDocument();
    });

    it('should hide phone input when switching from mobile to gateway', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      const bkashRadio = screen.getByTestId('payment-method-bkash').querySelector('input');
      const sslRadio = screen.getByTestId('payment-method-sslcommerz').querySelector('input');

      fireEvent.click(bkashRadio!);
      expect(screen.getByTestId('phone-input-section')).toBeInTheDocument();

      fireEvent.click(sslRadio!);
      expect(screen.queryByTestId('phone-input-section')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should not submit when no payment method is selected', async () => {
      render(<PaymentForm locale="en" tierId="pro" onSubmit={mockOnSubmit} />);
      fireEvent.click(screen.getByTestId('pay-now-button'));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit mobile payment without phone number', async () => {
      render(<PaymentForm locale="en" tierId="pro" onSubmit={mockOnSubmit} />);
      const bkashRadio = screen.getByTestId('payment-method-bkash').querySelector('input');
      fireEvent.click(bkashRadio!);
      fireEvent.click(screen.getByTestId('pay-now-button'));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should submit sslcommerz payment without phone number', async () => {
      render(<PaymentForm locale="en" tierId="pro" onSubmit={mockOnSubmit} />);
      const sslRadio = screen.getByTestId('payment-method-sslcommerz').querySelector('input');
      fireEvent.click(sslRadio!);
      fireEvent.click(screen.getByTestId('pay-now-button'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentMethod: 'sslcommerz',
            tierId: 'pro',
          })
        );
      });
    });

    it('should submit bkash payment with valid phone number', async () => {
      render(<PaymentForm locale="en" tierId="pro" onSubmit={mockOnSubmit} />);
      const bkashRadio = screen.getByTestId('payment-method-bkash').querySelector('input');
      fireEvent.click(bkashRadio!);

      const phoneInput = screen.getByTestId('phone-input');
      fireEvent.change(phoneInput, { target: { value: '01712345678' } });

      fireEvent.click(screen.getByTestId('pay-now-button'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentMethod: 'bkash',
            phoneNumber: '01712345678',
            tierId: 'pro',
          })
        );
      });
    });

    it('should submit enterprise tier payment', async () => {
      render(<PaymentForm locale="en" tierId="enterprise" onSubmit={mockOnSubmit} />);
      const sslRadio = screen.getByTestId('payment-method-sslcommerz').querySelector('input');
      fireEvent.click(sslRadio!);
      fireEvent.click(screen.getByTestId('pay-now-button'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentMethod: 'sslcommerz',
            tierId: 'enterprise',
          })
        );
      });
    });
  });

  describe('Loading State', () => {
    it('should disable submit button when loading', () => {
      render(<PaymentForm locale="en" tierId="pro" isLoading={true} />);
      const submitButton = screen.getByTestId('pay-now-button');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when not loading', () => {
      render(<PaymentForm locale="en" tierId="pro" isLoading={false} />);
      const submitButton = screen.getByTestId('pay-now-button');
      expect(submitButton).not.toBeDisabled();
    });

    it('should show loading text when processing', () => {
      render(<PaymentForm locale="en" tierId="pro" isLoading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on the form', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      expect(screen.getByRole('form', { name: /ariaLabel/ })).toBeInTheDocument();
    });

    it('should have radiogroup role for payment methods', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('should have noValidate on form for custom validation', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      const form = screen.getByRole('form', { name: /ariaLabel/ });
      expect(form).toHaveAttribute('novalidate');
    });

    it('should have payment method icons with aria-hidden', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      const icons = screen.getAllByTestId(/payment-icon-/);
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale without errors', () => {
      render(<PaymentForm locale="bn" tierId="pro" />);
      expect(screen.getByTestId('payment-form')).toBeInTheDocument();
    });

    it('should render with English locale without errors', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      expect(screen.getByTestId('payment-form')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should not throw when onSubmit prop is not provided', () => {
      render(<PaymentForm locale="en" tierId="pro" />);
      const sslRadio = screen.getByTestId('payment-method-sslcommerz').querySelector('input');
      fireEvent.click(sslRadio!);

      expect(() => {
        fireEvent.click(screen.getByTestId('pay-now-button'));
      }).not.toThrow();
    });

    it('should apply custom className', () => {
      render(<PaymentForm locale="en" tierId="pro" className="custom-class" />);
      const form = screen.getByTestId('payment-form');
      // The custom class is applied to the Card wrapper (parent of the form)
      expect(form.parentElement).toHaveClass('custom-class');
    });
  });
});
