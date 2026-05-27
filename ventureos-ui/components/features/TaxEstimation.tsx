'use client';

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/formatNumber';
import {
  CalculatorIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export interface TaxEstimationProps {
  totalRevenue: number;
  locale: 'bn' | 'en';
  className?: string;
}

/** Standard VAT rate in Bangladesh (NBR) */
export const VAT_RATE = 0.15;

/**
 * Calculate VAT estimation based on total revenue and standard 15% rate.
 */
export function calculateVAT(totalRevenue: number): {
  taxableAmount: number;
  estimatedVAT: number;
  effectiveRate: number;
} {
  const taxableAmount = totalRevenue;
  const estimatedVAT = taxableAmount * VAT_RATE;
  return {
    taxableAmount,
    estimatedVAT,
    effectiveRate: VAT_RATE,
  };
}

export function TaxEstimation({ totalRevenue, locale, className = '' }: TaxEstimationProps) {
  const t = useTranslations('financialTracker.taxEstimation');

  const { taxableAmount, estimatedVAT, effectiveRate } = calculateVAT(totalRevenue);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalculatorIcon className="w-5 h-5 text-blue-600" aria-hidden="true" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" data-testid="tax-estimation">
          {/* Revenue Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t('totalRevenue')}</p>
              <p className="text-lg font-semibold text-gray-900" data-testid="tax-total-revenue">
                {formatCurrency(totalRevenue, 'BDT', locale)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t('taxableAmount')}</p>
              <p className="text-lg font-semibold text-gray-900" data-testid="tax-taxable-amount">
                {formatCurrency(taxableAmount, 'BDT', locale)}
              </p>
            </div>
          </div>

          {/* VAT Estimation */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">{t('estimatedVAT')}</p>
                <p className="text-2xl font-bold text-blue-700 mt-1" data-testid="tax-estimated-vat">
                  {formatCurrency(estimatedVAT, 'BDT', locale)}
                </p>
              </div>
              <Badge variant="info" size="md">
                {Math.round(effectiveRate * 100)}% {t('rate')}
              </Badge>
            </div>
          </div>

          {/* NBR Filing Reminder */}
          <div
            className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100"
            data-testid="nbr-filing-reminder"
            role="note"
          >
            <InformationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-amber-800">{t('nbrReminder')}</p>
              <p className="text-xs text-amber-700 mt-0.5">{t('nbrReminderDetail')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
