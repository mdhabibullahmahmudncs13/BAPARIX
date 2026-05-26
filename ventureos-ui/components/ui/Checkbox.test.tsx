import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders with label', () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<Checkbox aria-label="Checkbox without label" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('handles checked state', () => {
    render(<Checkbox label="Test Checkbox" checked readOnly />);
    const checkbox = screen.getByLabelText('Test Checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('handles onChange event', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Checkbox label="Test Checkbox" onChange={handleChange} />);
    
    const checkbox = screen.getByLabelText('Test Checkbox');
    await user.click(checkbox);
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<Checkbox label="Test Checkbox" error="This field is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
  });

  it('displays helper text', () => {
    render(
      <Checkbox label="Test Checkbox" helperText="Check this box to continue" />
    );
    expect(screen.getByText('Check this box to continue')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<Checkbox label="Test Checkbox" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Checkbox label="Test Checkbox" disabled />);
    const checkbox = screen.getByLabelText('Test Checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('applies error styling when error is present', () => {
    render(<Checkbox label="Test Checkbox" error="Error message" />);
    const checkbox = screen.getByLabelText('Test Checkbox');
    expect(checkbox).toHaveClass('border-error-500');
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Checkbox label="Test Checkbox" onChange={handleChange} />);
    
    const checkbox = screen.getByLabelText('Test Checkbox');
    checkbox.focus();
    expect(checkbox).toHaveFocus();
    
    await user.keyboard(' ');
    expect(handleChange).toHaveBeenCalled();
  });

  it('has proper ARIA attributes', () => {
    render(<Checkbox label="Test Checkbox" error="Error message" />);
    const checkbox = screen.getByLabelText('Test Checkbox');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAttribute('aria-describedby');
  });

  it('meets minimum touch target size', () => {
    render(<Checkbox label="Test Checkbox" />);
    const checkbox = screen.getByLabelText('Test Checkbox');
    // Checkbox should be at least 16px (w-4 h-4 = 1rem = 16px)
    expect(checkbox).toHaveClass('w-4', 'h-4');
  });
});
