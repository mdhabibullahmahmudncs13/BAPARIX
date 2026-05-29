'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface GoogleLensOptimizationProps {
  imageTagging: string[];
  altTextGuidance: string;
  locale: 'bn' | 'en';
  isLoading?: boolean;
}

export interface BestPractice {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const BEST_PRACTICES: BestPractice[] = [
  {
    id: 'high-resolution',
    title: 'bestPractices.highResolution.title',
    description: 'bestPractices.highResolution.description',
    priority: 'high',
  },
  {
    id: 'clean-background',
    title: 'bestPractices.cleanBackground.title',
    description: 'bestPractices.cleanBackground.description',
    priority: 'high',
  },
  {
    id: 'multiple-angles',
    title: 'bestPractices.multipleAngles.title',
    description: 'bestPractices.multipleAngles.description',
    priority: 'medium',
  },
  {
    id: 'descriptive-filename',
    title: 'bestPractices.descriptiveFilename.title',
    description: 'bestPractices.descriptiveFilename.description',
    priority: 'medium',
  },
  {
    id: 'structured-data',
    title: 'bestPractices.structuredData.title',
    description: 'bestPractices.structuredData.description',
    priority: 'low',
  },
];

function getPriorityBadgeVariant(
  priority: BestPractice['priority']
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

export function GoogleLensOptimization({
  imageTagging,
  altTextGuidance,
  locale,
  isLoading = false,
}: GoogleLensOptimizationProps) {
  const t = useTranslations('seo.googleLens');

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4" role="status" aria-label={t('loading')}>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4 mt-6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3 mt-6"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <span className="sr-only">{t('loading')}</span>
        </div>
      </Card>
    );
  }

  const isEmpty = imageTagging.length === 0 && !altTextGuidance;

  if (isEmpty) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">{t('noResults')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {t('title')}
      </h2>

      {/* Image Tagging Guidance Section */}
      {imageTagging.length > 0 && (
        <section aria-labelledby="image-tagging-heading" className="mb-8">
          <h3 id="image-tagging-heading" className="text-lg font-medium text-gray-800 mb-3">
            {t('imageTagging.title')}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {t('imageTagging.description')}
          </p>
          <ul className="space-y-2" aria-label={t('imageTagging.listAriaLabel')}>
            {imageTagging.map((tag, index) => (
              <li
                key={`${tag}-${index}`}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <span
                  className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"
                  aria-hidden="true"
                ></span>
                {tag}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Alt Text Recommendations Section */}
      {altTextGuidance && (
        <section aria-labelledby="alt-text-heading" className="mb-8">
          <h3 id="alt-text-heading" className="text-lg font-medium text-gray-800 mb-3">
            {t('altText.title')}
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">{altTextGuidance}</p>
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                {t('altText.exampleTitle')}
              </h4>
              <div className="bg-white border border-gray-100 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">{t('altText.goodExample')}</p>
                <code className="text-sm text-green-700 block mb-2">
                  {t('altText.goodExampleText')}
                </code>
                <p className="text-xs text-gray-500 mb-1">{t('altText.badExample')}</p>
                <code className="text-sm text-red-700 block">
                  {t('altText.badExampleText')}
                </code>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Best Practices Section */}
      <section aria-labelledby="best-practices-heading">
        <h3 id="best-practices-heading" className="text-lg font-medium text-gray-800 mb-3">
          {t('bestPractices.title')}
        </h3>
        <div className="space-y-3">
          {BEST_PRACTICES.map((practice) => (
            <div
              key={practice.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900 text-sm">
                  {t(practice.title)}
                </h4>
                <Badge
                  variant={getPriorityBadgeVariant(practice.priority)}
                  size="sm"
                >
                  {t(`priority.${practice.priority}`)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {t(practice.description)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </Card>
  );
}
