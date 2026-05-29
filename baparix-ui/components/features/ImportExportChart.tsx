'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Select } from '@/components/ui/Select';
import { formatNumber } from '@/lib/utils/formatNumber';

interface ImportExportData {
  month: string;
  imports: number;
  exports: number;
}

interface ImportExportChartProps {
  className?: string;
}

// Color-blind friendly palette (blues and oranges)
const COLORS = {
  imports: '#2563eb', // Blue for imports
  exports: '#ea580c', // Orange for exports
};

// Mock data generator - will be replaced with real API data
const generateMockData = (months: number): ImportExportData[] => {
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const data: ImportExportData[] = [];
  
  for (let i = 0; i < months; i++) {
    const monthIndex = (new Date().getMonth() - months + i + 1 + 12) % 12;
    data.push({
      month: monthNames[monthIndex],
      imports: Math.floor(Math.random() * 50000) + 30000,
      exports: Math.floor(Math.random() * 40000) + 20000,
    });
  }
  
  return data;
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, locale }: TooltipProps<number, string> & { locale: string }) => {
  const t = useTranslations('marketIntelligence.importExport');
  
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">
          {t(`months.${label}`)}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value as number, locale)} {t('volume').split(' ')[1]}
          </p>
        ))}
      </div>
    );
  }
  
  return null;
};

export function ImportExportChart({ className = '' }: ImportExportChartProps) {
  const t = useTranslations('marketIntelligence.importExport');
  const [period, setPeriod] = useState<'6months' | '1year'>('6months');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  // Generate data based on selected period
  const data = generateMockData(period === '6months' ? 6 : 12);
  
  // Get current locale from translations
  const locale = 'en'; // This will be dynamically set based on user preference
  
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value as '6months' | '1year');
  };
  
  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChartType(e.target.value as 'line' | 'bar');
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select
            id="period-select"
            label={t('period')}
            value={period}
            onChange={handlePeriodChange}
            options={[
              { value: '6months', label: t('6months') },
              { value: '1year', label: t('1year') },
            ]}
          />
        </div>
        
        <div className="flex-1">
          <Select
            id="chart-type-select"
            label={t('chartType')}
            value={chartType}
            onChange={handleChartTypeChange}
            options={[
              { value: 'line', label: t('lineChart') },
              { value: 'bar', label: t('barChart') },
            ]}
          />
        </div>
      </div>
      
      {/* Chart */}
      <div className="w-full h-80 bg-white rounded-lg p-4 border border-gray-200">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">{t('noData')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => t(`months.${value}`)}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => formatNumber(value, locale)}
                />
                <Tooltip
                  content={<CustomTooltip locale={locale} />}
                  cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '14px' }}
                  formatter={(value) => t(value as 'imports' | 'exports')}
                />
                <Line
                  type="monotone"
                  dataKey="imports"
                  stroke={COLORS.imports}
                  strokeWidth={2}
                  dot={{ fill: COLORS.imports, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="imports"
                />
                <Line
                  type="monotone"
                  dataKey="exports"
                  stroke={COLORS.exports}
                  strokeWidth={2}
                  dot={{ fill: COLORS.exports, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="exports"
                />
              </LineChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => t(`months.${value}`)}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => formatNumber(value, locale)}
                />
                <Tooltip
                  content={<CustomTooltip locale={locale} />}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '14px' }}
                  formatter={(value) => t(value as 'imports' | 'exports')}
                />
                <Bar
                  dataKey="imports"
                  fill={COLORS.imports}
                  radius={[4, 4, 0, 0]}
                  name="imports"
                />
                <Bar
                  dataKey="exports"
                  fill={COLORS.exports}
                  radius={[4, 4, 0, 0]}
                  name="exports"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Legend explanation */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: COLORS.imports }}
            aria-hidden="true"
          />
          <span>{t('imports')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: COLORS.exports }}
            aria-hidden="true"
          />
          <span>{t('exports')}</span>
        </div>
      </div>
    </div>
  );
}
