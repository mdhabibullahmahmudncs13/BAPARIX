import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CurrencyInput } from './CurrencyInput';

describe('CurrencyInput', () => {
  it('should render with label', () => {
    render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
      />
    );
    
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
  });
  
  it('should display BDT currency symbol', () => {
    render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
      />
    );
    
    expect(screen.getByText('৳')).toBeInTheDocument();
  });
  
  it('should display USD currency symbol', () => {
    render(
      <CurrencyInput
        label="Amount"
        currency="USD"
        locale="en"
      />
    );
    
    expect(screen.getByText('$')).toBeInTheDocument();
  });
  
  it('should display CNY currency symbol', () => {
    render(
      <CurrencyInput
        label="Amount"
        currency="CNY"
        locale="en"
      />
    );
    
    expect(screen.getByText('¥')).toBeInTheDocument();
  });
  
  it('should format value on blur', () => {
    const handleChange = jest.fn();
    render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText('Amount') as HTMLInputElement;
    
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.blur(input);
    
    expect(handleChange).toHaveBeenCalledWith(1000);
    expect(input.value).toContain('1,000');
  });
  
  it('should allow only numeric input', () => {
    const handleChange = jest.fn();
    render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText('Amount') as HTMLInputElement;
    
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'abc123' } });
    
    expect(input.value).toBe('123');
  });
  
  it('should handle decimal values', () => {
    const handleChange = jest.fn();
    render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText('Amount') as HTMLInputElement;
    
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '1234.56' } });
    
    expect(handleChange).toHaveBeenCalledWith(1234.56);
  });
  
  it('should prevent multiple decimal points', () => {
    render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
      />
    );
    
    const input = screen.getByLabelText('Amount') as HTMLInputElement;
    
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12.34.56' } });
    
    expect(input.value).toBe('12.3456');
  });
  
  it('should display error message', () => {
    render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
        error="Amount is required"
      />
    );
    
    expect(screen.getByRole('alert')).toHaveTextContent('Amount is required');
  });
  
  it('should display helper text', () => {
    render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
        helperText="Enter the amount in BDT"
      />
    );
    
    expect(screen.getByText('Enter the amount in BDT')).toBeInTheDocument();
  });
  
  it('should mark required fields', () => {
    render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
        required
      />
    );
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });
  
  it('should apply Bengali font class for Bengali locale', () => {
    render(
      <CurrencyInput
        label="পরিমাণ"
        currency="BDT"
        locale="bn"
      />
    );
    
    const label = screen.getByText('পরিমাণ');
    expect(label).toHaveClass('font-bengali');
  });
  
  it('should be disabled when disabled prop is true', () => {
    render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
        disabled
      />
    );
    
    const input = screen.getByLabelText('Amount');
    expect(input).toBeDisabled();
  });
  
  it('should have proper ARIA attributes', () => {
    render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
        error="Invalid amount"
      />
    );
    
    const input = screen.getByLabelText('Amount');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });
  
  it('should update display value when value prop changes', () => {
    const { rerender } = render(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
        value={1000}
      />
    );
    
    const input = screen.getByLabelText('Amount') as HTMLInputElement;
    expect(input.value).toContain('1,000');
    
    rerender(
      <CurrencyInput
        label="Amount"
        currency="BDT"
        locale="en"
        value={2000}
      />
    );
    
    expect(input.value).toContain('2,000');
  });
});
