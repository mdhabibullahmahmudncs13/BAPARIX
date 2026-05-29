'use client';

import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatNumber';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import type { TimeRange } from './TimeRangeSelector';

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface RevenueChartProps {
  data: RevenueDataPoint[];
  timeRange: TimeRange;
  locale: 'bn' | 'en';
  isLoading?: boolean;
  className?: string;
}

// Color-blind friendly green for revenue (distinguishable from other chart colors)
const REVENUE_COLOR = '#16a34a'; // Green-600

function formatDateLabel(date: string, timeRange: TimeRange, locale: 'bn' | 'en'): string {
  try {
    const dateObj = new Date(date);
    const localeStr = locale === 'bn' ? 'bn-BD' : 'en-BD';

    switch (timeRange) {
      case 'daily':
        return dateObj.toLocaleDateString(localeStr, { day: 'numeric', month: 'short' });
      case 'weekly':
        return dateObj.toLocaleDateString(localeStr, { day: 'numeric', month: 'short' });
      case 'monthly':
        return dateObj.toLocaleDateString(localeStr, { month: 'short', year: '2-digit' });
      default:
        return date;
    }
  } catch {
    return date;
  }
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
  locale,
  tooltipLabel,
  dateLabel,
  timeRange,
}: TooltipProps<number, string> & {
  locale: 'bn' | 'en';
  tooltipLabel: string;
  dateLabel: string;
  timeRange: TimeRange;
}) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const formattedDate = formatDateLabel(label as string, timeRange, locale);

    return (
      <div
        className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg"
        data-testid="revenue-tooltip"
      >
        <p className="text-sm text-gray-600 mb-1">
          {dateLabel}: {formattedDate}
        </p>
        <p className="font-semibold text-gray-900">
          {tooltipLabel}: {formatCurrency(data.value as number, 'BDT', locale)}
        </p>
      </div>
    );
  }

  return null;
}

export function RevenueChart({
  data,
  timeRange,
  locale,
  isLoading = false,
  className = '',
}: RevenueChartProps) {
  const t = useTranslations('financialTracker.revenueChart');

  // Loading state
  if (isLoading) {
    return (
      <div className={`w-full ${className}`} data-testid="revenue-chart-loading">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('title')}</h3>
        <div className="w-full h-80 bg-white rounded-lg p-4 border border-gray-200">
          <LoadingSkeleton variant="image" height="100%" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={`w-full ${className}`} data-testid="revenue-chart-empty">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('title')}</h3>
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">{t('noData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} data-testid="revenue-chart">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('title')}</h3>
      <div
        className="w-full h-80 bg-white rounded-lg p-4 border border-gray-200"
        role="img"
        aria-label={t('ariaLabel')}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatDateLabel(value, timeRange, locale)}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `৳${value.toLocaleString()}`}
              label={{
                value: t('yAxisLabel'),
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '11px', fill: '#6b7280' },
              }}
            />
            <Tooltip
              content={
                <CustomTooltip
                  locale={locale}
                  tooltipLabel={t('tooltipLabel')}
                  dateLabel={t('dateLabel')}
                  timeRange={timeRange}
                />
              }
              cursor={{ stroke: '#d1d5db', strokeDasharray: '3 3' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={REVENUE_COLOR}
              strokeWidth={2}
              dot={{ fill: REVENUE_COLOR, r: 4 }}
              activeDot={{ r: 6, fill: REVENUE_COLOR, stroke: '#fff', strokeWidth: 2 }}
              name="revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
