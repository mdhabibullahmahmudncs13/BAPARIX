import React, { forwardRef } from 'react';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
  helperText?: string;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  error?: string;
  helperText?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  error,
  helperText,
  value,
  onChange,
  required,
  disabled,
  className = '',
}) => {
  const groupId = `radio-group-${name}`;

  return (
    <fieldset
      className={`w-full ${className}`}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={
        error ? `${groupId}-error` : helperText ? `${groupId}-helper` : undefined
      }
    >
      {label && (
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
        </legend>
      )}
      <div className="space-y-3">
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          const isDisabled = disabled || option.disabled;
          
          return (
            <div key={option.value} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  id={optionId}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange?.(e.target.value)}
                  disabled={isDisabled}
                  className={`
                    w-4 h-4 border
                    text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${error ? 'border-error-500' : 'border-gray-300'}
                  `}
                  aria-describedby={option.helperText ? `${optionId}-helper` : undefined}
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor={optionId}
                  className={`text-sm font-medium ${
                    isDisabled ? 'text-gray-400' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </label>
                {option.helperText && (
                  <p
                    id={`${optionId}-helper`}
                    className="text-sm text-gray-500"
                  >
                    {option.helperText}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <p
          id={`${groupId}-error`}
          className="mt-2 text-sm text-error-500"
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p
          id={`${groupId}-helper`}
          className="mt-2 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </fieldset>
  );
};

RadioGroup.displayName = 'RadioGroup';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', id, ...props }, ref) => {
    // Generate ID from label only if it's a string
    const radioId = id || (typeof label === 'string' ? `radio-${label.toLowerCase().replace(/\s+/g, '-')}` : `radio-${Math.random().toString(36).substr(2, 9)}`);
    
    return (
      <div className="flex items-center">
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className={`
            w-4 h-4 border border-gray-300
            text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {label && (
          <label
            htmlFor={radioId}
            className="ml-3 text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
