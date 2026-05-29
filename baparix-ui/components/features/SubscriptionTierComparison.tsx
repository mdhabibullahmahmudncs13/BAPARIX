'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/solid';

export interface SubscriptionTier {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  price: number;
  billingPeriod: string;
  isPopular?: boolean;
  features: TierFeature[];
}

export interface TierFeature {
  name: string;
  value: string;
  included: boolean;
}

export interface SubscriptionTierComparisonProps {
  locale: 'bn' | 'en';
  onSelectPlan?: (tierId: string) => void;
  className?: string;
}

/**
 * Get the default subscription tiers with feature comparison data.
 */
export function getDefaultTiers(t: (key: string) => string): SubscriptionTier[] {
  return [
    {
      id: 'free',
      name: t('tiers.free.name'),
      price: 0,
      billingPeriod: t('tiers.free.billingPeriod'),
      isPopular: false,
      features: [
        { name: t('features.blueprints'), value: t('tiers.free.blueprints'), included: true },
        { name: t('features.productSearches'), value: t('tiers.free.productSearches'), included: true },
        { name: t('features.teamMembers'), value: t('tiers.free.teamMembers'), included: true },
        { name: t('features.exportFormats'), value: t('tiers.free.exportFormats'), included: true },
        { name: t('features.marketIntelligence'), value: t('tiers.free.marketIntelligence'), included: true },
        { name: t('features.prioritySupport'), value: t('tiers.free.prioritySupport'), included: false },
      ],
    },
    {
      id: 'pro',
      name: t('tiers.pro.name'),
      price: 999,
      billingPeriod: t('tiers.pro.billingPeriod'),
      isPopular: true,
      features: [
        { name: t('features.blueprints'), value: t('tiers.pro.blueprints'), included: true },
        { name: t('features.productSearches'), value: t('tiers.pro.productSearches'), included: true },
        { name: t('features.teamMembers'), value: t('tiers.pro.teamMembers'), included: true },
        { name: t('features.exportFormats'), value: t('tiers.pro.exportFormats'), included: true },
        { name: t('features.marketIntelligence'), value: t('tiers.pro.marketIntelligence'), included: true },
        { name: t('features.prioritySupport'), value: t('tiers.pro.prioritySupport'), included: true },
      ],
    },
    {
      id: 'enterprise',
      name: t('tiers.enterprise.name'),
      price: 3499,
      billingPeriod: t('tiers.enterprise.billingPeriod'),
      isPopular: false,
      features: [
        { name: t('features.blueprints'), value: t('tiers.enterprise.blueprints'), included: true },
        { name: t('features.productSearches'), value: t('tiers.enterprise.productSearches'), included: true },
        { name: t('features.teamMembers'), value: t('tiers.enterprise.teamMembers'), included: true },
        { name: t('features.exportFormats'), value: t('tiers.enterprise.exportFormats'), included: true },
        { name: t('features.marketIntelligence'), value: t('tiers.enterprise.marketIntelligence'), included: true },
        { name: t('features.prioritySupport'), value: t('tiers.enterprise.prioritySupport'), included: true },
      ],
    },
  ];
}

/**
 * Format price for display with BDT currency symbol.
 */
export function formatTierPrice(price: number, locale: 'bn' | 'en'): string {
  if (price === 0) return locale === 'bn' ? '৳০' : '৳0';
  return `৳${price.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-BD')}`;
}

export function SubscriptionTierComparison({
  locale,
  onSelectPlan,
  className = '',
}: SubscriptionTierComparisonProps) {
  const t = useTranslations('subscription.tierComparison');
  const tiers = getDefaultTiers(t);

  return (
    <section
      className={`w-full ${className}`}
      aria-labelledby="subscription-comparison-title"
      data-testid="subscription-tier-comparison"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2
          id="subscription-comparison-title"
          className="text-2xl font-bold text-gray-900 md:text-3xl"
        >
          {t('title')}
        </h2>
        <p className="mt-2 text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Tier Cards */}
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8"
        data-testid="tier-cards-grid"
      >
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className={`relative flex flex-col ${
              tier.isPopular
                ? 'border-2 border-blue-500 ring-2 ring-blue-100'
                : ''
            }`}
            padding="lg"
            as="article"
          >
            {/* Popular Badge */}
            {tier.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="primary" size="sm" icon={<StarIcon className="w-3 h-3" />}>
                  {t('popularBadge')}
                </Badge>
              </div>
            )}

            {/* Tier Header */}
            <div className="text-center mb-6" data-testid={`tier-header-${tier.id}`}>
              <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
              <div className="mt-3">
                <span
                  className="text-3xl font-bold text-gray-900"
                  aria-label={`${formatTierPrice(tier.price, locale)} ${tier.billingPeriod}`}
                >
                  {formatTierPrice(tier.price, locale)}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  /{tier.billingPeriod}
                </span>
              </div>
            </div>

            {/* Feature List */}
            <ul
              className="flex-1 space-y-3 mb-6"
              aria-label={t('featuresListLabel', { tier: tier.name })}
              data-testid={`tier-features-${tier.id}`}
            >
              {tier.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2"
                >
                  {feature.included ? (
                    <CheckIcon
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <XMarkIcon
                      className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">{feature.name}:</span>{' '}
                    <span className={!feature.included ? 'text-gray-500' : ''}>
                      {feature.value}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Select Plan Button */}
            <Button
              variant={tier.isPopular ? 'primary' : 'secondary'}
              size="lg"
              className="w-full"
              onClick={() => onSelectPlan?.(tier.id)}
              aria-label={t('selectPlanAriaLabel', { tier: tier.name })}
              data-testid={`select-plan-${tier.id}`}
            >
              {t('selectPlanButton')}
            </Button>
          </Card>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-12 overflow-x-auto" data-testid="feature-comparison-table">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          {t('comparisonTableTitle')}
        </h3>
        <table
          className="w-full border-collapse"
          role="table"
          aria-label={t('comparisonTableAriaLabel')}
        >
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th
                className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
                scope="col"
              >
                {t('tableHeaders.feature')}
              </th>
              {tiers.map((tier) => (
                <th
                  key={tier.id}
                  className={`text-center py-3 px-4 text-sm font-semibold ${
                    tier.isPopular ? 'text-blue-700 bg-blue-50' : 'text-gray-700'
                  }`}
                  scope="col"
                >
                  {tier.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tiers[0].features.map((feature, featureIndex) => (
              <tr
                key={featureIndex}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-sm font-medium text-gray-700">
                  {feature.name}
                </td>
                {tiers.map((tier) => (
                  <td
                    key={tier.id}
                    className={`text-center py-3 px-4 text-sm ${
                      tier.isPopular ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {tier.features[featureIndex].included ? (
                      <span className="text-gray-900">
                        {tier.features[featureIndex].value}
                      </span>
                    ) : (
                      <XMarkIcon
                        className="w-5 h-5 text-gray-300 mx-auto"
                        aria-label={t('notIncluded')}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
