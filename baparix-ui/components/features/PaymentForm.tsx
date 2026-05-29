'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  paymentFormSchema,
  PaymentFormData,
  PAYMENT_METHODS,
  SUBSCRIPTION_TIERS,
  isMobilePaymentMethod,
  type PaymentMethod,
  type SubscriptionTierId,
} from '@/lib/validations/payment';

export interface PaymentFormProps {
  locale: 'bn' | 'en';
  tierId: SubscriptionTierId;
  onSubmit?: (data: PaymentFormData) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Format price for display with BDT currency symbol.
 */
function formatPrice(price: number, locale: 'bn' | 'en'): string {
  return `৳${price.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-BD')}`;
}

/**
 * Get display label for a payment method.
 */
function getPaymentMethodLabel(method: PaymentMethod, t: (key: string) => string): string {
  return t(`methods.${method}`);
}

export function PaymentForm({
  locale,
  tierId,
  onSubmit,
  isLoading = false,
  className = '',
}: PaymentFormProps) {
  const t = useTranslations('payment.form');
  const tier = SUBSCRIPTION_TIERS[tierId];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: '',
      phoneNumber: '',
      tierId,
    },
  });

  const selectedMethod = watch('paymentMethod');
  const showPhoneInput = isMobilePaymentMethod(selectedMethod);

  const handleFormSubmit = (data: PaymentFormData) => {
    onSubmit?.(data);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
        noValidate
        aria-label={t('ariaLabel')}
        data-testid="payment-form"
      >
        {/* Selected Tier Summary */}
        <div
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          data-testid="tier-summary"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            {t('selectedPlan')}
          </h2>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base text-gray-700" data-testid="tier-name">
              {t(`tiers.${tierId}`)}
            </span>
            <span
              className="text-2xl font-bold text-blue-700"
              data-testid="tier-price"
            >
              {formatPrice(tier.price, locale)}
              <span className="text-sm font-normal text-gray-500">
                /{t('perMonth')}
              </span>
            </span>
          </div>
        </div>

        {/* Hidden tier ID field */}
        <input type="hidden" {...register('tierId')} />

        {/* Payment Method Selection */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-3">
            {t('selectMethod')} <span className="text-error-500">*</span>
          </legend>
          <div
            className="space-y-2"
            role="radiogroup"
            aria-label={t('selectMethod')}
            data-testid="payment-methods"
          >
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedMethod === method
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid={`payment-method-${method}`}
              >
                <input
                  type="radio"
                  value={method}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  aria-label={getPaymentMethodLabel(method, t)}
                  {...register('paymentMethod')}
                />
                <span className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-xs font-bold"
                    aria-hidden="true"
                    data-testid={`payment-icon-${method}`}
                  >
                    {method === 'bkash' && '🅱️'}
                    {method === 'nagad' && '🟠'}
                    {method === 'rocket' && '🚀'}
                    {method === 'sslcommerz' && '🔒'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {getPaymentMethodLabel(method, t)}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {errors.paymentMethod && (
            <p
              className="mt-2 text-sm text-error-500"
              role="alert"
              data-testid="payment-method-error"
            >
              {t(`validation.${errors.paymentMethod.message}`)}
            </p>
          )}
        </fieldset>

        {/* Phone Number Input (shown for mobile payment methods) */}
        {showPhoneInput && (
          <div data-testid="phone-input-section">
            <Input
              label={t('phoneNumber')}
              type="tel"
              placeholder={t('phonePlaceholder')}
              error={
                errors.phoneNumber?.message
                  ? t(`validation.${errors.phoneNumber.message}`)
                  : undefined
              }
              required
              aria-describedby="phone-helper"
              data-testid="phone-input"
              {...register('phoneNumber')}
            />
            <p id="phone-helper" className="mt-1 text-xs text-gray-500">
              {t('phoneHelper')}
            </p>
          </div>
        )}

        {/* Total Amount */}
        <div
          className="border-t border-gray-200 pt-4"
          data-testid="total-section"
        >
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-gray-700">
              {t('totalAmount')}
            </span>
            <span
              className="text-xl font-bold text-gray-900"
              data-testid="total-amount"
            >
              {formatPrice(tier.price, locale)}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isLoading}
          isLoading={isLoading}
          data-testid="pay-now-button"
        >
          {isLoading ? t('processing') : t('payNow')}
        </Button>
      </form>
    </Card>
  );
}
