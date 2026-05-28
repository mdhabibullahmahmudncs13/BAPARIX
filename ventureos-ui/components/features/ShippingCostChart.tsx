'use client';

import { useTranslations } from 'next-intl';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatNumber';
import type { ShippingResult } from './ShippingCostResults';

export interface ShippingCostChartProps {
  results: ShippingResult[];
  locale: 'bn' | 'en';
  className?: string;
}

// Color-blind friendly palette (distinguishable by both color and pattern perception)
// Uses blue, orange, teal, purple, gold, and red-brown — safe for deuteranopia, protanopia, and tritanopia
const COLOR_BLIND_PALETTE = [
  '#2563eb', // Blue
  '#ea580c', // Orange
  '#0d9488', // Teal
  '#7c3aed', // Purple
  '#ca8a04', // Gold
  '#dc2626', // Red
];

interface ChartDataPoint {
  agency: string;
  totalLandedCost: number;
}

function prepareChartData(results: ShippingResult[]): ChartDataPoint[] {
  return results.map((result) => ({
    agency: result.agency,
    totalLandedCost: result.totalLandedCost,
  }));
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  locale,
  tooltipLabel,
}: TooltipProps<number, string> & { locale: 'bn' | 'en'; tooltipLabel: string }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-1">{data.payload.agency}</p>
        <p className="text-sm text-gray-700">
          {tooltipLabel}: {formatCurrency(data.value as number, 'BDT', locale)}
        </p>
      </div>
    );
  }

  return null;
}

export function ShippingCostChart({
  results,
  locale,
  className = '',
}: ShippingCostChartProps) {
  const t = useTranslations('shipping.costChart');

  const chartData = prepareChartData(results);

  if (chartData.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('title')}</h3>
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">{t('noData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('title')}</h3>
      <div
        className="w-full h-80 bg-white rounded-lg p-4 border border-gray-200"
        role="img"
        aria-label={t('ariaLabel')}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="agency"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              angle={-20}
              textAnchor="end"
              height={60}
              interval={0}
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
              content={<CustomTooltip locale={locale} tooltipLabel={t('tooltipLabel')} />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar dataKey="totalLandedCost" radius={[4, 4, 0, 0]} name="totalLandedCost">
              {chartData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLOR_BLIND_PALETTE[index % COLOR_BLIND_PALETTE.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
