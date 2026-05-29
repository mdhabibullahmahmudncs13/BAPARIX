import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

describe('Select', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
  ];

  it('renders with label', () => {
    render(<Select label="Test Select" options={mockOptions} />);
    expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select label="Test Select" options={mockOptions} />);
    const select = screen.getByLabelText('Test Select') as HTMLSelectElement;
    expect(select.options).toHaveLength(3);
    expect(select.options[0].textContent).toBe('Option 1');
    expect(select.options[1].textContent).toBe('Option 2');
    expect(select.options[2].textContent).toBe('Option 3');
  });

  it('renders placeholder when provided', () => {
    render(
      <Select
        label="Test Select"
        options={mockOptions}
        placeholder="Select an option"
      />
    );
    const select = screen.getByLabelText('Test Select') as HTMLSelectElement;
    expect(select.options[0].textContent).toBe('Select an option');
    expect(select.options[0].disabled).toBe(true);
  });

  it('handles disabled options', () => {
    render(<Select label="Test Select" options={mockOptions} />);
    const select = screen.getByLabelText('Test Select') as HTMLSelectElement;
    expect(select.options[2].disabled).toBe(true);
  });

  it('displays error message', () => {
    render(
      <Select
        label="Test Select"
        options={mockOptions}
        error="This field is required"
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
  });

  it('displays helper text', () => {
    render(
      <Select
        label="Test Select"
        options={mockOptions}
        helperText="Choose one option"
      />
    );
    expect(screen.getByText('Choose one option')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<Select label="Test Select" options={mockOptions} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('handles onChange event', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Select
        label="Test Select"
        options={mockOptions}
        onChange={handleChange}
      />
    );
    
    const select = screen.getByLabelText('Test Select');
    await user.selectOptions(select, 'option2');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies error styling when error is present', () => {
    render(
      <Select
        label="Test Select"
        options={mockOptions}
        error="Error message"
      />
    );
    const select = screen.getByLabelText('Test Select');
    expect(select).toHaveClass('border-error-500');
  });

  it('is keyboard accessible', () => {
    render(<Select label="Test Select" options={mockOptions} />);
    const select = screen.getByLabelText('Test Select');
    select.focus();
    expect(select).toHaveFocus();
  });

  it('has proper ARIA attributes', () => {
    render(
      <Select
        label="Test Select"
        options={mockOptions}
        error="Error message"
      />
    );
    const select = screen.getByLabelText('Test Select');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby');
  });
});
