'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  financialEntrySchema,
  FinancialEntryFormData,
  REVENUE_CATEGORIES,
  EXPENSE_CATEGORIES,
  SUBCATEGORIES,
  PAYMENT_METHODS,
} from '@/lib/validations/financialEntry';

export interface FinancialEntryFormProps {
  locale: 'bn' | 'en';
  onSubmit?: (data: FinancialEntryFormData) => void;
  isLoading?: boolean;
}

export function FinancialEntryForm({
  locale,
  onSubmit,
  isLoading = false,
}: FinancialEntryFormProps) {
  const t = useTranslations('financialTracker.entryForm');
  const [entryType, setEntryType] = useState<'revenue' | 'expense'>('revenue');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FinancialEntryFormData>({
    resolver: zodResolver(financialEntrySchema),
    defaultValues: {
      type: 'revenue',
      amount: undefined,
      category: '',
      subcategory: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      productId: '',
      paymentMethod: '',
    },
  });

  const selectedCategory = watch('category');

  const handleTypeChange = (type: 'revenue' | 'expense') => {
    setEntryType(type);
    setValue('type', type);
    setValue('category', '');
    setValue('subcategory', '');
  };

  const handleFormSubmit = (data: FinancialEntryFormData) => {
    onSubmit?.(data);
  };

  const categories = entryType === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  const categoryOptions = categories.map((category) => ({
    value: category,
    label: t(`categories.${category}`),
  }));

  const subcategoryOptions = selectedCategory && SUBCATEGORIES[selectedCategory]
    ? SUBCATEGORIES[selectedCategory].map((sub) => ({
        value: sub,
        label: t(`subcategories.${sub}`),
      }))
    : [];

  const paymentMethodOptions = PAYMENT_METHODS.map((method) => ({
    value: method,
    label: t(`paymentMethods.${method}`),
  }));

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {t('title')}
      </h2>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
        noValidate
        aria-label={t('ariaLabel')}
      >
        {/* Type Toggle */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            {t('type')} <span className="text-error-500">*</span>
          </legend>
          <div className="flex gap-2" role="radiogroup" aria-label={t('type')}>
            <button
              type="button"
              role="radio"
              aria-checked={entryType === 'revenue'}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                entryType === 'revenue'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => handleTypeChange('revenue')}
              data-testid="type-revenue"
            >
              {t('revenue')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={entryType === 'expense'}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                entryType === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => handleTypeChange('expense')}
              data-testid="type-expense"
            >
              {t('expense')}
            </button>
          </div>
          {errors.type && (
            <p className="mt-1 text-sm text-error-500" role="alert">
              {t(`validation.${errors.type.message}`)}
            </p>
          )}
        </fieldset>

        {/* Hidden type field for form submission */}
        <input type="hidden" {...register('type')} />

        {/* Amount */}
        <div>
          <Input
            label={t('amount')}
            type="number"
            step="0.01"
            min="0"
            placeholder={t('amountPlaceholder')}
            error={errors.amount?.message ? t(`validation.${errors.amount.message}`) : undefined}
            required
            aria-describedby="amount-helper"
            {...register('amount', { valueAsNumber: true })}
          />
          <p id="amount-helper" className="mt-1 text-xs text-gray-500">
            {t('amountHelper')}
          </p>
        </div>

        {/* Category */}
        <Select
          label={t('category')}
          placeholder={t('categoryPlaceholder')}
          options={categoryOptions}
          error={
            errors.category?.message
              ? t(`validation.${errors.category.message}`)
              : undefined
          }
          required
          {...register('category')}
        />

        {/* Subcategory (optional, shown when category has subcategories) */}
        {subcategoryOptions.length > 0 && (
          <Select
            label={t('subcategory')}
            placeholder={t('subcategoryPlaceholder')}
            options={subcategoryOptions}
            error={
              errors.subcategory?.message
                ? t(`validation.${errors.subcategory.message}`)
                : undefined
            }
            {...register('subcategory')}
          />
        )}

        {/* Description */}
        <div>
          <Input
            label={t('description')}
            type="text"
            placeholder={t('descriptionPlaceholder')}
            error={
              errors.description?.message
                ? t(`validation.${errors.description.message}`)
                : undefined
            }
            required
            {...register('description')}
          />
        </div>

        {/* Date */}
        <Input
          label={t('date')}
          type="date"
          error={
            errors.date?.message
              ? t(`validation.${errors.date.message}`)
              : undefined
          }
          required
          {...register('date')}
        />

        {/* Product Reference (optional) */}
        <Input
          label={t('productId')}
          type="text"
          placeholder={t('productIdPlaceholder')}
          error={
            errors.productId?.message
              ? t(`validation.${errors.productId.message}`)
              : undefined
          }
          {...register('productId')}
        />

        {/* Payment Method (optional) */}
        <Select
          label={t('paymentMethod')}
          placeholder={t('paymentMethodPlaceholder')}
          options={paymentMethodOptions}
          error={
            errors.paymentMethod?.message
              ? t(`validation.${errors.paymentMethod.message}`)
              : undefined
          }
          {...register('paymentMethod')}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
          isLoading={isLoading}
        >
          {isLoading ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Card>
  );
}
