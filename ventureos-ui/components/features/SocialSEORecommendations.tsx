'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface Hashtag {
  tag: string;
  volume: number;
  trendDuration: string;
}

export interface SocialPlatform {
  name: string;
  strategy: string;
  postingFrequency: string;
}

export interface PostingTime {
  platform: string;
  day: string;
  time: string;
  engagement: 'high' | 'medium' | 'low';
}

export interface SocialSEORecommendationsProps {
  hashtags: Hashtag[];
  platforms: SocialPlatform[];
  postingTimes: PostingTime[];
  locale: 'bn' | 'en';
  isLoading?: boolean;
}

function getEngagementBadgeVariant(
  engagement: PostingTime['engagement']
): 'success' | 'warning' | 'default' {
  switch (engagement) {
    case 'high':
      return 'success';
    case 'medium':
      return 'warning';
    case 'low':
      return 'default';
  }
}

function formatVolume(volume: number, locale: 'bn' | 'en'): string {
  if (locale === 'bn') {
    return volume.toLocaleString('bn-BD');
  }
  return volume.toLocaleString('en-BD');
}

export function SocialSEORecommendations({
  hashtags,
  platforms,
  postingTimes,
  locale,
  isLoading = false,
}: SocialSEORecommendationsProps) {
  const t = useTranslations('seo.socialSEO');

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4" role="status" aria-label={t('loading')}>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4 mt-6"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <span className="sr-only">{t('loading')}</span>
        </div>
      </Card>
    );
  }

  const isEmpty = hashtags.length === 0 && platforms.length === 0 && postingTimes.length === 0;

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

      {/* Hashtag Strategy Section */}
      {hashtags.length > 0 && (
        <section aria-labelledby="hashtag-strategy-heading" className="mb-8">
          <h3 id="hashtag-strategy-heading" className="text-lg font-medium text-gray-800 mb-3">
            {t('hashtagStrategy')}
          </h3>
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm text-left"
              role="grid"
              aria-label={t('hashtagTableAriaLabel')}
            >
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('columns.hashtag')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('columns.volume')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('columns.trendDuration')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {hashtags.map((hashtag, index) => (
                  <tr
                    key={`${hashtag.tag}-${index}`}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      #{hashtag.tag}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatVolume(hashtag.volume, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info" size="sm">
                        {hashtag.trendDuration}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Optimal Posting Times Section */}
      {postingTimes.length > 0 && (
        <section aria-labelledby="posting-times-heading" className="mb-8">
          <h3 id="posting-times-heading" className="text-lg font-medium text-gray-800 mb-3">
            {t('optimalPostingTimes')}
          </h3>
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm text-left"
              role="grid"
              aria-label={t('postingTimesTableAriaLabel')}
            >
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('columns.platform')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('columns.day')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('columns.time')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t('columns.engagement')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {postingTimes.map((pt, index) => (
                  <tr
                    key={`${pt.platform}-${pt.day}-${index}`}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {pt.platform}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {pt.day}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {pt.time}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={getEngagementBadgeVariant(pt.engagement)}
                        size="sm"
                      >
                        {t(`engagement.${pt.engagement}`)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Platform Strategy Section */}
      {platforms.length > 0 && (
        <section aria-labelledby="platform-strategy-heading">
          <h3 id="platform-strategy-heading" className="text-lg font-medium text-gray-800 mb-3">
            {t('platformStrategy')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform, index) => (
              <div
                key={`${platform.name}-${index}`}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                  <Badge variant="primary" size="sm">
                    {platform.postingFrequency}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{platform.strategy}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </Card>
  );
}
