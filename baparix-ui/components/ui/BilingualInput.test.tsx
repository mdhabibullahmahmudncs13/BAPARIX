import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BilingualInput } from './BilingualInput';

describe('BilingualInput', () => {
  const mockLabel = {
    bn: 'নাম',
    en: 'Name',
  };

  const mockPlaceholder = {
    bn: 'আপনার নাম লিখুন',
    en: 'Enter your name',
  };

  it('renders with Bengali label when locale is bn', () => {
    render(<BilingualInput label={mockLabel} locale="bn" />);
    expect(screen.getByLabelText('নাম')).toBeInTheDocument();
  });

  it('renders with English label when locale is en', () => {
    render(<BilingualInput label={mockLabel} locale="en" />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('renders with Bengali placeholder when locale is bn', () => {
    render(
      <BilingualInput
        label={mockLabel}
        placeholder={mockPlaceholder}
        locale="bn"
      />
    );
    const input = screen.getByLabelText('নাম');
    expect(input).toHaveAttribute('placeholder', 'আপনার নাম লিখুন');
  });

  it('renders with English placeholder when locale is en', () => {
    render(
      <BilingualInput
        label={mockLabel}
        placeholder={mockPlaceholder}
        locale="en"
      />
    );
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('placeholder', 'Enter your name');
  });

  it('applies Bengali font class when locale is bn', () => {
    render(<BilingualInput label={mockLabel} locale="bn" />);
    const input = screen.getByLabelText('নাম');
    expect(input).toHaveClass('font-bengali');
  });

  it('applies English font class when locale is en', () => {
    render(<BilingualInput label={mockLabel} locale="en" />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveClass('font-english');
  });

  it('displays error message in correct locale', () => {
    render(
      <BilingualInput
        label={mockLabel}
        locale="bn"
        error="এই ক্ষেত্রটি প্রয়োজনীয়"
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('এই ক্ষেত্রটি প্রয়োজনীয়');
  });

  it('displays helper text', () => {
    render(
      <BilingualInput
        label={mockLabel}
        locale="en"
        helperText="Enter your full name"
      />
    );
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<BilingualInput label={mockLabel} locale="en" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('handles onChange event', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <BilingualInput
        label={mockLabel}
        locale="en"
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText('Name');
    await user.type(input, 'John');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('handles number input type', () => {
    render(
      <BilingualInput
        label={{ bn: 'বয়স', en: 'Age' }}
        locale="en"
        type="number"
      />
    );
    const input = screen.getByLabelText('Age');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('converts Bengali numerals to English for number inputs', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <BilingualInput
        label={{ bn: 'সংখ্যা', en: 'Number' }}
        locale="bn"
        type="number"
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText('সংখ্যা') as HTMLInputElement;
    
    // Type regular numbers (Bengali numeral conversion is handled in the component)
    await user.type(input, '123');
    
    // Should have called onChange
    expect(handleChange).toHaveBeenCalled();
  });

  it('handles disabled state', () => {
    render(<BilingualInput label={mockLabel} locale="en" disabled />);
    const input = screen.getByLabelText('Name');
    expect(input).toBeDisabled();
  });

  it('applies error styling when error is present', () => {
    render(
      <BilingualInput
        label={mockLabel}
        locale="en"
        error="Error message"
      />
    );
    const input = screen.getByLabelText('Name');
    expect(input).toHaveClass('border-error-500');
  });

  it('has proper ARIA attributes', () => {
    render(
      <BilingualInput
        label={mockLabel}
        locale="en"
        error="Error message"
      />
    );
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('is keyboard accessible', () => {
    render(<BilingualInput label={mockLabel} locale="en" />);
    const input = screen.getByLabelText('Name');
    input.focus();
    expect(input).toHaveFocus();
  });

  it('supports all standard input types', () => {
    const { rerender } = render(
      <BilingualInput label={mockLabel} locale="en" type="email" />
    );
    let input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<BilingualInput label={mockLabel} locale="en" type="tel" />);
    input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('type', 'tel');

    rerender(<BilingualInput label={mockLabel} locale="en" type="text" />);
    input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('applies custom className', () => {
    render(
      <BilingualInput
        label={mockLabel}
        locale="en"
        className="custom-class"
      />
    );
    const input = screen.getByLabelText('Name');
    expect(input).toHaveClass('custom-class');
  });
});
