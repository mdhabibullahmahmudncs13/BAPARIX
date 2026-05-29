'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  shippingFormSchema,
  ShippingFormData,
  BANGLADESH_CITIES,
  PRODUCT_CATEGORIES,
} from '@/lib/validations/shipping';

export interface ShippingCalculatorFormProps {
  locale: 'bn' | 'en';
  onSubmit?: (data: ShippingFormData) => void;
  isLoading?: boolean;
}

export function ShippingCalculatorForm({
  locale,
  onSubmit,
  isLoading = false,
}: ShippingCalculatorFormProps) {
  const t = useTranslations('shipping');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      weight: undefined,
      dimensions: { length: undefined, width: undefined, height: undefined },
      destination: '',
      productCategory: '',
    },
  });

  const handleFormSubmit = (data: ShippingFormData) => {
    onSubmit?.(data);
  };

  const cityOptions = BANGLADESH_CITIES.map((city) => ({
    value: city,
    label: t(`cities.${city.replace(/'/g, '').replace(/\s+/g, '_').toLowerCase()}`),
  }));

  const categoryOptions = PRODUCT_CATEGORIES.map((category) => ({
    value: category,
    label: t(`categories.${category}`),
  }));

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {t('form.title')}
      </h2>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
        noValidate
        aria-label={t('form.ariaLabel')}
      >
        {/* Weight */}
        <div>
          <Input
            label={t('form.weight')}
            type="number"
            step="0.01"
            placeholder={t('form.weightPlaceholder')}
            error={errors.weight?.message ? t(`validation.${errors.weight.message}`) : undefined}
            required
            aria-describedby="weight-helper"
            {...register('weight', { valueAsNumber: true })}
          />
          <p id="weight-helper" className="mt-1 text-xs text-gray-500">
            {t('form.weightHelper')}
          </p>
        </div>

        {/* Dimensions */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.dimensions')} <span className="text-error-500">*</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={t('form.length')}
              type="number"
              step="0.1"
              placeholder={t('form.dimensionPlaceholder')}
              error={
                errors.dimensions?.length?.message
                  ? t(`validation.${errors.dimensions.length.message}`)
                  : undefined
              }
              required
              {...register('dimensions.length', { valueAsNumber: true })}
            />
            <Input
              label={t('form.width')}
              type="number"
              step="0.1"
              placeholder={t('form.dimensionPlaceholder')}
              error={
                errors.dimensions?.width?.message
                  ? t(`validation.${errors.dimensions.width.message}`)
                  : undefined
              }
              required
              {...register('dimensions.width', { valueAsNumber: true })}
            />
            <Input
              label={t('form.height')}
              type="number"
              step="0.1"
              placeholder={t('form.dimensionPlaceholder')}
              error={
                errors.dimensions?.height?.message
                  ? t(`validation.${errors.dimensions.height.message}`)
                  : undefined
              }
              required
              {...register('dimensions.height', { valueAsNumber: true })}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {t('form.dimensionsHelper')}
          </p>
        </fieldset>

        {/* Destination */}
        <Select
          label={t('form.destination')}
          placeholder={t('form.destinationPlaceholder')}
          options={cityOptions}
          error={
            errors.destination?.message
              ? t(`validation.${errors.destination.message}`)
              : undefined
          }
          required
          {...register('destination')}
        />

        {/* Product Category */}
        <Select
          label={t('form.productCategory')}
          placeholder={t('form.categoryPlaceholder')}
          options={categoryOptions}
          error={
            errors.productCategory?.message
              ? t(`validation.${errors.productCategory.message}`)
              : undefined
          }
          required
          {...register('productCategory')}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
          isLoading={isLoading}
        >
          {isLoading ? t('form.calculating') : t('form.calculate')}
        </Button>
      </form>
    </Card>
  );
}
