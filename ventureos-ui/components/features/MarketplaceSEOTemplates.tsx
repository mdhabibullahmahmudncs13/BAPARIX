'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface MarketplaceSEOTemplate {
  platform: string;
  titleTemplate: string;
  descriptionTemplate: string;
}

export interface MarketplaceSEOTemplatesProps {
  templates: MarketplaceSEOTemplate[];
  locale: 'bn' | 'en';
  isLoading?: boolean;
}

export interface PlatformBestPractice {
  id: string;
  tip: string;
  priority: 'high' | 'medium' | 'low';
}

const PLATFORM_BEST_PRACTICES: Record<string, PlatformBestPractice[]> = {
  daraz: [
    {
      id: 'daraz-keywords-front',
      tip: 'bestPractices.daraz.keywordsFront',
      priority: 'high',
    },
    {
      id: 'daraz-title-length',
      tip: 'bestPractices.daraz.titleLength',
      priority: 'high',
    },
    {
      id: 'daraz-bullet-points',
      tip: 'bestPractices.daraz.bulletPoints',
      priority: 'medium',
    },
    {
      id: 'daraz-bangla-keywords',
      tip: 'bestPractices.daraz.banglaKeywords',
      priority: 'medium',
    },
  ],
  shajgoj: [
    {
      id: 'shajgoj-beauty-terms',
      tip: 'bestPractices.shajgoj.beautyTerms',
      priority: 'high',
    },
    {
      id: 'shajgoj-ingredients',
      tip: 'bestPractices.shajgoj.ingredients',
      priority: 'high',
    },
    {
      id: 'shajgoj-skin-type',
      tip: 'bestPractices.shajgoj.skinType',
      priority: 'medium',
    },
    {
      id: 'shajgoj-benefits-first',
      tip: 'bestPractices.shajgoj.benefitsFirst',
      priority: 'medium',
    },
  ],
};

const TITLE_CHAR_LIMITS: Record<string, { min: number; max: number }> = {
  daraz: { min: 20, max: 150 },
  shajgoj: { min: 15, max: 100 },
};

const DESCRIPTION_KEYWORD_TIPS: Record<string, string> = {
  daraz: 'keywordTips.daraz',
  shajgoj: 'keywordTips.shajgoj',
};

function getPriorityBadgeVariant(
  priority: PlatformBestPractice['priority']
): 'error' | 'warning' | 'info' {
  switch (priority) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
  }
}

function getPlatformBadgeVariant(
  platform: string
): 'primary' | 'success' | 'info' {
  switch (platform.toLowerCase()) {
    case 'daraz':
      return 'primary';
    case 'shajgoj':
      return 'success';
    default:
      return 'info';
  }
}

export function MarketplaceSEOTemplates({
  templates,
  locale,
  isLoading = false,
}: MarketplaceSEOTemplatesProps) {
  const t = useTranslations('seo.marketplaceSEO');

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-6" role="status" aria-label={t('loading')}>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <span className="sr-only">{t('loading')}</span>
        </div>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">{t('noTemplates')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {t('title')}
      </h2>

      <div className="space-y-8">
        {templates.map((template) => {
          const platformKey = template.platform.toLowerCase();
          const charLimits = TITLE_CHAR_LIMITS[platformKey];
          const keywordTip = DESCRIPTION_KEYWORD_TIPS[platformKey];
          const bestPractices = PLATFORM_BEST_PRACTICES[platformKey] || [];

          return (
            <section
              key={template.platform}
              aria-labelledby={`platform-heading-${platformKey}`}
              className="border border-gray-200 rounded-lg p-5"
            >
              {/* Platform Header */}
              <div className="flex items-center gap-3 mb-4">
                <h3
                  id={`platform-heading-${platformKey}`}
                  className="text-lg font-medium text-gray-800"
                >
                  {template.platform}
                </h3>
                <Badge variant={getPlatformBadgeVariant(template.platform)} size="sm">
                  {t('platformBadge')}
                </Badge>
              </div>

              {/* Title Template Section */}
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  {t('titleTemplate.heading')}
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <code className="text-sm text-gray-700 block break-words">
                    {template.titleTemplate}
                  </code>
                  {charLimits && (
                    <p className="text-xs text-gray-500 mt-2">
                      {t('titleTemplate.charCount', {
                        min: charLimits.min,
                        max: charLimits.max,
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Description Template Section */}
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  {t('descriptionTemplate.heading')}
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {template.descriptionTemplate}
                  </p>
                  {keywordTip && (
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      {t(keywordTip)}
                    </p>
                  )}
                </div>
              </div>

              {/* Platform Best Practices */}
              {bestPractices.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    {t('bestPractices.heading')}
                  </h4>
                  <ul className="space-y-2" aria-label={t('bestPractices.listAriaLabel', { platform: template.platform })}>
                    {bestPractices.map((practice) => (
                      <li
                        key={practice.id}
                        className="flex items-center justify-between gap-2 text-sm text-gray-700 border border-gray-100 rounded p-3"
                      >
                        <span>{t(practice.tip)}</span>
                        <Badge
                          variant={getPriorityBadgeVariant(practice.priority)}
                          size="sm"
                        >
                          {t(`priority.${practice.priority}`)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Card>
  );
}
