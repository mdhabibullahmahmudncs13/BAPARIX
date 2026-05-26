import React, { forwardRef } from 'react';

export interface BilingualInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: { bn: string; en: string };
  placeholder?: { bn: string; en: string };
  error?: string;
  helperText?: string;
  locale: 'bn' | 'en';
}

export const BilingualInput = forwardRef<HTMLInputElement, BilingualInputProps>(
  ({ label, placeholder, error, helperText, locale, className = '', id, type = 'text', ...props }, ref) => {
    const inputId = id || `bilingual-input-${label[locale].toLowerCase().replace(/\s+/g, '-')}`;
    
    // Determine if we should use Bengali font
    const fontClass = locale === 'bn' ? 'font-bengali' : 'font-english';
    
    // Format number inputs according to locale
    const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === 'number' && locale === 'bn') {
        // Allow Bengali numerals input
        const value = e.target.value;
        // Convert Bengali numerals to English for processing
        const englishValue = value.replace(/[০-৯]/g, (d) => 
          String.fromCharCode(d.charCodeAt(0) - '০'.charCodeAt(0) + '0'.charCodeAt(0))
        );
        e.target.value = englishValue;
      }
      props.onChange?.(e);
    };
    
    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-gray-700 mb-1 ${fontClass}`}
        >
          {label[locale]}
          {props.required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder?.[locale]}
          className={`
            w-full px-3 py-2 border rounded-md
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
          onChange={type === 'number' ? handleNumberInput : props.onChange}
          {...props}
        />
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

BilingualInput.displayName = 'BilingualInput';
