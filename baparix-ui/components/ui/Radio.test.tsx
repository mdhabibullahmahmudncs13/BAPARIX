import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Radio, RadioGroup } from './Radio';

describe('Radio', () => {
  it('renders with label', () => {
    render(<Radio label="Option 1" name="test" value="option1" />);
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
  });

  it('handles checked state', () => {
    render(<Radio label="Option 1" name="test" value="option1" checked readOnly />);
    const radio = screen.getByLabelText('Option 1') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('handles onChange event', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Radio label="Option 1" name="test" value="option1" onChange={handleChange} />);
    
    const radio = screen.getByLabelText('Option 1');
    await user.click(radio);
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('is keyboard accessible', () => {
    render(<Radio label="Option 1" name="test" value="option1" />);
    const radio = screen.getByLabelText('Option 1');
    radio.focus();
    expect(radio).toHaveFocus();
  });
});

describe('RadioGroup', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2', helperText: 'This is option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
  ];

  it('renders with label', () => {
    render(
      <RadioGroup
        name="test-group"
        label="Choose an option"
        options={mockOptions}
      />
    );
    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<RadioGroup name="test-group" options={mockOptions} />);
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 3')).toBeInTheDocument();
  });

  it('renders option helper text', () => {
    render(<RadioGroup name="test-group" options={mockOptions} />);
    expect(screen.getByText('This is option 2')).toBeInTheDocument();
  });

  it('handles disabled options', () => {
    render(<RadioGroup name="test-group" options={mockOptions} />);
    const radio = screen.getByLabelText('Option 3');
    expect(radio).toBeDisabled();
  });

  it('handles selected value', () => {
    render(
      <RadioGroup name="test-group" options={mockOptions} value="option2" />
    );
    const radio = screen.getByLabelText('Option 2') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('handles onChange event', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <RadioGroup
        name="test-group"
        options={mockOptions}
        onChange={handleChange}
      />
    );
    
    const radio = screen.getByLabelText('Option 1');
    await user.click(radio);
    
    expect(handleChange).toHaveBeenCalledWith('option1');
  });

  it('displays error message', () => {
    render(
      <RadioGroup
        name="test-group"
        options={mockOptions}
        error="Please select an option"
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Please select an option');
  });

  it('displays helper text', () => {
    render(
      <RadioGroup
        name="test-group"
        options={mockOptions}
        helperText="Select one option"
      />
    );
    expect(screen.getByText('Select one option')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(
      <RadioGroup
        name="test-group"
        label="Choose an option"
        options={mockOptions}
        required
      />
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('handles disabled state for entire group', () => {
    render(
      <RadioGroup name="test-group" options={mockOptions} disabled />
    );
    const radio1 = screen.getByLabelText('Option 1');
    const radio2 = screen.getByLabelText('Option 2');
    expect(radio1).toBeDisabled();
    expect(radio2).toBeDisabled();
  });

  it('uses fieldset for semantic grouping', () => {
    const { container } = render(
      <RadioGroup name="test-group" label="Choose an option" options={mockOptions} />
    );
    expect(container.querySelector('fieldset')).toBeInTheDocument();
    expect(container.querySelector('legend')).toHaveTextContent('Choose an option');
  });

  it('has proper ARIA attributes', () => {
    const { container } = render(
      <RadioGroup
        name="test-group"
        options={mockOptions}
        error="Error message"
      />
    );
    const fieldset = container.querySelector('fieldset');
    expect(fieldset).toHaveAttribute('aria-invalid', 'true');
    expect(fieldset).toHaveAttribute('aria-describedby');
  });

  it('is keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<RadioGroup name="test-group" options={mockOptions} />);
    
    const radio1 = screen.getByLabelText('Option 1');
    radio1.focus();
    expect(radio1).toHaveFocus();
    
    // Arrow keys should navigate between radio buttons
    await user.keyboard('{ArrowDown}');
    const radio2 = screen.getByLabelText('Option 2');
    expect(radio2).toHaveFocus();
  });
});
