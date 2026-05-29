import React, { forwardRef, useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  currency: 'BDT' | 'USD' | 'CNY';
  locale: 'bn' | 'en';
  value?: number;
  onChange?: (value: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, helperText, currency, locale, value, onChange, className = '', id, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    
    const inputId = id || `currency-input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    const fontClass = locale === 'bn' ? 'font-bengali' : 'font-english';
    
    // Currency symbols
    const currencySymbols = {
      BDT: '৳',
      USD: '$',
      CNY: '¥',
    };
    
    // Update display value when value prop changes
    useEffect(() => {
      if (value !== undefined && !isFocused) {
        const formatted = formatCurrency(value, currency, locale);
        setDisplayValue(formatted);
      }
    }, [value, currency, locale, isFocused]);
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show raw number when focused
      if (value !== undefined) {
        setDisplayValue(value.toString());
      }
      props.onFocus?.(e);
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Format when blurred
      const numericValue = parseFloat(displayValue) || 0;
      const formatted = formatCurrency(numericValue, currency, locale);
      setDisplayValue(formatted);
      onChange?.(numericValue);
      props.onBlur?.(e);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow only numbers and decimal point
      const cleaned = inputValue.replace(/[^\d.]/g, '');
      
      // Prevent multiple decimal points
      const parts = cleaned.split('.');
      const sanitized = parts.length > 2 
        ? `${parts[0]}.${parts.slice(1).join('')}` 
        : cleaned;
      
      setDisplayValue(sanitized);
      
      // Call onChange with numeric value
      const numericValue = parseFloat(sanitized) || 0;
      onChange?.(numericValue);
    };
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium text-gray-700 mb-1 ${fontClass}`}
          >
            {label}
            {props.required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        <div className="relative">
          <span 
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 ${fontClass}`}
            aria-hidden="true"
          >
            {currencySymbols[currency]}
          </span>
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              w-full pl-8 pr-3 py-2 border rounded-md
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error ? 'border-error-500' : 'border-gray-300'}
              ${fontClass}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className={`mt-1 text-sm text-error-500 ${fontClass}`}
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className={`mt-1 text-sm text-gray-500 ${fontClass}`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
