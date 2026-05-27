'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface ShippingResult {
  agency: string;
  cost: number;
  leadTime: string;
  method: 'air' | 'sea' | 'courier';
  customsDuty: number;
  totalLandedCost: number;
  riskFlags?: string[];
  seasonalWarnings?: string[];
}

export type SortField = 'agency' | 'method' | 'cost' | 'leadTime' | 'totalLandedCost';
export type SortDirection = 'asc' | 'desc';

export interface ShippingCostResultsProps {
  results: ShippingResult[];
  locale: 'bn' | 'en';
  isLoading?: boolean;
}

const SHIPPING_AGENCIES = [
  'SKS Group',
  'SkyBuyBD',
  'BD Express',
  'Sundarban Courier',
  'DHL Express',
  'Aramex',
] as const;

function getMethodBadgeVariant(method: ShippingResult['method']): 'info' | 'success' | 'warning' {
  switch (method) {
    case 'air':
      return 'info';
    case 'sea':
      return 'success';
    case 'courier':
      return 'warning';
  }
}

function parseLeadTimeDays(leadTime: string): number {
  const match = leadTime.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function ShippingCostResults({
  results,
  locale,
  isLoading = false,
}: ShippingCostResultsProps) {
  const t = useTranslations('shipping');
  const [sortField, setSortField] = useState<SortField>('cost');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'agency':
          comparison = a.agency.localeCompare(b.agency);
          break;
        case 'method':
          comparison = a.method.localeCompare(b.method);
          break;
        case 'cost':
          comparison = a.cost - b.cost;
          break;
        case 'leadTime':
          comparison = parseLeadTimeDays(a.leadTime) - parseLeadTimeDays(b.leadTime);
          break;
        case 'totalLandedCost':
          comparison = a.totalLandedCost - b.totalLandedCost;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [results, sortField, sortDirection]);

  const formatCurrency = (amount: number): string => {
    if (locale === 'bn') {
      return `৳${amount.toLocaleString('bn-BD')}`;
    }
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  const getSortIndicator = (field: SortField): string => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4" role="status" aria-label={t('results.loading')}>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <span className="sr-only">{t('results.loading')}</span>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">{t('results.noResults')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t('results.title')}
      </h2>

      <div className="overflow-x-auto">
        <table
          className="w-full text-sm text-left"
          role="grid"
          aria-label={t('results.tableAriaLabel')}
        >
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('agency')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'agency' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('results.columns.agency')}{getSortIndicator('agency')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('method')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'method' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('results.columns.method')}{getSortIndicator('method')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('cost')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'cost' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('results.columns.cost')}{getSortIndicator('cost')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('leadTime')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'leadTime' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('results.columns.leadTime')}{getSortIndicator('leadTime')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('totalLandedCost')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'totalLandedCost' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('results.columns.totalLandedCost')}{getSortIndicator('totalLandedCost')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => (
              <tr
                key={`${result.agency}-${result.method}-${index}`}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {result.agency}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getMethodBadgeVariant(result.method)} size="sm">
                    {t(`results.methods.${result.method}`)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatCurrency(result.cost)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {result.leadTime}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {formatCurrency(result.totalLandedCost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-500">
        {t('results.summary', { count: results.length })}
      </div>
    </Card>
  );
}

export { SHIPPING_AGENCIES };
