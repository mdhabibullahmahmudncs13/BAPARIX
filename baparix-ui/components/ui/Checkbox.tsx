import React, { forwardRef } from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    
    return (
      <div className="w-full">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className={`
                w-4 h-4 border rounded
                text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? 'border-error-500' : 'border-gray-300'}
                ${className}
              `}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={
                error ? `${checkboxId}-error` : helperText ? `${checkboxId}-helper` : undefined
              }
              {...props}
            />
          </div>
          {label && (
            <div className="ml-3">
              <label
                htmlFor={checkboxId}
                className="text-sm font-medium text-gray-700"
              >
                {label}
                {props.required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
              </label>
              {helperText && !error && (
                <p
                  id={`${checkboxId}-helper`}
                  className="text-sm text-gray-500"
                >
                  {helperText}
                </p>
              )}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${checkboxId}-error`}
            className="mt-1 text-sm text-error-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
