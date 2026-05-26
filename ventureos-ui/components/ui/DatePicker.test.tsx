import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  it('should render with label', () => {
    render(
      <DatePicker
        label="Select Date"
        locale="en"
      />
    );
    
    expect(screen.getByLabelText('Select Date')).toBeInTheDocument();
  });
  
  it('should render date input', () => {
    render(
      <DatePicker
        label="Select Date"
        locale="en"
      />
    );
    
    const input = screen.getByLabelText('Select Date');
    expect(input).toHaveAttribute('type', 'date');
  });
  
  it('should display error message', () => {
    render(
      <DatePicker
        label="Select Date"
        locale="en"
        error="Date is required"
      />
    );
    
    expect(screen.getByRole('alert')).toHaveTextContent('Date is required');
  });
  
  it('should display helper text', () => {
    render(
      <DatePicker
        label="Select Date"
        locale="en"
        helperText="Choose a date from the calendar"
      />
    );
    
    expect(screen.getByText('Choose a date from the calendar')).toBeInTheDocument();
  });
  
  it('should mark required fields', () => {
    render(
      <DatePicker
        label="Select Date"
        locale="en"
        required
      />
    );
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });
  
  it('should apply Bengali font class for Bengali locale', () => {
    render(
      <DatePicker
        label="তারিখ নির্বাচন করুন"
        locale="bn"
      />
    );
    
    const label = screen.getByText('তারিখ নির্বাচন করুন');
    expect(label).toHaveClass('font-bengali');
  });
  
  it('should show Bengali calendar toggle for Bengali locale', () => {
    render(
      <DatePicker
        label="তারিখ নির্বাচন করুন"
        locale="bn"
        value="2024-01-15"
        supportBengaliCalendar={true}
      />
    );
    
    expect(screen.getByText('বাংলা তারিখ দেখান')).toBeInTheDocument();
  });
  
  it('should toggle Bengali calendar display', () => {
    render(
      <DatePicker
        label="তারিখ নির্বাচন করুন"
        locale="bn"
        value="2024-01-15"
        supportBengaliCalendar={true}
      />
    );
    
    const toggleButton = screen.getByText('বাংলা তারিখ দেখান');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('ইংরেজি তারিখ দেখান')).toBeInTheDocument();
  });
  
  it('should not show Bengali calendar toggle for English locale', () => {
    render(
      <DatePicker
        label="Select Date"
        locale="en"
        value="2024-01-15"
        supportBengaliCalendar={true}
      />
    );
    
    expect(screen.queryByText('বাংলা তারিখ দেখান')).not.toBeInTheDocument();
  });
  
  it('should not show Bengali calendar toggle when supportBengaliCalendar is false', () => {
    render(
      <DatePicker
        label="তারিখ নির্বাচন করুন"
        locale="bn"
        value="2024-01-15"
        supportBengaliCalendar={false}
      />
    );
    
    expect(screen.queryByText('বাংলা তারিখ দেখান')).not.toBeInTheDocument();
  });
  
  it('should be disabled when disabled prop is true', () => {
    render(
      <DatePicker
        label="Select Date"
        locale="en"
        disabled
      />
    );
    
    const input = screen.getByLabelText('Select Date');
    expect(input).toBeDisabled();
  });
  
  it('should have proper ARIA attributes', () => {
    render(
      <DatePicker
        label="Select Date"
        locale="en"
        error="Invalid date"
      />
    );
    
    const input = screen.getByLabelText('Select Date');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });
  
  it('should accept value prop', () => {
    render(
      <DatePicker
        label="Select Date"
        locale="en"
        value="2024-01-15"
      />
    );
    
    const input = screen.getByLabelText('Select Date') as HTMLInputElement;
    expect(input.value).toBe('2024-01-15');
  });
  
  it('should call onChange when date is selected', () => {
    const handleChange = jest.fn();
    render(
      <DatePicker
        label="Select Date"
        locale="en"
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText('Select Date');
    fireEvent.change(input, { target: { value: '2024-01-15' } });
    
    expect(handleChange).toHaveBeenCalled();
  });
  
  it('should display Bengali date when toggled', () => {
    render(
      <DatePicker
        label="তারিখ নির্বাচন করুন"
        locale="bn"
        value="2024-01-15"
        supportBengaliCalendar={true}
      />
    );
    
    const toggleButton = screen.getByText('বাংলা তারিখ দেখান');
    fireEvent.click(toggleButton);
    
    // Should display Bengali month name
    expect(screen.getByText(/পৌষ|মাঘ|ফাল্গুন|চৈত্র|বৈশাখ|জ্যৈষ্ঠ|আষাঢ়|শ্রাবণ|ভাদ্র|আশ্বিন|কার্তিক|অগ্রহায়ণ/)).toBeInTheDocument();
  });
});
