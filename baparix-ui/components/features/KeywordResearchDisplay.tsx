'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface Keyword {
  term: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  language: 'bn' | 'en';
  trendDuration?: string;
}

export type KeywordSortField = 'term' | 'searchVolume' | 'competition';
export type SortDirection = 'asc' | 'desc';
export type GeographyFilter = 'all' | 'bangladesh';

export interface KeywordResearchDisplayProps {
  keywords: Keyword[];
  locale: 'bn' | 'en';
  isLoading?: boolean;
}

const COMPETITION_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function getCompetitionBadgeVariant(
  competition: Keyword['competition']
): 'success' | 'warning' | 'error' {
  switch (competition) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'error';
  }
}

export function KeywordResearchDisplay({
  keywords,
  locale,
  isLoading = false,
}: KeywordResearchDisplayProps) {
  const t = useTranslations('seo.keywordResearch');
  const [sortField, setSortField] = useState<KeywordSortField>('searchVolume');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [geographyFilter, setGeographyFilter] = useState<GeographyFilter>('bangladesh');

  const handleSort = (field: KeywordSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'term' ? 'asc' : 'desc');
    }
  };

  const filteredKeywords = useMemo(() => {
    if (geographyFilter === 'all') {
      return keywords;
    }
    // Bangladesh filter: include keywords in Bengali or English relevant to BD market
    return keywords.filter(
      (kw) => kw.language === 'bn' || kw.language === 'en'
    );
  }, [keywords, geographyFilter]);

  const sortedKeywords = useMemo(() => {
    return [...filteredKeywords].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'term':
          comparison = a.term.localeCompare(b.term);
          break;
        case 'searchVolume':
          comparison = a.searchVolume - b.searchVolume;
          break;
        case 'competition':
          comparison =
            COMPETITION_ORDER[a.competition] - COMPETITION_ORDER[b.competition];
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredKeywords, sortField, sortDirection]);

  const formatVolume = (volume: number): string => {
    if (locale === 'bn') {
      return volume.toLocaleString('bn-BD');
    }
    return volume.toLocaleString('en-BD');
  };

  const getSortIndicator = (field: KeywordSortField): string => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4" role="status" aria-label={t('loading')}>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <span className="sr-only">{t('loading')}</span>
        </div>
      </Card>
    );
  }

  if (keywords.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">{t('noResults')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('title')}
        </h2>

        {/* Geography Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="geography-filter" className="text-sm text-gray-600">
            {t('filters.geography')}
          </label>
          <select
            id="geography-filter"
            value={geographyFilter}
            onChange={(e) => setGeographyFilter(e.target.value as GeographyFilter)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            aria-label={t('filters.geographyAriaLabel')}
          >
            <option value="bangladesh">{t('filters.bangladesh')}</option>
            <option value="all">{t('filters.all')}</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full text-sm text-left"
          role="grid"
          aria-label={t('tableAriaLabel')}
        >
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('term')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={
                    sortField === 'term'
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {t('columns.keyword')}{getSortIndicator('term')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('searchVolume')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={
                    sortField === 'searchVolume'
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {t('columns.searchVolume')}{getSortIndicator('searchVolume')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('competition')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={
                    sortField === 'competition'
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {t('columns.competition')}{getSortIndicator('competition')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="font-semibold uppercase">
                  {t('columns.language')}
                </span>
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="font-semibold uppercase">
                  {t('columns.trendDuration')}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedKeywords.map((keyword, index) => (
              <tr
                key={`${keyword.term}-${index}`}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {keyword.term}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatVolume(keyword.searchVolume)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={getCompetitionBadgeVariant(keyword.competition)}
                    size="sm"
                  >
                    {t(`competition.${keyword.competition}`)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <Badge variant="info" size="sm">
                    {t(`languages.${keyword.language}`)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {keyword.trendDuration || t('trendDuration.unknown')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-500">
        {t('summary', { count: sortedKeywords.length, total: keywords.length })}
      </div>
    </Card>
  );
}
