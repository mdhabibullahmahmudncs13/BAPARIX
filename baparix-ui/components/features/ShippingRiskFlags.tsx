'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProductCategory } from '@/lib/validations/shipping';

export interface RiskFlag {
  type: 'seizure' | 'delay' | 'damage';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ShippingRiskFlagsProps {
  productCategory: ProductCategory;
  riskFlags?: RiskFlag[];
  locale: 'bn' | 'en';
}

/**
 * High-risk product categories that are more likely to be seized at customs.
 * Requirements: 7.6
 */
export const HIGH_RISK_CATEGORIES: Record<string, RiskFlag[]> = {
  electronics: [
    {
      type: 'seizure',
      severity: 'high',
      description: 'Electronics are frequently inspected and may be seized if lacking proper certifications (BTRC, BSTI).',
    },
    {
      type: 'damage',
      severity: 'medium',
      description: 'Sensitive electronic components may be damaged during extended customs holds.',
    },
  ],
  chemicals: [
    {
      type: 'seizure',
      severity: 'high',
      description: 'Chemical products require import permits and BSTI clearance. High seizure risk without proper documentation.',
    },
    {
      type: 'delay',
      severity: 'high',
      description: 'Chemical shipments undergo mandatory lab testing, causing 7-14 day delays.',
    },
  ],
  beauty: [
    {
      type: 'seizure',
      severity: 'medium',
      description: 'Beauty and cosmetic products require BSTI certification and ingredient declarations.',
    },
    {
      type: 'delay',
      severity: 'low',
      description: 'Cosmetics may require additional documentation review at customs.',
    },
  ],
  machinery: [
    {
      type: 'delay',
      severity: 'medium',
      description: 'Heavy machinery requires special import permits and may face inspection delays.',
    },
  ],
  food_beverage: [
    {
      type: 'seizure',
      severity: 'medium',
      description: 'Food items require BFSA (Bangladesh Food Safety Authority) clearance and proper labeling.',
    },
    {
      type: 'damage',
      severity: 'high',
      description: 'Perishable items risk spoilage during extended customs processing.',
    },
  ],
};

function getSeverityBadgeVariant(severity: RiskFlag['severity']): 'error' | 'warning' | 'success' {
  switch (severity) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
  }
}

function getRiskTypeIcon(type: RiskFlag['type']): string {
  switch (type) {
    case 'seizure':
      return '🚫';
    case 'delay':
      return '⏳';
    case 'damage':
      return '⚠️';
  }
}

export function ShippingRiskFlags({
  productCategory,
  riskFlags,
  locale,
}: ShippingRiskFlagsProps) {
  const t = useTranslations('shipping');

  // Use provided riskFlags or derive from product category
  const flags = riskFlags ?? HIGH_RISK_CATEGORIES[productCategory] ?? [];

  if (flags.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span aria-hidden="true">🛃</span>
        {t('riskFlags.title')}
      </h3>

      <div className="space-y-3" role="list" aria-label={t('riskFlags.ariaLabel')}>
        {flags.map((flag, index) => (
          <div
            key={`${flag.type}-${flag.severity}-${index}`}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              flag.severity === 'high'
                ? 'bg-red-50 border-red-200'
                : flag.severity === 'medium'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}
            role="listitem"
          >
            <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">
              {getRiskTypeIcon(flag.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant={getSeverityBadgeVariant(flag.severity)} size="sm">
                  {t(`riskFlags.severity.${flag.severity}`)}
                </Badge>
                <Badge variant="default" size="sm">
                  {t(`riskFlags.types.${flag.type}`)}
                </Badge>
              </div>
              <p className="text-sm text-gray-700">{flag.description}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {t('riskFlags.disclaimer')}
      </p>
    </Card>
  );
}
