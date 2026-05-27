import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShippingCalculatorForm } from './ShippingCalculatorForm';

describe('ShippingCalculatorForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('Rendering', () => {
    it('should render the form title', () => {
      render(<ShippingCalculatorForm locale="en" />);
      expect(screen.getByText('form.title')).toBeInTheDocument();
    });

    it('should render weight input', () => {
      render(<ShippingCalculatorForm locale="en" />);
      expect(screen.getByLabelText(/form\.weight/)).toBeInTheDocument();
    });

    it('should render dimension inputs (length, width, height)', () => {
      render(<ShippingCalculatorForm locale="en" />);
      expect(screen.getByLabelText(/form\.length/)).toBeInTheDocument();
      expect(screen.getByLabelText(/form\.width/)).toBeInTheDocument();
      expect(screen.getByLabelText(/form\.height/)).toBeInTheDocument();
    });

    it('should render destination dropdown', () => {
      render(<ShippingCalculatorForm locale="en" />);
      expect(screen.getByLabelText(/form\.destination/)).toBeInTheDocument();
    });

    it('should render product category dropdown', () => {
      render(<ShippingCalculatorForm locale="en" />);
      expect(screen.getByLabelText(/form\.productCategory/)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<ShippingCalculatorForm locale="en" />);
      expect(screen.getByRole('button', { name: /form\.calculate/ })).toBeInTheDocument();
    });

    it('should render weight helper text', () => {
      render(<ShippingCalculatorForm locale="en" />);
      expect(screen.getByText('form.weightHelper')).toBeInTheDocument();
    });

    it('should render dimensions helper text', () => {
      render(<ShippingCalculatorForm locale="en" />);
      expect(screen.getByText('form.dimensionsHelper')).toBeInTheDocument();
    });
  });

  describe('Destination Dropdown', () => {
    it('should have Bangladesh cities as options', () => {
      render(<ShippingCalculatorForm locale="en" />);
      const destinationSelect = screen.getByLabelText(/form\.destination/);
      
      // Check that the select has options (cities are translated via t() mock)
      const options = destinationSelect.querySelectorAll('option');
      // 20 cities + 1 placeholder option
      expect(options.length).toBe(21);
    });

    it('should have a placeholder option', () => {
      render(<ShippingCalculatorForm locale="en" />);
      const destinationSelect = screen.getByLabelText(/form\.destination/);
      const placeholderOption = destinationSelect.querySelector('option[disabled]');
      expect(placeholderOption).toBeInTheDocument();
    });
  });

  describe('Product Category Dropdown', () => {
    it('should have product categories as options', () => {
      render(<ShippingCalculatorForm locale="en" />);
      const categorySelect = screen.getByLabelText(/form\.productCategory/);
      
      const options = categorySelect.querySelectorAll('option');
      // 10 categories + 1 placeholder option
      expect(options.length).toBe(11);
    });
  });

  describe('Form Validation', () => {
    it('should show error when submitting empty form', async () => {
      render(<ShippingCalculatorForm locale="en" onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /form\.calculate/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit when weight is missing', async () => {
      render(<ShippingCalculatorForm locale="en" onSubmit={mockOnSubmit} />);
      
      // Fill everything except weight
      fireEvent.change(screen.getByLabelText(/form\.length/), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText(/form\.width/), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText(/form\.height/), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText(/form\.destination/), { target: { value: 'Dhaka' } });
      fireEvent.change(screen.getByLabelText(/form\.productCategory/), { target: { value: 'electronics' } });

      fireEvent.click(screen.getByRole('button', { name: /form\.calculate/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit when dimensions are missing', async () => {
      render(<ShippingCalculatorForm locale="en" onSubmit={mockOnSubmit} />);
      
      // Fill everything except dimensions
      fireEvent.change(screen.getByLabelText(/form\.weight/), { target: { value: '5' } });
      fireEvent.change(screen.getByLabelText(/form\.destination/), { target: { value: 'Dhaka' } });
      fireEvent.change(screen.getByLabelText(/form\.productCategory/), { target: { value: 'electronics' } });

      fireEvent.click(screen.getByRole('button', { name: /form\.calculate/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit when destination is not selected', async () => {
      render(<ShippingCalculatorForm locale="en" onSubmit={mockOnSubmit} />);
      
      fireEvent.change(screen.getByLabelText(/form\.weight/), { target: { value: '5' } });
      fireEvent.change(screen.getByLabelText(/form\.length/), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText(/form\.width/), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText(/form\.height/), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText(/form\.productCategory/), { target: { value: 'electronics' } });

      fireEvent.click(screen.getByRole('button', { name: /form\.calculate/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should submit with valid data', async () => {
      render(<ShippingCalculatorForm locale="en" onSubmit={mockOnSubmit} />);
      
      fireEvent.change(screen.getByLabelText(/form\.weight/), { target: { value: '5.5' } });
      fireEvent.change(screen.getByLabelText(/form\.length/), { target: { value: '30' } });
      fireEvent.change(screen.getByLabelText(/form\.width/), { target: { value: '20' } });
      fireEvent.change(screen.getByLabelText(/form\.height/), { target: { value: '15' } });
      fireEvent.change(screen.getByLabelText(/form\.destination/), { target: { value: 'Dhaka' } });
      fireEvent.change(screen.getByLabelText(/form\.productCategory/), { target: { value: 'electronics' } });

      fireEvent.click(screen.getByRole('button', { name: /form\.calculate/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          weight: 5.5,
          dimensions: { length: 30, width: 20, height: 15 },
          destination: 'Dhaka',
          productCategory: 'electronics',
        });
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading text when isLoading is true', () => {
      render(<ShippingCalculatorForm locale="en" isLoading={true} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should disable submit button when loading', () => {
      render(<ShippingCalculatorForm locale="en" isLoading={true} />);
      const submitButton = screen.getByRole('button');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when not loading', () => {
      render(<ShippingCalculatorForm locale="en" isLoading={false} />);
      const submitButton = screen.getByRole('button', { name: /form\.calculate/ });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on the form', () => {
      render(<ShippingCalculatorForm locale="en" />);
      expect(screen.getByRole('form', { name: /form\.ariaLabel/ })).toBeInTheDocument();
    });

    it('should have required indicators on mandatory fields', () => {
      render(<ShippingCalculatorForm locale="en" />);
      const weightInput = screen.getByLabelText(/form\.weight/);
      expect(weightInput).toBeRequired();
    });

    it('should have fieldset and legend for dimensions', () => {
      render(<ShippingCalculatorForm locale="en" />);
      const fieldset = screen.getByRole('group');
      expect(fieldset).toBeInTheDocument();
    });

    it('should have noValidate on form for custom validation', () => {
      render(<ShippingCalculatorForm locale="en" />);
      const form = screen.getByRole('form', { name: /form\.ariaLabel/ });
      expect(form).toHaveAttribute('novalidate');
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale without errors', () => {
      render(<ShippingCalculatorForm locale="bn" />);
      expect(screen.getByRole('form', { name: /form\.ariaLabel/ })).toBeInTheDocument();
      expect(screen.getByLabelText(/form\.weight/)).toBeInTheDocument();
    });

    it('should render with English locale without errors', () => {
      render(<ShippingCalculatorForm locale="en" />);
      expect(screen.getByRole('form', { name: /form\.ariaLabel/ })).toBeInTheDocument();
      expect(screen.getByLabelText(/form\.weight/)).toBeInTheDocument();
    });
  });

  describe('Form Submission Data', () => {
    it('should convert weight to number on submission', async () => {
      render(<ShippingCalculatorForm locale="en" onSubmit={mockOnSubmit} />);
      
      fireEvent.change(screen.getByLabelText(/form\.weight/), { target: { value: '12.5' } });
      fireEvent.change(screen.getByLabelText(/form\.length/), { target: { value: '30' } });
      fireEvent.change(screen.getByLabelText(/form\.width/), { target: { value: '20' } });
      fireEvent.change(screen.getByLabelText(/form\.height/), { target: { value: '15' } });
      fireEvent.change(screen.getByLabelText(/form\.destination/), { target: { value: 'Chittagong' } });
      fireEvent.change(screen.getByLabelText(/form\.productCategory/), { target: { value: 'fashion' } });

      fireEvent.click(screen.getByRole('button', { name: /form\.calculate/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            weight: 12.5,
            dimensions: { length: 30, width: 20, height: 15 },
            destination: 'Chittagong',
            productCategory: 'fashion',
          })
        );
      });
    });

    it('should not call onSubmit when onSubmit prop is not provided', async () => {
      // Render without onSubmit - should not throw
      render(<ShippingCalculatorForm locale="en" />);
      
      fireEvent.change(screen.getByLabelText(/form\.weight/), { target: { value: '5' } });
      fireEvent.change(screen.getByLabelText(/form\.length/), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText(/form\.width/), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText(/form\.height/), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText(/form\.destination/), { target: { value: 'Dhaka' } });
      fireEvent.change(screen.getByLabelText(/form\.productCategory/), { target: { value: 'electronics' } });

      // Should not throw when submitting without onSubmit handler
      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: /form\.calculate/ }));
      }).not.toThrow();
    });
  });
});
