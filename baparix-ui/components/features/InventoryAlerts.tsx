'use client';

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

export interface UnsoldProduct {
  id: string;
  name: string;
  daysUnsold: number;
  stockQuantity: number;
}

export interface InventoryAlertsProps {
  products: UnsoldProduct[];
  locale: 'bn' | 'en';
  className?: string;
}

/**
 * Returns the severity level based on days unsold.
 * >60 days = error, >30 days = warning
 */
export function getSeverity(daysUnsold: number): 'error' | 'warning' {
  return daysUnsold > 60 ? 'error' : 'warning';
}

export function InventoryAlerts({ products, locale, className = '' }: InventoryAlertsProps) {
  const t = useTranslations('financialTracker.inventoryAlerts');

  // Filter to only show products unsold for more than 30 days
  const alertProducts = products.filter((p) => p.daysUnsold > 30);

  // Empty state
  if (alertProducts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" aria-hidden="true" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center py-8 text-center"
            data-testid="inventory-alerts-empty"
          >
            <ArchiveBoxIcon className="w-12 h-12 text-gray-300 mb-3" aria-hidden="true" />
            <p className="text-gray-500 text-sm">{t('noAlerts')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" aria-hidden="true" />
          {t('title')}
          <Badge variant="warning" size="sm">
            {alertProducts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul
          className="divide-y divide-gray-100 space-y-0"
          data-testid="inventory-alerts-list"
          aria-label={t('title')}
        >
          {alertProducts.map((product) => {
            const severity = getSeverity(product.daysUnsold);
            return (
              <li
                key={product.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                data-testid={`inventory-alert-item-${product.id}`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {severity === 'error' ? (
                    <ExclamationCircleIcon
                      className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <ExclamationTriangleIcon
                      className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('daysUnsold', { days: product.daysUnsold })} · {t('stock', { quantity: product.stockQuantity })}
                    </p>
                  </div>
                </div>
                <Badge variant={severity} size="sm">
                  {severity === 'error' ? t('critical') : t('warning')}
                </Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
