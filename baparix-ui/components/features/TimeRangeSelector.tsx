'use client';

import { useTranslations } from 'next-intl';

export type TimeRange = 'daily' | 'weekly' | 'monthly';

export interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const timeRangeOptions: TimeRange[] = ['daily', 'weekly', 'monthly'];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const t = useTranslations('financialTracker.timeRange');

  return (
    <div
      role="group"
      aria-label={t('label')}
      className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1"
    >
      {timeRangeOptions.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          aria-pressed={value === range}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150
            min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:py-1.5
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            ${
              value === range
                ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }
          `}
        >
          {t(range)}
        </button>
      ))}
    </div>
  );
}
