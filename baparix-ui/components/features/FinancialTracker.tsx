'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TimeRangeSelector, TimeRange } from '@/components/features/TimeRangeSelector';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  TableCellsIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export interface FinancialTrackerProps {
  locale: 'bn' | 'en';
}

export function FinancialTracker({ locale }: FinancialTrackerProps) {
  const t = useTranslations('financialTracker');
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  return (
    <div className="space-y-6">
      {/* Header with title and time range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-green-600" aria-hidden="true" />
              {t('sections.revenueChart')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
              data-testid="revenue-chart-slot"
            >
              <div className="text-center">
                <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                <p className="text-gray-600">{t('placeholders.revenueChart')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('placeholders.comingSoon')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-red-600" aria-hidden="true" />
              {t('sections.expenseChart')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
              data-testid="expense-chart-slot"
            >
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                <p className="text-gray-600">{t('placeholders.expenseChart')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('placeholders.comingSoon')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Table Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableCellsIcon className="w-5 h-5 text-blue-600" aria-hidden="true" />
              {t('sections.profitTable')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
              data-testid="profit-table-slot"
            >
              <div className="text-center">
                <TableCellsIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                <p className="text-gray-600">{t('placeholders.profitTable')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('placeholders.comingSoon')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" aria-hidden="true" />
              {t('sections.alerts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
              data-testid="alerts-slot"
            >
              <div className="text-center">
                <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                <p className="text-gray-600">{t('placeholders.alerts')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('placeholders.comingSoon')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
