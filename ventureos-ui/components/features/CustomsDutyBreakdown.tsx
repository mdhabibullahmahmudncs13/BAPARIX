'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProductCategory } from '@/lib/validations/shipping';
import {
  calculateLandedCost,
  LandedCostBreakdown,
  NBR_DUTY_RATES,
} from '@/lib/utils/customsDuty';

export interface CustomsDutyBreakdownProps {
  productCost: number;
  shippingCost: number;
  productCategory: ProductCategory;
  agentFeeRate?: number;
  locale: 'bn' | 'en';
}

export function CustomsDutyBreakdown({
  productCost,
  shippingCost,
  productCategory,
  agentFeeRate,
  locale,
}: CustomsDutyBreakdownProps) {
  const t = useTranslations('shipping');

  const breakdown: LandedCostBreakdown = calculateLandedCost({
    productCost,
    shippingCost,
    productCategory,
    agentFeeRate,
  });

  const formatCurrency = (amount: number): string => {
    if (locale === 'bn') {
      return `৳${amount.toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(0)}%`;
  };

  const dutyRateInfo = NBR_DUTY_RATES[productCategory] || NBR_DUTY_RATES.other;

  return (
    <Card className="p-6">
      {/* Customs Duty Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {t('customsDuty.title')}
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">
              {t('customsDuty.category')}
            </span>
            <Badge variant="info" size="sm">
              {t(`categories.${productCategory}`)}
            </Badge>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">
              {t('customsDuty.nbrRate')}
            </span>
            <span className="text-sm font-semibold text-blue-700">
              {formatPercentage(dutyRateInfo.rate)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {t('customsDuty.estimatedDuty')}
            </span>
            <span className="text-base font-bold text-blue-800">
              {formatCurrency(breakdown.customsDuty)}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {t('customsDuty.disclaimer')}
          </p>
        </div>
      </div>

      {/* Total Landed Cost Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {t('landedCost.title')}
        </h3>
        <div className="space-y-3">
          {/* Product Cost */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">
              {t('landedCost.productCost')}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(breakdown.productCost)}
            </span>
          </div>

          {/* Shipping Cost */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">
              {t('landedCost.shippingCost')}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(breakdown.shippingCost)}
            </span>
          </div>

          {/* Customs Duty */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                {t('landedCost.customsDuty')}
              </span>
              <span className="text-xs text-gray-500">
                ({formatPercentage(breakdown.customsDutyRate)})
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(breakdown.customsDuty)}
            </span>
          </div>

          {/* Agent Fees */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                {t('landedCost.agentFees')}
              </span>
              <span className="text-xs text-gray-500">
                ({formatPercentage(breakdown.agentFeeRate)})
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(breakdown.agentFees)}
            </span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-3 bg-gray-50 rounded-lg px-3 mt-2">
            <span className="text-base font-semibold text-gray-900">
              {t('landedCost.total')}
            </span>
            <span className="text-lg font-bold text-primary-700">
              {formatCurrency(breakdown.totalLandedCost)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
