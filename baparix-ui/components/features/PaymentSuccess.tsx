'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SUBSCRIPTION_TIERS, type SubscriptionTierId } from '@/lib/validations/payment';

export interface PaymentSuccessProps {
  tierId: SubscriptionTierId;
  amount: number;
  transactionRef: string;
  locale?: 'bn' | 'en';
  onGoToDashboard?: () => void;
  className?: string;
}

/**
 * Format price for display with BDT currency symbol.
 */
function formatPrice(price: number, locale: 'bn' | 'en'): string {
  return `৳${price.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-BD')}`;
}

/**
 * PaymentSuccess component displays a payment confirmation after successful payment.
 * Updates subscription status within 5 seconds of successful payment.
 * Requirements: 18.4
 */
export function PaymentSuccess({
  tierId,
  amount,
  transactionRef,
  locale = 'en',
  onGoToDashboard,
  className = '',
}: PaymentSuccessProps) {
  const t = useTranslations('payment.success');
  const router = useRouter();
  const tier = SUBSCRIPTION_TIERS[tierId];

  const handleGoToDashboard = () => {
    if (onGoToDashboard) {
      onGoToDashboard();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div
        role="status"
        aria-live="polite"
        className="text-center space-y-6"
        data-testid="payment-success"
      >
        {/* Success Icon */}
        <div
          className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100"
          data-testid="success-icon"
          aria-hidden="true"
        >
          <svg
            className="w-8 h-8 text-green-600 animate-[scale_0.3s_ease-in-out]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Confirmation Message */}
        <div className="space-y-2">
          <h2
            className="text-xl font-semibold text-gray-900"
            data-testid="success-title"
          >
            {t('title')}
          </h2>
          <p
            className="text-sm text-gray-600"
            data-testid="success-message"
          >
            {t('message')}
          </p>
        </div>

        {/* Payment Details */}
        <div
          className="bg-gray-50 rounded-lg p-4 space-y-3 text-left"
          data-testid="payment-details"
        >
          {/* Subscription Tier */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('subscriptionTier')}</span>
            <span
              className="text-sm font-medium text-gray-900"
              data-testid="activated-tier"
            >
              {tier.label}
            </span>
          </div>

          {/* Amount Paid */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('amountPaid')}</span>
            <span
              className="text-sm font-medium text-gray-900"
              data-testid="amount-paid"
            >
              {formatPrice(amount, locale)}
            </span>
          </div>

          {/* Transaction Reference */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('transactionRef')}</span>
            <span
              className="text-sm font-mono font-medium text-gray-900"
              data-testid="transaction-ref"
            >
              {transactionRef}
            </span>
          </div>
        </div>

        {/* Status Update Notice */}
        <p
          className="text-xs text-gray-500"
          data-testid="status-update-notice"
        >
          {t('statusUpdateNotice')}
        </p>

        {/* Go to Dashboard Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleGoToDashboard}
          data-testid="go-to-dashboard-button"
        >
          {t('goToDashboard')}
        </Button>
      </div>
    </Card>
  );
}
