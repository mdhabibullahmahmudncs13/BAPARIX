'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SUBSCRIPTION_TIERS, type SubscriptionTierId } from '@/lib/validations/payment';

/**
 * Represents a single payment transaction in the history.
 */
export interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  reference: string;
}

/**
 * Subscription information for the current user.
 */
export interface SubscriptionInfo {
  tier: SubscriptionTierId | 'free';
  status: 'active' | 'cancelled' | 'expired';
  nextBillingDate: string | null;
  renewalAmount: number | null;
}

export interface PaymentHistoryProps {
  locale: 'bn' | 'en';
  transactions: PaymentTransaction[];
  subscription: SubscriptionInfo;
  isLoading?: boolean;
  onCancelSubscription?: () => void;
  isCancelling?: boolean;
  className?: string;
}

/**
 * Format price for display with BDT currency symbol.
 */
function formatPrice(price: number, locale: 'bn' | 'en'): string {
  return `৳${price.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-BD')}`;
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
  });
}

/**
 * Get badge variant for payment status.
 */
function getStatusVariant(status: PaymentTransaction['status']): 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'error';
    case 'refunded':
      return 'info';
  }
}

/**
 * Get badge variant for subscription status.
 */
function getSubscriptionStatusVariant(status: SubscriptionInfo['status']): 'success' | 'warning' | 'error' {
  switch (status) {
    case 'active':
      return 'success';
    case 'cancelled':
      return 'warning';
    case 'expired':
      return 'error';
  }
}

/**
 * PaymentHistory component displays payment history, subscription status,
 * next billing info, and allows subscription cancellation.
 * Requirements: 18.5, 18.6, 18.7
 */
export function PaymentHistory({
  locale,
  transactions,
  subscription,
  isLoading = false,
  onCancelSubscription,
  isCancelling = false,
  className = '',
}: PaymentHistoryProps) {
  const t = useTranslations('payment.history');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    onCancelSubscription?.();
    setShowCancelDialog(false);
  };

  const handleDismissCancel = () => {
    setShowCancelDialog(false);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="payment-history-loading">
        <Card padding="lg">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </Card>
        <Card padding="lg">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="payment-history">
      {/* Subscription Status Card */}
      <section aria-labelledby="subscription-heading" data-testid="subscription-section">
        <Card padding="lg">
          <CardHeader>
            <CardTitle as="h2" className="flex items-center justify-between">
              <span id="subscription-heading">{t('subscriptionStatus')}</span>
              <span data-testid="subscription-status-badge">
                <Badge variant={getSubscriptionStatusVariant(subscription.status)}>
                  {t(`status.${subscription.status}`)}
                </Badge>
              </span>
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Tier */}
            <div className="flex items-center justify-between" data-testid="current-tier">
              <span className="text-sm text-gray-600">{t('currentTier')}</span>
              <span className="text-sm font-medium text-gray-900">
                {subscription.tier === 'free'
                  ? t('tiers.free')
                  : SUBSCRIPTION_TIERS[subscription.tier].label}
              </span>
            </div>

            {/* Next Billing Date */}
            {subscription.nextBillingDate && (
              <div className="flex items-center justify-between" data-testid="next-billing-date">
                <span className="text-sm text-gray-600">{t('nextBillingDate')}</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(subscription.nextBillingDate, locale)}
                </span>
              </div>
            )}

            {/* Renewal Amount */}
            {subscription.renewalAmount !== null && subscription.renewalAmount > 0 && (
              <div className="flex items-center justify-between" data-testid="renewal-amount">
                <span className="text-sm text-gray-600">{t('renewalAmount')}</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatPrice(subscription.renewalAmount, locale)}
                </span>
              </div>
            )}

            {/* Cancel Subscription Button */}
            {subscription.status === 'active' && subscription.tier !== 'free' && (
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleCancelClick}
                  disabled={isCancelling}
                  data-testid="cancel-subscription-button"
                  aria-label={t('cancelSubscription')}
                >
                  {t('cancelSubscription')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </section>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          data-testid="cancel-confirmation-dialog"
        >
          <Card padding="lg" className="max-w-md w-full mx-4">
            <div className="space-y-4">
              <h3
                id="cancel-dialog-title"
                className="text-lg font-semibold text-gray-900"
              >
                {t('cancelDialog.title')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('cancelDialog.message')}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDismissCancel}
                  data-testid="cancel-dialog-dismiss"
                >
                  {t('cancelDialog.keepSubscription')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  onClick={handleConfirmCancel}
                  isLoading={isCancelling}
                  data-testid="cancel-dialog-confirm"
                >
                  {t('cancelDialog.confirmCancel')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Payment History Table */}
      <section aria-labelledby="history-heading" data-testid="history-section">
        <Card padding="lg">
          <CardHeader>
            <CardTitle as="h2">
              <span id="history-heading">{t('paymentHistory')}</span>
            </CardTitle>
          </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div
              className="text-center py-8"
              data-testid="empty-state"
            >
              <p className="text-gray-500 text-sm">{t('noTransactions')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto" role="region" aria-label={t('paymentHistory')}>
              <table
                className="w-full text-sm"
                data-testid="transactions-table"
                aria-label={t('paymentHistory')}
              >
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                      {t('columns.date')}
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                      {t('columns.amount')}
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                      {t('columns.method')}
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                      {t('columns.status')}
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                      {t('columns.reference')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 last:border-0"
                      data-testid={`transaction-row-${transaction.id}`}
                    >
                      <td className="py-3 px-2 text-gray-900">
                        {formatDate(transaction.date, locale)}
                      </td>
                      <td className="py-3 px-2 text-gray-900 font-medium">
                        {formatPrice(transaction.amount, locale)}
                      </td>
                      <td className="py-3 px-2 text-gray-700 capitalize">
                        {transaction.method}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={getStatusVariant(transaction.status)}
                          size="sm"
                        >
                          {t(`transactionStatus.${transaction.status}`)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-700 font-mono text-xs">
                        {transaction.reference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        </Card>
      </section>
    </div>
  );
}
