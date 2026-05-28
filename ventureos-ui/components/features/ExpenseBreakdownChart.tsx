'use client';

import { useTranslations } from 'next-intl';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatNumber';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import type { ExpenseCategory } from '@/lib/validations/financialEntry';

export interface ExpenseDataPoint {
  category: ExpenseCategory;
  amount: number;
}

export interface ExpenseBreakdownChartProps {
  data: ExpenseDataPoint[];
  locale: 'bn' | 'en';
  isLoading?: boolean;
  className?: string;
}

// Color-blind friendly palette (distinguishable by both color and pattern perception)
// Uses blue, orange, teal, purple, gold, red, indigo, emerald, rose, amber, cyan
// Safe for deuteranopia, protanopia, and tritanopia
const COLOR_BLIND_PALETTE = [
  '#2563eb', // Blue
  '#ea580c', // Orange
  '#0d9488', // Teal
  '#7c3aed', // Purple
  '#ca8a04', // Gold
  '#dc2626', // Red
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#e11d48', // Rose
  '#d97706', // Amber
  '#0891b2', // Cyan
];

interface ChartDataPoint {
  category: string;
  categoryKey: ExpenseCategory;
  amount: number;
  percentage: number;
}

function prepareChartData(
  data: ExpenseDataPoint[],
  getCategoryLabel: (key: string) => string
): ChartDataPoint[] {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  if (total === 0) return [];

  return data
    .filter((item) => item.amount > 0)
    .map((item) => ({
      category: getCategoryLabel(item.category),
      categoryKey: item.category,
      amount: item.amount,
      percentage: (item.amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  locale,
  categoryLabel,
  amountLabel,
  percentageLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  locale: 'bn' | 'en';
  categoryLabel: string;
  amountLabel: string;
  percentageLabel: string;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg"
        data-testid="expense-tooltip"
      >
        <p className="font-semibold text-gray-900 mb-1">
          {categoryLabel}: {data.category}
        </p>
        <p className="text-sm text-gray-700">
          {amountLabel}: {formatCurrency(data.amount, 'BDT', locale)}
        </p>
        <p className="text-sm text-gray-700">
          {percentageLabel}: {data.percentage.toFixed(1)}%
        </p>
      </div>
    );
  }

  return null;
}

// Custom legend component
function CustomLegend({
  payload,
  locale,
}: {
  payload?: Array<{ value: string; color: string; payload: ChartDataPoint }>;
  locale: 'bn' | 'en';
}) {
  if (!payload || payload.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4" data-testid="expense-legend">
      {payload.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center gap-1.5 text-sm">
          <span
            className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-gray-700">
            {entry.value}: {formatCurrency(entry.payload.amount, 'BDT', locale)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ExpenseBreakdownChart({
  data,
  locale,
  isLoading = false,
  className = '',
}: ExpenseBreakdownChartProps) {
  const t = useTranslations('financialTracker.expenseBreakdown');
  const tCategories = useTranslations('financialTracker.entryForm.categories');

  const getCategoryLabel = (key: string): string => {
    try {
      return tCategories(key);
    } catch {
      return key;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`w-full ${className}`} data-testid="expense-chart-loading">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('title')}</h3>
        <div className="w-full h-80 bg-white rounded-lg p-4 border border-gray-200">
          <LoadingSkeleton variant="image" height="100%" />
        </div>
      </div>
    );
  }

  const chartData = prepareChartData(data, getCategoryLabel);

  // Empty state
  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className={`w-full ${className}`} data-testid="expense-chart-empty">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('title')}</h3>
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">{t('noData')}</p>
        </div>
      </div>
    );
  }

  const totalExpenses = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className={`w-full ${className}`} data-testid="expense-chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('title')}</h3>
        <div className="text-sm text-gray-600" data-testid="expense-total">
          {t('total')}: {formatCurrency(totalExpenses, 'BDT', locale)}
        </div>
      </div>
      <div
        className="w-full h-80 bg-white rounded-lg p-4 border border-gray-200"
        role="img"
        aria-label={t('ariaLabel')}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              outerRadius={100}
              dataKey="amount"
              nameKey="category"
              label={({ percentage }: any) => `${percentage.toFixed(0)}%`}
            >
              {chartData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLOR_BLIND_PALETTE[index % COLOR_BLIND_PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  active={props.active}
                  payload={props.payload as any}
                  locale={locale}
                  categoryLabel={t('tooltipCategory')}
                  amountLabel={t('tooltipAmount')}
                  percentageLabel={t('tooltipPercentage')}
                />
              )}
            />
            <Legend
              content={<CustomLegend locale={locale} />}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
