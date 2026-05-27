'use client';

import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * Represents a single export record in the history.
 */
export interface ExportRecord {
  id: string;
  date: string;
  type: 'csv' | 'pdf' | 'json';
  fileName: string;
  size: string;
  downloadUrl: string;
}

export interface ExportHistoryProps {
  exports: ExportRecord[];
  isLoading?: boolean;
  locale: 'bn' | 'en';
  className?: string;
}

/**
 * Get badge variant for export type.
 */
function getTypeVariant(type: ExportRecord['type']): 'success' | 'info' | 'warning' {
  switch (type) {
    case 'csv':
      return 'success';
    case 'pdf':
      return 'info';
    case 'json':
      return 'warning';
  }
}

/**
 * Format date for display.
 */
function formatDate(dateStr: string, locale: 'bn' | 'en'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * ExportHistory component displays a list of previous exports with download links.
 * Requirements: 19.6
 */
export function ExportHistory({
  exports,
  isLoading = false,
  locale,
  className = '',
}: ExportHistoryProps) {
  const t = useTranslations('export.history');

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className={className} data-testid="export-history-loading">
        <Card padding="lg">
          <CardHeader>
            <CardTitle as="h2">
              <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  data-testid={`skeleton-row-${i}`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className} data-testid="export-history">
      <Card padding="lg">
        <CardHeader>
          <CardTitle as="h2">
            <span className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" aria-hidden="true" />
              <span id="export-history-heading">{t('title')}</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <div
              className="text-center py-8"
              data-testid="export-history-empty"
            >
              <DocumentTextIcon
                className="w-12 h-12 mx-auto text-gray-300 mb-3"
                aria-hidden="true"
              />
              <p className="text-gray-500 text-sm">{t('empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto" role="region" aria-label={t('title')}>
              <table
                className="w-full text-sm"
                data-testid="export-history-table"
                aria-label={t('title')}
              >
                <thead>
                  <tr className="border-b border-gray-200">
                    <th
                      className="text-left py-3 px-2 font-medium text-gray-600"
                      scope="col"
                    >
                      {t('columns.date')}
                    </th>
                    <th
                      className="text-left py-3 px-2 font-medium text-gray-600"
                      scope="col"
                    >
                      {t('columns.type')}
                    </th>
                    <th
                      className="text-left py-3 px-2 font-medium text-gray-600"
                      scope="col"
                    >
                      {t('columns.fileName')}
                    </th>
                    <th
                      className="text-left py-3 px-2 font-medium text-gray-600"
                      scope="col"
                    >
                      {t('columns.size')}
                    </th>
                    <th
                      className="text-right py-3 px-2 font-medium text-gray-600"
                      scope="col"
                    >
                      {t('columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exports.map((exportItem) => (
                    <tr
                      key={exportItem.id}
                      className="border-b border-gray-100 last:border-0"
                      data-testid={`export-row-${exportItem.id}`}
                    >
                      <td className="py-3 px-2 text-gray-900">
                        {formatDate(exportItem.date, locale)}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={getTypeVariant(exportItem.type)}
                          size="sm"
                        >
                          {exportItem.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-900 font-medium truncate max-w-[200px]">
                        {exportItem.fileName}
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        {exportItem.size}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <a
                          href={exportItem.downloadUrl}
                          download={exportItem.fileName}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          aria-label={`${t('download')} ${exportItem.fileName}`}
                          data-testid={`download-link-${exportItem.id}`}
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
                          <span className="hidden sm:inline">{t('download')}</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
