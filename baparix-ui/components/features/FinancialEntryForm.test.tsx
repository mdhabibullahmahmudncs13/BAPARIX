import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FinancialEntryForm } from './FinancialEntryForm';

describe('FinancialEntryForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('Rendering', () => {
    it('should render the form title', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render type toggle buttons', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByTestId('type-revenue')).toBeInTheDocument();
      expect(screen.getByTestId('type-expense')).toBeInTheDocument();
    });

    it('should render amount input', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByLabelText(/amount/)).toBeInTheDocument();
    });

    it('should render category dropdown', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    it('should render description input', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByLabelText(/description/)).toBeInTheDocument();
    });

    it('should render date input', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByLabelText(/date/)).toBeInTheDocument();
    });

    it('should render product reference input', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByLabelText(/productId/)).toBeInTheDocument();
    });

    it('should render payment method dropdown', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByLabelText(/paymentMethod/)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByRole('button', { name: /submit/ })).toBeInTheDocument();
    });

    it('should render amount helper text', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByText('amountHelper')).toBeInTheDocument();
    });
  });

  describe('Type Toggle', () => {
    it('should default to revenue type', () => {
      render(<FinancialEntryForm locale="en" />);
      const revenueBtn = screen.getByTestId('type-revenue');
      expect(revenueBtn).toHaveAttribute('aria-checked', 'true');
    });

    it('should switch to expense type when expense button is clicked', () => {
      render(<FinancialEntryForm locale="en" />);
      const expenseBtn = screen.getByTestId('type-expense');
      fireEvent.click(expenseBtn);
      expect(expenseBtn).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('type-revenue')).toHaveAttribute('aria-checked', 'false');
    });

    it('should switch back to revenue type', () => {
      render(<FinancialEntryForm locale="en" />);
      fireEvent.click(screen.getByTestId('type-expense'));
      fireEvent.click(screen.getByTestId('type-revenue'));
      expect(screen.getByTestId('type-revenue')).toHaveAttribute('aria-checked', 'true');
    });

    it('should show revenue categories when revenue is selected', () => {
      render(<FinancialEntryForm locale="en" />);
      const categorySelect = screen.getByLabelText(/category/i);
      const options = categorySelect.querySelectorAll('option');
      // 8 revenue categories + 1 placeholder
      expect(options.length).toBe(9);
    });

    it('should show expense categories when expense is selected', () => {
      render(<FinancialEntryForm locale="en" />);
      fireEvent.click(screen.getByTestId('type-expense'));
      const categorySelect = screen.getByLabelText(/category/i);
      const options = categorySelect.querySelectorAll('option');
      // 11 expense categories + 1 placeholder
      expect(options.length).toBe(12);
    });

    it('should reset category when type changes', () => {
      render(<FinancialEntryForm locale="en" />);
      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
      fireEvent.change(categorySelect, { target: { value: 'product_sales' } });
      fireEvent.click(screen.getByTestId('type-expense'));
      expect(categorySelect.value).toBe('');
    });
  });

  describe('Category Dropdown', () => {
    it('should have a placeholder option', () => {
      render(<FinancialEntryForm locale="en" />);
      const categorySelect = screen.getByLabelText(/category/i);
      const placeholderOption = categorySelect.querySelector('option[disabled]');
      expect(placeholderOption).toBeInTheDocument();
    });
  });

  describe('Payment Method Dropdown', () => {
    it('should have payment method options', () => {
      render(<FinancialEntryForm locale="en" />);
      const paymentSelect = screen.getByLabelText(/paymentMethod/);
      const options = paymentSelect.querySelectorAll('option');
      // 7 payment methods + 1 placeholder
      expect(options.length).toBe(8);
    });
  });

  describe('Form Validation', () => {
    it('should not submit when form is empty', async () => {
      render(<FinancialEntryForm locale="en" onSubmit={mockOnSubmit} />);
      fireEvent.click(screen.getByRole('button', { name: /submit/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit when amount is missing', async () => {
      render(<FinancialEntryForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'product_sales' } });
      fireEvent.change(screen.getByLabelText(/description/), { target: { value: 'Test entry' } });
      fireEvent.change(screen.getByLabelText(/date/), { target: { value: '2024-01-15' } });

      fireEvent.click(screen.getByRole('button', { name: /submit/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit when category is missing', async () => {
      render(<FinancialEntryForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/amount/), { target: { value: '5000' } });
      fireEvent.change(screen.getByLabelText(/description/), { target: { value: 'Test entry' } });
      fireEvent.change(screen.getByLabelText(/date/), { target: { value: '2024-01-15' } });

      fireEvent.click(screen.getByRole('button', { name: /submit/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit when description is missing', async () => {
      render(<FinancialEntryForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/amount/), { target: { value: '5000' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'product_sales' } });
      fireEvent.change(screen.getByLabelText(/date/), { target: { value: '2024-01-15' } });

      fireEvent.click(screen.getByRole('button', { name: /submit/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit when date is missing', async () => {
      render(<FinancialEntryForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/amount/), { target: { value: '5000' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'product_sales' } });
      fireEvent.change(screen.getByLabelText(/description/), { target: { value: 'Test entry' } });
      fireEvent.change(screen.getByLabelText(/date/), { target: { value: '' } });

      fireEvent.click(screen.getByRole('button', { name: /submit/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should submit with valid data', async () => {
      render(<FinancialEntryForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/amount/), { target: { value: '5000' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'product_sales' } });
      fireEvent.change(screen.getByLabelText(/description/), { target: { value: 'Sold phone cases' } });
      fireEvent.change(screen.getByLabelText(/date/), { target: { value: '2024-01-15' } });

      fireEvent.click(screen.getByRole('button', { name: /submit/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'revenue',
            amount: 5000,
            category: 'product_sales',
            description: 'Sold phone cases',
            date: '2024-01-15',
          })
        );
      });
    });

    it('should submit expense entry with valid data', async () => {
      render(<FinancialEntryForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.click(screen.getByTestId('type-expense'));
      fireEvent.change(screen.getByLabelText(/amount/), { target: { value: '2500' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'shipping' } });
      fireEvent.change(screen.getByLabelText(/description/), { target: { value: 'Shipping cost' } });
      fireEvent.change(screen.getByLabelText(/date/), { target: { value: '2024-01-15' } });

      fireEvent.click(screen.getByRole('button', { name: /submit/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'expense',
            amount: 2500,
            category: 'shipping',
            description: 'Shipping cost',
            date: '2024-01-15',
          })
        );
      });
    });
  });

  describe('Loading State', () => {
    it('should disable submit button when loading', () => {
      render(<FinancialEntryForm locale="en" isLoading={true} />);
      const submitButton = screen.getByRole('button', { name: /Loading/ });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when not loading', () => {
      render(<FinancialEntryForm locale="en" isLoading={false} />);
      const submitButton = screen.getByRole('button', { name: /submit/ });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on the form', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByRole('form', { name: /ariaLabel/ })).toBeInTheDocument();
    });

    it('should have radiogroup role for type toggle', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('should have radio role on type buttons', () => {
      render(<FinancialEntryForm locale="en" />);
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(2);
    });

    it('should have noValidate on form for custom validation', () => {
      render(<FinancialEntryForm locale="en" />);
      const form = screen.getByRole('form', { name: /ariaLabel/ });
      expect(form).toHaveAttribute('novalidate');
    });

    it('should have required indicators on mandatory fields', () => {
      render(<FinancialEntryForm locale="en" />);
      const amountInput = screen.getByLabelText(/amount/);
      expect(amountInput).toBeRequired();
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale without errors', () => {
      render(<FinancialEntryForm locale="bn" />);
      expect(screen.getByRole('form', { name: /ariaLabel/ })).toBeInTheDocument();
    });

    it('should render with English locale without errors', () => {
      render(<FinancialEntryForm locale="en" />);
      expect(screen.getByRole('form', { name: /ariaLabel/ })).toBeInTheDocument();
    });
  });

  describe('Form Submission Data', () => {
    it('should convert amount to number on submission', async () => {
      render(<FinancialEntryForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/amount/), { target: { value: '12500.50' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'product_sales' } });
      fireEvent.change(screen.getByLabelText(/description/), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText(/date/), { target: { value: '2024-01-15' } });

      fireEvent.click(screen.getByRole('button', { name: /submit/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 12500.50,
          })
        );
      });
    });

    it('should not throw when onSubmit prop is not provided', async () => {
      render(<FinancialEntryForm locale="en" />);

      fireEvent.change(screen.getByLabelText(/amount/), { target: { value: '5000' } });
      fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'product_sales' } });
      fireEvent.change(screen.getByLabelText(/description/), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText(/date/), { target: { value: '2024-01-15' } });

      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: /submit/ }));
      }).not.toThrow();
    });
  });
});
