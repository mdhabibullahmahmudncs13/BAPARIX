import React, { forwardRef, useState } from 'react';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  locale: 'bn' | 'en';
  supportBengaliCalendar?: boolean;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, helperText, locale, supportBengaliCalendar = true, className = '', id, ...props }, ref) => {
    const [showBengaliDate, setShowBengaliDate] = useState(false);
    
    const inputId = id || `datepicker-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    const fontClass = locale === 'bn' ? 'font-bengali' : 'font-english';
    
    // Convert Gregorian date to Bengali calendar (simplified approximation)
    const toBengaliDate = (gregorianDate: string): string => {
      if (!gregorianDate) return '';
      
      const date = new Date(gregorianDate);
      const bengaliYear = date.getFullYear() - 593; // Bengali calendar is ~593 years ahead
      
      // Bengali month names
      const bengaliMonths = [
        'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
        'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
      ];
      
      // Simplified mapping (actual Bengali calendar is more complex)
      const month = date.getMonth();
      const day = date.getDate();
      
      return `${day} ${bengaliMonths[month]}, ${bengaliYear}`;
    };
    
    const formatDateForDisplay = (value: string): string => {
      if (!value) return '';
      
      if (locale === 'bn' && supportBengaliCalendar && showBengaliDate) {
        return toBengaliDate(value);
      }
      
      // Format for display based on locale
      const date = new Date(value);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      
      const localeMap = {
        bn: 'bn-BD',
        en: 'en-BD',
      };
      
      return date.toLocaleDateString(localeMap[locale], options);
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
          <input
            ref={ref}
            id={inputId}
            type="date"
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
            {...props}
          />
          {locale === 'bn' && supportBengaliCalendar && props.value && (
            <button
              type="button"
              onClick={() => setShowBengaliDate(!showBengaliDate)}
              className={`mt-1 text-xs text-primary-600 hover:text-primary-700 ${fontClass}`}
              aria-label={showBengaliDate ? 'Show Gregorian date' : 'Show Bengali date'}
            >
              {showBengaliDate ? 'ইংরেজি তারিখ দেখান' : 'বাংলা তারিখ দেখান'}
            </button>
          )}
        </div>
        {showBengaliDate && props.value && (
          <p className={`mt-1 text-sm text-gray-600 ${fontClass}`}>
            {formatDateForDisplay(props.value as string)}
          </p>
        )}
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

DatePicker.displayName = 'DatePicker';
