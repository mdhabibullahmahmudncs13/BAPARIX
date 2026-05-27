'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface AdCopy {
  platform: 'facebook' | 'instagram';
  bengaliCopy: string;
  englishCopy: string;
  headline?: string;
  callToAction?: string;
}

export interface TikTokScript {
  title: string;
  hook: string;
  middle: string;
  cta: string;
  estimatedDuration?: string;
}

export interface PricePoint {
  productName: string;
  suggestedPrice: number;
  competitorMin: number;
  competitorMax: number;
  competitorAvg: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface UpsellSuggestion {
  id: string;
  productName: string;
  reason: string;
  priceRange: { min: number; max: number; currency: string };
  relevanceScore: number;
  category: string;
}

export type AdCopyLanguageTab = 'bengali' | 'english';

export interface ContentGenerationToolsProps {
  adCopies: AdCopy[];
  tiktokScripts: TikTokScript[];
  pricePoints: PricePoint[];
  upsellSuggestions: UpsellSuggestion[];
  locale: 'bn' | 'en';
  isLoading?: boolean;
}

function getConfidenceBadgeVariant(
  confidence: PricePoint['confidence']
): 'success' | 'warning' | 'error' {
  switch (confidence) {
    case 'high':
      return 'success';
    case 'medium':
      return 'warning';
    case 'low':
      return 'error';
  }
}

function getPlatformBadgeVariant(
  platform: AdCopy['platform']
): 'info' | 'primary' {
  switch (platform) {
    case 'facebook':
      return 'info';
    case 'instagram':
      return 'primary';
  }
}

function formatCurrency(amount: number, currency: string, locale: 'bn' | 'en'): string {
  const symbol = currency === 'BDT' ? '৳' : currency;
  const formatted = locale === 'bn'
    ? amount.toLocaleString('bn-BD')
    : amount.toLocaleString('en-BD');
  return `${symbol}${formatted}`;
}

export function ContentGenerationTools({
  adCopies,
  tiktokScripts,
  pricePoints,
  upsellSuggestions,
  locale,
  isLoading = false,
}: ContentGenerationToolsProps) {
  const t = useTranslations('seo.contentGeneration');
  const [activeLanguageTab, setActiveLanguageTab] = useState<AdCopyLanguageTab>('bengali');

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-6" role="status" aria-label={t('loading')}>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-1/4 mt-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-1/4 mt-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <span className="sr-only">{t('loading')}</span>
        </div>
      </Card>
    );
  }

  const isEmpty =
    adCopies.length === 0 &&
    tiktokScripts.length === 0 &&
    pricePoints.length === 0 &&
    upsellSuggestions.length === 0;

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

      {/* Ad Copy Section */}
      {adCopies.length > 0 && (
        <section aria-labelledby="ad-copy-heading" className="mb-8">
          <h3 id="ad-copy-heading" className="text-lg font-medium text-gray-800 mb-3">
            {t('adCopy.title')}
          </h3>

          {/* Language Tabs */}
          <div className="flex border-b border-gray-200 mb-4" role="tablist" aria-label={t('adCopy.languageTabsAriaLabel')}>
            <button
              type="button"
              role="tab"
              id="tab-bengali"
              aria-selected={activeLanguageTab === 'bengali'}
              aria-controls="tabpanel-bengali"
              onClick={() => setActiveLanguageTab('bengali')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeLanguageTab === 'bengali'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('adCopy.bengaliTab')}
            </button>
            <button
              type="button"
              role="tab"
              id="tab-english"
              aria-selected={activeLanguageTab === 'english'}
              aria-controls="tabpanel-english"
              onClick={() => setActiveLanguageTab('english')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeLanguageTab === 'english'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('adCopy.englishTab')}
            </button>
          </div>

          {/* Tab Panels */}
          <div
            role="tabpanel"
            id={`tabpanel-${activeLanguageTab}`}
            aria-labelledby={`tab-${activeLanguageTab}`}
            className="space-y-4"
          >
            {adCopies.map((ad, index) => (
              <div
                key={`${ad.platform}-${index}`}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getPlatformBadgeVariant(ad.platform)} size="sm">
                    {t(`adCopy.platforms.${ad.platform}`)}
                  </Badge>
                  {ad.headline && (
                    <span className="text-sm font-medium text-gray-700">
                      {ad.headline}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {activeLanguageTab === 'bengali' ? ad.bengaliCopy : ad.englishCopy}
                </p>
                {ad.callToAction && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">{t('adCopy.cta')}:</span>{' '}
                    <span className="text-sm font-medium text-primary-600">
                      {ad.callToAction}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TikTok Script Section */}
      {tiktokScripts.length > 0 && (
        <section aria-labelledby="tiktok-scripts-heading" className="mb-8">
          <h3 id="tiktok-scripts-heading" className="text-lg font-medium text-gray-800 mb-3">
            {t('tiktokScripts.title')}
          </h3>
          <div className="space-y-4">
            {tiktokScripts.map((script, index) => (
              <div
                key={`script-${index}`}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{script.title}</h4>
                  {script.estimatedDuration && (
                    <Badge variant="default" size="sm">
                      {script.estimatedDuration}
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  {/* Hook */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Badge variant="error" size="sm">
                        {t('tiktokScripts.hook')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">{script.hook}</p>
                  </div>
                  {/* Middle */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Badge variant="info" size="sm">
                        {t('tiktokScripts.middle')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">{script.middle}</p>
                  </div>
                  {/* CTA */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Badge variant="success" size="sm">
                        {t('tiktokScripts.cta')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">{script.cta}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Price Points Section */}
      {pricePoints.length > 0 && (
        <section aria-labelledby="price-points-heading" className="mb-8">
          <h3 id="price-points-heading" className="text-lg font-medium text-gray-800 mb-3">
            {t('pricePoints.title')}
          </h3>
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm text-left"
              role="grid"
              aria-label={t('pricePoints.tableAriaLabel')}
            >
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('pricePoints.columns.product')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('pricePoints.columns.suggested')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('pricePoints.columns.competitorRange')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('pricePoints.columns.competitorAvg')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('pricePoints.columns.confidence')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricePoints.map((point, index) => (
                  <tr
                    key={`price-${index}`}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {point.productName}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">
                      {formatCurrency(point.suggestedPrice, point.currency, locale)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatCurrency(point.competitorMin, point.currency, locale)} - {formatCurrency(point.competitorMax, point.currency, locale)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatCurrency(point.competitorAvg, point.currency, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={getConfidenceBadgeVariant(point.confidence)}
                        size="sm"
                      >
                        {t(`pricePoints.confidence.${point.confidence}`)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Upsell Suggestions Section */}
      {upsellSuggestions.length > 0 && (
        <section aria-labelledby="upsell-suggestions-heading">
          <h3 id="upsell-suggestions-heading" className="text-lg font-medium text-gray-800 mb-3">
            {t('upsell.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upsellSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {suggestion.productName}
                  </h4>
                  <Badge variant="info" size="sm">
                    {suggestion.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{suggestion.reason}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {formatCurrency(suggestion.priceRange.min, suggestion.priceRange.currency, locale)} - {formatCurrency(suggestion.priceRange.max, suggestion.priceRange.currency, locale)}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500" aria-hidden="true">
                      {t('upsell.relevance')}:
                    </span>
                    <span
                      className="text-xs font-medium text-primary-600"
                      aria-label={t('upsell.relevanceScore', { score: suggestion.relevanceScore })}
                    >
                      {suggestion.relevanceScore}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </Card>
  );
}
