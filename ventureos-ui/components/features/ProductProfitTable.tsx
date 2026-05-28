'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/formatNumber';

export interface ProductProfitData {
  id: string;
  name: string;
  revenue: number;
  cost: number;
  unitsSold: number;
}

export type ProductSortField = 'rank' | 'name' | 'revenue' | 'cost' | 'profit' | 'margin' | 'unitsSold';
export type SortDirection = 'asc' | 'desc';

export interface ProductProfitTableProps {
  products: ProductProfitData[];
  locale: 'bn' | 'en';
  isLoading?: boolean;
}

function getMarginVariant(margin: number): 'success' | 'error' | 'default' {
  if (margin > 30) return 'success';
  if (margin < 10) return 'error';
  return 'default';
}

export function ProductProfitTable({
  products,
  locale,
  isLoading = false,
}: ProductProfitTableProps) {
  const t = useTranslations('financial');
  const [sortField, setSortField] = useState<ProductSortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: ProductSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedProducts = useMemo(() => {
    const enriched = products.map((product) => {
      const profit = product.revenue - product.cost;
      const margin = product.revenue > 0 ? (profit / product.revenue) * 100 : 0;
      return { ...product, profit, margin };
    });

    return enriched.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'rank':
          // Rank is based on revenue descending by default
          comparison = b.revenue - a.revenue;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'revenue':
          comparison = a.revenue - b.revenue;
          break;
        case 'cost':
          comparison = a.cost - b.cost;
          break;
        case 'profit':
          comparison = a.profit - b.profit;
          break;
        case 'margin':
          comparison = a.margin - b.margin;
          break;
        case 'unitsSold':
          comparison = a.unitsSold - b.unitsSold;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [products, sortField, sortDirection]);

  const getSortIndicator = (field: ProductSortField): string => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const formatMargin = (margin: number): string => {
    return `${margin.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4" role="status" aria-label={t('profitTable.loading')}>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <span className="sr-only">{t('profitTable.loading')}</span>
        </div>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">{t('profitTable.noProducts')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t('profitTable.title')}
      </h2>

      <div className="overflow-x-auto">
        <table
          className="w-full text-sm text-left"
          role="grid"
          aria-label={t('profitTable.tableAriaLabel')}
        >
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('rank')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'rank' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('profitTable.columns.rank')}{getSortIndicator('rank')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('profitTable.columns.name')}{getSortIndicator('name')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('revenue')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'revenue' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('profitTable.columns.revenue')}{getSortIndicator('revenue')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('cost')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'cost' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('profitTable.columns.cost')}{getSortIndicator('cost')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('profit')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'profit' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('profitTable.columns.profit')}{getSortIndicator('profit')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('margin')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'margin' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('profitTable.columns.margin')}{getSortIndicator('margin')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('unitsSold')}
                  className="font-semibold uppercase hover:text-primary-600 focus:outline-none focus:underline"
                  aria-sort={sortField === 'unitsSold' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('profitTable.columns.unitsSold')}{getSortIndicator('unitsSold')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product, index) => (
              <tr
                key={product.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {index + 1}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatCurrency(product.revenue, 'BDT', locale)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatCurrency(product.cost, 'BDT', locale)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatCurrency(product.profit, 'BDT', locale)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getMarginVariant(product.margin)} size="sm">
                    {formatMargin(product.margin)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {product.unitsSold.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-BD')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-500">
        {t('profitTable.summary', { count: products.length })}
      </div>
    </Card>
  );
}
