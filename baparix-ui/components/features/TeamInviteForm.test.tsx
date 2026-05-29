import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamInviteForm } from './TeamInviteForm';

describe('TeamInviteForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render the form title', () => {
      render(<TeamInviteForm locale="en" />);
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render contact input', () => {
      render(<TeamInviteForm locale="en" />);
      expect(screen.getByLabelText(/contact/)).toBeInTheDocument();
    });

    it('should render role dropdown', () => {
      render(<TeamInviteForm locale="en" />);
      expect(screen.getByLabelText(/role/)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<TeamInviteForm locale="en" />);
      expect(screen.getByRole('button', { name: /send/ })).toBeInTheDocument();
    });

    it('should render contact helper text', () => {
      render(<TeamInviteForm locale="en" />);
      expect(screen.getByText('contactHelper')).toBeInTheDocument();
    });

    it('should render role options for all roles', () => {
      render(<TeamInviteForm locale="en" />);
      const roleSelect = screen.getByLabelText(/role/);
      const options = roleSelect.querySelectorAll('option');
      // 5 roles + 1 placeholder
      expect(options.length).toBe(6);
    });
  });

  describe('Form Validation', () => {
    it('should not submit when form is empty', async () => {
      render(<TeamInviteForm locale="en" onSubmit={mockOnSubmit} />);
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit when contact is missing', async () => {
      render(<TeamInviteForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'manager' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit when role is missing', async () => {
      render(<TeamInviteForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/contact/), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should not submit with invalid email format', async () => {
      render(<TeamInviteForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/contact/), { target: { value: 'invalid-email' } });
      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'analyst' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should submit with valid email', async () => {
      render(<TeamInviteForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/contact/), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'manager' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            contact: 'user@example.com',
            role: 'manager',
          })
        );
      });
    });

    it('should submit with valid phone number', async () => {
      render(<TeamInviteForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/contact/), { target: { value: '+8801712345678' } });
      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'analyst' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            contact: '+8801712345678',
            role: 'analyst',
          })
        );
      });
    });

    it('should submit with local phone number format', async () => {
      render(<TeamInviteForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/contact/), { target: { value: '01712345678' } });
      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'guest' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            contact: '01712345678',
            role: 'guest',
          })
        );
      });
    });
  });

  describe('Success State', () => {
    it('should show success message after successful submission', async () => {
      render(<TeamInviteForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/contact/), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'manager' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        expect(screen.getByTestId('invite-success')).toBeInTheDocument();
      });
    });

    it('should reset form after successful submission', async () => {
      render(<TeamInviteForm locale="en" onSubmit={mockOnSubmit} />);

      const contactInput = screen.getByLabelText(/contact/) as HTMLInputElement;
      fireEvent.change(contactInput, { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'manager' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        expect(contactInput.value).toBe('');
      });
    });
  });

  describe('Error State', () => {
    it('should show error message when submission fails', async () => {
      const failingSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
      render(<TeamInviteForm locale="en" onSubmit={failingSubmit} />);

      fireEvent.change(screen.getByLabelText(/contact/), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'manager' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        expect(screen.getByTestId('invite-error')).toBeInTheDocument();
      });
    });

    it('should display the error message from the thrown error', async () => {
      const failingSubmit = jest.fn().mockRejectedValue(new Error('User already invited'));
      render(<TeamInviteForm locale="en" onSubmit={failingSubmit} />);

      fireEvent.change(screen.getByLabelText(/contact/), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'manager' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        expect(screen.getByText('User already invited')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable submit button when loading', () => {
      render(<TeamInviteForm locale="en" isLoading={true} />);
      const submitButton = screen.getByRole('button', { name: /Loading/ });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when not loading', () => {
      render(<TeamInviteForm locale="en" isLoading={false} />);
      const submitButton = screen.getByRole('button', { name: /send/ });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on the form', () => {
      render(<TeamInviteForm locale="en" />);
      expect(screen.getByRole('form', { name: /ariaLabel/ })).toBeInTheDocument();
    });

    it('should have noValidate on form for custom validation', () => {
      render(<TeamInviteForm locale="en" />);
      const form = screen.getByRole('form', { name: /ariaLabel/ });
      expect(form).toHaveAttribute('novalidate');
    });

    it('should have required indicators on mandatory fields', () => {
      render(<TeamInviteForm locale="en" />);
      const contactInput = screen.getByLabelText(/contact/);
      expect(contactInput).toBeRequired();
    });

    it('should have aria-live on success message', async () => {
      render(<TeamInviteForm locale="en" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/contact/), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'manager' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        const successMsg = screen.getByTestId('invite-success');
        expect(successMsg).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have aria-live on error message', async () => {
      const failingSubmit = jest.fn().mockRejectedValue(new Error('Failed'));
      render(<TeamInviteForm locale="en" onSubmit={failingSubmit} />);

      fireEvent.change(screen.getByLabelText(/contact/), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'manager' } });
      fireEvent.click(screen.getByRole('button', { name: /send/ }));

      await waitFor(() => {
        const errorMsg = screen.getByTestId('invite-error');
        expect(errorMsg).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale without errors', () => {
      render(<TeamInviteForm locale="bn" />);
      expect(screen.getByRole('form', { name: /ariaLabel/ })).toBeInTheDocument();
    });

    it('should render with English locale without errors', () => {
      render(<TeamInviteForm locale="en" />);
      expect(screen.getByRole('form', { name: /ariaLabel/ })).toBeInTheDocument();
    });
  });

  describe('No onSubmit prop', () => {
    it('should not throw when onSubmit prop is not provided', async () => {
      render(<TeamInviteForm locale="en" />);

      fireEvent.change(screen.getByLabelText(/contact/), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText(/role/), { target: { value: 'manager' } });

      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: /send/ }));
      }).not.toThrow();
    });
  });
});
