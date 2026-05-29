'use client';

import { useTranslations } from 'next-intl';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatNumber';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export interface ImportSalesDataPoint {
  date: string;
  imports: number;
  sales: number;
}

export interface ImportSalesChartProps {
  data: ImportSalesDataPoint[];
  locale: 'bn' | 'en';
  isLoading?: boolean;
  className?: string;
}

// Color-blind friendly palette
const COLORS = {
  imports: '#2563eb', // Blue for imports
  sales: '#16a34a', // Green for sales
};

function formatDateLabel(date: string, locale: 'bn' | 'en'): string {
  try {
    const dateObj = new Date(date);
    const localeStr = locale === 'bn' ? 'bn-BD' : 'en-BD';
    return dateObj.toLocaleDateString(localeStr, { month: 'short', year: '2-digit' });
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
  importsLabel,
  salesLabel,
  dateLabel,
}: TooltipProps<number, string> & {
  locale: 'bn' | 'en';
  importsLabel: string;
  salesLabel: string;
  dateLabel: string;
}) {
  if (active && payload && payload.length) {
    const formattedDate = formatDateLabel(label as string, locale);

    return (
      <div
        className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg"
        data-testid="import-sales-tooltip"
      >
        <p className="text-sm text-gray-600 mb-1">
          {dateLabel}: {formattedDate}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="font-semibold" style={{ color: entry.color }}>
            {entry.dataKey === 'imports' ? importsLabel : salesLabel}:{' '}
            {formatCurrency(entry.value as number, 'BDT', locale)}
          </p>
        ))}
      </div>
    );
  }

  return null;
}

export function ImportSalesChart({
  data,
  locale,
  isLoading = false,
  className = '',
}: ImportSalesChartProps) {
  const t = useTranslations('importSalesChart');

  // Loading state
  if (isLoading) {
    return (
      <div className={`w-full ${className}`} data-testid="import-sales-chart-loading">
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
      <div className={`w-full ${className}`} data-testid="import-sales-chart-empty">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('title')}</h3>
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">{t('noData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} data-testid="import-sales-chart">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('title')}</h3>
      <div
        className="w-full h-80 bg-white rounded-lg p-4 border border-gray-200"
        role="img"
        aria-label={t('ariaLabel')}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatDateLabel(value, locale)}
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
                  importsLabel={t('imports')}
                  salesLabel={t('sales')}
                  dateLabel={t('dateLabel')}
                />
              }
              cursor={{ stroke: '#d1d5db', strokeDasharray: '3 3' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '14px' }}
              formatter={(value) => (value === 'imports' ? t('imports') : t('sales'))}
            />
            <Bar
              dataKey="imports"
              fill={COLORS.imports}
              radius={[4, 4, 0, 0]}
              name="imports"
              barSize={20}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke={COLORS.sales}
              strokeWidth={2}
              dot={{ fill: COLORS.sales, r: 4 }}
              activeDot={{ r: 6, fill: COLORS.sales, stroke: '#fff', strokeWidth: 2 }}
              name="sales"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
