'use client';

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/formatNumber';
import {
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export interface BreakEvenProgressProps {
  currentRevenue: number;
  breakEvenTarget: number;
  estimatedDaysToBreakEven?: number;
  locale: 'bn' | 'en';
  className?: string;
}

/**
 * Calculate break-even progress percentage (capped at 100%).
 */
export function calculateBreakEvenPercentage(
  currentRevenue: number,
  breakEvenTarget: number
): number {
  if (breakEvenTarget <= 0) return 100;
  const percentage = (currentRevenue / breakEvenTarget) * 100;
  return Math.min(Math.max(percentage, 0), 100);
}

/**
 * Get the color class for the progress bar based on percentage.
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export function BreakEvenProgress({
  currentRevenue,
  breakEvenTarget,
  estimatedDaysToBreakEven,
  locale,
  className = '',
}: BreakEvenProgressProps) {
  const t = useTranslations('financialTracker.breakEvenProgress');

  const percentage = calculateBreakEvenPercentage(currentRevenue, breakEvenTarget);
  const progressColor = getProgressColor(percentage);
  const isComplete = percentage >= 100;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" data-testid="break-even-progress">
          {/* Revenue vs Target */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t('currentRevenue')}</p>
              <p className="text-lg font-semibold text-gray-900" data-testid="break-even-current">
                {formatCurrency(currentRevenue, 'BDT', locale)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t('breakEvenTarget')}</p>
              <p className="text-lg font-semibold text-gray-900" data-testid="break-even-target">
                {formatCurrency(breakEvenTarget, 'BDT', locale)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t('progress')}</span>
              <span
                className="text-sm font-bold text-gray-900"
                data-testid="break-even-percentage"
              >
                {Math.round(percentage)}%
              </span>
            </div>
            <div
              className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(percentage)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('progressLabel')}
              data-testid="break-even-bar"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Status / Estimated Time */}
          <div className="flex items-center gap-2 text-sm" data-testid="break-even-status">
            {isComplete ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg w-full">
                <ChartBarIcon className="w-4 h-4" aria-hidden="true" />
                <span className="font-medium">{t('achieved')}</span>
              </div>
            ) : (
              estimatedDaysToBreakEven !== undefined && (
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg w-full">
                  <ClockIcon className="w-4 h-4" aria-hidden="true" />
                  <span>{t('estimatedTime', { days: estimatedDaysToBreakEven })}</span>
                </div>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
